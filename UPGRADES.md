# Hop on! — miglioramenti

Elenco di idee, lavori da fare, domande aperte e limiti noti. Aggiornarlo quando si chiude o si aggiunge qualcosa.

Stato: **da fare** (concordato con l'utente) · **proposta** (idea non ancora approvata) · **fatto** (con data).

## 1. Interfaccia mobile: meno informazioni a schermo

Su telefono la schermata è troppo carica. Proposte del 9 ottobre 2026, in ordine di utilità. Consigliato iniziare da 1.1 e 1.2.

| # | Idea | Stato |
|---|---|---|
| 1.1 | **Percorsi delle linee solo quando servono.** Oggi la mappa generale disegna i percorsi di tutte le linee utili: è la cosa che pesa di più. Mostrarli solo per la linea selezionata e per l'itinerario; nella mappa generale restano area raggiungibile, fermate vicine e mezzi in arrivo. | proposta |
| 1.2 | **Controlli in un pannello "Filtri" richiudibile.** Gli slider occupano mezzo schermo. Nel pannello basso restano titolo e lista; un riassunto ("20 min · 400 m · max 1 cambio") apre i controlli. | proposta |
| 1.3 | **Meno dettagli a zoom basso.** Sotto un certo zoom niente mezzi, oppure un pallino per linea con il numero di mezzi. | proposta |
| 1.4 | **Etichette fisse dell'itinerario più compatte.** Solo "↑ 13" / "↓ 13", nome della fermata al tocco. | proposta |
| 1.5 | **Area raggiungibile più leggera.** Un solo colore invece di tre fasce (fasce come opzione). | proposta |
| 1.6 | **"In arrivo vicino a te" al posto di "Linee utili".** Prossimi passaggi alle fermate raggiungibili a piedi, es. "13 → Gran Madre tra 2 min, Castello". | proposta |
| 1.7 | Mezzi sulla mappa generale solo se stanno per passare da una fermata raggiungibile a piedi; tutti i mezzi solo con la linea selezionata; interruttori separati per mezzi live e stimati; barretta di direzione nel riquadro del mezzo. | fatto (9/10/2026) |

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
