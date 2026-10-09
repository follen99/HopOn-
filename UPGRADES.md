# Hop on! — miglioramenti

Elenco di idee, lavori da fare, domande aperte e limiti noti. Aggiornarlo quando si chiude o si aggiunge qualcosa.

Stato: **da fare** (concordato con l'utente) · **proposta** (idea non ancora approvata) · **fatto** (con data).

## 1. Interfaccia mobile: meno informazioni a schermo

Su telefono la schermata era troppo carica. Proposte del 9 ottobre 2026, tutte fatte lo stesso giorno (verificate su localhost con dati reali, tema chiaro e scuro, 390×844).

| # | Idea | Stato |
|---|---|---|
| 1.1 | **Linee raggiungibili per intero, tenui fuori dalla zona raggiungibile** (scelta dell'utente al posto di "solo quando servono"): ogni linea è disegnata tutta, tenue; marcato solo il tratto che si percorre entro il tempo (per direzione, dalla fermata di salita all'ultima fermata in tempo: `reachSegment`). Con una linea selezionata le altre diventano ancora più tenui. | fatto (9/10/2026) |
| 1.2 | **Impostazioni di viaggio in un pallino flottante** sotto l'ingranaggio (che ora apre i dati e le impostazioni generali), con i minuti nel badge. La scheda resta aperta anche con un itinerario, così si vede come cambia modificando cambi, tratto a piedi, ecc.: in cima la riga col risultato aggiornato (arrivo, linee, metri a piedi), che lampeggia quando cambia; il pannello in basso scende al minimo mentre è aperta. Il pannello in basso mostra solo "In arrivo vicino a te" o l'itinerario. Il suggerimento sui gesti sparisce dopo il primo uso (`prefs.hintSeen`). | fatto (9/10/2026) |
| 1.3 | **Meno dettagli a zoom basso** (`Z` in `MapView`): sotto 14 nella mappa generale un pallino per gruppo di mezzi della stessa linea (entro ~70 px) col numero, sotto 12 nessun mezzo; con linea selezionata o itinerario piccoli cerchi pieni (stimati: chiari e tratteggiati). Sotto 13 spariscono fermate intermedie e frecce (`dotsLayer`). | fatto (9/10/2026) |
| 1.4 | **Etichette compatte dell'itinerario con convenzione di direzione:** alla salita freccia + linea (la freccia punta dove va il mezzo, calcolata dalla forma della corsa), alla discesa cerchio + linea (bordo); al tocco l'etichetta si apre con "Sali a … · ora". Frecce anche lungo il tratto percorso (ogni ~400 m). Legenda sotto il riepilogo dell'itinerario. Vicino alla partenza l'etichetta di salita va sotto la fermata (il PIN la coprirebbe). | fatto (9/10/2026) |
| 1.5 | **Area raggiungibile a un solo colore**; tre fasce come opzione in Impostazioni (`prefs.isoBands`, legenda solo con le fasce). | fatto (9/10/2026) |
| 1.6 | **"In arrivo vicino a te"** al posto di "Linee utili": per linea e direzione il primo passaggio prendibile a piedi (senza cambi), es. "52 → Val Salice · Porta Nuova · 90 m a piedi · 3 min, poi 18 min". Le linee raggiungibili solo con cambi restano sotto come badge ("Con un cambio: …"). | fatto (9/10/2026) |
| 1.7 | Mezzi sulla mappa generale solo se stanno per passare da una fermata raggiungibile a piedi; tutti i mezzi solo con la linea selezionata; interruttori separati per mezzi live e stimati; barretta di direzione nel riquadro del mezzo. | fatto (9/10/2026) |
| 1.9 | **Slider a piedi coerenti:** "Preferisco camminare sotto" non supera mai "A piedi, massimo per tratto" e lo segue quando scende (torna al valore scelto se il massimo risale); stessa scala 0–1000 m per entrambi, valori non ammessi tratteggiati, cursore bloccato al limite; preferenze salvate non valide corrette all'avvio (`Prefs.fix`). Verificati tutti i casi (limiti, passi, valori corrotti, trascinamento oltre il limite). | fatto (9/10/2026) |
| 1.10 | **Tratti evidenziati esattamente da fermata a fermata** (itinerario e tratti raggiungibili): prima ogni fermata era agganciata al vertice più vicino della forma con una ricerca in avanti che si fermava presto, quindi l'evidenziazione partiva o finiva prima o dopo, a volte di centinaia di metri (mediana 57 m, massimo 7,8 km). Ora `Shape.snapStops` (proiezione sul tratto + programmazione dinamica in avanti): mediana 6 m, 99% entro 23 m, e il tratto si chiude sul punto esatto della fermata. Restano 9 casi su 33.598 di due fermate consecutive proiettate sullo stesso punto, es. al capolinea: lì il tratto è la linea retta tra le fermate. | fatto (9/10/2026) |
| 1.11 | **"Meglio a piedi"** (segnalato dall'utente: M1 per una fermata + 740 m a piedi invece di ~1 km a piedi). Prima il percorso tutto a piedi era considerato solo se stava entro "A piedi, massimo per tratto", quindi a volte si proponeva un mezzo anche più lento che camminare (es. 62 in 18 min contro 12 a piedi). Ora `Engine.walkAdvice` confronta sempre con il percorso a piedi e lo propone quando i mezzi fanno risparmiare poco tempo e poca strada. Le soglie sono più severe con orari programmati che con dati in tempo reale (nel caso dell'utente: a piedi con orari programmati, metro con dati live). Riquadro con il motivo e pulsante "Vedi con i mezzi" / "Torna a piedi". Soglie da tarare con l'uso (`Config.walkAdvice`). | fatto (9/10/2026) |
| 1.8 | Convenzione di direzione anche sui riquadri dei mezzi: oggi il triangolo orbitante punta già dove va il mezzo, ma la forma è diversa dalla freccia delle etichette; valutare di usare la stessa freccia (e se la barretta d0/d1 serve ancora). | proposta |

## 2. Funzioni

| # | Idea | Stato |
|---|---|---|
| 2.1 | **Modalità radar:** l'app segue la posizione mentre si cammina e avvisa se sta per passare un mezzo nella stessa direzione. Era l'idea iniziale dell'utente. | proposta (prioritaria) |
| 2.2 | **Luoghi preferiti** (casa, lavoro…) con il tempo live per arrivarci. | proposta |
| 2.3 | **Confronto a piedi vs mezzi:** evidenziare le zone dove il mezzo fa guadagnare davvero tempo. | proposta |
| 2.4 | **Affidabilità delle linee:** corse fantasma, ritardi medi, mezzi in coda (bunching). Richiede di registrare i feed nel tempo. | proposta |
| 2.5 | **Bike sharing e monopattini** per primo e ultimo tratto. | proposta |
| 2.6 | **Partenza a un orario futuro** ("parto alle 18:30"). Oggi si parte sempre da adesso. | proposta (vedi domanda 4.2) |
| 2.7 | **Ricerca di un indirizzo** per sapere se rientra nell'area e come arrivarci. | proposta (vedi domanda 4.3) |
| 2.8 | **Treni regionali SFM/Trenitalia** dal GTFS della Regione Piemonte: oggi la casella "Treni" non ha effetto perché lo zip GTT non contiene treni. | proposta (vedi domanda 4.5) |
| 2.9 | **Avvisi GTT senza linea associata** (es. "Linee 13 e 15 deviate", collegati solo all'azienda): associarli alle linee leggendo i numeri nel titolo. | proposta |
| 2.10 | **Proxy che accetta solo richieste dal sito GitHub Pages** (controllo dell'header Origin nel worker), visto che l'indirizzo in `config.js` è pubblico. Il worker va poi ricopiato su Cloudflare. | proposta |

## 3. Tecnica

| # | Lavoro | Stato |
|---|---|---|
| 3.1 | **Provare l'app sul telefono** con il sito pubblicato (prestazioni di caricamento orari e rete pedonale, GPS). | da fare |
| 3.2 | **`GtfsStatic.build` in un Web Worker:** oggi gira sul thread principale (~3,8 s su PC, molto di più su telefono) e blocca l'interfaccia. Valutare lo stesso per `Walk.build` + `Walk.attach` (~1 s su PC). | da fare |
| 3.3 | **Test automatici** in `test/` per decoder GTFS-RT, parser GTFS, motore, rete pedonale (oggi solo script di prova non salvati). | da fare |
| 3.4 | **Migrazione a progetto (es. Vite)**: `src/core/*`, `src/app/*`, `src/styles/tokens.css`, `worker/proxy.js`, `test/`. | proposta |
| 3.5 | **Ritardo per fermata** invece di un solo ritardo per corsa (preso dal primo aggiornamento utile). | proposta |
| 3.6 | **Stime dei mezzi per linee con GPS parziale:** oggi le posizioni stimate si aggiungono nella mappa generale solo per le linee senza nessun mezzo live (per evitare doppioni). | proposta |
| 3.7 | **PWA installabile** (manifest + service worker, uso offline). | proposta (vedi domanda 4.4) |
| 3.8 | **Fluidità su mobile (prossima sessione, priorità dell'utente).** Punti caldi noti, da misurare prima di toccare: vedi sotto. | da fare |

### 3.8 Punti caldi per la fluidità (da misurare sul telefono)

- `UI._compute` rifà tutto a ogni movimento degli slider (attesa 120 ms) e a ogni aggiornamento live (30 s): `Engine.isochrone` + `Walk.field` + ridisegno completo di `IsoLayer` + `drawLines` (ricrea tutte le polilinee: per linea percorso intero + tratto raggiungibile, ~4 per linea) + `drawVehicles` + `innerHTML` delle liste. Idee: separare cosa cambia (live → solo mezzi e orari), un solo layer canvas per le linee invece di centinaia di `L.polyline`, aggiornare i marker invece di ricrearli.
- `IsoLayer._draw` ridisegna l'intero canvas a ogni `moveend` scorrendo tutti i nodi raggiunti (~160.000 con area di 6 km) e lo nasconde durante lo zoom.
- Mezzi: un `L.divIcon` (nodo DOM) per mezzo, ricreati a ogni `moveend`; `Realtime.scheduled` scorre tutte le ~15.000 corse a ogni `drawMap`.
- Lista "In arrivo": `Engine.nextDepartures` per riga (scorre le corse della linea).
- Cache già presenti: forme e percorsi delle corse con fermate agganciate (`cached` in `MapView`, per indice).
- `GtfsStatic.build` e `Walk.build`/`attach` sul thread principale (3.2). Sfondo MapLibre (WebGL) + Leaflet: valutare il costo sul telefono.

## 4. Domande aperte per l'utente

1. Il limite "a piedi" deve restare uno solo (accesso, cambi e tratto finale) o servono valori separati? Esiste ora anche la soglia "Preferisco camminare sotto".
2. Serve solo "parto adesso" o anche un orario futuro?
3. Serve cercare un indirizzo?
4. Piattaforma finale: sito GitHub Pages, PWA installabile o app nativa?
5. Includere i treni regionali SFM/Trenitalia?

## 5. Limiti noti

- **GTT non pubblica la metro** in tempo reale e molte linee non hanno mezzi nel feed (9/10/2026 ore 10:50: 316 mezzi su 64 linee, contro 517 corse in servizio su 119 linee); a volte il feed arriva vuoto. Le posizioni stimate dall'orario coprono in parte il buco.
- La rete pedonale dipende dalla qualità di OpenStreetMap: piazze o cortili mal collegati possono allungare qualche percorso. Dove manca, i tratti sono stimati (linea d'aria × 1,3).
- Le preferenze (soglia a piedi, vantaggio minimo di 2 minuti per un mezzo in più) valgono anche per l'area disegnata, che può risultare un po' più piccola di quella teoricamente raggiungibile.
- In http (server locale raggiungibile dal telefono) il GPS non funziona: serve https.
- L'indirizzo del proxy è pubblico in `config.js` sul sito ed è rimasto nella storia git (commit `c68ac2a`, `4632bd7`).

## 6. Fatto

- 7/10/2026 — CLAUDE.md; verifica con dati GTT reali; itinerario al tocco, partenza con pressione prolungata.
- 7–8/10/2026 — Percorsi a piedi lungo le strade (tessere OSM, aree scaricabili e gestibili); pubblicazione su GitHub Pages con workflow.
- 9/10/2026 — Proxy predefinito dal secret `HOPON_PROXY` (`config.js`); soglia "Preferisco camminare sotto" e vantaggio minimo per un mezzo in più; nessun tratto a piedi oltre il massimo; demo attorno alla partenza; avvio anche se IndexedDB non risponde; server locale aperto alla rete; più mezzi sulla mappa (stimati per le linee senza GPS) e poi filtrati per la mappa generale, con direzione.
- 9/10/2026 — Interfaccia mobile alleggerita (§1.1–1.6): linee intere tenui fuori dalla zona raggiungibile, filtri richiudibili, meno dettagli a zoom basso, etichette compatte dell'itinerario con freccia di direzione, area a un colore, lista "In arrivo vicino a te".
