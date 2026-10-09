/**
 * Hop on! — questionario di feedback (Google Forms) e analisi deterministica delle risposte.
 *
 * USO (una volta sola, ~2 minuti):
 *   1. Vai su https://script.google.com → Nuovo progetto, incolla tutto questo file al posto del codice.
 *   2. Esegui creaForm (autorizza l'accesso a Moduli e Fogli). Nel registro trovi il link da condividere,
 *      quello per modificare il modulo e il foglio delle risposte.
 *   3. Quando vuoi i risultati esegui analizza: scrive i fogli "Analisi", "Backlog" e "Testi liberi"
 *      nel foglio delle risposte. Rieseguibile quante volte vuoi: stesse risposte → stessi risultati.
 *
 * Le domande sono definite UNA volta qui sotto (Q, FEATURES, KANO, SUS, PROBLEMS, CODEBOOK) e usate sia per
 * costruire il modulo sia per leggere le risposte: se cambi un testo, ricrea il modulo (le colonne del foglio
 * si chiamano come le domande). Metodo spiegato in feedback/README.md.
 */

const TITLE = "Hop on! — com'è andata?";
const APP_URL = "https://follen99.github.io/HopOn-/";

/* Funzioni già presenti: importanza e soddisfazione (opportunity score). code = sezione di UPGRADES.md. */
const FEATURES = [
  { code: "area", label: "Mappa dell'area raggiungibile in X minuti" },
  { code: "arrivi", label: "Lista \"In arrivo vicino a te\"" },
  { code: "live", label: "Mezzi in tempo reale sulla mappa" },
  { code: "2.7 ricerca", label: "Ricerca di indirizzi, negozi e fermate" },
  { code: "2.7 fix", label: "Proposte quando una meta è fuori portata (\"Applica\")" },
  { code: "itinerario", label: "Itinerario passo passo (dove salire, dove scendere, orari)" },
  { code: "1.11 a piedi", label: "Consiglio \"Meglio a piedi\"" },
  { code: "1.2 filtri", label: "Impostazioni di viaggio (tempo, metri a piedi, cambi, mezzi)" },
];
const IMPORTANCE_COLS = ["1", "2", "3", "4", "5"];
const NOT_TRIED = "Non provata";
const SATISFACTION_COLS = ["1", "2", "3", "4", "5", NOT_TRIED];

/* Funzioni possibili: modello di Kano (domanda funzionale + disfunzionale). */
const KANO = [
  { code: "2.1 radar", label: "Avviso quando sta per passare un mezzo utile mentre cammini" },
  { code: "2.2 preferiti", label: "Luoghi preferiti (casa, uni, lavoro) con il tempo live per arrivarci" },
  { code: "2.6 orario futuro", label: "Partenza a un orario futuro (\"parto alle 18:30\")" },
  { code: "2.8 treni", label: "Treni regionali e SFM" },
  { code: "2.5 bike sharing", label: "Bike sharing e monopattini per il primo o l'ultimo tratto" },
  { code: "3.7 installabile", label: "App installabile che funziona anche offline" },
  { code: "2.4 affidabilità", label: "Affidabilità delle linee (ritardi medi, corse saltate)" },
];
const KANO_COLS = ["Mi piacerebbe", "Me lo aspetto", "Mi è indifferente", "Posso tollerarlo", "Non mi piacerebbe"];
const [K_LIKE, K_MUST, K_NEUTRAL, K_LIVE, K_DISLIKE] = KANO_COLS;

/* System Usability Scale (10 frasi standard, adattate all'app). Dispari positive, pari negative. */
const SUS = [
  "Penso che userei volentieri questa app spesso.",
  "Ho trovato l'app inutilmente complessa.",
  "Ho trovato l'app facile da usare.",
  "Penso che mi servirebbe l'aiuto di una persona esperta per usarla.",
  "Ho trovato le varie funzioni ben integrate tra loro.",
  "Ho trovato troppe incoerenze nell'app.",
  "Immagino che quasi tutti imparerebbero a usarla molto in fretta.",
  "Ho trovato l'app molto macchinosa da usare.",
  "Ho usato l'app con molta sicurezza.",
  "Ho dovuto imparare molte cose prima di riuscire a usarla.",
];
const SUS_COLS = ["1", "2", "3", "4", "5"];

