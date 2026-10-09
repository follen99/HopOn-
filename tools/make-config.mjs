#!/usr/bin/env node
/*
  Hop on! — scrive config.js (window.HOPON_CONFIG), letto dall'app all'avvio, con il proxy predefinito per i dati GTT.
  È uno script e non un JSON perché così funziona anche aprendo hop-on.html da disco (file://).

  Uso:  node tools/make-config.mjs [--out <cartella>]        (predefinita: cartella corrente)

  Il proxy si legge, in quest'ordine:
    1. dalla variabile d'ambiente HOPON_PROXY (su GitHub: secret o variabile del repository);
    2. dal file .env nella cartella corrente (riga HOPON_PROXY=...), comodo in locale.
  Se manca o non è valido non scrive nulla (e cancella un config.js vecchio): l'app chiederà all'utente
  di inserire il suo proxy, come senza configurazione. Non fallisce mai, così la pubblicazione non si blocca.

  Nota: config.js è pubblico sul sito pubblicato, quindi chiunque apra la pagina può leggere l'indirizzo del proxy.
*/
import fs from "node:fs";
import path from "node:path";

const argv = process.argv.slice(2), i = argv.indexOf("--out");
const out = i >= 0 && argv[i + 1] ? argv[i + 1] : ".";
const file = path.join(out, "config.js");
const warn = (msg) => console.log(process.env.GITHUB_ACTIONS ? `::warning::${msg}` : `Attenzione: ${msg}`);

function fromDotEnv() {
  try {
    for (const line of fs.readFileSync(".env", "utf8").split(/\r?\n/)) {
      const m = /^\s*(?:export\s+)?HOPON_PROXY\s*=\s*(.*)\s*$/.exec(line);
      if (m) return m[1].replace(/\s+#.*$/, "").replace(/^(["'])(.*)\1$/, "$2");
    }
  } catch {}
  return "";
}

const proxy = (process.env.HOPON_PROXY || fromDotEnv()).trim();
const clear = () => { try { fs.rmSync(file); } catch {} };

if (!proxy) {
  clear();
  warn("HOPON_PROXY non impostato: nessun proxy predefinito, ogni utente dovrà inserire il suo dalle impostazioni.");
} else if (!/^https:\/\/\S+$/.test(proxy)) {
  clear();
  warn("HOPON_PROXY non valido (deve essere un indirizzo https senza spazi): ignorato.");
} else {
  if (!proxy.includes("{url}") && !/[?&]url=$/.test(proxy)) warn("HOPON_PROXY di solito termina con ?url= (oppure contiene {url}).");
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(file, `// Generato da tools/make-config.mjs: non modificare a mano.\nwindow.HOPON_CONFIG = ${JSON.stringify({ proxy })};\n`);
  console.log(`config.js scritto in ${out} con il proxy predefinito.`);
}
