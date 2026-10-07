# Hop on!

Dove arrivi in X minuti con i mezzi GTT di Torino, con orari e posizioni in tempo reale. Tocca un punto della mappa per sapere come arrivarci.

L'app è un solo file, [hop-on.html](hop-on.html). I percorsi a piedi lungo le strade usano le "tessere" della rete pedonale, generate da OpenStreetMap con [tools/build-walk-tiles.mjs](tools/build-walk-tiles.mjs).

## Pubblicare su GitHub Pages (gratis)

1. Crea un repository su GitHub e fai il push di questo progetto (branch `main` o `master`).
2. Su GitHub apri **Settings → Pages** e in **Source** scegli **GitHub Actions**.
3. Il workflow [.github/workflows/pages.yml](.github/workflows/pages.yml) parte a ogni push e il primo giorno di ogni mese:
   - scarica l'estratto OSM del Nord-Ovest (Geofabrik),
   - genera le tessere dei percorsi a piedi attorno alle fermate GTT,
   - pubblica `index.html` e la cartella `walk/`.
4. L'app sarà su `https://<utente>.github.io/<repository>/`. Al primo avvio apri le impostazioni e inserisci l'indirizzo del proxy (vedi sotto).

Facoltativo: in **Settings → Secrets and variables → Actions → Variables** puoi creare `HOPON_PROXY` con l'indirizzo del tuo proxy; il workflow lo usa solo se GitHub non riesce a scaricare il GTFS GTT direttamente.

## Proxy per i dati GTT

I server GTT non permettono la lettura diretta da una pagina web. Serve un piccolo Cloudflare Worker gratuito: il codice e le istruzioni sono nell'app, in **Impostazioni → Come creare il proxy**. L'indirizzo va inserito come `https://<nome>.<utente>.workers.dev/?url=`.

## Provare in locale

```bash
curl -L -o Turin.osm.pbf https://download.bbbike.org/osm/bbbike/Turin/Turin.osm.pbf
node tools/build-walk-tiles.mjs --pbf Turin.osm.pbf --out walk
python -m http.server 8080
```

Poi apri `http://localhost:8080/hop-on.html`. Aprendo il file direttamente (`file://`) l'app funziona, ma senza GPS e con i tratti a piedi stimati, a meno di indicare in **Impostazioni → Percorsi a piedi → avanzato** l'indirizzo `walk/` del sito pubblicato.

## Dati e licenze

- Orari e tempo reale: GTT / Comune di Torino (aperTO), CC-BY 4.0.
- Strade e mappa: © OpenStreetMap contributors, ODbL; mappa di sfondo OpenFreeMap.