/* Problemi incontrati. Nelle domande a scelta multipla (checkbox) niente virgole nelle opzioni: nel foglio le scelte sono separate da ", ". */
const NO_PROBLEM = "Nessun problema";
const PROBLEMS = [
  { code: "dati orari", label: "Orari o passaggi sbagliati" },
  { code: "dati mezzi", label: "Un mezzo indicato che non è mai passato" },
  { code: "a piedi", label: "Percorso a piedi strano o troppo lungo" },
  { code: "3.8 prestazioni", label: "App lenta o che si blocca" },
  { code: "3.8 batteria", label: "Consuma molta batteria" },
  { code: "gps", label: "La posizione GPS non funziona" },
  { code: "grafica", label: "Mappa poco leggibile" },
  { code: "testi", label: "Testi o istruzioni poco chiari" },
  { code: "2.7 ricerca", label: "La ricerca non trova il posto che cerco" },
];

/* Domande singole: titolo = intestazione della colonna nel foglio delle risposte. */
const Q = {
  freq: "Quanto spesso usi i mezzi GTT?",
  who: "Cosa fai principalmente?",
  where: "Dove abiti o passi più tempo?",
  device: "Da dove hai usato Hop on!?",
  apps: "Che app usi oggi per i mezzi?",
  uses: "Quante volte hai usato Hop on!?",
  clear: "Dopo il primo minuto ti era chiaro a cosa serve Hop on!?",
  importance: "Quanto è importante per te ogni funzione?",
  satisfaction: "Quanto funziona bene ogni funzione?",
  reliability: "Quanto ti fidi degli orari e dei passaggi mostrati?",
  problems: "Hai incontrato qualcuno di questi problemi?",
  sus: "Quanto sei d'accordo con queste frasi?",
  kanoYes: "Se Hop on! avesse questa funzione, come ti sentiresti?",
  kanoNo: "E se NON l'avesse, come ti sentiresti?",
  replace: "Per cosa useresti Hop on! al posto della tua app attuale?",
  pmf: "Quanto ti dispiacerebbe se Hop on! smettesse di esistere?",
  nps: "Quanto è probabile che consigli Hop on! a un amico o a un collega?",
  liked: "Cosa ti è piaciuto di più?",
  change: "Cosa cambieresti per primo?",
  bug: "Hai trovato un errore? Descrivilo (linea, fermata, ora se te le ricordi)",
  email: "Email (facoltativa: solo se vuoi una risposta)",
};
const FREQ = ["Ogni giorno", "Qualche volta a settimana", "Qualche volta al mese", "Raramente o mai"];
const WHO = ["Studio all'università", "Studio alle superiori", "Lavoro", "Studio e lavoro", "Sono di passaggio o turista", "Altro"];
const WHERE = ["Torino centro", "Torino fuori dal centro", "Prima cintura (Moncalieri, Collegno…)", "Più lontano"];
const DEVICE = ["Telefono Android", "iPhone", "Computer"];
const APPS = ["Google Maps", "Moovit", "App ufficiale GTT", "Citymapper", "Guardo le paline", "Nessuna"];
const USES = ["Una volta per provarla", "Da 2 a 5 volte", "Più di 5 volte", "Ormai la uso spesso"];
const REPLACE = ["Scegliere cosa prendere sotto casa", "Capire dove arrivo in poco tempo", "Andare in un posto preciso", "Nessuna: resto sulla mia app"];
const PMF = ["Moltissimo", "Un po'", "Per niente", "Non la uso già più"];

/* Testi liberi: codifica per parole chiave (espressioni regolari sul testo minuscolo), uguale per tutti. */
const CODEBOOK = [
  { code: "3.8 prestazioni", re: /lent|bloc|carica|scatt|pesant|crash/ },
  { code: "3.8 batteria", re: /batteri|consum/ },
  { code: "dati e affidabilità", re: /orari|ritard|passaggi|non passa|sbagliat|fantasma|in tempo reale|live/ },
  { code: "metro", re: /metro/ },
  { code: "2.8 treni", re: /treno|treni|sfm|ferrovi/ },
  { code: "notturni", re: /nott|notturn/ },
  { code: "2.5 bike sharing", re: /bici|bike|monopattin|sharing/ },
  { code: "2.2 preferiti", re: /preferit|salvat|casa|lavoro/ },
  { code: "2.6 orario futuro", re: /orario futuro|più tardi|domani|partenza alle|programmar/ },
  { code: "2.1 radar / notifiche", re: /notific|avvis|radar/ },
  { code: "3.7 installabile", re: /install|offline|app nativa|play store|app store/ },
  { code: "2.7 ricerca", re: /ricerca|cerca|indirizz/ },
  { code: "grafica e leggibilità", re: /grafic|colori|legg|font|scur|chiar|piccol|confus/ },
  { code: "a piedi", re: /a piedi|camminat|marciapied/ },
  { code: "accessibilità", re: /accessib|carrozzin|disabil|ascensor|gradin/ },
];

