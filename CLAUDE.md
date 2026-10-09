# Hop on!

App web mobile per Torino: data una partenza (GPS o PIN sulla mappa) mostra **dove si arriva in X minuti con i mezzi GTT**, usando orari GTFS e feed GTFS-RT in tempo reale. Uso personale, con prospettiva di diventare un progetto vero.

Idee, lavori da fare, domande aperte per l'utente e limiti noti: **[UPGRADES.md](UPGRADES.md)**. Leggerlo all'inizio di una nuova sessione e aggiornarlo quando si chiude o si aggiunge qualcosa. (Il vecchio HANDOFF.md è stato eliminato dall'utente; il contenuto ancora valido è in UPGRADES.md.)

Requisiti originali dell'utente: partenza da GPS o PIN; area raggiungibile entro un tempo; controlli per tempo, mezzi (metro/tram/bus/treni), distanza massima a piedi; linee e fermate utili sulla mappa con la linea toccata evidenziata; dati reali dai feed con cache; ottimizzata per mobile; nome "Hop on!".

## Lingua e preferenze dell'utente

- L'utente scrive in italiano: rispondere in italiano. UI, commenti nel codice e documentazione sono in italiano.
- Se un messaggio finisce con un numero da 1 a 5, indica la lunghezza desiderata della risposta (1 = poche parole, 5 = completa). La risposta deve comunque contenere tutte le informazioni rilevanti.

## Struttura

L'app è in **[hop-on.html](hop-on.html)** (un solo file, nessun build). Accanto:
- [tools/build-walk-tiles.mjs](tools/build-walk-tiles.mjs): Node senza dipendenze, legge un `.osm.pbf` (decoder PBF interno, due passaggi: relazioni poi nodi/vie) e il GTFS GTT, scrive le tessere della rete pedonale in `walk/` (gitignored).
- [.github/workflows/pages.yml](.github/workflows/pages.yml): pubblica su GitHub Pages (`hop-on.html` → `index.html` + `walk/` generata da Geofabrik nord-ovest + `config.js`); istruzioni per l'utente in [README.md](README.md). Pages deve avere Source = GitHub Actions.
- [tools/make-config.mjs](tools/make-config.mjs): scrive `config.js` (`window.HOPON_CONFIG = {proxy}`) dal secret/variabile `HOPON_PROXY` o dal file `.env` (entrambi `config.js` e `.env` sono gitignored). Senza proxy valido non scrive nulla.
- `.claude/launch.json`: server locale `python -m http.server 8080 --bind 0.0.0.0` (nome `hopon`), raggiungibile anche dalla rete locale (es. telefono su `http://<IP del PC>:8080/hop-on.html`; lì niente GPS perché non è https).

`hop-on.html` è diviso in blocchi che diventeranno moduli:

| Blocco | Contenuto |
|---|---|
| commento in `<head>` | mappa del file e URL dei dati |
| `<style>` | design token su `:root` (tema chiaro/scuro) + componenti |
| `<body>` | mappa, barra in alto, pallino e scheda delle impostazioni di viaggio, pannello inferiore trascinabile, modale impostazioni |
| `script#proxy-worker-src` | codice del Cloudflare Worker (proxy CORS), come testo copiabile dalle Impostazioni |
| `script#core` | logica pura **senza DOM**, esposta come `Core` e via `module.exports` |
| `script#app` | tutto ciò che usa il browser (IIFE) |

`Core` contiene: `Config`, `MODES`/`modeFromRouteType`, `Geo`, `Time`, `Csv`, `GtfsRt` (decoder protobuf scritto a mano), `GtfsStatic` + `finalizeIndex` (zip GTFS → indice a array tipizzati), `Demo`, `Realtime`, `Walk` (rete pedonale), `Engine` (isocrona con Connection Scan Algorithm a round).

**Percorsi a piedi (`Walk`):** tessere ~2,8 × 2,8 km (`tileLat` 0,025°, `tileLon` 0,035°, letti da `walk/index.json`), formato `HOW1` gzip descritto in testa a `Walk` e in `writeTile`. `Walk.build` unisce le tessere (nodi di confine per coordinate) in un grafo CSR; i pezzi di rete con meno di 200 nodi sono "non principali" e l'aggancio li evita. `Walk.attach` aggancia le fermate. Un punto parte da tutti i nodi entro (distanza dal più vicino + 40 m) (`Walk.cands`), così piazze e cortili non allungano i percorsi. Dove la rete manca la distanza è stimata: linea d'aria × `Walk.DETOUR` (1,3), e il tratto è marcato `estimated`. `Walk.field` (Dijkstra multi-sorgente in tempo, max `maxWalk` per tratto) dà il tempo di arrivo per nodo: il layer isocrona disegna le strade colorate; i punti fuori rete restano cerchi.

**Preferenza per camminare:** `Config.rideGainSec` (120 s) e `opts.preferWalk` (slider "Preferisco camminare sotto", default 200 m). La preferenza non supera mai il massimo a piedi: `Prefs.fix` (all'avvio e a ogni slider) porta i valori nei limiti di `Prefs.LIMITS` e mette `preferWalk = min(preferWish, maxWalk)`, dove `preferWish` è l'ultima scelta dell'utente (se il massimo risale, la preferenza torna lì). I due slider a piedi hanno la stessa scala 0–1000 m; i valori non ammessi sono tratteggiati sulla barra (`--a`/`--b`). Nel CSA un arrivo a una fermata con più corse vale solo se batte gli arrivi con meno corse di `Engine.margin(lastWalk)`: 120 s, oppure l'intero tempo dell'ultimo tratto a piedi se è ≤ `preferWalk`. Stessa regola in `Engine.journey` tra le opzioni per numero di corse. Gli itinerari e l'area disegnata finiscono solo da fermate dove si scende da un mezzo (`Engine.rideArrival`), così nessun tratto a piedi supera `maxWalk`.

`Engine.isochrone` salva per ogni round e fermata il "genitore" (corsa + fermata di salita, oppure fermata da cui si arriva a piedi); `Engine.journey` lo usa per ricostruire l'itinerario verso un punto qualsiasi, `Engine.nextDepartures` dà i passaggi successivi a una fermata.

**Interazioni sulla mappa:** tocco breve = "Come arrivarci" (vista `journey` nel pannello; fuori dall'area → messaggio breve); pressione prolungata ≥ 550 ms o clic destro = sposta la partenza; il PIN resta trascinabile. Le linee disegnate non sono toccabili (coprirebbero l'area): una linea si seleziona dalla lista, da un mezzo live o da un badge nell'itinerario.

**Mappa e pannello (interfaccia mobile alleggerita):**
- Linee raggiungibili disegnate per intero, tenui; marcato il tratto percorribile entro il tempo (`reachSegment`).
- Area a un colore (tre fasce con `prefs.isoBands`).
- In alto a destra: ingranaggio = "Dati e impostazioni" (modale); sotto, pallino flottante = **impostazioni di viaggio** (tempo, a piedi, preferenza, mezzi, cambi) con i minuti nel badge (`UI.syncFilters`). La scheda (`#trip-panel`, `UI.tripPanel`) resta aperta anche con un itinerario: ogni modifica ricalcola area e itinerario, e la riga in cima (`UI.renderTripRes`) mostra il risultato aggiornato; aperta, il pannello in basso scende al minimo e torna com'era alla chiusura.
- Il pannello in basso mostra solo "In arrivo vicino a te", il dettaglio linea o l'itinerario.
- Lista "In arrivo vicino a te" (`UI.renderList`: per linea e direzione il primo passaggio prendibile a piedi, `byDir` con `round === 1`); le linee raggiungibili solo con cambi stanno sotto come badge.
- Soglie di zoom in `MapView` (`Z`): sotto 14 i mezzi diventano pallini per gruppo (mappa generale) o piccoli cerchi (linea/itinerario), sotto 12 la mappa generale non ne mostra, sotto 13 si nasconde `dotsLayer` (fermate intermedie, frecce).
- **Convenzione di direzione**, valida in tutta l'app: la freccia (`arrowSvg`) o il triangolo puntano dove va il mezzo; il cerchio (`.stop-mark`) è la fermata dove scendi. Etichette dell'itinerario: salita = freccia + linea, discesa = cerchio + linea; si aprono al tocco col nome della fermata.

`app` contiene: `Prefs` (localStorage `hopon.prefs.v1`), `Cache` (IndexedDB `hopon`/`kv`), `Net`, `MapView` (Leaflet + layer isocrona su canvas), `UI`, `WalkAreas`, `Sheet`, `Settings`, `Data`, `Boot`.

**Aree pedonali (`WalkAreas`):** un'area è un cerchio (centro, raggio 3/6/10 km) con le sue tessere; IndexedDB `walk:areas`, `walk:stored`, `walk:index`, `walk:t:<tx>_<ty>`. Download automatico (`ensure`) all'avvio, dopo il GPS e quando la partenza esce dalle aree; gestione manuale in Impostazioni → Percorsi a piedi. Sorgente: `walk/` dello stesso sito (http/https) oppure `prefs.walkBase`; da `file://` niente rete pedonale → stima.

## Regole del codice

- **`script#core` non deve toccare DOM, `window` o API del browser**: deve restare eseguibile in Node.
- Se cambia il formato dell'indice prodotto da `GtfsStatic`/`finalizeIndex`, **incrementare `Config.indexVersion`**, altrimenti resta in uso l'indice vecchio in IndexedDB.
- Librerie solo da CDN con versione fissata: Leaflet 1.9.4 (cdnjs), fflate 0.8.2, maplibre-gl 5.24.0, @maplibre/maplibre-gl-leaflet 0.1.4 (jsdelivr). Niente protobuf.js: si usa il decoder interno.
- Colori solo tramite token CSS (accento arancio, isocrona verde acqua; metro rosso, tram arancio, bus blu, treni viola). Ogni modifica grafica va controllata in tema chiaro e scuro e a larghezza telefono (390×844); da 900 px il pannello diventa colonna laterale.
- Modalità normalizzate: 0 metro, 1 tram, 2 bus, 3 treno.

## Dati e rete

- Fonti GTT/aperTO, CC-BY 4.0, senza chiave (URL in `Config.urls`).
- I server GTT **non inviano header CORS**: dal browser si passa sempre dal proxy (formato `https://…workers.dev/?url=` oppure con segnaposto `{url}`). Il worker accetta solo `percorsieorari.gtt.to.it` e `www.gtt.to.it`.
- Proxy effettivo = `prefs.proxy` dell'utente, altrimenti `Site.proxy` letto da `config.js` (script `window.HOPON_CONFIG`, funziona anche da `file://`), altrimenti nessuno → demo con banner che chiede di collegarlo. **Non scrivere l'indirizzo del proxy nei file del repository** (è pubblico): sta nel secret `HOPON_PROXY` e in `.env` locale.
- Mappa: OpenFreeMap vettoriale (default), CARTO raster con chiave facoltativa, tile OSM solo come ripiego (non funzionano da `file://`).
- GPS e tile OSM richiedono https: per provare su telefono va pubblicato (es. GitHub Pages).
- Senza orari reali raggiungibili l'app parte in **modalità demo**, con banner.

## Test

Non ci sono ancora file di test. `Core` si carica in Node estraendo lo script:

```bash
node -e 'const fs=require("fs"),vm=require("vm");const src=fs.readFileSync("hop-on.html","utf8").match(/<script id="core">([\s\S]*?)<\/script>/)[1];const m={exports:{}};vm.runInNewContext(src,{module:m,console,TextDecoder,Date,Math});console.log(Object.keys(m.exports))'
```

Per l'interfaccia con i percorsi a piedi serve http: generare `walk/` (es. da BBBike Torino, 24 MB: `node tools/build-walk-tiles.mjs --pbf Turin.osm.pbf --out walk`), avviare il server `hopon` di `.claude/launch.json` e aprire `http://localhost:8080/hop-on.html`. Aperta come file, l'app funziona ma con i tratti a piedi stimati.

## Stato

- Proxy dell'utente online (funzionante, rifiuta host non GTT); indirizzo nel secret `HOPON_PROXY` del repository GitHub `follen99/HopOn-` e in `.env` locale.
- **Dati reali verificati in Node (7 ottobre 2026)** con `Core`:
  - Zip GTT ~15,8 MB (stop_times.txt ~84 MB decompresso). `GtfsStatic.build` ~3,8 s su PC (sul telefono sarà molto di più → Web Worker), indice ~16 MB. 7.054 fermate, 215 linee, ~15.000 corse/giorno, ~430.000 connessioni. Isocrona 10–15 ms.
  - `routes.txt`: metro `METROU` con route_type 1 (classificata correttamente), 10 tram, 204 bus, **nessun treno** → la casella "Treni" oggi non ha effetto. CSV con tutti i campi tra virgolette.
  - `direction_id`, `trip_headsign` e `shapes.txt` presenti. `stop_sequence` sempre 1..n contiguo (usato da `Realtime._schedAt`).
  - Posizioni mezzi: tutte con `bearing` e `timestamp`, età tipica ~2 min; ~83% con `trip_id`, tutti con `route_id`, tutti presenti nello zip. **La metro non c'è mai** (né posizioni né trip_update) e molte linee mancano: il 9 ottobre alle 10:50 il feed aveva 316 mezzi su 64 linee contro 517 corse in servizio su 119 linee (a volte il feed arriva vuoto). Mezzi sulla mappa (`UI.vehicles`): live (`prefs.vehLive`) e stimati dall'orario (`Realtime.scheduled`, tratteggiati, `prefs.vehScheduled`). Mappa generale: solo quelli che devono ancora passare da una fermata raggiungibile a piedi, in tempo e entro il tempo a disposizione (`Realtime.approaching`), con stime solo per le linee senza nessun mezzo live; linea selezionata o itinerario: tutti i mezzi di quelle linee, con stime per le corse non coperte (doppioni scartati entro 400 m). Barretta in alto/basso nel riquadro = `direction_id` 0/1, legenda nei titoli "Verso …" del dettaglio linea.
  - trip_update: nessun `delay` a livello corsa; per fermata mix di `delay` e `time`, solo `stop_sequence` (mai `stop_id`). Tutti i `trip_id` presenti nello zip.
  - Avvisi: ~150, quasi tutti collegati a linee; quelli con solo `agency_id` (es. "Linee 13 e 15 deviate") non vengono associati alle linee.
- Rete pedonale (7 ottobre 2026): estratto BBBike Torino → 175 tessere, 3,8 MB; area di 6 km attorno a piazza Castello ≈ 1,3 MB, ~160.000 nodi, costruzione grafo ~0,4 s + aggancio fermate ~0,5 s su PC; isocrona con strade ~10 ms, area colorata ~30 ms. Tratti a piedi tipicamente 1,2–1,4 × la linea d'aria.
- Verificati nel browser (localhost) con dati reali: itinerari, cambi, pressione prolungata, aree a piedi (download, eliminazione, persistenza), proxy del sito (presente, assente, non raggiungibile). Estratto Geofabrik completo: 833 tessere, 14,7 MB, ~50 s.
- Preferenza per camminare, su ~500 itinerari reali: corse medie 1,31 → 1,22, "navette" di 1–2 fermate prima di un altro mezzo 43 → 28, arrivo medio invariato (+6 s).
- Non verificati: prestazioni sul telefono.
- **Pubblicazione (9 ottobre 2026):** sito online su https://follen99.github.io/HopOn-/ (Pages con Source = GitHub Actions), ma con la versione del commit `4632bd7`; in locale ci sono commit non ancora inviati e modifiche non salvate (mezzi filtrati, direzione). Il secret `HOPON_PROXY` va creato su GitHub perché il sito abbia il proxy predefinito.
- L'utente prova anche dal telefono tramite il server locale (`http://<IP del PC>:8080/hop-on.html`).
- Interfaccia mobile alleggerita (UPGRADES §1.1–1.6) fatta e verificata su localhost il 9 ottobre 2026.
- Prossimi passi: vedi [UPGRADES.md](UPGRADES.md). Prima la **fluidità su mobile** (§3.8, con l'elenco dei punti caldi), poi il Web Worker per gli orari (§3.2).
