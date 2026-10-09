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
- [feedback/hopon-feedback.gs](feedback/hopon-feedback.gs): Google Apps Script che crea il Google Form di feedback (`creaForm`) e analizza le risposte con regole fisse (`analizza` → fogli Analisi, Backlog, Testi liberi: NPS, SUS, opportunity score, Kano, codifica dei testi, utenti quotidiani pesati il doppio); metodo in [feedback/README.md](feedback/README.md). Codici delle voci = sezioni di UPGRADES.md.
- [promo/reddit-r-torino.md](promo/reddit-r-torino.md): post di lancio per r/Torino.
- `.claude/launch.json`: server locale `python -m http.server 8080 --bind 0.0.0.0` (nome `hopon`), raggiungibile anche dalla rete locale (es. telefono su `http://<IP del PC>:8080/hop-on.html`; lì niente GPS perché non è https).

`hop-on.html` è diviso in blocchi che diventeranno moduli:

| Blocco | Contenuto |
|---|---|
| commento in `<head>` | mappa del file e URL dei dati |
| `<style>` | design token su `:root` (tema chiaro/scuro) + componenti |
| script in `<head>` | applica subito il tema salvato (niente lampo di colori) |
| `<body>` | mappa, barra in alto con la ricerca, pallino e scheda delle impostazioni di viaggio, pannello inferiore trascinabile, modale impostazioni; testi con `data-i18n*` |
| `script#i18n` | testi dell'interfaccia in tutte le lingue (`LOCALES`) e il motore `I18n` (`t`, `apply`, `set`, `missing`); subito dopo il markup, così la lingua giusta c'è al primo disegno |
| `script#proxy-worker-src` | codice del Cloudflare Worker (proxy CORS), come testo copiabile dalle Impostazioni |
| `script#core` | logica pura **senza DOM**, esposta come `Core` e via `module.exports` |
| `script#app` | tutto ciò che usa il browser (IIFE) |

`Core` contiene: `Config`, `MODES`/`modeFromRouteType`, `Geo`, `Time`, `Csv`, `GtfsRt` (decoder protobuf scritto a mano), `GtfsStatic` + `finalizeIndex` (zip GTFS → indice a array tipizzati), `Demo`, `Realtime`, `Walk` (rete pedonale), `Shape` (fermate agganciate alla forma della corsa), `Engine` (isocrona con Connection Scan Algorithm a round, itinerari, fix).

**Tratti evidenziati da fermata a fermata:** `Shape.snapStops` proietta ogni fermata sul punto più vicino del tratto giusto della forma (posizione continua `j + u`, non il vertice più vicino). Per ogni fermata considera come candidati i minimi locali della distanza e sceglie, con programmazione dinamica, la sequenza che avanza sempre lungo la forma con la distanza totale minima, così le forme che passano due volte nella stessa via non sbagliano passaggio. `ridePath` in `MapView` usa `Shape.sub` più un raccordo fino al punto esatto di ogni fermata: lo usano l'itinerario e i tratti raggiungibili. Sui 1.245 schemi di fermate reali (9 ottobre 2026): distanza fermata–inizio/fine del tratto con mediana 57 m e massimo 7,8 km prima, mediana 6 m e 99% entro 23 m dopo; ~0,1 ms per schema.

**Percorsi a piedi (`Walk`):** tessere ~2,8 × 2,8 km (`tileLat` 0,025°, `tileLon` 0,035°, letti da `walk/index.json`), formato `HOW1` gzip descritto in testa a `Walk` e in `writeTile`. `Walk.build` unisce le tessere (nodi di confine per coordinate) in un grafo CSR; i pezzi di rete con meno di 200 nodi sono "non principali" e l'aggancio li evita. `Walk.attach` aggancia le fermate. Un punto parte da tutti i nodi entro (distanza dal più vicino + 40 m) (`Walk.cands`), così piazze e cortili non allungano i percorsi. Dove la rete manca la distanza è stimata: linea d'aria × `Walk.DETOUR` (1,3), e il tratto è marcato `estimated`. `Walk.field` (Dijkstra multi-sorgente in tempo, max `maxWalk` per tratto) dà il tempo di arrivo per nodo: il layer isocrona disegna le strade colorate; i punti fuori rete restano cerchi.