/* ======================================================================
   1. CREAZIONE DEL MODULO
   ====================================================================== */
function creaForm() {
  const form = FormApp.create(TITLE);
  form.setDescription(
    "Grazie per aver provato Hop on! (" + APP_URL + "). Bastano 5 minuti: le risposte servono a decidere cosa migliorare per primo, " +
    "con un'analisi uguale per tutte le risposte. Il questionario è anonimo: l'email in fondo è facoltativa e serve solo se vuoi una risposta.")
    .setProgressBar(true).setCollectEmail(false).setAllowResponseEdits(false).setShowLinkToRespondAgain(false)
    .setConfirmationMessage("Grazie! Ogni risposta finisce nella lista delle cose da migliorare. Buon viaggio 🚋");

  const choice = (title, values, required = true) => form.addMultipleChoiceItem().setTitle(title).setChoiceValues(values).setRequired(required);
  const boxes = (title, values, required = true) => form.addCheckboxItem().setTitle(title).setChoiceValues(values).setRequired(required);
  const grid = (title, help, rows, cols) => form.addGridItem().setTitle(title).setHelpText(help).setRows(rows).setColumns(cols).setRequired(true);
  const scale = (title, lo, hi, a, b) => form.addScaleItem().setTitle(title).setBounds(lo, hi).setLabels(a, b).setRequired(true);
  const page = (title, help) => form.addPageBreakItem().setTitle(title).setHelpText(help || "");

  // 1. chi sei
  form.addSectionHeaderItem().setTitle("Chi sei").setHelpText("Serve a capire chi trova utile l'app.");
  choice(Q.freq, FREQ);
  choice(Q.who, WHO);
  choice(Q.where, WHERE);
  choice(Q.device, DEVICE);
  boxes(Q.apps, APPS);

  // 2. uso e funzioni attuali
  page("Le funzioni di oggi", "Per ogni funzione: quanto ti importa e quanto funziona bene.");
  choice(Q.uses, USES);
  scale(Q.clear, 1, 5, "Per niente", "Chiarissimo");
  grid(Q.importance, "1 = per niente importante · 5 = fondamentale", FEATURES.map((f) => f.label), IMPORTANCE_COLS);
  grid(Q.satisfaction, "1 = funziona male · 5 = funziona benissimo · \"" + NOT_TRIED + "\" se non l'hai usata", FEATURES.map((f) => f.label), SATISFACTION_COLS);

  // 3. affidabilità e problemi
  page("Dati e problemi");
  scale(Q.reliability, 1, 5, "Per niente", "Del tutto");
  boxes(Q.problems, PROBLEMS.map((p) => p.label).concat(NO_PROBLEM));

  // 4. facilità d'uso (SUS)
  page("Facilità d'uso", "Dieci frasi standard (System Usability Scale): rispondi d'istinto.");
  grid(Q.sus, "1 = per niente d'accordo · 5 = del tutto d'accordo", SUS, SUS_COLS);

  // 5. funzioni future (Kano)
  page("Funzioni che potrebbero arrivare", "Due domande per ogni idea: come ti sentiresti se ci fosse, e se non ci fosse.");
  grid(Q.kanoYes, "Immagina che la funzione ci sia.", KANO.map((k) => k.label), KANO_COLS);
  grid(Q.kanoNo, "Immagina che la funzione NON ci sia.", KANO.map((k) => k.label), KANO_COLS);

  // 6. valore
  page("In generale");
  boxes(Q.replace, REPLACE);
  choice(Q.pmf, PMF);
  scale(Q.nps, 0, 10, "Per niente", "Sicuramente");

  // 7. testi liberi (facoltativi)
  page("Dimmi tutto", "Tutto facoltativo.");
  form.addParagraphTextItem().setTitle(Q.liked);
  form.addParagraphTextItem().setTitle(Q.change);
  form.addParagraphTextItem().setTitle(Q.bug);
  form.addTextItem().setTitle(Q.email).setValidation(FormApp.createTextValidation().requireTextIsEmail().build());

  const ss = SpreadsheetApp.create(TITLE + " (risposte)");
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  PropertiesService.getScriptProperties().setProperties({ formId: form.getId(), sheetId: ss.getId() });

  let link = form.getPublishedUrl();
  try { link = form.shortenFormUrl(link); } catch (e) { /* link lungo */ }
  Logger.log("Link da condividere: " + link);
  Logger.log("Modifica il modulo: " + form.getEditUrl());
  Logger.log("Foglio delle risposte: " + ss.getUrl());
}

