# Hop on!

App web mobile per Torino: data una partenza (GPS o PIN sulla mappa) mostra **dove si arriva in X minuti con i mezzi GTT**, usando orari GTFS e feed GTFS-RT in tempo reale. Uso personale, con prospettiva di diventare un progetto vero.

Storia, requisiti completi, domande aperte e idee di feature: **[HANDOFF.md](HANDOFF.md)**. Leggerlo prima di lavori non banali.

## Lingua e preferenze dell'utente

- L'utente scrive in italiano: rispondere in italiano. UI, commenti nel codice e documentazione sono in italiano.
- Se un messaggio finisce con un numero da 1 a 5, indica la lunghezza desiderata della risposta (1 = poche parole, 5 = completa). La risposta deve comunque contenere tutte le informazioni rilevanti.

## Struttura

Tutto il prototipo è in **[hop-on.html](hop-on.html)** (un solo file, nessun build). È diviso in blocchi che diventeranno moduli:

| Blocco | Contenuto |
|---|---|
| commento in `<head>` | mappa del file e URL dei dati |
| `<style>` | design token su `:root` (tema chiaro/scuro) + componenti |
| `<body>` | mappa, barra in alto, pannello inferiore trascinabile, modale impostazioni |
| `script#proxy-worker-src` | codice del Cloudflare Worker (proxy CORS), come testo copiabile dalle Impostazioni |
| `script#core` | logica pura **senza DOM**, esposta come `Core` e via `module.exports` |
| `script#app` | tutto ciò che usa il browser (IIFE) |

`Core` contiene: `Config`, `MODES`/`modeFromRouteType`, `Geo`, `Time`, `Csv`, `GtfsRt` (decoder protobuf scritto a mano), `GtfsStatic` + `finalizeIndex` (zip GTFS → indice a array tipizzati), `Demo`, `Realtime`, `Engine` (isocrona con Connection Scan Algorithm a round).

`Engine.isochrone` salva per ogni round e fermata il "genitore" (corsa + fermata di salita, oppure fermata da cui si arriva a piedi); `Engine.journey` lo usa per ricostruire l'itinerario verso un punto qualsiasi, `Engine.nextDepartures` dà i passaggi successivi a una fermata.

**Interazioni sulla mappa:** tocco breve = "Come arrivarci" (vista `journey` nel pannello; fuori dall'area → messaggio breve); pressione prolungata ≥ 550 ms o clic destro = sposta la partenza; il PIN resta trascinabile. Le linee disegnate non sono toccabili (coprirebbero l'area): una linea si seleziona dalla lista, da un mezzo live o da un badge nell'itinerario.

`app` contiene: `Prefs` (localStorage `hopon.prefs.v1`), `Cache` (IndexedDB `hopon`/`kv`), `Net`, `MapView` (Leaflet + layer isocrona su canvas), `UI`, `Sheet`, `Settings`, `Data`, `Boot`.

## Regole del codice

- **`script#core` non deve toccare DOM, `window` o API del browser**: deve restare eseguibile in Node.
- Se cambia il formato dell'indice prodotto da `GtfsStatic`/`finalizeIndex`, **incrementare `Config.indexVersion`**, altrimenti resta in uso l'indice vecchio in IndexedDB.
- Librerie solo da CDN con versione fissata: Leaflet 1.9.4 (cdnjs), fflate 0.8.2, maplibre-gl 5.24.0, @maplibre/maplibre-gl-leaflet 0.1.4 (jsdelivr). Niente protobuf.js: si usa il decoder interno.
- Colori solo tramite token CSS (accento arancio, isocrona verde acqua; metro rosso, tram arancio, bus blu, treni viola). Ogni modifica grafica va controllata in tema chiaro e scuro e a larghezza telefono (390×844); da 900 px il pannello diventa colonna laterale.
- Modalità normalizzate: 0 metro, 1 tram, 2 bus, 3 treno.

## Dati e rete

- Fonti GTT/aperTO, CC-BY 4.0, senza chiave (URL in `Config.urls`).
- I server GTT **non inviano header CORS**: dal browser si passa sempre dal proxy (formato `https://…workers.dev/?url=` oppure con segnaposto `{url}`). Il worker accetta solo `percorsieorari.gtt.to.it` e `www.gtt.to.it`.
- Mappa: OpenFreeMap vettoriale (default), CARTO raster con chiave facoltativa, tile OSM solo come ripiego (non funzionano da `file://`).
- GPS e tile OSM richiedono https: per provare su telefono va pubblicato (es. GitHub Pages).
- Senza orari reali raggiungibili l'app parte in **modalità demo**, con banner.

## Test

Non ci sono ancora file di test. `Core` si carica in Node estraendo lo script:

```bash
node -e 'const fs=require("fs"),vm=require("vm");const src=fs.readFileSync("hop-on.html","utf8").match(/<script id="core">([\s\S]*?)<\/script>/)[1];const m={exports:{}};vm.runInNewContext(src,{module:m,console,TextDecoder,Date,Math});console.log(Object.keys(m.exports))'
```

Per l'interfaccia: aprire `hop-on.html` nel browser (il pannello browser integrato va bene) e controllare la console.

## Stato

- Proxy online: `https://hopon-proxy.giulianoranauroiphone1.workers.dev/?url=` (funzionante, rifiuta host non GTT).
- **Dati reali verificati in Node (7 ottobre 2026)** con `Core`:
  - Zip GTT ~15,8 MB (stop_times.txt ~84 MB decompresso). `GtfsStatic.build` ~3,8 s su PC (sul telefono sarà molto di più → Web Worker), indice ~16 MB. 7.054 fermate, 215 linee, ~15.000 corse/giorno, ~430.000 connessioni. Isocrona 10–15 ms.
  - `routes.txt`: metro `METROU` con route_type 1 (classificata correttamente), 10 tram, 204 bus, **nessun treno** → la casella "Treni" oggi non ha effetto. CSV con tutti i campi tra virgolette.
  - `direction_id`, `trip_headsign` e `shapes.txt` presenti. `stop_sequence` sempre 1..n contiguo (usato da `Realtime._schedAt`).
  - Posizioni mezzi: tutte con `bearing` e `timestamp`, età tipica ~2 min; ~83% con `trip_id`, tutti con `route_id`, tutti presenti nello zip.
  - trip_update: nessun `delay` a livello corsa; per fermata mix di `delay` e `time`, solo `stop_sequence` (mai `stop_id`). Tutti i `trip_id` presenti nello zip.
  - Avvisi: ~150, quasi tutti collegati a linee; quelli con solo `agency_id` (es. "Linee 13 e 15 deviate") non vengono associati alle linee.
- Non ancora verificati: app completa nel browser con dati reali, OpenFreeMap reale, prestazioni sul telefono.
- Prossimi passi (HANDOFF.md §8): GitHub Pages → prova dell'app sul telefono → `GtfsStatic.build` in un Web Worker → migrazione a progetto Vite (`src/core`, `src/app`, `worker/proxy.js`, `test/`) → domande aperte e modalità radar.