**Preferenza per camminare:** `Config.rideGainSec` (120 s) e `opts.preferWalk` (slider "Preferisco camminare sotto", default 200 m). La preferenza non supera mai il massimo a piedi: `Prefs.fix` (all'avvio e a ogni slider) porta i valori nei limiti di `Prefs.LIMITS` e mette `preferWalk = min(preferWish, maxWalk)`, dove `preferWish` è l'ultima scelta dell'utente (se il massimo risale, la preferenza torna lì). I due slider a piedi hanno la stessa scala 0–1000 m; i valori non ammessi sono tratteggiati sulla barra (`--a`/`--b`). Nel CSA un arrivo a una fermata con più corse vale solo se batte gli arrivi con meno corse di `Engine.margin(lastWalk)`: 120 s, oppure l'intero tempo dell'ultimo tratto a piedi se è ≤ `preferWalk`. Stessa regola in `Engine.journey` tra le opzioni per numero di corse. Gli itinerari e l'area disegnata finiscono solo da fermate dove si scende da un mezzo (`Engine.rideArrival`), così nessun tratto a piedi supera `maxWalk`.

**Meglio a piedi (`Engine.walkAdvice`):** dopo `Engine.journey` l'itinerario coi mezzi si confronta con il percorso tutto a piedi. Questo non ha il limite per tratto, perché coi mezzi si camminerebbe comunque quasi altrettanto, ma deve stare entro il tempo a disposizione. Si suggerisce di camminare se i mezzi fanno guadagnare poco tempo **e** poca strada a piedi, con le soglie di `Config.walkAdvice`:
- tempo: almeno 2 min se tutte le corse hanno orari in tempo reale, 4 min se programmati, più 2 min per ogni mezzo oltre il primo;
- strada: almeno max(300 m, 40% del percorso a piedi).

Nella vista itinerario si mostra allora il percorso a piedi con il riquadro "Meglio a piedi", con il pulsante "Vedi con i mezzi" (`state.rideAnyway`); altrimenti c'è una riga di confronto "Tutto a piedi: …". `Engine.plan(idx, res, lat, lon, rideAnyway, walkOnly)` mette insieme `journey` + `walkAdvice` e restituisce l'itinerario da mostrare (`best`); `Engine.walkTrip` è il percorso tutto a piedi.

**Destinazione fuori area: i "fix" (`Engine.fixes`).** Se `plan` non trova itinerari, si cercano impostazioni diverse con cui ci si arriva, ognuna col suo itinerario, cambiando il meno possibile:
- più tempo: il minimo a passi di 5 min (prova col massimo, 90 min, poi conferma);
- più strada a piedi per tratto: ricerca binaria tra il valore attuale e 1000 m;
- se a piedi da solo non basta: combinazioni a piedi + tempo (valgono solo se chiedono meno tempo del fix "solo tempo");
- più cambi (il primo numero che basta) e mezzi esclusi (solo quelli che l'itinerario usa);
- "tutto a piedi" oltre il massimo per tratto (`changes.walkOnly`, poi `state.walkOnly`), se si cammina al più `Config.fixes.walkOnlyMaxMin` (30 min) o entro il tempo scelto;
- se non c'è niente: tutto al massimo, poi ridotto.

Ordinati per `Engine.fixCost`, in minuti "percepiti": durata + 0,5 × minuti a piedi + 3 per cambio, più le penalità per l'uscita dalle impostazioni dell'utente (1,5 × minuti a piedi oltre il suo massimo per tratto, 3 per cambio in più, 6 per mezzo riattivato); valori in `Config.fixes`. Itinerari uguali compaiono una volta sola, al massimo 4 fix. Le cache dei cambi a piedi create per le prove (`W.nb`) vengono tolte alla fine. Sui dati reali (9 ottobre 2026): 6–19 isocrone, 100–580 ms su PC. Nell'app (`UI.loadFixes`) il calcolo parte in differita (250 ms, "Cerco come arrivarci…") e resta valido finché non cambiano destinazione, partenza o impostazioni (al massimo 2 minuti, poi si ricalcola mostrando intanto i vecchi). La vista mostra la soluzione consigliata e le altre sotto "Altre N soluzioni"; toccandone una la si vede sulla mappa (`state.fixPick`), "Applica" (`UI.applyFix`) cambia preferenze e slider (`UI.syncControls`), "Ripristina" (`state.fixUndo`) torna indietro.

`Engine.isochrone` salva per ogni round e fermata il "genitore" (corsa + fermata di salita, oppure fermata da cui si arriva a piedi); `Engine.journey` lo usa per ricostruire l'itinerario verso un punto qualsiasi, `Engine.nextDepartures` dà i passaggi successivi a una fermata.

**Interazioni sulla mappa:** tocco breve = "Come arrivarci" (`UI.goTo`, vista `journey` nel pannello; fuori dall'area → i fix); con la ricerca aperta il tocco la chiude e basta; pressione prolungata ≥ 550 ms o clic destro = sposta la partenza; il PIN resta trascinabile. Le linee disegnate non sono toccabili (coprirebbero l'area): una linea si seleziona dalla lista, da un mezzo live o da un badge nell'itinerario.

**Mappa e pannello (interfaccia mobile alleggerita):**
- Linee raggiungibili disegnate per intero, tenui; marcato il tratto percorribile entro il tempo (`reachSegment`).
- Area a un colore (tre fasce con `prefs.isoBands`).
- In alto a destra: ingranaggio = "Dati e impostazioni" (modale); sotto, pallino flottante = **impostazioni di viaggio** (tempo, a piedi, preferenza, mezzi, cambi) con i minuti nel badge (`UI.syncFilters`). La scheda (`#trip-panel`, `UI.tripPanel`) resta aperta anche con un itinerario: ogni modifica ricalcola area e itinerario, e la riga in cima (`UI.renderTripRes`) mostra il risultato aggiornato; aperta, il pannello in basso scende al minimo e torna com'era alla chiusura.
- Il pannello in basso mostra solo "In arrivo vicino a te", il dettaglio linea o l'itinerario.
- Lista "In arrivo vicino a te" (`UI.renderList`: per linea e direzione il primo passaggio prendibile a piedi, `byDir` con `round === 1`); le linee raggiungibili solo con cambi stanno sotto come badge.
- Soglie di zoom in `MapView` (`Z`): sotto 14 i mezzi diventano pallini per gruppo (mappa generale) o piccoli cerchi (linea/itinerario), sotto 12 la mappa generale non ne mostra, sotto 13 si nasconde `dotsLayer` (fermate intermedie, frecce).
- **Convenzione di direzione**, valida in tutta l'app: la freccia (`arrowSvg`) o il triangolo puntano dove va il mezzo; il cerchio (`.stop-mark`) è la fermata dove scendi. Etichette dell'itinerario: salita = freccia + linea, discesa = cerchio + linea; si aprono al tocco col nome della fermata.

**Ricerca della destinazione (`Search`):** campo nella barra in alto (su telefono, aperto, copre il logo; il chip di stato è sotto, a sinistra). Fermate GTT cercate nell'indice (tutte le parole nel nome o il codice; una per nome, la più vicina; al più 4) e indirizzi/luoghi da **Photon** (`Config.urls.geocode`, OpenStreetMap, senza chiave, CORS aperto: non passa dal proxy). Photon (`Config.geocode`): dal 3° carattere, attesa 280 ms, richiesta precedente annullata, 15 risultati riordinati per posizione nella risposta + distanza dalla partenza (3 km = un posto) e tenuti 8; `bbox` = fermate dell'indice ± 0,05° (le fermate GTT coprono quasi tutta la provincia, quindi conta soprattutto il riordino); `lang` sempre passato (`_meta.geocode` della lingua: Photon accetta solo `default`, `de`, `en`, `fr`, e senza `lang` usa la lingua del browser); la partenza mandata per la precedenza ai vicini è arrotondata a 2 decimali (~1 km). Ricerche recenti in `prefs.recent` (6), mostrate a campo vuoto. Frecce + Invio da tastiera. La scelta apre `UI.goTo({lat, lon, name, sub})`: il titolo del pannello diventa il nome del luogo.

`app` contiene: `Prefs` (localStorage `hopon.prefs.v1`), `Cache` (IndexedDB `hopon`/`kv`), `Net`, `Theme`, `MapView` (Leaflet + layer isocrona su canvas), `UI`, `Search`, `WalkAreas`, `Sheet`, `Settings`, `Data`, `Boot`.

**Tema e lingua (Impostazioni → Aspetto e lingua):** `prefs.theme` = `auto` | `light` | `dark` (`data-theme` su `<html>`, token già pronti in `<style>`); al cambio si ridisegnano mappa di sfondo e linee. `prefs.lang` = `auto` | codice di `LOCALES`; `auto` prende la prima lingua del browser disponibile, altrimenti l'inglese. Al cambio (`I18n.onChange` → `UI.relabel`) si riapplicano i testi fissi e si ridisegna tutto senza ricaricare. I banner di avvio sono salvati come chiavi (`Boot.setBanner`) per poterli ritradurre. Avvisi GTT nella lingua scelta se il feed la ha (`Realtime.alerts(idx, feed, [lang, "it"])`).

**Aree pedonali (`WalkAreas`):** un'area è un cerchio (centro, raggio 3/6/10 km) con le sue tessere; IndexedDB `walk:areas`, `walk:stored`, `walk:index`, `walk:t:<tx>_<ty>`. Download automatico (`ensure`) all'avvio, dopo il GPS e quando la partenza esce dalle aree; gestione manuale in Impostazioni → Percorsi a piedi. Sorgente: `walk/` dello stesso sito (http/https) oppure `prefs.walkBase`; da `file://` niente rete pedonale → stima.

## Regole del codice

- **`script#core` non deve toccare DOM, `window` o API del browser**: deve restare eseguibile in Node.
- Se cambia il formato dell'indice prodotto da `GtfsStatic`/`finalizeIndex`, **incrementare `Config.indexVersion`**, altrimenti resta in uso l'indice vecchio in IndexedDB.
- Librerie solo da CDN con versione fissata: Leaflet 1.9.4 (cdnjs), fflate 0.8.2, maplibre-gl 5.24.0, @maplibre/maplibre-gl-leaflet 0.1.4 (jsdelivr). Niente protobuf.js: si usa il decoder interno.
- Colori solo tramite token CSS (accento arancio, isocrona verde acqua; metro rosso, tram arancio, bus blu, treni viola). Ogni modifica grafica va controllata in tema chiaro e scuro e a larghezza telefono (390×844); da 900 px il pannello diventa colonna laterale.
- Modalità normalizzate: 0 metro, 1 tram, 2 bus, 3 treno.
- **Testi dell'interfaccia solo da `script#i18n`**: nel codice `t("chiave", {param})`, nel markup `data-i18n` / `data-i18n-html` / `data-i18n-attr` (+ `data-i18n-args`). Niente testi fissi nello `script#app`; numeri e date con `I18n.num` / `I18n.date` / `I18n.dateTime` / `I18n.time` (o `fmtDist`, `fmtDur`, `fmtMb`). Il `Core` non ha testi: le fasi di caricamento sono chiavi (`load.*`). L'italiano è la lingua di riferimento e deve essere completo; ogni nuova chiave va aggiunta a **tutte** le lingue. Plurali come oggetti `{ one, other, "=0" }` (Intl.PluralRules). **Nuova lingua:** copiare il blocco `en` in `LOCALES`, tradurre, compilare `_meta` (`name`, `locale`, `geocode`); controllare con `I18n.missing("xx")` (comando in "Test").

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

Traduzioni: chiavi mancanti per lingua.

```bash
node -e 'const fs=require("fs"),vm=require("vm");const src=fs.readFileSync("hop-on.html","utf8").match(/<script id="i18n">([\s\S]*?)<\/script>/)[1];const m={exports:{}};vm.runInNewContext(src,{module:m,Intl});for(const l in m.exports.LOCALES)console.log(l,m.exports.missing(l))'
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
- Ricerca della destinazione con fix, tema chiaro/scuro/automatico, italiano e inglese (UPGRADES §2.7, §2.11, §2.12): fatti e verificati su localhost il 9 ottobre 2026 con dati reali (390×844 e desktop, chiaro e scuro, cambio di lingua al volo). Tempo a disposizione ora fino a 90 min (prima 60), così i fix "più tempo" si possono applicare.
- Prossimi passi: vedi [UPGRADES.md](UPGRADES.md). Prima la **fluidità su mobile** (§3.8, con l'elenco dei punti caldi), poi il Web Worker per gli orari (§3.2).