/* ======================================================================
   2. ANALISI DETERMINISTICA
   ====================================================================== */
function analizza() {
  const props = PropertiesService.getScriptProperties();
  const ss = SpreadsheetApp.openById(props.getProperty("sheetId"));
  const src = ss.getSheets().find((s) => s.getFormUrl()) || ss.getSheets()[0];
  const data = src.getDataRange().getValues();
  const out = computeAnalysis(data[0], data.slice(1));
  writeSheet(ss, "Analisi", out.analysis);
  writeSheet(ss, "Backlog", out.backlog);
  writeSheet(ss, "Testi liberi", out.texts);
  Logger.log("Analisi di " + out.n + " risposte scritta in " + ss.getUrl());
}

function writeSheet(ss, name, rows) {
  const sh = ss.getSheetByName(name) || ss.insertSheet(name);
  sh.clearContents();
  const w = Math.max(...rows.map((r) => r.length));
  const grid = rows.map((r) => r.concat(Array(w - r.length).fill("")));
  if (grid.length) sh.getRange(1, 1, grid.length, w).setValues(grid);
  rows.forEach((r, i) => { if (r.length === 1 && r[0] && String(r[0]).startsWith("■")) sh.getRange(i + 1, 1).setFontWeight("bold"); });
}

/**
 * Calcolo puro (nessuna API Google): header = intestazioni del foglio, rows = risposte.
 * Restituisce le tabelle { analysis, backlog, texts } come array di righe.
 */
