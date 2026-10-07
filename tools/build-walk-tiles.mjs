#!/usr/bin/env node
/*
  Hop on! — costruisce le "tessere" della rete pedonale a partire da un estratto OpenStreetMap (.osm.pbf).

  Uso:
    node tools/build-walk-tiles.mjs --pbf nord-ovest-latest.osm.pbf [--out walk] [--gtfs <url o file zip>] [--proxy <prefisso>]

  - Legge le fermate dal GTFS GTT e costruisce solo le tessere attorno alle fermate (± 1 tessera).
  - Tiene le vie percorribili a piedi (marciapiedi, strade, sentieri, scale…), scarta autostrade e accessi vietati.
  - Le piazze pedonali (highway=pedestrian + area=yes) sono attraversabili: ogni vertice è collegato al centro.
  - Scrive <out>/index.json e <out>/t/<tx>_<ty>.bin.gz (formato descritto in writeTile).

  Nessuna dipendenza: decoder PBF e lettore zip sono scritti qui sotto (Node ≥ 18).
  Dati © OpenStreetMap contributors, licenza ODbL.
*/
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

// Deve coincidere con quanto letto dall'app da index.json
const TILE_LAT = 0.025, TILE_LON = 0.035;          // ~2,8 × 2,8 km a Torino
const FORMAT = 1;

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith("--") && a.push([x.slice(2), all[i + 1]]), a), []));
if (!args.pbf) { console.error("Manca --pbf <file .osm.pbf>"); process.exit(1); }
const OUT = args.out || "walk";
const GTFS = args.gtfs || "https://www.gtt.to.it/open_data/gtt_gtfs.zip";
const t0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s]`, ...a);

const tileKey = (tx, ty) => tx + "_" + ty;
const tileOf = (lat, lon) => [Math.floor(lon / TILE_LON), Math.floor(lat / TILE_LAT)];

/* ---------------- 1. Fermate GTT → tessere da costruire ---------------- */
async function loadBytes(src) {
  if (!/^https?:/.test(src)) return fs.readFileSync(src);
  const tries = [src]; if (args.proxy) tries.push(args.proxy + encodeURIComponent(src));
  for (const u of tries) {
    try { const r = await fetch(u); if (r.ok) return Buffer.from(await r.arrayBuffer()); log("HTTP", r.status, u); } catch (e) { log("errore", e.message, u); }
  }
  throw new Error("Download non riuscito: " + src);
}
function unzipEntry(zip, name) {
  // cerca la directory centrale e il file richiesto (anche in sottocartelle)
  let eocd = zip.length - 22; while (eocd >= 0 && zip.readUInt32LE(eocd) !== 0x06054b50) eocd--;
  if (eocd < 0) throw new Error("Zip non valido");
  let p = zip.readUInt32LE(eocd + 16); const n = zip.readUInt16LE(eocd + 10);
  for (let i = 0; i < n; i++) {
    const method = zip.readUInt16LE(p + 10), csize = zip.readUInt32LE(p + 20), nl = zip.readUInt16LE(p + 28), xl = zip.readUInt16LE(p + 30), cl = zip.readUInt16LE(p + 32), off = zip.readUInt32LE(p + 42);
    const fname = zip.toString("utf8", p + 46, p + 46 + nl);
    if (fname.split("/").pop() === name) {
      const lnl = zip.readUInt16LE(off + 26), lxl = zip.readUInt16LE(off + 28), data = zip.subarray(off + 30 + lnl + lxl, off + 30 + lnl + lxl + csize);
      return method === 0 ? data : zlib.inflateRawSync(data);
    }
    p += 46 + nl + xl + cl;
  }
  throw new Error(name + " non trovato nello zip");
}
function parseStops(buf) {
  const lines = buf.toString("utf8").replace(/^﻿/, "").split(/\r?\n/);
  const split = (l) => { const out = []; let cur = "", q = false; for (let i = 0; i < l.length; i++) { const c = l[i]; if (q) { if (c === '"') { if (l[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; } else if (c === '"') q = true; else if (c === ",") { out.push(cur); cur = ""; } else cur += c; } out.push(cur); return out; };
  const h = split(lines[0]), il = h.indexOf("stop_lat"), io = h.indexOf("stop_lon"), out = [];
  for (const l of lines.slice(1)) { if (!l) continue; const f = split(l), lat = +f[il], lon = +f[io]; if (lat && lon) out.push([lat, lon]); }
  return out;
}

const stops = parseStops(unzipEntry(await loadBytes(GTFS), "stops.txt"));
const wanted = new Set();
for (const [lat, lon] of stops) { const [tx, ty] = tileOf(lat, lon); for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) wanted.add(tileKey(tx + dx, ty + dy)); }
log(`${stops.length} fermate → ${wanted.size} tessere da costruire`);

/* ---------------- 2. Lettura PBF in un solo passaggio ---------------- */
class Pb {
  constructor(buf, s = 0, e = buf.length) { this.b = buf; this.p = s; this.e = e; }
  more() { return this.p < this.e; }
  varint() { let r = 0, m = 1, b; do { b = this.b[this.p++]; r += (b & 0x7f) * m; m *= 128; } while (b & 0x80); return r; }
  svarint() { const n = this.varint(); return n % 2 === 0 ? n / 2 : -(n + 1) / 2; }
  sub() { const n = this.varint(), s = this.p; this.p += n; return new Pb(this.b, s, s + n); }
  bytes() { const n = this.varint(), s = this.p; this.p += n; return this.b.subarray(s, s + n); }
  skip(w) { if (w === 0) this.varint(); else if (w === 1) this.p += 8; else if (w === 2) { const n = this.varint(); this.p += n; } else if (w === 5) this.p += 4; else throw new Error("wire " + w); }
  packed(signed, out = []) { const s = this.sub(); while (s.more()) out.push(signed ? s.svarint() : s.varint()); return out; }
}

// nodi tenuti: id (ordinati), lat/lon in microgradi
let nId = new Float64Array(1 << 22), nLat = new Int32Array(1 << 22), nLon = new Int32Array(1 << 22), nN = 0, lastId = -Infinity, sawWay = false;
const pushNode = (id, lat, lon) => {
  if (nN === nId.length) { const g = (A) => { const b = new A.constructor(A.length * 2); b.set(A); return b; }; nId = g(nId); nLat = g(nLat); nLon = g(nLon); }
  if (id <= lastId) throw new Error("PBF non ordinato per id (serve un estratto ordinato, es. Geofabrik)");
  if (sawWay) throw new Error("Nodi dopo le vie: PBF non ordinato");
  lastId = id; nId[nN] = id; nLat[nN] = lat; nLon[nN] = lon; nN++;
};
const findNode = (id) => { let lo = 0, hi = nN - 1; while (lo <= hi) { const m = (lo + hi) >> 1, v = nId[m]; if (v === id) return m; if (v < id) lo = m + 1; else hi = m - 1; } return -1; };

// grafo: nodi usati (indice nodo PBF → indice grafo) e archi
const used = new Map();            // indice nodo → indice grafo
const gLat = [], gLon = [];
const eA = [], eB = [];
const gNode = (k) => { let g = used.get(k); if (g === undefined) { g = gLat.length; used.set(k, g); gLat.push(nLat[k]); gLon.push(nLon[k]); } return g; };

const YES = new Set(["footway", "pedestrian", "path", "steps", "living_street", "residential", "service", "unclassified", "tertiary", "tertiary_link", "secondary", "secondary_link", "primary", "primary_link", "track", "road", "corridor", "platform", "cycleway", "bridleway"]);
const FOOT_OK = new Set(["yes", "designated", "permissive"]);
function walkable(t) {
  const hw = t.highway; if (!hw) return false;
  if (t.foot === "no" || t.foot === "private" || t.foot === "use_sidepath") return false;
  if ((t.access === "no" || t.access === "private") && !FOOT_OK.has(t.foot)) return false;
  if (YES.has(hw)) return true;
  return (hw === "trunk" || hw === "trunk_link") && FOOT_OK.has(t.foot);
}
let ways = 0, areas = 0;
function addWay(tags, refs) {
  if (!walkable(tags)) return;
  const idx = refs.map(findNode);
  let prev = -1;
  for (const k of idx) {
    if (k >= 0 && prev >= 0 && k !== prev) { eA.push(gNode(prev)); eB.push(gNode(k)); }
    prev = k;
  }
  ways++;
  // piazza pedonale: collega ogni vertice al centro, così si può attraversare
  if (tags.area === "yes" && (tags.highway === "pedestrian" || tags.highway === "footway") && refs.length > 3 && refs[0] === refs[refs.length - 1]) addSquare(idx);
}
function addSquare(idx) {
  const pts = [...new Set(idx.filter((k) => k >= 0))]; if (pts.length < 3) return;
  let la = 0, lo = 0; for (const k of pts) { la += nLat[k]; lo += nLon[k]; }
  const c = gLat.length; gLat.push(Math.round(la / pts.length)); gLon.push(Math.round(lo / pts.length));
  for (const k of pts) { eA.push(c); eB.push(gNode(k)); }
  areas++;
}
// piazze disegnate come multipoligono (es. piazza Castello): id delle vie del contorno → relazione
const squareRel = new Map(), squareNodes = [];

function primitiveBlock(buf, pass) {
  const r = new Pb(buf); let strings = null, gran = 100, latOff = 0, lonOff = 0; const groups = [];
  while (r.more()) { const t = r.varint(), f = t >>> 3, w = t & 7;
    if (f === 1 && w === 2) { strings = []; const s = r.sub(); while (s.more()) { const tt = s.varint(); if ((tt >>> 3) === 1) strings.push(s.bytes().toString("utf8")); else s.skip(tt & 7); } }
    else if (f === 2 && w === 2) groups.push(r.sub());
    else if (f === 17) gran = r.varint(); else if (f === 19) latOff = r.svarint(); else if (f === 20) lonOff = r.svarint();
    else r.skip(w); }
  const toMicro = (v, off) => Math.round((off + gran * v) / 1000);    // nanogradi → microgradi
  for (const g of groups) {
    while (g.more()) { const t = g.varint(), f = t >>> 3, w = t & 7;
      if (pass === 1) {                                                // 1° passaggio: solo relazioni
        if (f === 4 && w === 2) relation(g.sub(), strings); else g.skip(w);
        continue;
      }
      if (f === 2 && w === 2) {                                        // DenseNodes
        const d = g.sub(); let ids = [], lats = [], lons = [];
        while (d.more()) { const tt = d.varint(), ff = tt >>> 3, ww = tt & 7;
          if (ff === 1 && ww === 2) ids = d.packed(true); else if (ff === 8 && ww === 2) lats = d.packed(true); else if (ff === 9 && ww === 2) lons = d.packed(true); else d.skip(ww); }
        let id = 0, la = 0, lo = 0;
        for (let i = 0; i < ids.length; i++) {
          id += ids[i]; la += lats[i]; lo += lons[i];
          const lat = toMicro(la, latOff), lon = toMicro(lo, lonOff);
          const [tx, ty] = tileOf(lat / 1e6, lon / 1e6);
          if (wanted.has(tileKey(tx, ty))) pushNode(id, lat, lon);
        }
      } else if (f === 1 && w === 2) {                                 // Node singolo (raro)
        const n = g.sub(); let id = 0, la = 0, lo = 0;
        while (n.more()) { const tt = n.varint(), ff = tt >>> 3, ww = tt & 7; if (ff === 1) id = n.svarint(); else if (ff === 8) la = n.svarint(); else if (ff === 9) lo = n.svarint(); else n.skip(ww); }
        const lat = toMicro(la, latOff), lon = toMicro(lo, lonOff), [tx, ty] = tileOf(lat / 1e6, lon / 1e6);
        if (wanted.has(tileKey(tx, ty))) pushNode(id, lat, lon);
      } else if (f === 3 && w === 2) {                                 // Way
        sawWay = true;
        const wy = g.sub(); let id = 0, keys = [], vals = [], refs = [];
        while (wy.more()) { const tt = wy.varint(), ff = tt >>> 3, ww = tt & 7;
          if (ff === 1 && ww === 0) id = wy.varint(); else if (ff === 2 && ww === 2) keys = wy.packed(false); else if (ff === 3 && ww === 2) vals = wy.packed(false); else if (ff === 8 && ww === 2) refs = wy.packed(true); else wy.skip(ww); }
        const rel = squareRel.get(id);
        const tags = {}; for (let i = 0; i < keys.length; i++) tags[strings[keys[i]]] = strings[vals[i]];
        if (!tags.highway && rel === undefined) continue;
        for (let i = 1; i < refs.length; i++) refs[i] += refs[i - 1];
        if (rel !== undefined) for (const r of rel) squareNodes[r].push(...refs.map(findNode));
        if (tags.highway) addWay(tags, refs);
      } else g.skip(w);
    }
  }
}

function relation(r, strings) {
  let keys = [], vals = [], roles = [], mem = [], types = [];
  while (r.more()) { const t = r.varint(), f = t >>> 3, w = t & 7;
    if (f === 2 && w === 2) keys = r.packed(false); else if (f === 3 && w === 2) vals = r.packed(false); else if (f === 8 && w === 2) roles = r.packed(false);
    else if (f === 9 && w === 2) mem = r.packed(true); else if (f === 10 && w === 2) types = r.packed(false); else r.skip(w); }
  const tags = {}; for (let i = 0; i < keys.length; i++) tags[strings[keys[i]]] = strings[vals[i]];
  if (tags.type !== "multipolygon" || !(tags.highway === "pedestrian" || tags.highway === "footway")) return;
  if (tags.foot === "no" || tags.access === "private" || tags.access === "no") return;
  const ri = squareNodes.length; squareNodes.push([]);
  let id = 0;
  for (let i = 0; i < mem.length; i++) {
    id += mem[i];
    const role = strings[roles[i]] || "";
    if (types[i] !== 1 || (role !== "outer" && role !== "")) continue;
    const a = squareRel.get(id); if (a) a.push(ri); else squareRel.set(id, [ri]);
  }
}

function scan(pass) {
  const fd = fs.openSync(args.pbf, "r"), size = fs.fstatSync(fd).size; let pos = 0, blocks = 0;
  const read = (n) => { const b = Buffer.allocUnsafe(n); let got = 0; while (got < n) got += fs.readSync(fd, b, got, n - got, pos + got); pos += n; return b; };
  while (pos < size) {
    const hl = read(4).readUInt32BE(0), h = new Pb(read(hl)); let type = "", dsize = 0;
    while (h.more()) { const t = h.varint(), f = t >>> 3, w = t & 7; if (f === 1) type = h.bytes().toString(); else if (f === 3) dsize = h.varint(); else h.skip(w); }
    const blob = new Pb(read(dsize)); let raw = null, zdata = null;
    while (blob.more()) { const t = blob.varint(), f = t >>> 3, w = t & 7; if (f === 1) raw = blob.bytes(); else if (f === 3) zdata = blob.bytes(); else blob.skip(w); }
    if (type === "OSMData") primitiveBlock(raw || zlib.inflateSync(zdata), pass);
    if (++blocks % 2000 === 0) log(`passaggio ${pass} · ${(pos / size * 100).toFixed(0)}%${pass === 2 ? ` · nodi tenuti ${nN} · vie a piedi ${ways}` : ""}`);
  }
  fs.closeSync(fd);
}
scan(1);
log(`${squareNodes.length} piazze multipoligono`);
scan(2);
for (const idx of squareNodes) addSquare(idx);
log(`PBF letto: ${nN} nodi nelle tessere, ${ways} vie a piedi, ${areas} piazze, grafo ${gLat.length} nodi / ${eA.length} archi`);

/* ---------------- 3. Tessere ---------------- */
// ogni arco va nella tessera di entrambi gli estremi; i nodi di confine sono duplicati e l'app li unisce per coordinate
const byTile = new Map();
const tileOfNode = (g) => tileKey(...tileOf(gLat[g] / 1e6, gLon[g] / 1e6));
for (let i = 0; i < eA.length; i++) {
  const ka = tileOfNode(eA[i]), kb = tileOfNode(eB[i]);
  for (const k of ka === kb ? [ka] : [ka, kb]) { if (!wanted.has(k)) continue; let a = byTile.get(k); if (!a) byTile.set(k, a = []); a.push(i); }
}

/**
 * Formato tessera (little endian, poi gzip):
 *   "HOW1" · uint32 nNodi · uint32 nArchi · int32[n] lat (microgradi, delta) · int32[n] lon (delta) · uint32[m] a · uint32[m] b
 * Le lunghezze degli archi si ricalcolano dalle coordinate.
 */
function writeTile(key, edges) {
  const local = new Map(), nodes = [];
  for (const i of edges) for (const g of [eA[i], eB[i]]) if (!local.has(g)) { local.set(g, -1); nodes.push(g); }
  nodes.sort((x, y) => gLat[x] - gLat[y] || gLon[x] - gLon[y]);
  nodes.forEach((g, j) => local.set(g, j));
  const n = nodes.length, m = edges.length, buf = Buffer.alloc(12 + n * 8 + m * 8);
  buf.write("HOW1", 0, "latin1"); buf.writeUInt32LE(n, 4); buf.writeUInt32LE(m, 8);
  let o = 12, pl = 0, po = 0;
  for (const g of nodes) { buf.writeInt32LE(gLat[g] - pl, o); pl = gLat[g]; o += 4; }
  for (const g of nodes) { buf.writeInt32LE(gLon[g] - po, o); po = gLon[g]; o += 4; }
  const ord = edges.map((i) => [local.get(eA[i]), local.get(eB[i])]).sort((x, y) => x[0] - y[0] || x[1] - y[1]);
  for (const [a] of ord) { buf.writeUInt32LE(a, o); o += 4; }
  for (const [, b] of ord) { buf.writeUInt32LE(b, o); o += 4; }
  const gz = zlib.gzipSync(buf, { level: 9 });
  fs.writeFileSync(path.join(OUT, "t", key + ".bin.gz"), gz);
  return { n, m, bytes: gz.length };
}
fs.mkdirSync(path.join(OUT, "t"), { recursive: true });
const tiles = {}; let total = 0;
for (const [key, edges] of byTile) { const r = writeTile(key, edges); tiles[key] = r.bytes; total += r.bytes; }
fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify({
  format: FORMAT, built: new Date().toISOString(), tileLat: TILE_LAT, tileLon: TILE_LON,
  source: path.basename(args.pbf), attribution: "© OpenStreetMap contributors (ODbL)", tiles,
}));
log(`${Object.keys(tiles).length} tessere scritte in ${OUT}/ · ${(total / 1e6).toFixed(1)} MB totali`);
