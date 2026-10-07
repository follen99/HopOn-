# Hop on! — handoff

Documento di passaggio per una nuova sessione. Contiene i requisiti dell'app, cosa è stato costruito, cosa è stato verificato e cosa resta da fare.

Il file di riferimento è **`hop-on.html`**: un prototipo completo in un unico file, da allegare insieme a questo documento.

---

## 1. Contesto

- L'utente vive a **Torino**, usa spesso i mezzi GTT e scrive in italiano. L'app è per uso personale, ma potrebbe diventare un progetto reale.
- **Preferenza dell'utente sulle risposte:** se un messaggio finisce con un numero da 1 a 5, quel numero indica la lunghezza desiderata della risposta (1 = poche parole, 5 = risposta completa). La risposta deve comunque contenere tutte le informazioni rilevanti.
- **Obiettivo:** un'app che faccia ciò che Google Maps non fa. In questo caso: data una posizione, mostrare **dove si può arrivare in X minuti con i mezzi**, usando dati in tempo reale.

## 2. Requisiti (bozza dell'utente)

1. **Partenza:** posizione GPS corrente, oppure un PIN messo/trascinato sulla mappa.
2. **Calcolo:** l'area raggiungibile con i mezzi entro un certo tempo (isocrona).
3. **Controlli, tramite slider o selettori:**
   - tempo di percorrenza ("dove arrivo in X minuti");
   - mezzi utilizzabili, con checkbox per metro, tram, bus, treni;
   - distanza massima a piedi per raggiungere una fermata. Esempio: con 200 m impostati, una fermata a 300 m viene esclusa.
4. **Mappa:** percorsi e fermate delle linee utili. Toccando una linea, questa viene **evidenziata** per far capire dove passa in città.
5. **Dati reali:** vanno letti davvero dai feed in tempo reale, con la cache necessaria.
6. **Ottimizzata per mobile.**
7. **Codice:** tutto in un HTML, ma organizzato bene per diventare facilmente un progetto vero.
8. **Nome:** "Hop on!"

Aggiunte mie, già implementate: selettore del numero di cambi (nessuno / max 1 / max 2), passo a piedi (3,6 / 4,5 / 5,4 km/h), mezzi live sulla mappa, ritardi e corse soppresse applicati al calcolo, avvisi di servizio nel dettaglio linea, modalità demo.

### Domande ancora aperte (fatte all'utente, senza risposta)

1. Il limite "a piedi" deve valere sia per raggiungere la fermata sia dopo la discesa, o servono due valori separati? Oggi lo stesso valore vale per accesso, cambi e tratto finale.
2. Serve solo "parto adesso" o anche un orario futuro ("parto alle 18:30")?
3. Serve cercare un indirizzo per sapere se rientra nell'area raggiungibile?
4. Piattaforma finale: PWA installabile, app nativa o solo uso personale?
5. Includere i treni regionali SFM/Trenitalia, dal GTFS della Regione Piemonte?

### Idee di feature proposte (non implementate)

- **Modalità radar:** l'app segue la posizione mentre si cammina e avvisa se sta per passare un mezzo nella stessa direzione. Era l'idea iniziale dell'utente.
- **Confronto a piedi vs mezzi:** evidenzia le zone dove il mezzo fa guadagnare davvero tempo.
- **Luoghi preferiti:** casa, lavoro, ecc., con il tempo live per arrivarci.
- **Affidabilità delle linee:** corse fantasma, ritardi medi, bus in coda (bunching). Richiede di registrare i feed nel tempo.
- **Bike sharing e monopattini** per il primo e l'ultimo tratto.

## 3. Fonti dati

Tutte sono **CC-BY 4.0**, fonte GTT / Comune di Torino (portale aperTO), e nessuna richiede una chiave.

| Dato | URL |
|---|---|
| GTFS statico (zip) | `https://www.gtt.to.it/open_data/gtt_gtfs.zip` |
| GTFS-RT posizioni mezzi | `https://percorsieorari.gtt.to.it/das_gtfsrt/vehicle_position.aspx` |
| GTFS-RT passaggi/ritardi | `https://percorsieorari.gtt.to.it/das_gtfsrt/trip_update.aspx` |
| GTFS-RT avvisi | `https://percorsieorari.gtt.to.it/das_gtfsrt/alerts.aspx` |

**Vincolo importante:** i server GTT non inviano gli header CORS, quindi un browser non può leggerli direttamente. Serve un proxy. Il codice di un **Cloudflare Worker** è incluso nel file (`<script type="text/plain" id="proxy-worker-src">`) e copiabile dalle Impostazioni dell'app. Il worker accetta solo gli host `percorsieorari.gtt.to.it` e `www.gtt.to.it` e tiene in cache le risposte: 15 s per il tempo reale, 6 h per lo zip. Nell'app l'indirizzo del proxy si scrive come `https://…workers.dev/?url=`; in alternativa il formato può contenere il segnaposto `{url}`.

