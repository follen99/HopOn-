# Hop on!

**Hai 20 minuti. Dove puoi arrivare?**

Hop on! risponde a una domanda che le solite app di navigazione non si fanno. Non ti chiede dove vuoi andare: ti mostra sulla mappa **tutta Torino che puoi raggiungere adesso, in X minuti**, con metro, tram, bus e a piedi. Usa gli orari GTT e le posizioni dei mezzi in tempo reale.

👉 **Provala subito: [follen99.github.io/HopOn-](https://follen99.github.io/HopOn-/)**, dal telefono, senza installare nulla.

---

## L'idea

Le app di navigazione funzionano al contrario: prima scegli la meta, poi scopri quanto ci metti. Spesso però la domanda vera è un'altra:

- *"Ho mezz'ora prima di cena: dove posso andare a fare un giro?"*
- *"Esco dall'ufficio: quali zone raggiungo in 15 minuti senza cambi?"*
- *"Cerco casa: da qui, quanto è comodo arrivare in centro?"*
- *"È appena passato il 15: cosa mi conviene prendere adesso?"*

Hop on! colora la mappa con l'**area che raggiungi in tempo**, strada per strada. Basta un'occhiata per vedere cosa è a portata di mano e cosa no.

## Cosa sa fare

### 🗺️ L'area raggiungibile, dal vivo
Scegli quanti minuti hai (da 5 a 90) e la mappa si colora con le strade dove arrivi in tempo, a piedi e con i mezzi. Si aggiorna ogni 30 secondi con i dati GTT: se un tram è in ritardo o un bus sta arrivando, l'area cambia di conseguenza.

### 🚋 In arrivo vicino a te
Una lista delle linee che passano dalle fermate vicine, ognuna con la sua direzione, il tempo di attesa e il passaggio successivo, e l'etichetta **LIVE** quando l'orario arriva dal mezzo vero e non dal tabellone. Sulla mappa vedi i mezzi che si avvicinano, con una freccia che indica dove vanno.

### 🔎 Cerca una destinazione
Indirizzi, negozi, locali, fermate GTT: si cerca come su Google Maps. Scegli il risultato e Hop on! calcola subito l'itinerario, con i tratti a piedi lungo le strade vere, dove salire, dove scendere e a che ora arrivi.

### 💡 "Non ci arrivi? Ecco come"
Se la meta è fuori dalla tua area, Hop on! non si limita a dirti di no: trova **cosa cambiare per arrivarci** e ti propone la soluzione migliore:

- *"Concediti 30 minuti invece di 20"*
- *"Cammina fino a 550 m invece di 400 e prendi il 18"*
- *"Accetta un cambio: 55 e poi metro"*
- *"Vai a piedi: 17 minuti"*

Le alternative sono messe in ordine in base a quanto ti costano davvero, tra tempo, strada a piedi e cambi. Le vedi una per una sulla mappa e con un tocco applichi quella che preferisci: le impostazioni si aggiornano da sole, e se cambi idea c'è **Ripristina**.

### 🚶 Onesta sul camminare
Hop on! conosce le strade (dati OpenStreetMap), non traccia linee d'aria. Se il bus ti fa risparmiare un minuto ma ti fa camminare quasi lo stesso, te lo dice: **"Meglio a piedi"**. Puoi anche dirle sotto quale distanza preferisci camminare invece di aspettare un mezzo.

### ⚙️ Fatta su misura per te
- Tempo a disposizione, distanza massima a piedi, numero di cambi.
- Quali mezzi usare: metro, tram, bus.
- Passo a piedi: tranquillo, normale o svelto.
- Partenza dalla tua posizione GPS o da un punto qualsiasi: tieni premuto sulla mappa.
- Tema chiaro, scuro o automatico.
- **Italiano e inglese**, con la lingua scelta in automatico. Utile anche per amici e turisti in visita a Torino.

## Perché è diversa

| | App di navigazione classiche | **Hop on!** |
|---|---|---|
| Domanda di partenza | "Come arrivo lì?" | **"Dove arrivo in X minuti?"** |
| Risultato | Un percorso | **Un'area intera**, più il percorso se ti serve |
| Meta fuori portata | "Ci metti 34 minuti" | **"Ecco cosa cambiare per arrivarci"** |
| Mezzi | Spesso solo orari | **Posizioni GPS e ritardi dal vivo** |
| Camminare | Una scelta tra tante | **Te lo propone quando conviene davvero** |

## Come si usa

1. Apri il sito dal telefono e consenti la posizione (oppure tieni premuto sulla mappa per scegliere la partenza).
2. Tocca il pallino con i minuti, in alto a destra, e scegli quanto tempo hai.
3. Guarda l'area colorata: tutto quello che vedi lo raggiungi in tempo.
4. Tocca un punto della mappa, o cerca un posto in alto, per sapere **come arrivarci**.

## Di cosa ti puoi fidare (e i limiti)

- **Orari e posizioni** arrivano dai dati aperti di GTT e del Comune di Torino, aggiornati ogni 30 secondi.
- **La metro non trasmette la posizione** e alcune linee GTT a volte mancano nel flusso in tempo reale: per quelle Hop on! usa l'orario programmato e lo segnala.
- I **treni regionali** non ci sono ancora.
- Gli **indirizzi** si cercano con Photon (OpenStreetMap): nessun account e nessuna pubblicità. Al servizio arriva solo il testo cercato e una posizione indicativa (circa 1 km) per dare la precedenza ai risultati vicini.

## Dati e licenze

- Orari e tempo reale: GTT / Comune di Torino (aperTO), CC-BY 4.0.
- Strade, mappa e indirizzi: © OpenStreetMap contributors, ODbL; mappa di sfondo OpenFreeMap; ricerca Photon (komoot).

---

<details>
<summary><b>Per chi sviluppa: pubblicare e provare in locale</b></summary>

L'app è un solo file, [hop-on.html](hop-on.html), senza build. I percorsi a piedi usano le "tessere" della rete pedonale, generate da OpenStreetMap con [tools/build-walk-tiles.mjs](tools/build-walk-tiles.mjs). Le traduzioni sono nello `script#i18n` del file: per aggiungere una lingua basta copiare il blocco `en` e tradurlo (istruzioni in testa al blocco).

### Pubblicare su GitHub Pages (gratis)

1. Fai il push del progetto su GitHub (branch `main` o `master`).
2. In **Settings → Pages**, alla voce **Source**, scegli **GitHub Actions**.
3. Il workflow [.github/workflows/pages.yml](.github/workflows/pages.yml) parte a ogni push e il primo giorno di ogni mese: scarica l'estratto OSM del Nord-Ovest (Geofabrik), genera le tessere dei percorsi a piedi e pubblica `index.html` con la cartella `walk/`.
4. L'app sarà su `https://<utente>.github.io/<repository>/`.

### Proxy per i dati GTT

I server GTT non permettono a una pagina web di leggere i dati direttamente: serve un piccolo Cloudflare Worker gratuito. Codice e istruzioni sono nell'app, in **Impostazioni → Come creare il proxy**. L'indirizzo ha la forma `https://<nome>.<utente>.workers.dev/?url=`.

Per avere un **proxy predefinito** crea il secret `HOPON_PROXY` (Settings → Secrets and variables → Actions) e rilancia il workflow: [tools/make-config.mjs](tools/make-config.mjs) scrive `config.js` accanto all'app. Senza secret il sito funziona lo stesso, e ogni utente può inserire il suo proxy dalle impostazioni (quello dell'utente ha sempre la precedenza). Nota: `config.js` è pubblico sul sito.

### Provare in locale

```bash
curl -L -o Turin.osm.pbf https://download.bbbike.org/osm/bbbike/Turin/Turin.osm.pbf
node tools/build-walk-tiles.mjs --pbf Turin.osm.pbf --out walk
python -m http.server 8080
```

Poi apri `http://localhost:8080/hop-on.html`. Per il proxy predefinito in locale copia `.env.example` in `.env`, inserisci l'indirizzo ed esegui `node tools/make-config.mjs`. Aperta come file (`file://`) l'app funziona, ma senza GPS e con i tratti a piedi stimati.

</details>
