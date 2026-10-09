# Post per r/Torino

Prima di pubblicare controlla le regole del sub sull'autopromozione e scegli il flair giusto.

## Titolo (scegline uno)

1. **Hai 20 minuti e l'abbonamento GTT: dove puoi arrivare? Ho fatto una mappa che te lo dice**
2. Ho fatto una mappa che colora tutta la Torino che raggiungi in X minuti con i mezzi GTT

## Testo

---

Ciao a tuttiii

mi sono costruito un'app per una domanda che mi faccio spesso: **"ho 20 minuti, dove riesco ad arrivare *adesso* coi mezzi?"**

👉 **https://follen99.github.io/HopOn-/**. Si apre dal browser del telefono, senza installare nulla, senza account e senza pubblicità.

**"Ok, ma cosa cambia da Google Maps o da MaTo?"**

Google Maps e MaTo (muoversiatorino.it) rispondono a *"come vado da A a B?"*, e lo fanno bene: li uso anch'io. Anche i dati live sono gli stessi, cioè quelli aperti di GTT. Hop on! non vuole sostituirli: risponde a un'altra domanda.

- **Non parti da una meta, ma dal tempo che hai.** Scegli i minuti (da 5 a 90) e la mappa colora *tutte* le strade che raggiungi in tempo, a piedi e con metro, tram e bus. Se un mezzo è in ritardo, l'area si restringe. È utile per capire se fai in tempo a passare da un posto, dove vedersi a metà strada, quanto è "comoda" una casa.
- **Se una meta è fuori portata, ti dice cosa cambiare.** Invece di un semplice "no": "con 30 minuti ci arrivi col 15 + metro", oppure "col 18, camminando un po' di più". Tocchi **Applica** e hai l'itinerario.
- **Decidi tu quanto camminare.** Imposti quanta strada sei disposto a fare a piedi per ogni tratto (fino a 1 km), sotto quanti metri preferisci camminare invece di aspettare un mezzo, e quanti cambi accetti. E se il bus ti fa risparmiare un minuto ma ti fa camminare quasi uguale, ti scrive "Meglio a piedi".

Per il resto fa le cose che ti aspetti: passaggi in arrivo vicino a te, mezzi sulla mappa, ricerca di indirizzi e negozi, itinerario passo passo, tema scuro e inglese.

**Limiti:** la metro non trasmette la posizione (usa l'orario programmato) e i treni non ci sono ancora. È un progetto personale, quindi qualcosa si romperà: ditemelo nei commenti!

E voi, **qual è la vostra linea maledetta?**

---

## Per farlo funzionare meglio

- **Allega un video di 10–15 secondi** dello schermo del telefono: lo slider dei minuti che passa da 10 a 30 e l'area che si allarga, poi una ricerca con la proposta "Applica". Su Reddit un video fa molta più strada di un link.
- **Quando pubblicare**: un giorno feriale tra le 18 e le 21.
- **Rispondi ai commenti** nelle prime 2 ore. Alle domande "e Google/MaTo?" la risposta è sempre la stessa: loro vanno da A a B, Hop on! ti mostra tutto quello che raggiungi in X minuti.
- **Capacità del proxy**: ogni app aperta fa circa 360 richieste all'ora a Cloudflare Workers, e il piano gratuito ha un limite giornaliero (da verificare nel dashboard, di solito 100.000). Il giorno del post tienilo d'occhio.