Il progetto open source [Torino-Bus-Radar](https://github.com/nadimsbaihi/Torino-Bus-Radar), un'app Android, usa gli stessi feed: utile come riferimento. Non è stato possibile leggerne il codice da questa sessione.

### Mappa di sfondo

- **Predefinita: OpenFreeMap**, mappe vettoriali tramite MapLibre GL con il ponte per Leaflet. Gratuita, senza chiave e senza vincoli di Referer. Stili `positron` (chiaro) e `dark` (scuro).
- **Facoltativa: CARTO raster**, se l'utente inserisce una chiave nelle impostazioni. Da fine agosto 2026 CARTO **richiede una chiave** per le tile raster; la chiave è gratuita, si chiede su carto.com/basemaps/apikey e non serve un account.
- **Ripiego: tile OpenStreetMap**, solo se WebGL non è disponibile. Funzionano **solo** se la pagina è ospitata su un sito https: aprendo il file in locale OSM risponde "Access blocked", perché la richiesta arriva senza Referer. L'utente l'ha già visto succedere.

## 4. Architettura di `hop-on.html`

Il file è diviso in blocchi pensati per diventare moduli separati:

```
<style>                         design tokens (:root, tema chiaro/scuro) + componenti
<body>                          mappa, barra in alto, pannello inferiore trascinabile, modale impostazioni
script#proxy-worker-src         codice del Cloudflare Worker (testo)
script#core                     logica pura senza DOM, esportata come `Core` (anche module.exports → testabile in Node)
script#app                      tutto ciò che usa il browser
```

**`Core`, nell'ordine:**
- `Config`: URL, origine predefinita (piazza Castello, 45.0711, 7.6857), polling 30 s, età massima delle posizioni 300 s, ricarica dello zip ogni 3 giorni, margine di cambio 60 s, `indexVersion` 3.
- `MODES` e `modeFromRouteType`: route_type GTFS (anche gli estesi) ridotti a 4 modalità: 0 metro, 1 tram, 2 bus, 3 treno.
- `Geo`: distanza equirettangolare e griglia spaziale per cercare le fermate vicine.
- `Time` e `Csv`: CSV in streaming, con gestione di virgolette e BOM.
- `GtfsRt.decode(bytes)`: **decoder protobuf scritto a mano**, solo per i campi GTFS-RT usati (FeedMessage, TripUpdate, VehiclePosition, Alert). Così non serve protobuf.js.
- `GtfsStatic.build(zip, now, {fflate}, onProgress)`: decomprime lo zip con fflate, tiene solo i servizi attivi **oggi e ieri** (le corse di ieri oltre le 24:00 vengono spostate di −86400 s) e legge `stop_times.txt` e `shapes.txt` in streaming. Produce un indice a array tipizzati.
- `finalizeIndex`: costruisce le "connessioni" (tratta fermata→fermata di una corsa), ordinate per orario di partenza, e sceglie una forma rappresentativa per linea e direzione.
- `Demo`: rete inventata intorno al centro (9 linee) e posizioni simulate dei mezzi.
- `Realtime`: ritardi e soppressioni dai trip_update, mezzi dalle vehicle_position (collegati per trip_id, altrimenti per route_id), avvisi.
- `Engine.isochrone(idx, opts)`: **Connection Scan Algorithm** con etichette per "round" (numero di corse prese = cambi + 1). Restituisce il tempo di arrivo migliore per ogni fermata e un riepilogo per linea: fermata di salita, orario, direzione, fermate raggiunte. `Engine.isoPoints` produce i punti per il disegno.

**`app`, nell'ordine:**
- `Prefs`: preferenze in localStorage (`hopon.prefs.v1`).
- `Cache`: IndexedDB, database `hopon`, store `kv`, chiavi `zip`, `zipMeta`, `idx`. L'indice viene ricostruito ogni giorno; lo zip vecchio viene riusato se si è offline.
- `Net`: fetch tramite proxy, con timeout e avanzamento del download.
- `MapView`: Leaflet. Contiene:
  - un layer **isocrona** su canvas: unione di cerchi, raggio = min(distanza max a piedi, tempo residuo × velocità), 3 fasce di tempo;
  - il disegno di linee e fermate, con la linea selezionata evidenziata e le altre attenuate;
  - i mezzi live, mostrati solo per le linee utili entro 2,5 km o per la linea selezionata;
  - `centerOn`, che tiene conto dell'altezza del pannello.
- `UI`: controlli, lista "Linee utili adesso", dettaglio linea (dove salire, orari alle fermate, avvisi), stato in alto (Live / Solo orari / Demo).
- `Sheet`: pannello inferiore con 3 altezze. Da 900 px in su diventa una colonna laterale.
- `Settings`: indirizzo del proxy con pulsante di prova, riscarica orari, interruttore demo, passo a piedi, chiave CARTO, codice del worker da copiare.
- `Data`: caricamento degli orari, polling del tempo reale solo con la pagina visibile, ticker della demo.
- `Boot`: se gli orari reali non sono raggiungibili, avvia la **demo** con un banner esplicito.

**Librerie** (CDN, versioni fissate): Leaflet 1.9.4 (cdnjs), fflate 0.8.2, maplibre-gl 5.24.0, @maplibre/maplibre-gl-leaflet 0.1.4 (jsdelivr).
**Font:** Familjen Grotesk, Atkinson Hyperlegible, IBM Plex Mono (Google Fonts).
**Design:** arancio "tram torinese" come accento, isocrona in toni verde acqua, colori per modalità (metro rosso, tram arancio, bus blu, treni viola), tema chiaro e scuro tramite token CSS.

## 5. Cosa è stato verificato

Ambiente di test: Node con lo script `#core` estratto, più Chromium headless. Non ci sono file di test nel repository: vanno ricreati.

- **Decoder GTFS-RT:** un feed generato con le binding ufficiali `gtfs-realtime-bindings` (Python) viene letto correttamente. Verificati: timestamp, float della posizione, ritardi negativi, corse soppresse, orari assoluti, avvisi con traduzione in italiano.
- **Parser GTFS su uno zip sintetico:** CSV con virgolette e BOM, `calendar` + `calendar_dates`, corse notturne di ieri oltre le 24:00, ordinamento delle shape.
- **Motore:** orari di arrivo corretti, filtro sui cambi, filtro sui mezzi, limite a piedi, ritardi applicati, corse soppresse escluse.
- **Prestazioni** su una rete sintetica grande come GTT (4.300 fermate, circa 12.000 corse, circa 406.000 connessioni): costruzione dell'indice circa 0,3 s, isocrona **20–30 ms**.
- **Interfaccia:** screenshot a 390×844 in tema chiaro e scuro, nessun errore JS. Lo stile OpenFreeMap viene richiesto e il layer si inizializza; nel test era simulato.

## 6. Cosa NON è stato verificato (priorità alta)

L'ambiente di sviluppo non poteva raggiungere i server GTT (allowlist di rete). Quindi:

- **Lo zip GTFS reale di GTT non è mai stato scaricato né letto.** Da verificare: nomi delle colonne, dimensione, tempo di elaborazione e memoria su telefono, valori reali di `route_type` (in particolare come è classificata la metro), presenza di `shapes.txt`, `direction_id` e `trip_headsign`.
- **I feed GTFS-RT reali non sono mai stati letti.** Da verificare: se i trip_update usano `delay` o `time`, se i `trip_id` del tempo reale coincidono con quelli dello zip, se le posizioni hanno `bearing` e `timestamp`.
- **Il proxy Cloudflare non è mai stato messo online.**
- **OpenFreeMap reale:** testato solo con uno stile simulato.

## 7. Limiti noti e semplificazioni

- Per ogni corsa si applica **un solo ritardo**, preso dal primo aggiornamento utile, e non un ritardo per singola fermata.
- I tratti a piedi sono calcolati **in linea d'aria** e l'isocrona è un'unione di cerchi, senza percorsi pedonali reali.
- L'elaborazione dello zip avviene sul **thread principale** (a blocchi, con `setTimeout`). Andrebbe spostata in un **Web Worker**.
- L'indice viene salvato intero in IndexedDB: sui dati reali bisogna controllarne la dimensione.
- Gli orari partono sempre da "adesso"; non c'è ricerca di indirizzi.
- Il GPS richiede **https**: aprendo il file in locale su molti telefoni non funziona. Pubblicarlo, per esempio con GitHub Pages, risolve.
- I mezzi live vengono collegati alla linea tramite `trip_id`/`route_id`; se gli ID del tempo reale non corrispondono a quelli dello zip, i mezzi non appaiono.

## 8. Prossimi passi consigliati

1. Mettere online il **proxy Cloudflare** (il codice è nel file) e pubblicare l'HTML su **GitHub Pages**.
2. **Provare con i dati reali** e correggere quanto emerge dalla sezione 6.
3. Spostare `GtfsStatic.build` in un **Web Worker**.
4. Trasformare il file in un progetto (per esempio Vite):
   ```
   src/core/{config,geo,time,csv,gtfs-rt,gtfs-static,demo,realtime,engine}.js
   src/app/{prefs,cache,net,map-view,ui,sheet,settings,data,boot}.js
   src/styles/tokens.css
   worker/proxy.js            (Cloudflare Worker)
   test/                      (decoder, parser, engine — come descritto in §5)
   ```
5. Raccogliere dall'utente le risposte alle **domande aperte** (§2), poi passare alle feature, partendo dalla **modalità radar**.