function computeAnalysis(header, rows) {
  const col = (title) => { const i = header.indexOf(title); if (i < 0) throw new Error("Colonna mancante: " + title); return i; };
  const gcol = (title, row) => col(title + " [" + row + "]");
  const n = rows.length;
  const r2 = (x) => (x == null || isNaN(x) ? "" : Math.round(x * 100) / 100);
  const pct = (a, b) => (b ? Math.round(1000 * a / b) / 10 : "");
  const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
  const num = (v) => (v === "" || v == null || isNaN(Number(v)) ? null : Number(v));
  const multi = (v) => String(v || "").split(", ").filter(Boolean);
  // peso nel backlog: chi usa i mezzi ogni giorno conta il doppio (sono gli utenti a cui punta l'app)
  const weight = rows.map((r) => (r[col(Q.freq)] === FREQ[0] ? 2 : 1));
  const W = weight.reduce((s, x) => s + x, 0);

  const A = [];
  const section = (t) => { A.push([]); A.push(["■ " + t]); };
  A.push(["■ Hop on! — analisi di " + n + " risposte", n < 30 ? "Meno di 30 risposte: risultati solo indicativi" : ""]);

  // campione
  section("Campione");
  for (const [title, values] of [[Q.freq, FREQ], [Q.who, WHO], [Q.where, WHERE], [Q.device, DEVICE], [Q.uses, USES]]) {
    A.push([title, "risposte", "%"]);
    for (const v of values) { const c = rows.filter((r) => r[col(title)] === v).length; A.push(["  " + v, c, pct(c, n)]); }
  }
  A.push([Q.apps, "risposte", "%"]);
  for (const v of APPS) { const c = rows.filter((r) => multi(r[col(Q.apps)]).includes(v)).length; A.push(["  " + v, c, pct(c, n)]); }

  // metriche principali
  section("Metriche principali");
  const nps = rows.map((r) => num(r[col(Q.nps)])).filter((x) => x != null);
  const npsScore = nps.length ? Math.round(100 * (nps.filter((x) => x >= 9).length - nps.filter((x) => x <= 6).length) / nps.length) : "";
  const sus = rows.map((r) => {
    let s = 0;
    for (let i = 0; i < SUS.length; i++) { const v = num(r[gcol(Q.sus, SUS[i])]); if (v == null) return null; s += i % 2 === 0 ? v - 1 : 5 - v; }
    return s * 2.5;
  }).filter((x) => x != null);
  const susMean = mean(sus);
  const pmf = rows.filter((r) => r[col(Q.pmf)] === PMF[0]).length;
  A.push(["Metrica", "valore", "regola di lettura"]);
  A.push(["NPS (−100…100)", npsScore, "promotori (9–10) − detrattori (0–6), in %; > 0 bene, > 30 molto bene"]);
  A.push(["SUS medio (0…100)", r2(susMean), susMean >= 80.3 ? "eccellente (≥ 80,3)" : susMean >= 68 ? "sopra la media (≥ 68)" : susMean >= 51 ? "sotto la media (51–68)" : "da rifare (< 51)"]);
  A.push(["\"Mi dispiacerebbe moltissimo\" (%)", pct(pmf, n), "≥ 40%: l'app risponde a un bisogno vero (test di Sean Ellis)"]);
  A.push(["Chiarezza dopo un minuto (1…5)", r2(mean(rows.map((r) => num(r[col(Q.clear)])).filter((x) => x != null))), "< 3,5: spiegare meglio l'idea all'apertura"]);
  A.push(["Fiducia negli orari (1…5)", r2(mean(rows.map((r) => num(r[col(Q.reliability)])).filter((x) => x != null))), "< 3,5: priorità alla qualità dei dati"]);
  A.push([Q.replace, "risposte", "%"]);
  for (const v of REPLACE) { const c = rows.filter((r) => multi(r[col(Q.replace)]).includes(v)).length; A.push(["  " + v, c, pct(c, n)]); }

  // funzioni attuali: opportunity score (Ulwick) su scala 0–10
  section("Funzioni di oggi (opportunity score)");
  A.push(["Funzione", "codice", "importanza 0–10", "soddisfazione 0–10", "provata da %", "opportunity 0–20", "azione"]);
  const backlog = [];
  const to10 = (v) => (v - 1) * 2.5;
  for (const f of FEATURES) {
    const imp = [], sat = []; let tried = 0, wImp = 0, wSat = 0, wSum = 0, wSatSum = 0;
    rows.forEach((r, i) => {
      const a = num(r[gcol(Q.importance, f.label)]), b = r[gcol(Q.satisfaction, f.label)];
      if (a != null) { imp.push(to10(a)); wImp += weight[i] * to10(a); wSum += weight[i]; }
      if (b !== NOT_TRIED && num(b) != null) { tried++; sat.push(to10(num(b))); wSat += weight[i] * to10(num(b)); wSatSum += weight[i]; }
    });
    const I = mean(imp), S = mean(sat), opp = I + Math.max(I - (isNaN(S) ? 0 : S), 0), adoption = pct(tried, n);
    const action = isNaN(I) ? "" : opp >= 15 ? "priorità alta: migliorare" : opp >= 12 ? "priorità media: migliorare" : I >= 6 && adoption < 40 ? "renderla più visibile" : I < 4 ? "poco importante: non investirci" : "va bene così";
    A.push([f.label, f.code, r2(I), r2(S), adoption, r2(opp), action]);
    const wI = wImp / wSum, wS = wSatSum ? wSat / wSatSum : 0;
    if (wSum) backlog.push(["Migliorare funzione", f.label, f.code, r2(5 * (wI + Math.max(wI - wS, 0))), "opportunity pesato × 5"]);
  }

  // funzioni future: Kano
  section("Funzioni future (modello di Kano)");
  A.push(["Funzione", "codice", "M obbligatoria", "O prestazionale", "A entusiasmante", "I indifferente", "R contraria", "Q dubbia", "categoria", "Better", "Worse"]);
  const kanoCat = (f, d) => {
    if (f === K_LIKE) return d === K_LIKE ? "Q" : d === K_DISLIKE ? "O" : "A";
    if (f === K_DISLIKE) return d === K_DISLIKE ? "Q" : "R";
    return d === K_LIKE ? "R" : d === K_DISLIKE ? "M" : "I";
  };
  const CAT_ORDER = ["M", "O", "A", "I", "R", "Q"];   // a parità di voti vince la prima
  for (const k of KANO) {
    const c = { M: 0, O: 0, A: 0, I: 0, R: 0, Q: 0 }, wc = { M: 0, O: 0, A: 0, I: 0, R: 0, Q: 0 };
    rows.forEach((r, i) => { const x = kanoCat(r[gcol(Q.kanoYes, k.label)], r[gcol(Q.kanoNo, k.label)]); c[x]++; wc[x] += weight[i]; });
    const cat = CAT_ORDER.reduce((best, x) => (c[x] > c[best] ? x : best), CAT_ORDER[0]);
    const base = c.A + c.O + c.M + c.I;
    A.push([k.label, k.code, c.M, c.O, c.A, c.I, c.R, c.Q, cat, base ? r2((c.A + c.O) / base) : "", base ? r2(-(c.O + c.M) / base) : ""]);
    backlog.push(["Nuova funzione", k.label, k.code, r2(100 * (wc.M + 0.8 * wc.O + 0.5 * wc.A - 0.5 * wc.R) / W), "Kano pesato: M×1 + O×0,8 + A×0,5 − R×0,5"]);
  }

  // problemi
  section("Problemi segnalati");
  A.push(["Problema", "codice", "segnalazioni", "% risposte", "% di chi usa i mezzi ogni giorno"]);
  const daily = rows.filter((r) => r[col(Q.freq)] === FREQ[0]);
  for (const p of PROBLEMS) {
    const has = (r) => multi(r[col(Q.problems)]).includes(p.label);
    const c = rows.filter(has).length, w = rows.reduce((s, r, i) => s + (has(r) ? weight[i] : 0), 0);
    A.push([p.label, p.code, c, pct(c, n), pct(daily.filter(has).length, daily.length)]);
    backlog.push(["Correggere problema", p.label, p.code, r2(100 * w / W), "% pesata di chi lo segnala"]);
  }
  A.push([NO_PROBLEM, "", rows.filter((r) => multi(r[col(Q.problems)]).includes(NO_PROBLEM)).length]);

  // testi liberi codificati
  const T = [["Risposta", "domanda", "testo", "codici"]], codeCount = {};
  rows.forEach((r, i) => {
    const asked = new Set();                                  // un tema conta una volta per persona
    for (const q of [Q.liked, Q.change, Q.bug]) {
      const txt = String(r[col(q)] || "").trim(); if (!txt) continue;
      const codes = CODEBOOK.filter((c) => c.re.test(txt.toLowerCase())).map((c) => c.code);
      if (q !== Q.liked) codes.forEach((c) => asked.add(c));
      T.push([i + 1, q, txt, codes.join(", ") || "(nessun codice: leggere)"]);
    }
    asked.forEach((c) => { codeCount[c] = (codeCount[c] || 0) + weight[i]; });
  });
  section("Temi nei testi liberi (\"cosa cambieresti\" + errori)");
  A.push(["Tema", "menzioni pesate"]);
  for (const c of CODEBOOK) A.push([c.code, codeCount[c.code] || 0]);
  for (const c of CODEBOOK) if (codeCount[c.code]) backlog.push(["Richiesta nei testi", c.code, c.code, r2(100 * codeCount[c.code] / W), "% pesata di chi ne parla"]);

  // backlog unico: punteggio 0–100, ordine deterministico (punteggio, poi tipo, poi nome)
  const typeOrder = ["Correggere problema", "Migliorare funzione", "Nuova funzione", "Richiesta nei testi"];
  backlog.sort((a, b) => (Number(b[3]) || 0) - (Number(a[3]) || 0) || typeOrder.indexOf(a[0]) - typeOrder.indexOf(b[0]) || String(a[1]).localeCompare(String(b[1])));
  const B = [["#", "tipo", "cosa", "codice UPGRADES", "punteggio 0–100", "come è calcolato"]].concat(backlog.map((b, i) => [i + 1].concat(b)));
  return { n, analysis: A, backlog: B, texts: T };
}

if (typeof module !== "undefined") module.exports = { computeAnalysis, Q, FEATURES, KANO, SUS, PROBLEMS, FREQ, WHO, WHERE, DEVICE, APPS, USES, REPLACE, PMF, KANO_COLS, NOT_TRIED, NO_PROBLEM, creaForm };
