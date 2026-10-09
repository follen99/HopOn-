# Feedback: questionario e analisi

[hopon-feedback.gs](hopon-feedback.gs) è uno script Google Apps Script che **crea il Google Form** e poi **analizza le risposte** sempre con le stesse regole: con le stesse risposte esce lo stesso backlog, senza interpretazioni.

## Come si usa

1. Apri [script.google.com](https://script.google.com) → **Nuovo progetto** e incolla tutto `hopon-feedback.gs`.
2. Scegli la funzione `creaForm` e premi **Esegui**, poi autorizza Moduli e Fogli. Nel **registro di esecuzione** trovi:
   - il link breve da mettere nel post (`forms.gle/…`);
   - il link per modificare il modulo;
   - il foglio delle risposte.
3. Quando arrivano le risposte, esegui `analizza`. Nel foglio delle risposte compaiono tre fogli: **Analisi**, **Backlog** e **Testi liberi**. Si può rieseguire quando vuoi.

Le domande sono costanti in testa allo script e servono sia a creare il modulo sia a leggere il foglio. Se le cambi, ricrea il modulo: le colonne del foglio hanno il nome delle domande.

## Cosa si chiede (circa 5 minuti, 7 pagine)

| Pagina | Domande | Strumento |
|---|---|---|
| Chi sei | quanto usi i mezzi, cosa fai, zona, dispositivo, app usate oggi | segmentazione |
| Le funzioni di oggi | volte che l'hai usata, chiarezza dell'idea (1–5), **importanza** e **soddisfazione** per 8 funzioni | opportunity score |
| Dati e problemi | fiducia negli orari (1–5), problemi incontrati (scelta multipla) | frequenza dei problemi |
| Facilità d'uso | 10 frasi della System Usability Scale | SUS |
| Funzioni future | 7 idee di UPGRADES.md, ognuna con domanda "se ci fosse" / "se non ci fosse" | modello di Kano |
| In generale | per cosa la useresti, quanto ti dispiacerebbe se sparisse, consiglio (0–10) | Sean Ellis, NPS |
| Dimmi tutto | cosa ti è piaciuto, cosa cambieresti, errori, email facoltativa | codifica per parole chiave |

Ogni voce ha un **codice** che rimanda alle sezioni di [UPGRADES.md](../UPGRADES.md) (es. `2.1 radar`, `3.8 prestazioni`). Così il backlog si collega direttamente alla lista dei lavori.

## Regole dell'analisi (tutte nello script, funzione `computeAnalysis`)

**Metriche principali**
- **NPS** = % di chi dà 9–10 meno % di chi dà 0–6. Sopra 0 è bene, sopra 30 è molto bene.
- **SUS** = per ogni persona (dispari − 1) + (5 − pari), × 2,5, poi la media. Lettura: ≥ 80,3 eccellente, ≥ 68 sopra la media, 51–68 sotto la media, < 51 da rifare.
- **Test di Sean Ellis**: % di chi risponde "mi dispiacerebbe moltissimo". Dal 40% in su l'app risponde a un bisogno vero.
- **Soglie di allarme**: chiarezza e fiducia negli orari sotto 3,5 su 5.

**Funzioni di oggi: opportunity score** (Ulwick)
- Importanza e soddisfazione vanno su una scala 0–10; la soddisfazione si calcola solo tra chi ha provato la funzione.
- Opportunity = importanza + max(importanza − soddisfazione, 0).
- Lettura: ≥ 15 priorità alta, ≥ 12 media. Se una funzione è importante (≥ 6) ma l'ha provata meno del 40%, va **resa più visibile**. Sotto 4 di importanza non conviene investirci.

**Funzioni future: modello di Kano**

Ogni coppia di risposte ("se ci fosse" × "se non ci fosse") dà una categoria con la tabella standard:
- **M** obbligatoria;
- **O** prestazionale;
- **A** entusiasmante;
- **I** indifferente;
- **R** contraria;
- **Q** risposta incoerente.

Vince la categoria più votata; a parità vale l'ordine M > O > A > I > R > Q. Si calcolano anche Better = (A+O)/(A+O+M+I) e Worse = −(O+M)/(A+O+M+I).

**Testi liberi**
- Ogni risposta riceve i temi del `CODEBOOK`: espressioni regolari fisse, es. `lent|bloc|carica` → `3.8 prestazioni`. Ogni tema conta una volta per persona.
- Le risposte senza tema compaiono con "(nessun codice: leggere)". Se un argomento ricorre, aggiungi la regola al `CODEBOOK` e riesegui.

**Backlog unico** (foglio Backlog, punteggio 0–100)

Chi usa i mezzi **ogni giorno pesa il doppio**: sono gli utenti per cui l'app deve diventare un'abitudine.

| Tipo | Punteggio |
|---|---|
| Correggere problema | % pesata di chi lo segnala |
| Migliorare funzione | opportunity pesato × 5 |
| Nuova funzione | 100 × (M + 0,8·O + 0,5·A − 0,5·R) / pesi totali |
| Richiesta nei testi | % pesata di chi ne parla in "cosa cambieresti" o negli errori |

L'ordine è per punteggio, poi per tipo (prima i problemi, poi le funzioni esistenti, le nuove e i testi), poi per nome. Con meno di 30 risposte il foglio lo segnala: i risultati sono solo indicativi.

## Verifica

L'analisi è codice puro, senza API Google: in Node si può caricare con `vm` e passarle intestazioni e righe nel formato del foglio, cioè per le griglie `Domanda [Riga]` e per le scelte multiple le opzioni separate da `", "`. L'ho provata su 60 risposte simulate. Due esecuzioni danno risultati identici, e nessuna opzione a scelta multipla contiene virgole.
