import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";

/* ------------------------------------------------------------------ *
 *  SCHEDA V4 — Tracker allenamento, rotazione A-B-C
 *  Marco · manubri regolabili 6,5→24,5 kg · panca inclinabile
 *  · barra per trazioni · ab wheel · corda · tappetino
 *  Versione PWA: localStorage verificato, backup a rotazione,
 *  migrazione automatica dallo storico V3 sullo stesso dominio.
 * ------------------------------------------------------------------ */

const APP_VERSION = "4.1.0";
const STORAGE_KEY = "schedaV4_sessions";
const DRAFT_KEY = "schedaV4_draft";
const BACKUP_KEY = "schedaV4_backups";
const MIGRATED_KEY = "schedaV4_migratedFromV3";
const V3_KEYS = ["schedaV3_sessions"];
const SCHEMA_VERSION = 4;
const MAX_BACKUPS = 5;

const LADDER = [0, 6.5, 11, 15.5, 20, 24.5];
const MAX_LOAD = 24.5;
const MESI = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];

/* ============================ PROGRAMMA V4 ============================ */

const PROGRAM = [
  {
    id: 11,
    tag: "A",
    short: "Spinta + Quadricipiti",
    name: "A — Spinta + Quadricipiti",
    focus: "Petto · Deltoidi · Tricipiti · Quadricipiti · Core",
    exercises: [
      {
        name: "Panca inclinata 30° con manubri",
        aliases: [],
        sets: 4, repMin: 6, repMax: 12, rest: 120, rir: "1-2",
        prescribed: "4 × 6-12", load: "24,5 kg",
        tecnica: "Panca a 30°, piedi piantati a terra, scapole addotte e depresse contro lo schienale per tutta la serie. I manubri partono all'altezza del petto alto con gomiti a circa 45-60° rispetto al busto. Spingi verso l'alto e leggermente verso l'interno, fermandoti prima che i manubri si tocchino.",
        respirazione: "Inspira e mantieni la pressione addominale durante la discesa (2-3\"), espira nella seconda metà della spinta.",
        errore: "Gomiti aperti a 90° (stress sulla spalla), rimbalzo sul petto, perdita dell'appoggio scapolare quando il carico sale.",
        nota: "Sei al carico massimo dei manubri. Quando arrivi a 4 × 12: discesa in 3\" e fermo di 1\" sul petto, ripartendo da 6-8 ripetizioni.",
      },
      {
        name: "Bulgarian split squat",
        aliases: [],
        sets: 3, repMin: 8, repMax: 12, rest: 90, rir: "1-2",
        prescribed: "3 × 8-12/lato", load: "11 kg × 2 →",
        tecnica: "Collo del piede posteriore sulla panca, gamba avanti a distanza tale che il ginocchio non superi troppo la punta. Scendi in verticale, risali spingendo dal tallone anteriore. Busto leggermente inclinato avanti se vuoi più glutei.",
        respirazione: "Inspira scendendo, espira risalendo.",
        errore: "Passo troppo corto (ginocchio sovraccarico); perdita di equilibrio che ti fa accorciare l'escursione.",
        nota: "Esercizio principale per i quadricipiti nella V4. Nella V3 l'hai fatto con 6,5-11 kg: margine ampio prima di arrivare al tetto dei 24,5. Recupero conteggiato dopo entrambi i lati.",
      },
      {
        name: "Military press in piedi (OHP con manubri)",
        aliases: [],
        sets: 3, repMin: 6, repMax: 12, rest: 120, rir: "1-2",
        prescribed: "3 × 6-12", load: "15,5 kg",
        tecnica: "Piedi alla larghezza delle anche, glutei e addome contratti (costole basse). Manubri all'altezza delle spalle, presa prona. Spingi in verticale; a fine spinta la testa 'passa avanti' tra le braccia. Discesa controllata fino a poco sotto il mento.",
        respirazione: "Inspira in posizione bassa, espira durante la spinta.",
        errore: "Iperestensione lombare per completare la ripetizione; spinta con le gambe (diventa un push press).",
        nota: "Nella V3 sei rimasto a 14/13/13 con 11 kg per 4 sedute. Passi a 15,5: se scendi sotto le 6 ripetizioni, fai le prime 1-2 serie a 15,5 e completa con 11.",
      },
      {
        name: "Squeeze press su panca piana",
        aliases: [],
        sets: 3, repMin: 10, repMax: 15, rest: 75, rir: "1",
        prescribed: "3 × 10-15", load: "20 kg",
        tecnica: "Manubri uniti al centro del petto, presa neutra. Spingi attivamente i manubri l'uno contro l'altro per tutta la serie. Discesa a metà petto, risalita mantenendo la pressione costante.",
        respirazione: "Inspira in discesa, espira nella spinta mantenendo la pressione tra i manubri.",
        errore: "Perdere la compressione tra i manubri a metà serie.",
        nota: "",
      },
      {
        name: "Leaning lateral raise (1 mano in appoggio)",
        aliases: [],
        superset: "5a — in superserie con 5b",
        sets: 4, repMin: 15, repMax: 25, rest: 75, rir: "0-1",
        prescribed: "4 × 15-25/lato", load: "11 kg",
        tecnica: "Una mano si aggrappa allo stipite o alla barra, busto inclinato lateralmente verso l'esterno. Alza il manubrio lateralmente guidando col gomito fino all'altezza della spalla, discesa in 2-3\".",
        respirazione: "Espira salendo, inspira scendendo.",
        errore: "Slancio di gambe o busto; salire con il trapezio invece che con il deltoide.",
        nota: "Range alzato a 15-25: da 11 a 15,5 kg è un salto del 41%. La quarta serie si fa da sola, dopo l'ultima di 5b.",
      },
      {
        name: "Estensione tricipiti su panca inclinata (2 manubri)",
        aliases: [],
        superset: "5b — in superserie con 5a",
        sets: 3, repMin: 8, repMax: 15, rest: 75, rir: "0-1",
        prescribed: "3 × 8-15", load: "11 kg × 2 (stima)",
        tecnica: "Panca a 30-45°, un manubrio per mano a presa neutra. Braccia inclinate verso la testa, non perpendicolari al pavimento: la spalla resta flessa e il capo lungo lavora allungato. Gomiti fermi e stretti; scendi dietro la testa fino al massimo stiramento, poi estendi.",
        respirazione: "Inspira in discesa, espira in estensione.",
        errore: "Gomiti che si aprono; braccia che ruotano verso la verticale trasformando l'esercizio in un movimento di spalla.",
        nota: "Il carico di partenza è una stima: alla prima seduta trova il peso che ti porta a 8-15 ripetizioni con RIR 0-1.",
      },
      {
        name: "Ab wheel rollout in ginocchio con fermo 2\"",
        aliases: ["Ab wheel rollout in ginocchio"],
        sets: 3, repMin: 8, repMax: 12, rest: 60, rir: "1",
        prescribed: "3 × 8-12", load: "Corpo libero",
        bodyweight: true,
        tecnica: "Dalle ginocchia, bacino in retroversione e costole basse. Estenditi in 3\" fino al punto massimo in cui tieni la zona lombare neutra, fermati 2\", poi rientra tirando con l'addome.",
        respirazione: "Espira in allungamento, inspira in rientro. Durante il fermo respira corto senza perdere la contrazione.",
        errore: "Iperlordosi in uscita (segnale che sei andato oltre); rientrare spingendo con le anche invece che con l'addome.",
        nota: "Nella V3 eri a 15 × 4 da tre sedute. Quando arrivi a 3 × 12 con il fermo, allunga l'escursione prima di aggiungere ripetizioni.",
      },
    ],
  },
  {
    id: 12,
    tag: "B",
    short: "Trazione + Femorali",
    name: "B — Trazione + Femorali",
    focus: "Gran dorsale · Trapezio medio · Deltoide posteriore · Bicipiti · Femorali · Core",
    exercises: [
      {
        name: "Trazioni alla sbarra (presa prona)",
        aliases: [],
        sets: 4, repMin: 4, repMax: 12, rest: 150, rir: "1",
        prescribed: "4 × 4-12", load: "Corpo libero → zavorra",
        bodyweight: true,
        tecnica: "Presa poco più larga delle spalle. Parti a braccia distese con le scapole rilassate, poi deprimi le scapole e solo dopo tira, portando il petto verso la sbarra. Discesa controllata in 2-3\".",
        respirazione: "Espira durante la trazione, inspira nella discesa. Su serie vicine al cedimento, respira in sospensione tra una ripetizione e l'altra.",
        errore: "Kipping (slancio delle gambe), mezze ripetizioni, spalle che restano in protrazione.",
        nota: "Il campo kg è la zavorra. Quando arrivi a 4 × 12, stringi il manubrio da 6,5 kg tra i piedi o le caviglie (ginocchia piegate, caviglie incrociate) e riparti da 4-6 ripetizioni.",
      },
      {
        name: "Stacco rumeno sbilanciato (B-stance RDL)",
        aliases: [],
        sets: 3, repMin: 8, repMax: 12, rest: 90, rir: "1-2",
        prescribed: "3 × 8-12/lato", load: "20 → 24,5 kg × 2",
        tecnica: "Il piede anteriore porta circa il 70-80% del peso; il posteriore è mezzo passo indietro, appoggiato solo sulla punta, come un cavalletto. Ginocchio anteriore morbido e fermo, anche indietro, schiena neutra, manubri vicini alla gamba fino a metà tibia o fin dove senti lo stiramento dei femorali.",
        respirazione: "Inspira e contrai l'addome prima di scendere, espira dopo aver superato il punto più difficile della risalita.",
        errore: "Spingere con la gamba posteriore; curvare la schiena per scendere di più; ruotare il bacino verso il lato libero.",
        nota: "Sostituisce gli stacchi rumeni bilaterali (24,5 × 12 × 4: carico massimo raggiunto). Prima seduta con 2 × 20 kg per imparare l'appoggio.",
      },
      {
        name: "Rematore busto piegato a 2 manubri (bilaterale)",
        aliases: [],
        sets: 4, repMin: 8, repMax: 12, rest: 120, rir: "1-2",
        prescribed: "4 × 8-12", load: "24,5 kg",
        tecnica: "Anche indietro, busto a 30-45°, schiena piatta e sguardo a terra davanti a te. Tira i manubri verso l'ombelico guidando con i gomiti, pausa breve in chiusura.",
        respirazione: "Inspira in basso, espira tirando.",
        errore: "Estendere il busto per aiutare la tirata; 'strappare' il carico dal basso.",
        nota: "Carico massimo dei manubri. Quando arrivi a 4 × 12: fermo di 2\" a gomiti chiusi e discesa in 3\".",
      },
      {
        name: "Spider curl su panca inclinata",
        aliases: [],
        superset: "4a — in superserie con 4b",
        sets: 3, repMin: 10, repMax: 15, rest: 75, rir: "0-1",
        prescribed: "3 × 10-15", load: "11 kg",
        tecnica: "Prono sulla panca a 45°, petto sullo schienale, braccia appese verticali. Curl completo senza portare i gomiti in avanti, 1\" di contrazione in alto, discesa fino alla distensione.",
        respirazione: "Espira salendo, inspira scendendo.",
        errore: "Gomiti che avanzano o arretrano; staccare il petto dalla panca per aiutarsi.",
        nota: "Sostituisce il curl inclinato, fermo a 15,5 × 8 per tre sedute. Carica il bicipite in accorciamento: complementare al curl in allungamento della V3.",
      },
      {
        name: "Reverse fly prono su panca inclinata",
        aliases: ["Reverse fly busto piegato"],
        superset: "4b — in superserie con 4a",
        sets: 3, repMin: 12, repMax: 20, rest: 75, rir: "0-1",
        prescribed: "3 × 12-20", load: "11 kg",
        tecnica: "Stessa posizione dello spider curl. Gomiti leggermente flessi e fissi; apri le braccia verso l'esterno fino alla linea delle spalle pensando 'mani lontane', non 'scapole insieme'.",
        respirazione: "Espira in apertura, inspira nel ritorno.",
        errore: "Retrarre le scapole per prime (lavora il trapezio, non il deltoide posteriore); piegare i gomiti trasformandolo in un rematore.",
        nota: "Il petto in appoggio elimina lo slancio del busto che c'era nella versione in piedi.",
      },
      {
        name: "Hanging leg raise alla sbarra",
        aliases: [],
        sets: 3, repMin: 8, repMax: 15, rest: 60, rir: "1",
        prescribed: "3 × 8-15", load: "Corpo libero",
        bodyweight: true,
        tecnica: "Appeso alla sbarra con scapole attive. Porta le ginocchia o le gambe tese verso l'alto arrotolando il bacino in retroversione a fine movimento. Discesa lenta, senza oscillare.",
        respirazione: "Espira salendo, inspira scendendo.",
        errore: "Slanciare le gambe e usare l'oscillazione; fermarsi a 90° senza arrotolare il bacino.",
        nota: "A 3 × 15: gambe tese, poi discesa in 3\".",
      },
    ],
  },
  {
    id: 13,
    tag: "C",
    short: "Gambe unilaterali + richiami",
    name: "C — Gambe unilaterali + richiami",
    focus: "Quadricipiti · Glutei · Femorali · Polpacci · Dorso · Petto · Braccia",
    exercises: [
      {
        name: "Goblet squat 1½",
        aliases: [],
        sets: 3, repMin: 8, repMax: 12, rest: 120, rir: "1-2",
        prescribed: "3 × 8-12", load: "24,5 kg",
        tecnica: "Manubrio al petto come un calice, gomiti dentro le ginocchia. Scendi fino in fondo, risali a metà, ridiscendi fino in fondo, poi risali completamente: questa è 1 ripetizione. Se la caviglia limita la profondità, talloni su un rialzo di 2-3 cm.",
        respirazione: "Inspira in alto e mantieni l'addome contratto per tutta la ripetizione; espira solo alla risalita completa.",
        errore: "Rimbalzare nel mezzo movimento; ginocchia che collassano verso l'interno; busto che crolla in avanti.",
        nota: "Sostituisce il goblet con pausa (16 × 4 con il carico massimo, oltre il range). La 1½ aumenta il tempo sotto carico nella parte bassa senza aggiungere peso.",
      },
      {
        name: "Rematore Meadows (single arm, gomito largo)",
        aliases: [],
        sets: 3, repMin: 10, repMax: 15, rest: 75, rir: "1",
        prescribed: "3 × 10-15/lato", load: "20 → 24,5 kg",
        tecnica: "Mano libera in appoggio sulla panca, busto quasi parallelo, manubrio in linea con la spalla. Tira in diagonale verso l'anca alta con il gomito largo, lasciando che la scapola scorra in basso in allungamento.",
        respirazione: "Inspira in allungamento, espira tirando.",
        errore: "Ruotare il busto per completare la tirata; ridurre l'escursione in allungamento.",
        nota: "",
      },
      {
        name: "Hip thrust monopodalico (spalle su panca)",
        aliases: [],
        sets: 3, repMin: 8, repMax: 15, rest: 75, rir: "1",
        prescribed: "3 × 8-15/lato", load: "11 kg (stima)",
        tecnica: "Bordo della panca sotto le scapole, manubrio sull'anca della gamba che lavora (asciugamano per il comfort), l'altra gamba piegata al petto. Spingi col tallone fino a portare il bacino in linea, 1\" di tenuta, mento basso.",
        respirazione: "Espira in salita, inspira scendendo; costole basse in chiusura.",
        errore: "Iperestendere la zona lombare invece di chiudere con i glutei; bacino che ruota verso il lato libero.",
        nota: "Sostituisce l'hip thrust bilaterale (20 × 15 × 3, top del range). Prima seduta prudente: 4 settimane senza lavoro di gambe.",
      },
      {
        name: "Croci su panca inclinata 30°",
        aliases: [],
        sets: 3, repMin: 10, repMax: 15, rest: 75, rir: "0-1",
        prescribed: "3 × 10-15", load: "15,5 kg",
        tecnica: "Gomiti morbidi e con angolo fisso per tutta la serie. Apri fino a percepire uno stiramento controllato sul petto, senza andare oltre il comfort della spalla, poi richiudi come in un grande abbraccio.",
        respirazione: "Inspira in apertura, espira in chiusura.",
        errore: "Piegare i gomiti durante la risalita trasformandolo in una spinta; scendere troppo cercando lo stretch a tutti i costi.",
        nota: "Passi a 15,5 kg (eri a 11 × 15 × 3). Se scendi sotto le 10, completa le ultime serie con 11.",
      },
      {
        name: "Curl martello in piedi",
        aliases: [],
        superset: "5a — in superserie con 5b",
        sets: 3, repMin: 10, repMax: 15, rest: 75, rir: "0-1",
        prescribed: "3 × 10-15", load: "15,5 kg",
        tecnica: "Presa neutra, gomiti fermi al fianco, busto immobile. Salita diretta verso la spalla, discesa in 2-3\".",
        respirazione: "Espira salendo, inspira scendendo.",
        errore: "Dondolare il busto; polsi che cedono.",
        nota: "",
      },
      {
        name: "Estensione tricipiti sopra la testa (1 manubrio, 2 mani)",
        aliases: [],
        superset: "5b — in superserie con 5a",
        sets: 3, repMin: 8, repMax: 12, rest: 75, rir: "0-1",
        prescribed: "3 × 8-12", load: "24,5 kg",
        tecnica: "Seduto con schienale a 80-90°, manubrio impugnato a due mani sopra la testa. Gomiti stretti e puntati in avanti. Scendi in 3\" dietro la nuca fino allo stiramento completo del capo lungo, poi estendi.",
        respirazione: "Inspira scendendo, espira estendendo.",
        errore: "Gomiti che si allargano; costole che si alzano e schiena che si inarca.",
        nota: "Carico massimo: la progressione passa dalla discesa in 3\". Range abbassato a 8-12 proprio per questo.",
      },
      {
        name: "Calf raise monopodalico su rialzo",
        aliases: [],
        superset: "6a — in superserie con 6b",
        sets: 3, repMin: 10, repMax: 15, rest: 60, rir: "0-1",
        prescribed: "3 × 10-15/lato", load: "24,5 kg (1 mano)",
        tecnica: "Avampiede su un gradino o un rialzo stabile, una mano al muro, il manubrio nell'altra mano dal lato della gamba che lavora. Scendi al massimo allungamento, fermo di 2\", poi sali al massimo.",
        respirazione: "Espira salendo, inspira scendendo; respira normalmente durante il fermo.",
        errore: "Rimbalzare in basso; escursione ridotta; piegare il ginocchio per aiutarsi.",
        nota: "Sostituisce il calf raise bilaterale, identico a 20 × 12 per 4 sedute. Senza rialzo l'esercizio perde la parte bassa del movimento.",
      },
      {
        name: "Leg curl scivolato (sliding leg curl)",
        aliases: [],
        superset: "6b — in superserie con 6a",
        sets: 3, repMin: 8, repMax: 15, rest: 60, rir: "1",
        prescribed: "3 × 8-15", load: "Corpo libero",
        bodyweight: true,
        tecnica: "Supino, talloni su un asciugamano o su calzini sul pavimento liscio. Solleva il bacino in ponte e mantienilo; fai scivolare i talloni verso i glutei, poi riallontanali lentamente in 3\".",
        respirazione: "Espira in flessione, inspira in allontanamento.",
        errore: "Lasciar cadere il bacino durante l'allontanamento; inarcare la zona lombare.",
        nota: "Copre la flessione del ginocchio, assente nella V3. Se è troppo difficile, fai solo la fase di allontanamento lenta. Progressione: a una gamba.",
      },
    ],
  },
];

const ALL_V4_IDS = PROGRAM.map((p) => p.id);

const WARMUP = [
  "Corda per saltare — 2-3 minuti",
  "Mobilità: 10 circonduzioni per spalla, 10 cat-camel, 10 hip hinge a vuoto",
  "1-2 serie di avvicinamento del primo esercizio al 50-70% del carico di lavoro",
  "Programma posturale: Routine A ogni giorno, Routine C nei giorni senza seduta",
];

const SOURCES = [
  {
    ref: "Schoenfeld BJ et al. J Strength Cond Res 2017;31(12):3508-3523",
    doi: "10.1519/JSC.0000000000002200",
    text: "Ipertrofia simile con carichi bassi (≤60% 1RM) e alti, a condizione che le serie arrivino vicino al cedimento. Giustifica il lavoro a ripetizioni alte quando sei al tetto dei 24,5 kg.",
  },
  {
    ref: "Refalo MC et al. Sports Med 2023;53(3):649-665",
    doi: "10.1007/s40279-022-01784-y",
    text: "Vantaggio trascurabile del cedimento completo rispetto al non cedimento. Per questo i RIR sono 0-2.",
  },
  {
    ref: "Schoenfeld BJ et al. J Sports Sci 2019;37(11):1286-1295",
    doi: "10.1080/02640414.2018.1555906",
    text: "A parità di volume la frequenza settimanale non cambia l'ipertrofia. La rotazione A-B-C serve all'aderenza, non a crescere di più.",
  },
  {
    ref: "Maeo S et al. Eur J Sport Sci 2023;23(7):1240-1250",
    doi: "10.1080/17461391.2022.2100279",
    text: "Tricipite: crescita circa 1,4 volte maggiore con il braccio sopra la testa (singolo studio, 21 soggetti, cavi).",
  },
  {
    ref: "Varovic D et al. Int J Sports Med 2025;46(14):1027-1036",
    doi: "10.1055/a-2615-4935",
    text: "Contrappeso: nessuna differenza regionale rilevante tra allenare il muscolo più o meno allungato. Le varianti in allungamento non sono un principio da applicare ovunque.",
  },
];


/* ============================ UTILITY ============================ */


const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const fmtDateIT = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${String(d).padStart(2, "0")} ${MESI[m - 1]} ${y}`;
};

const fmtClock = (s) => {
  const v = Math.max(0, Math.round(s));
  return `${Math.floor(v / 60)}:${String(v % 60).padStart(2, "0")}`;
};

const ytLink = (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q + " tecnica manubri")}`;

const normName = (s) => (s || "").toLowerCase().replace(/\s+/g, " ").trim();

function buildEmptySession(day, date) {
  return {
    id: uid(),
    date: date || todayISO(),
    day: day.id,
    dayName: day.name,
    exercises: day.exercises.map((ex) => ({
      name: ex.name,
      prescribed: ex.prescribed,
      prescribedLoad: ex.load,
      sets: Array.from({ length: ex.sets }, () => ({ weight: "", reps: "" })),
      notes: "",
    })),
    generalNotes: "",
    savedAt: null,
    schemaVersion: SCHEMA_VERSION,
  };
}

function sessionHasData(s) {
  if (!s) return false;
  if (s.generalNotes && s.generalNotes.trim()) return true;
  return s.exercises.some((e) => (e.notes && e.notes.trim()) || e.sets.some((st) => String(st.reps || "").trim() !== ""));
}

/* --------------------------- STORAGE LAYER -------------------------- *
 * Backend primario: localStorage del dominio (PWA su GitHub Pages).
 * Fallback: window.storage (anteprima dentro Claude).
 * Ogni scrittura viene riletta e confrontata; fino a 3 tentativi.
 * -------------------------------------------------------------------- */

function detectBackend() {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const k = "__schedaV4_probe__";
      window.localStorage.setItem(k, "1");
      const ok = window.localStorage.getItem(k) === "1";
      window.localStorage.removeItem(k);
      if (ok) return "local";
    }
  } catch (e) {
    /* localStorage bloccato */
  }
  if (typeof window !== "undefined" && window.storage && typeof window.storage.set === "function") return "claude";
  return "none";
}

const BACKEND = detectBackend();

async function rawGet(key) {
  if (BACKEND === "local") return window.localStorage.getItem(key);
  if (BACKEND === "claude") {
    const r = await window.storage.get(key, false);
    return r ? r.value : null;
  }
  throw new Error("Nessun sistema di salvataggio disponibile in questo browser");
}

async function rawSet(key, value) {
  if (BACKEND === "local") return window.localStorage.setItem(key, value);
  if (BACKEND === "claude") return window.storage.set(key, value, false);
  throw new Error("Nessun sistema di salvataggio disponibile in questo browser");
}

async function rawDelete(key) {
  if (BACKEND === "local") return window.localStorage.removeItem(key);
  if (BACKEND === "claude") return window.storage.delete(key, false);
}

async function storageRead(key) {
  try {
    return await rawGet(key);
  } catch (e) {
    return null;
  }
}

/** Scrittura con rilettura di verifica e ritentativi con attesa crescente. */
async function storageWriteVerified(key, value, attempts = 3) {
  if (BACKEND === "none") return { ok: false, error: "Nessun sistema di salvataggio disponibile in questo browser" };
  let lastError = "errore non identificato";
  for (let i = 1; i <= attempts; i++) {
    try {
      await rawSet(key, value);
      let readBack = null;
      try {
        readBack = await rawGet(key);
      } catch (e) {
        readBack = null;
      }
      if (readBack === value) return { ok: true, attempts: i };
      lastError = "scrittura accettata ma la rilettura non corrisponde";
    } catch (e) {
      lastError = (e && e.name === "QuotaExceededError") ? "spazio di archiviazione esaurito" : (e && e.message) || String(e);
    }
    await new Promise((r) => setTimeout(r, 350 * i * i));
  }
  return { ok: false, error: lastError };
}

/** Copia a rotazione dell'archivio prima di ogni sovrascrittura. */
async function pushBackup(previousPayload) {
  if (!previousPayload || previousPayload === "[]") return;
  try {
    const raw = await storageRead(BACKUP_KEY);
    const list = raw ? JSON.parse(raw) : [];
    if (list.length && list[0].data === previousPayload) return;
    list.unshift({ at: new Date().toISOString(), data: previousPayload });
    await storageWriteVerified(BACKUP_KEY, JSON.stringify(list.slice(0, MAX_BACKUPS)), 1);
  } catch (e) {
    /* il backup non deve mai bloccare il salvataggio principale */
  }
}

async function readBackups() {
  try {
    const raw = await storageRead(BACKUP_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

async function requestPersistence() {
  try {
    if (navigator.storage && navigator.storage.persist) {
      if (await navigator.storage.persisted()) return true;
      return await navigator.storage.persist();
    }
  } catch (e) {
    /* non supportato */
  }
  return false;
}

async function storageDiagnose() {
  const out = [];
  out.push(`Versione app: ${APP_VERSION}`);
  out.push(
    BACKEND === "local"
      ? "Backend: localStorage del dominio (PWA)."
      : BACKEND === "claude"
      ? "Backend: window.storage (anteprima in Claude)."
      : "Nessun backend disponibile."
  );
  if (BACKEND === "none") return { ok: false, lines: out };
  const probeKey = "schedaV4_probe";
  const probeVal = "probe_" + Date.now();
  try {
    await rawSet(probeKey, probeVal);
    out.push("Scrittura: nessuna eccezione.");
    const v = await rawGet(probeKey);
    if (v !== probeVal) {
      out.push("Rilettura: valore DIVERSO da quello scritto.");
      return { ok: false, lines: out };
    }
    out.push("Rilettura: corretta.");
    await rawDelete(probeKey);
  } catch (e) {
    out.push("Test FALLITO: " + ((e && e.message) || String(e)));
    return { ok: false, lines: out };
  }
  try {
    if (navigator.storage && navigator.storage.persisted) {
      out.push((await navigator.storage.persisted()) ? "Persistenza: concessa dal browser." : "Persistenza: NON concessa (il browser potrebbe liberare spazio).");
    }
    if (navigator.storage && navigator.storage.estimate) {
      const est = await navigator.storage.estimate();
      out.push(`Spazio usato: ${Math.round((est.usage || 0) / 1024)} kB su ${Math.round((est.quota || 0) / 1048576)} MB disponibili.`);
    }
  } catch (e) {
    /* informazioni facoltative */
  }
  const standalone =
    (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone === true;
  out.push(standalone ? "Modalità: app installata." : "Modalità: scheda del browser.");
  const backups = await readBackups();
  out.push(`Backup a rotazione presenti: ${backups.length}/${MAX_BACKUPS}.`);
  return { ok: true, lines: out };
}


/* --------------------------- EXPORT / IMPORT ------------------------ */


/* -------------------- BACKUP AUTOMATICO SUL PC ---------------------- *
 * Dopo ogni salvataggio l'archivio viene inviato all'Hub web app sul PC
 * di casa (raggiunto via Tailscale), che lo scrive come file nuovo in una
 * cartella OneDrive. L'indirizzo del PC e' condiviso con le altre web app
 * dello stesso sito (chiave "hub-url"); lo stato e' solo di questa app.
 * -------------------------------------------------------------------- */
const HUB_APP = "scheda-v4";
const HUB_URL_KEY = "hub-url";
const HUB_STATE_KEY = "schedaV4_hubState";

function lsGet(k) {
  try {
    return window.localStorage.getItem(k);
  } catch (e) {
    return null;
  }
}
function lsSet(k, v) {
  try {
    window.localStorage.setItem(k, v);
  } catch (e) {
    /* non bloccante */
  }
}
const cleanHubUrl = (v) => (v || "").trim().replace(/\/+$/, "");
const readHubUrl = () => cleanHubUrl(lsGet(HUB_URL_KEY));
function readHubState() {
  try {
    return JSON.parse(lsGet(HUB_STATE_KEY) || "{}") || {};
  } catch (e) {
    return {};
  }
}
function writeHubState(patch) {
  const next = { ...readHubState(), ...patch };
  lsSet(HUB_STATE_KEY, JSON.stringify(next));
  return next;
}

/** Niente data/ora nel contenuto: cosi' l'hub riconosce i backup identici. */
const hubPayload = (sessions) => JSON.stringify({ app: HUB_APP, schema: SCHEMA_VERSION, sessions });

async function sha256(str) {
  try {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
    return [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, "0")).join("");
  } catch (e) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
    return "s" + h;
  }
}

async function hubFetch(base, path, opt = {}) {
  if (!base) throw new Error("indirizzo non impostato");
  const ctl = new AbortController();
  const to = setTimeout(() => ctl.abort(), 12000);
  try {
    const r = await fetch(base + path, { signal: ctl.signal, cache: "no-store", ...opt });
    let body = null;
    try {
      body = await r.json();
    } catch (e) {
      body = null;
    }
    if (!r.ok) throw new Error((body && body.errore) || "HTTP " + r.status);
    return body;
  } catch (e) {
    if (e && e.name === "AbortError") throw new Error("nessuna risposta dal PC");
    if (e instanceof TypeError) throw new Error("PC non raggiungibile (Tailscale attivo sul telefono?)");
    throw e;
  } finally {
    clearTimeout(to);
  }
}

function fmtWhen(iso) {
  if (!iso) return "mai";
  const d = new Date(iso);
  const t = new Date();
  const hm = d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === t.toDateString()) return "oggi " + hm;
  const y = new Date(t);
  y.setDate(t.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return "ieri " + hm;
  return d.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" }) + " " + hm;
}

function toMarkdown(sessions) {
  const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date));
  let out = "RIEPILOGO ALLENAMENTI — Scheda V4\n\n";
  out += `Sessioni totali: ${sorted.length}\n`;
  if (sorted.length) out += `Range date: ${sorted[sorted.length - 1].date} → ${sorted[0].date}\n`;
  out += "\nDettaglio cronologico\n\n";
  sorted.forEach((s) => {
    out += `${fmtDateIT(s.date)} — ${s.dayName}\n`;
    s.exercises.forEach((ex) => {
      const done = ex.sets.filter((st) => String(st.reps || "").trim() !== "");
      if (!done.length) return;
      const str = done.map((st) => `${st.weight || 0}kg×${st.reps}`).join(" · ");
      out += `• ${ex.name}: ${str}${ex.notes ? " — " + ex.notes : ""}\n`;
    });
    if (s.generalNotes) out += `Note: ${s.generalNotes}\n`;
    out += "\n";
  });
  return out;
}

function parseImport(raw) {
  const text = (raw || "").trim();
  if (!text) return { sessions: [], errors: ["Nessun contenuto da importare."] };

  // 1) JSON completo o array o singola sessione
  try {
    const parsed = JSON.parse(text);
    const arr = Array.isArray(parsed) ? parsed : parsed && Array.isArray(parsed.sessions) ? parsed.sessions : [parsed];
    const ok = arr.filter((s) => s && s.date && Array.isArray(s.exercises));
    if (ok.length) return { sessions: ok.map(normalizeSession), errors: [] };
  } catch (e) {
    /* non è JSON: si prosegue col parsing testuale */
  }

  const sessions = [];
  const errors = [];

  // 2) Oggetti JSON incollati dentro un testo (es. il salvataggio di emergenza della V2)
  const jsonChunks = text.match(/\{"date"[\s\S]*?"schemaVersion":\s*\d+\}/g) || [];
  jsonChunks.forEach((chunk) => {
    try {
      const o = JSON.parse(chunk);
      if (o && o.date && Array.isArray(o.exercises)) sessions.push(normalizeSession(o));
    } catch (e) {
      errors.push("Un blocco JSON incorporato non è stato interpretato.");
    }
  });

  // 3) Riepilogo testuale in stile V2
  const lines = text.split(/\r?\n/);
  const dateRe = new RegExp(`^(\\d{1,2})\\s+(${MESI.join("|")})\\s+(\\d{4})\\s*[—-]\\s*(.+)$`, "i");
  let current = null;
  const push = () => {
    if (current && current.exercises.length) sessions.push(current);
    current = null;
  };
  lines.forEach((lineRaw) => {
    const line = lineRaw.trim();
    const dm = line.match(dateRe);
    if (dm) {
      push();
      const day = String(dm[1]).padStart(2, "0");
      const month = String(MESI.indexOf(dm[2].toLowerCase()) + 1).padStart(2, "0");
      const title = dm[4].trim();
      const dayNum = (title.match(/Giorno\s*(\d+)/i) || [])[1];
      current = {
        id: uid(),
        date: `${dm[3]}-${month}-${day}`,
        day: dayNum ? Number(dayNum) : 0,
        dayName: title,
        exercises: [],
        generalNotes: "",
        savedAt: new Date().toISOString(),
        schemaVersion: SCHEMA_VERSION,
      };
      return;
    }
    if (!current) return;
    if (/^Note:/i.test(line)) {
      current.generalNotes = line.replace(/^Note:\s*/i, "");
      return;
    }
    const bm = line.match(/^[•*-]\s*(.+?):\s*(.+)$/);
    if (bm) {
      let body = bm[2];
      let notes = "";
      const noteSplit = body.split(/\s+[—-]\s+/);
      if (noteSplit.length > 1 && !/kg/i.test(noteSplit[noteSplit.length - 1])) {
        notes = noteSplit.pop().trim();
        body = noteSplit.join(" — ");
      }
      const sets = [];
      body.split("·").forEach((chunk) => {
        const m = chunk.trim().match(/([\d.,]+)\s*kg\s*[×x*]\s*(\d+)/i);
        if (m) sets.push({ weight: m[1].replace(",", "."), reps: m[2] });
      });
      if (sets.length) {
        current.exercises.push({ name: bm[1].trim(), prescribed: "", prescribedLoad: "", sets, notes });
      }
    }
  });
  push();

  if (!sessions.length) errors.push("Nessuna sessione riconosciuta. Verifica il formato del testo incollato.");
  return { sessions, errors };
}

function normalizeSession(s) {
  return {
    id: s.id || uid(),
    date: s.date,
    day: typeof s.day === "number" ? s.day : 0,
    dayName: s.dayName || "",
    exercises: (s.exercises || []).map((e) => ({
      name: e.name || "",
      prescribed: e.prescribed || "",
      prescribedLoad: e.prescribedLoad || "",
      sets: (e.sets || []).map((st) => ({ weight: String(st.weight ?? ""), reps: String(st.reps ?? "") })),
      notes: e.notes || "",
    })),
    generalNotes: s.generalNotes || "",
    savedAt: s.savedAt || new Date().toISOString(),
    schemaVersion: s.schemaVersion || SCHEMA_VERSION,
  };
}

function mergeSessions(existing, incoming) {
  const map = new Map();
  const keyOf = (s) => `${s.date}|${s.day}|${normName(s.dayName)}`;
  existing.forEach((s) => map.set(keyOf(s), s));
  let added = 0;
  let replaced = 0;
  incoming.forEach((s) => {
    const k = keyOf(s);
    if (map.has(k)) {
      const old = map.get(k);
      const oldCount = old.exercises.reduce((a, e) => a + e.sets.filter((x) => x.reps).length, 0);
      const newCount = s.exercises.reduce((a, e) => a + e.sets.filter((x) => x.reps).length, 0);
      if (newCount > oldCount) {
        map.set(k, { ...s, id: old.id });
        replaced++;
      }
    } else {
      map.set(k, s);
      added++;
    }
  });
  return {
    sessions: [...map.values()].sort((a, b) => b.date.localeCompare(a.date)),
    added,
    replaced,
  };
}

/* ============================ UI ATOMI ============================ */

/* ============================ UI ATOMI ============================ */


function Badge({ tone = "neutral", children }) {
  const tones = {
    neutral: "bg-stone-100 text-stone-600 border-stone-200",
    teal: "bg-teal-50 text-teal-800 border-teal-200",
    amber: "bg-amber-50 text-amber-800 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
    green: "bg-emerald-50 text-emerald-800 border-emerald-200",
  };
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>
  );
}

function Modal({ open, title, children, onClose, actions }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900 bg-opacity-50 p-0 sm:items-center sm:p-4">
      <div className="w-full max-w-lg rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl">
        {title && <h3 className="mb-2 text-lg font-semibold text-stone-900">{title}</h3>}
        <div className="max-h-96 overflow-y-auto text-sm text-stone-700">{children}</div>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          {actions}
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700"
            >
              Chiudi
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Stepper({ value, onChange, step = 1, min = 0, suffix = "", ladder = null, width = "w-16" }) {
  const dec = () => {
    const v = parseFloat(value);
    if (ladder) {
      if (isNaN(v)) return onChange(String(ladder[0]));
      const lower = ladder.filter((x) => x < v);
      return onChange(String(lower.length ? lower[lower.length - 1] : ladder[0]));
    }
    onChange(String(Math.max(min, (isNaN(v) ? min : v) - step)));
  };
  const inc = () => {
    const v = parseFloat(value);
    if (ladder) {
      if (isNaN(v)) return onChange(String(ladder[0]));
      const upper = ladder.find((x) => x > v);
      return onChange(String(upper !== undefined ? upper : ladder[ladder.length - 1]));
    }
    onChange(String((isNaN(v) ? min : v) + step));
  };
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={dec}
        className="h-9 w-9 shrink-0 rounded-lg border border-stone-300 bg-white text-lg font-semibold text-stone-600 active:bg-stone-100"
        aria-label="diminuisci"
      >
        −
      </button>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${width} h-9 rounded-lg border border-stone-300 bg-white px-1 text-center text-base font-semibold text-stone-900`}
        placeholder={suffix}
      />
      <button
        onClick={inc}
        className="h-9 w-9 shrink-0 rounded-lg border border-stone-300 bg-white text-lg font-semibold text-stone-600 active:bg-stone-100"
        aria-label="aumenta"
      >
        +
      </button>
    </div>
  );
}

/* ============================ TIMER ============================ */

function useRestTimer() {
  const [duration, setDuration] = useState(75);
  const [endAt, setEndAt] = useState(null);
  const [remaining, setRemaining] = useState(75);
  const [ringing, setRinging] = useState(false);
  const ctxRef = useRef(null);
  const loopRef = useRef(null);

  const ensureCtx = useCallback(() => {
    try {
      if (!ctxRef.current) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) ctxRef.current = new AC();
      }
      if (ctxRef.current && ctxRef.current.state === "suspended") ctxRef.current.resume();
    } catch (e) {
      /* audio non disponibile: il timer resta comunque visivo */
    }
    return ctxRef.current;
  }, []);

  const beep = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    try {
      const t0 = ctx.currentTime;
      [0, 0.2, 0.4].forEach((off, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(i === 2 ? 1180 : 880, t0 + off);
        gain.gain.setValueAtTime(0.0001, t0 + off);
        gain.gain.exponentialRampToValueAtTime(0.35, t0 + off + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + off + 0.16);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t0 + off);
        osc.stop(t0 + off + 0.18);
      });
      if (navigator.vibrate) navigator.vibrate([160, 90, 160]);
    } catch (e) {
      /* ignora */
    }
  }, []);

  const stopAlarm = useCallback(() => {
    setRinging(false);
    if (loopRef.current) {
      clearInterval(loopRef.current);
      loopRef.current = null;
    }
  }, []);

  const start = useCallback(
    (secs) => {
      const d = secs || duration;
      ensureCtx();
      stopAlarm();
      setDuration(d);
      setRemaining(d);
      setEndAt(Date.now() + d * 1000);
    },
    [duration, ensureCtx, stopAlarm]
  );

  const stop = useCallback(() => {
    stopAlarm();
    setEndAt(null);
    setRemaining(duration);
  }, [duration, stopAlarm]);

  const adjust = useCallback(
    (delta) => {
      if (endAt) setEndAt((e) => e + delta * 1000);
      else {
        const d = Math.max(15, duration + delta);
        setDuration(d);
        setRemaining(d);
      }
    },
    [endAt, duration]
  );

  useEffect(() => {
    if (!endAt) return;
    const tick = () => {
      const left = (endAt - Date.now()) / 1000;
      if (left <= 0) {
        setRemaining(0);
        setEndAt(null);
        setRinging(true);
        ensureCtx();
        beep();
        loopRef.current = setInterval(beep, 1600);
      } else {
        setRemaining(left);
      }
    };
    tick();
    const iv = setInterval(tick, 250);
    return () => clearInterval(iv);
  }, [endAt, beep, ensureCtx]);

  useEffect(() => () => loopRef.current && clearInterval(loopRef.current), []);

  return { duration, setDuration, remaining, running: !!endAt, ringing, start, stop, adjust, stopAlarm };
}

function TimerBar({ timer }) {
  const presets = [45, 60, 75, 90, 120, 150];
  const pct = timer.running && timer.duration ? Math.max(0, Math.min(1, timer.remaining / timer.duration)) : 0;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white shadow-lg">
      {timer.ringing ? (
        <button
          onClick={timer.stopAlarm}
          className="flex w-full items-center justify-center gap-3 bg-amber-500 px-4 py-4 text-lg font-bold text-white"
        >
          <span className="animate-pulse">● RECUPERO FINITO</span>
          <span className="rounded-lg bg-white px-3 py-1 text-sm text-amber-700">Ferma la sveglia</span>
        </button>
      ) : (
        <>
          <div className="h-1 w-full bg-stone-100">
            <div className="h-1 bg-teal-600" style={{ width: `${pct * 100}%` }} />
          </div>
          <div className="mx-auto flex max-w-3xl items-center gap-2 px-3 py-2">
            <div className="w-16 shrink-0 text-2xl font-bold tabular-nums text-stone-900">
              {fmtClock(timer.running ? timer.remaining : timer.duration)}
            </div>
            <button
              onClick={() => timer.adjust(-15)}
              className="h-10 shrink-0 rounded-lg border border-stone-300 px-2 text-xs font-semibold text-stone-600"
            >
              −15
            </button>
            <button
              onClick={() => timer.adjust(15)}
              className="h-10 shrink-0 rounded-lg border border-stone-300 px-2 text-xs font-semibold text-stone-600"
            >
              +15
            </button>
            {timer.running ? (
              <button
                onClick={timer.stop}
                className="h-10 flex-1 rounded-lg bg-stone-700 px-3 text-sm font-semibold text-white"
              >
                Annulla
              </button>
            ) : (
              <button
                onClick={() => timer.start()}
                className="h-10 flex-1 rounded-lg bg-teal-700 px-3 text-sm font-semibold text-white"
              >
                Avvia recupero
              </button>
            )}
          </div>
          {!timer.running && (
            <div className="mx-auto flex max-w-3xl gap-1 overflow-x-auto px-3 pb-2">
              {presets.map((p) => (
                <button
                  key={p}
                  onClick={() => timer.start(p)}
                  className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${
                    timer.duration === p ? "border-teal-600 bg-teal-50 text-teal-800" : "border-stone-300 text-stone-600"
                  }`}
                >
                  {fmtClock(p)}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ============================ SCHEDA ESERCIZIO ============================ */

/* ============================ SCHEDA ESERCIZIO ============================ */

const doneSets = (sets) => (sets || []).filter((s) => String(s.reps || "").trim() !== "");

/** Punteggio di una seduta: carico massimo, poi ripetizioni totali al carico massimo, poi ripetizioni totali. */
function scoreOf(entry) {
  const d = doneSets(entry.sets);
  const maxW = d.reduce((m, s) => Math.max(m, parseFloat(s.weight || "0") || 0), 0);
  const repsAtMax = d.filter((s) => (parseFloat(s.weight || "0") || 0) === maxW).reduce((a, s) => a + (Number(s.reps) || 0), 0);
  const total = d.reduce((a, s) => a + (Number(s.reps) || 0), 0);
  return [maxW, repsAtMax, total];
}

function cmpScore(a, b) {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return a[i] > b[i] ? 1 : -1;
  }
  return 0;
}

function buildSuggestion(def, history) {
  if (!history.length) return null;
  const prev = history[0];
  const done = doneSets(prev.sets);
  if (!done.length) return null;
  const reps = done.map((s) => Number(s.reps));
  const weights = done.map((s) => parseFloat(s.weight || "0") || 0);
  const w = weights[0];
  const sameW = weights.every((x) => x === w);
  const allTop = sameW && reps.length >= def.sets && reps.every((r) => r >= def.repMax);
  const kg = (x) => String(x).replace(".", ",");

  if (allTop) {
    if (def.bodyweight && w === 0 && def.name.startsWith("Trazioni")) {
      return { tone: "green", text: "Tutte le serie a 12: aggiungi il manubrio da 6,5 kg tra i piedi e riparti da 4-6 ripetizioni." };
    }
    if (def.bodyweight && w === 0) {
      return { tone: "green", text: "Top del range: rallenta l'eccentrica a 3\" o allunga l'escursione prima di aggiungere ripetizioni." };
    }
    const nextW = LADDER.find((x) => x > w);
    if (!nextW) {
      return {
        tone: "green",
        text: "Top del range al carico massimo: applica la scala → eccentrica 3\" → fermo 2\" → +1 serie → variante più difficile.",
      };
    }
    const jump = Math.round(((nextW - w) / w) * 100);
    if (jump > 20) {
      return {
        tone: "green",
        text: `Sali a ${kg(nextW)} kg (+${jump}%). Se scendi sotto ${def.repMin} ripetizioni, fai le prime serie a ${kg(nextW)} e completa a ${kg(w)}.`,
      };
    }
    return { tone: "green", text: `Tutte le serie al massimo del range: sali a ${kg(nextW)} kg e riparti da ${def.repMin} ripetizioni.` };
  }

  if (history.length >= 3) {
    const s0 = scoreOf(history[0]);
    const s1 = scoreOf(history[1]);
    const s2 = scoreOf(history[2]);
    if (cmpScore(s0, s2) <= 0 && cmpScore(s1, s2) <= 0) {
      return {
        tone: "amber",
        text: "Stallo: 3 sedute senza aumenti di carico o ripetizioni. Cambia leva (eccentrica, fermo, serie in più) o chiedi una variante.",
      };
    }
  }

  if (reps.some((r) => r < def.repMin)) {
    return { tone: "amber", text: "Sotto il range minimo la volta scorsa: consolida il carico attuale prima di salire." };
  }
  return { tone: "teal", text: "Obiettivo: 1-2 ripetizioni in più rispetto alla volta scorsa, stesso carico." };
}

function ExerciseCard({ index, def, entry, history, onSet, onNotes, onRepeatPrev, timer }) {
  const [open, setOpen] = useState(false);
  const prev = history[0] || null;
  const suggestion = useMemo(() => buildSuggestion(def, history), [def, history]);

  const prevStr = prev
    ? doneSets(prev.sets)
        .map((s) => `${String(s.weight || 0).replace(".", ",")}×${s.reps}`)
        .join(" · ")
    : null;
  const fromAlias = prev && normName(prev.name) !== normName(def.name);

  return (
    <div className="mb-3 overflow-hidden rounded-xl border border-stone-200 bg-white">
      <div className="flex items-start gap-3 border-b border-stone-100 p-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-700 text-sm font-bold text-white">
          {index + 1}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold leading-snug text-stone-900">{def.name}</h3>
          {def.superset && <div className="mt-0.5 text-xs font-semibold text-amber-700">Superserie {def.superset}</div>}
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <Badge tone="teal">{def.prescribed}</Badge>
            <Badge>{def.load}</Badge>
            <Badge>Rec {fmtClock(def.rest)}</Badge>
            <Badge>RIR {def.rir}</Badge>
          </div>
          {prevStr && (
            <div className="mt-1.5 text-xs text-stone-500">
              <span className="font-semibold text-stone-600">Precedente{fromAlias ? " (V3)" : ""}:</span> {prevStr}
              <span className="text-stone-400"> · {fmtDateIT(prev.date)}</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          className="shrink-0 rounded-lg border border-stone-300 px-2 py-1 text-xs font-medium text-stone-600"
        >
          {open ? "Chiudi" : "Info"}
        </button>
      </div>

      {open && (
        <div className="space-y-2 border-b border-stone-100 bg-stone-50 p-3 text-sm text-stone-700">
          <p>
            <span className="font-semibold text-teal-800">Tecnica.</span> {def.tecnica}
          </p>
          <p>
            <span className="font-semibold text-teal-800">Respirazione.</span> {def.respirazione}
          </p>
          <p>
            <span className="font-semibold text-teal-800">Errore comune.</span> {def.errore}
          </p>
          {def.nota && (
            <p>
              <span className="font-semibold text-teal-800">Nota.</span> {def.nota}
            </p>
          )}
          <a
            href={ytLink(def.name)}
            target="_blank"
            rel="noreferrer"
            className="inline-block rounded-lg border border-teal-300 bg-white px-3 py-1.5 text-xs font-semibold text-teal-800"
          >
            Cerca il video su YouTube
          </a>
        </div>
      )}

      {suggestion && (
        <div className="border-b border-stone-100 px-3 py-2">
          <Badge tone={suggestion.tone}>{suggestion.text}</Badge>
        </div>
      )}

      <div className="p-3">
        {entry.sets.map((st, i) => (
          <div key={i} className="mb-2 flex items-center gap-2">
            <div className="w-6 shrink-0 text-xs font-semibold text-stone-400">{i + 1}</div>
            <Stepper value={st.weight} onChange={(v) => onSet(i, "weight", v)} ladder={LADDER} suffix="kg" />
            <span className="shrink-0 text-xs text-stone-400">kg</span>
            <Stepper value={st.reps} onChange={(v) => onSet(i, "reps", v)} step={1} width="w-14" suffix="rip" />
            <span className="shrink-0 text-xs text-stone-400">rip</span>
          </div>
        ))}

        <div className="mt-2 flex flex-wrap gap-2">
          <button
            onClick={() => timer.start(def.rest)}
            className="rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white"
          >
            Recupero {fmtClock(def.rest)}
          </button>
          {prev && (
            <button
              onClick={onRepeatPrev}
              className="rounded-lg border border-stone-300 px-3 py-2 text-xs font-semibold text-stone-600"
            >
              Ripeti precedente
            </button>
          )}
        </div>

        <input
          value={entry.notes}
          onChange={(e) => onNotes(e.target.value)}
          placeholder="Note su questo esercizio…"
          className="mt-3 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-800"
        />
      </div>
    </div>
  );
}



/* ============================ ROTAZIONE ============================ */

function nextRotationIdx(sessions) {
  const last = [...sessions].sort((a, b) => b.date.localeCompare(a.date) || String(b.savedAt).localeCompare(String(a.savedAt))).find((s) => ALL_V4_IDS.includes(s.day));
  if (!last) return 0;
  const idx = PROGRAM.findIndex((p) => p.id === last.day);
  return idx < 0 ? 0 : (idx + 1) % PROGRAM.length;
}


/* ============================ APP ============================ */


export default function SchedaV4() {
  const [view, setView] = useState("allenamento");
  const [dayIdx, setDayIdx] = useState(0);
  const [sessions, setSessions] = useState([]);
  const [draft, setDraft] = useState(() => buildEmptySession(PROGRAM[0], todayISO()));
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState({ status: "idle", message: "" });
  const [rescue, setRescue] = useState(null);
  const [confirmBox, setConfirmBox] = useState(null);
  const [importText, setImportText] = useState("");
  const [importReport, setImportReport] = useState(null);
  const [diag, setDiag] = useState(null);
  const [exportText, setExportText] = useState(null);
  const [backups, setBackups] = useState([]);
  const [notice, setNotice] = useState(null);
  const [wakeOn, setWakeOn] = useState(false);
  const [updateReady, setUpdateReady] = useState(false);
  const timer = useRestTimer();
  const rescueRef = useRef(null);
  const fileRef = useRef(null);
  const wakeRef = useRef(null);
  const lastPayloadRef = useRef(null);

  /* ---------- backup automatico sul PC (hub via Tailscale) ---------- */
  const [hubUrlInput, setHubUrlInput] = useState(() => readHubUrl());
  const [hub, setHub] = useState(() => ({ url: readHubUrl(), ...readHubState(), busy: false, msg: null }));
  const sessionsRef = useRef([]);
  const hubBusyRef = useRef(false);
  const hubAgainRef = useRef(false);
  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  const hubSync = useCallback(async (force = false, list = null) => {
    const url = readHubUrl();
    if (!url) return;
    if (hubBusyRef.current) {
      hubAgainRef.current = true; // un invio e' gia' in corso: si ripete subito dopo
      return;
    }
    const data = list || sessionsRef.current;
    if (!data.length && !force) return; // un archivio vuoto non si invia da solo
    const payload = hubPayload(data);
    const h = await sha256(payload);
    if (!force && readHubState().lastHash === h) return; // il PC ha gia' questa versione
    hubBusyRef.current = true;
    setHub((s) => ({ ...s, url, busy: true, msg: "Invio del backup al PC…" }));
    try {
      const r = await hubFetch(url, `/api/${HUB_APP}/backup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      });
      const st = writeHubState({
        lastHash: h,
        lastOk: new Date().toISOString(),
        lastErr: null,
        lastFile: (r && r.file) || null,
        lastCount: data.length,
      });
      setHub((s) => ({ ...s, ...st, busy: false, msg: r && r.salvato === false ? "Il PC aveva già questa versione." : null }));
    } catch (e) {
      const st = writeHubState({ lastErr: (e && e.message) || String(e), lastErrAt: new Date().toISOString() });
      setHub((s) => ({ ...s, ...st, busy: false, msg: null }));
    } finally {
      hubBusyRef.current = false;
      if (hubAgainRef.current) {
        hubAgainRef.current = false;
        setTimeout(() => hubSync(false), 500);
      }
    }
  }, []);

  // all'apertura, al ritorno in primo piano e quando torna la rete
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => hubSync(false), 2000);
    const onVis = () => document.visibilityState === "visible" && hubSync(false);
    const onOnline = () => hubSync(false);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("online", onOnline);
    return () => {
      clearTimeout(t);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("online", onOnline);
    };
  }, [loaded, hubSync]);

  const saveHubUrl = async () => {
    const v = cleanHubUrl(hubUrlInput);
    if (v && !/^https:\/\//i.test(v)) {
      setHub((s) => ({ ...s, msg: "L'indirizzo deve iniziare con https://" }));
      return;
    }
    lsSet(HUB_URL_KEY, v);
    setHubUrlInput(v);
    if (!v) {
      setHub((s) => ({ ...s, url: "", msg: "Backup sul PC disattivato." }));
      return;
    }
    setHub((s) => ({ ...s, url: v, busy: true, msg: "Provo il collegamento…" }));
    try {
      const r = await hubFetch(v, "/api/ping");
      const known = Array.isArray(r && r.app) && r.app.includes(HUB_APP);
      setHub((s) => ({
        ...s,
        busy: false,
        msg: known
          ? `Collegato a ${r.pc}. Invio il primo backup…`
          : `Collegato a ${r.pc}, ma l'hub non conosce ancora "${HUB_APP}": aggiungila in hub_config.json e riavvia l'hub.`,
      }));
      if (known) await hubSync(true);
    } catch (e) {
      const st = writeHubState({ lastErr: e.message, lastErrAt: new Date().toISOString() });
      setHub((s) => ({ ...s, ...st, busy: false, msg: "Collegamento non riuscito: " + e.message }));
    }
  };

  const restoreFromPc = async () => {
    const url = readHubUrl();
    setHub((s) => ({ ...s, busy: true, msg: "Scarico l'ultimo backup dal PC…" }));
    try {
      const r = await hubFetch(url, `/api/${HUB_APP}/backup/ultimo`);
      const d = r && r.dati;
      const raw = Array.isArray(d) ? d : d && Array.isArray(d.sessions) ? d.sessions : null;
      if (!raw) throw new Error("il file sul PC non contiene sessioni");
      const incoming = raw.filter((x) => x && x.date && Array.isArray(x.exercises)).map(normalizeSession);
      setHub((s) => ({ ...s, busy: false, msg: null }));
      setConfirmBox({
        title: "Recuperare il backup dal PC?",
        body: `File ${r.file} con ${incoming.length} sessioni. Verrà unito all'archivio di questo telefono: le sessioni già presenti non vengono duplicate e niente viene cancellato.`,
        confirmLabel: "Unisci",
        onConfirm: async () => {
          setConfirmBox(null);
          const merged = mergeSessions(sessionsRef.current, incoming);
          setSessions(merged.sessions);
          const ok = await persist(merged.sessions);
          setHub((s) => ({
            ...s,
            msg: ok
              ? `Recupero completato: ${merged.added} sessioni aggiunte, ${merged.replaced} aggiornate.`
              : "Recupero caricato ma NON salvato sul telefono: usa il riquadro di recupero.",
          }));
        },
      });
    } catch (e) {
      setHub((s) => ({ ...s, busy: false, msg: "Recupero non riuscito: " + e.message }));
    }
  };

  const hubFailing = !!(hub.lastErr && (!hub.lastOk || (hub.lastErrAt || "") > hub.lastOk));
  const hubTone = !hub.url ? "neutral" : hub.busy ? "teal" : hubFailing ? "amber" : hub.lastOk ? "green" : "neutral";
  const hubLabel = !hub.url
    ? "non attivo"
    : hub.busy
    ? "invio…"
    : hubFailing
    ? "PC non raggiungibile"
    : hub.lastOk
    ? "ultimo: " + fmtWhen(hub.lastOk)
    : "in attesa";
  const hubStatusText =
    hub.msg != null
      ? hub.msg
      : !hub.url
      ? "Inserisci l'indirizzo del PC e premi Salva e prova."
      : `Ultimo backup riuscito: ${fmtWhen(hub.lastOk)}${hub.lastCount != null && hub.lastOk ? ` (${hub.lastCount} sessioni)` : ""}${
          hubFailing ? ` · ultimo tentativo fallito ${fmtWhen(hub.lastErrAt)}: ${hub.lastErr}` : ""
        }`;

  const day = PROGRAM[dayIdx];

  /* ---------- caricamento iniziale + migrazione dalla V3 ---------- */
  useEffect(() => {
    (async () => {
      requestPersistence();
      let list = [];
      try {
        const raw = await storageRead(STORAGE_KEY);
        if (raw) {
          lastPayloadRef.current = raw;
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) list = parsed.map(normalizeSession);
        }
      } catch (e) {
        /* archivio assente o illeggibile */
      }

      const migrated = await storageRead(MIGRATED_KEY);
      if (!migrated) {
        let found = [];
        for (const k of V3_KEYS) {
          try {
            const raw = await storageRead(k);
            const parsed = raw ? JSON.parse(raw) : null;
            if (Array.isArray(parsed)) found = found.concat(parsed.filter((s) => s && s.date && Array.isArray(s.exercises)));
          } catch (e) {
            /* chiave V3 assente */
          }
        }
        if (found.length) {
          const merged = mergeSessions(list, found.map(normalizeSession));
          list = merged.sessions;
          const payload = JSON.stringify(list);
          const res = await storageWriteVerified(STORAGE_KEY, payload);
          if (res.ok) {
            lastPayloadRef.current = payload;
            await storageWriteVerified(MIGRATED_KEY, new Date().toISOString(), 1);
            setNotice(`Storico V3 importato automaticamente: ${merged.added} sessioni. Lo trovi in Storico.`);
          }
        }
      }

      list.sort((a, b) => b.date.localeCompare(a.date));
      setSessions(list);

      let restored = false;
      try {
        const d = await storageRead(DRAFT_KEY);
        if (d) {
          const parsed = JSON.parse(d);
          if (parsed && parsed.date && Array.isArray(parsed.exercises) && sessionHasData(parsed)) {
            const idx = PROGRAM.findIndex((p) => p.id === parsed.day);
            if (idx >= 0) {
              setDayIdx(idx);
              setDraft(parsed);
              restored = true;
            }
          }
        }
      } catch (e) {
        /* nessuna bozza */
      }
      if (!restored) {
        const idx = nextRotationIdx(list);
        setDayIdx(idx);
        setDraft(buildEmptySession(PROGRAM[idx], todayISO()));
      }
      setBackups(await readBackups());
      setLoaded(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- aggiornamento disponibile (service worker) ---------- */
  useEffect(() => {
    const onUpd = () => setUpdateReady(true);
    window.addEventListener("scheda-update-ready", onUpd);
    if (window.__schedaUpdateReady) setUpdateReady(true);
    return () => window.removeEventListener("scheda-update-ready", onUpd);
  }, []);

  /* ---------- avviso uscita con dati non salvati ---------- */
  useEffect(() => {
    const h = (e) => {
      if (sessionHasData(draft) && saveState.status === "dirty") {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [draft, saveState.status]);

  /* ---------- schermo sempre acceso ---------- */
  const toggleWake = async () => {
    try {
      if (wakeRef.current) {
        await wakeRef.current.release();
        wakeRef.current = null;
        setWakeOn(false);
        return;
      }
      if (!("wakeLock" in navigator)) {
        setNotice("Questo browser non supporta il blocco dello spegnimento schermo.");
        return;
      }
      wakeRef.current = await navigator.wakeLock.request("screen");
      setWakeOn(true);
      wakeRef.current.addEventListener("release", () => {
        wakeRef.current = null;
        setWakeOn(false);
      });
    } catch (e) {
      setNotice("Impossibile tenere acceso lo schermo: " + ((e && e.message) || String(e)));
    }
  };

  useEffect(() => {
    const onVis = async () => {
      if (document.visibilityState === "visible" && wakeOn && !wakeRef.current && "wakeLock" in navigator) {
        try {
          wakeRef.current = await navigator.wakeLock.request("screen");
        } catch (e) {
          setWakeOn(false);
        }
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [wakeOn]);

  /* ---------- salvataggio automatico della bozza ---------- */
  useEffect(() => {
    if (!loaded) return;
    if (!sessionHasData(draft)) return;
    const t = setTimeout(() => {
      storageWriteVerified(DRAFT_KEY, JSON.stringify(draft), 1);
    }, 2000);
    return () => clearTimeout(t);
  }, [draft, loaded]);

  /* ---------- cambio giorno ---------- */
  const switchDay = (idx) => {
    if (idx === dayIdx) return;
    const go = () => {
      setDayIdx(idx);
      setDraft(buildEmptySession(PROGRAM[idx], draft.date));
      setSaveState({ status: "idle", message: "" });
    };
    if (sessionHasData(draft)) {
      setConfirmBox({
        title: "Cambiare giorno?",
        body: "La sessione in corso non è stata salvata. Cambiando giorno i dati inseriti andranno persi.",
        confirmLabel: "Cambia comunque",
        onConfirm: () => {
          setConfirmBox(null);
          go();
        },
      });
    } else go();
  };

  /* ---------- modifica set ---------- */
  const updateSet = (exIdx, setIdx, field, value) => {
    setDraft((d) => {
      const ex = d.exercises.map((e, i) =>
        i !== exIdx ? e : { ...e, sets: e.sets.map((s, j) => (j !== setIdx ? s : { ...s, [field]: value })) }
      );
      return { ...d, exercises: ex };
    });
    setSaveState({ status: "dirty", message: "" });
  };

  const updateNotes = (exIdx, value) => {
    setDraft((d) => ({ ...d, exercises: d.exercises.map((e, i) => (i !== exIdx ? e : { ...e, notes: value })) }));
    setSaveState({ status: "dirty", message: "" });
  };

  const historyFor = useCallback(
    (def, limit = 3) => {
      const targets = [def.name, ...(def.aliases || [])].map(normName);
      const out = [];
      for (const s of sessions) {
        const ex = s.exercises.find((e) => targets.includes(normName(e.name)));
        if (ex && ex.sets.some((st) => String(st.reps || "").trim() !== "")) {
          out.push({ ...ex, date: s.date });
          if (out.length >= limit) break;
        }
      }
      return out;
    },
    [sessions]
  );

  const repeatPrevious = (exIdx, def) => {
    const prev = historyFor(def, 1)[0];
    if (!prev) return;
    setDraft((d) => ({
      ...d,
      exercises: d.exercises.map((e, i) =>
        i !== exIdx
          ? e
          : {
              ...e,
              sets: e.sets.map((s, j) => {
                const p = prev.sets[j] || prev.sets[prev.sets.length - 1];
                return p ? { weight: String(p.weight), reps: String(p.reps) } : s;
              }),
            }
      ),
    }));
    setSaveState({ status: "dirty", message: "" });
  };

  /* ---------- salvataggio sessione ---------- */
  const persist = async (list) => {
    const payload = JSON.stringify(list);
    setSaveState({ status: "saving", message: "" });
    await pushBackup(lastPayloadRef.current);
    const res = await storageWriteVerified(STORAGE_KEY, payload);
    if (res.ok) {
      lastPayloadRef.current = payload;
      readBackups().then(setBackups);
      setTimeout(() => hubSync(false, list), 1500);
      setSaveState({ status: "saved", message: `Salvato alle ${new Date().toLocaleTimeString("it-IT")}` });
      storageWriteVerified(DRAFT_KEY, JSON.stringify({}), 1);
      return true;
    }
    setSaveState({ status: "error", message: res.error });
    setRescue({ payload: JSON.stringify(list[0] || {}, null, 0), full: payload, error: res.error });
    return false;
  };

  const saveSession = async () => {
    if (!sessionHasData(draft)) {
      setConfirmBox({
        title: "Sessione vuota",
        body: "Non hai inserito nessuna ripetizione. Inserisci almeno una serie prima di salvare.",
        confirmLabel: "Ho capito",
        onConfirm: () => setConfirmBox(null),
      });
      return;
    }
    const toSave = { ...draft, savedAt: new Date().toISOString() };
    const merged = mergeSessions(sessions, [toSave]);
    setSessions(merged.sessions);
    const ok = await persist(merged.sessions);
    if (ok) {
      const nextIdx = (dayIdx + 1) % PROGRAM.length;
      setDayIdx(nextIdx);
      setDraft(buildEmptySession(PROGRAM[nextIdx], todayISO()));
      setNotice(`Sessione ${day.tag} salvata. Prossima nella rotazione: ${PROGRAM[nextIdx].tag} — ${PROGRAM[nextIdx].short}.`);
      window.scrollTo(0, 0);
    }
  };

  const retrySave = async () => {
    setRescue(null);
    await persist(sessions);
  };

  const deleteSession = (id) => {
    setConfirmBox({
      title: "Eliminare la sessione?",
      body: "L'operazione non è reversibile. Esporta prima un backup se non sei sicuro.",
      confirmLabel: "Elimina",
      danger: true,
      onConfirm: async () => {
        setConfirmBox(null);
        const list = sessions.filter((s) => s.id !== id);
        setSessions(list);
        await persist(list);
      },
    });
  };

  /* ---------- import / export ---------- */
  const doExport = (kind) => {
    const text = kind === "json" ? JSON.stringify(sessions, null, 2) : toMarkdown(sessions);
    setExportText({ kind, text });
  };

  const doDownload = (filename, text) => {
    try {
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      return true;
    } catch (e) {
      return false;
    }
  };

  const copyText = async (text, node) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (e) {
      /* si prova il metodo alternativo */
    }
    try {
      if (node && node.current) {
        node.current.focus();
        node.current.select();
        return document.execCommand("copy");
      }
    } catch (e) {
      /* niente da fare */
    }
    return false;
  };

  const doImport = async () => {
    const { sessions: incoming, errors } = parseImport(importText);
    if (!incoming.length) {
      setImportReport({ ok: false, lines: errors });
      return;
    }
    const merged = mergeSessions(sessions, incoming);
    setSessions(merged.sessions);
    const ok = await persist(merged.sessions);
    setImportReport({
      ok,
      lines: [
        `Sessioni riconosciute: ${incoming.length}`,
        `Nuove aggiunte: ${merged.added}`,
        `Aggiornate: ${merged.replaced}`,
        ok ? "Archivio salvato." : "Archivio caricato in memoria ma NON salvato: usa il riquadro di recupero.",
        ...errors,
      ],
    });
    setImportText("");
  };

  const importFromFile = (ev) => {
    const f = ev.target.files && ev.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImportText(String(reader.result || ""));
      setImportReport({ ok: true, lines: [`File caricato: ${f.name}. Premi Importa per unirlo all'archivio.`] });
    };
    reader.onerror = () => setImportReport({ ok: false, lines: ["Lettura del file non riuscita."] });
    reader.readAsText(f);
    ev.target.value = "";
  };

  const restoreBackup = (b) => {
    let parsed = [];
    try {
      parsed = JSON.parse(b.data);
    } catch (e) {
      parsed = [];
    }
    setConfirmBox({
      title: "Ripristinare questo backup?",
      body: `Backup del ${new Date(b.at).toLocaleString("it-IT")} con ${parsed.length} sessioni. L'archivio attuale verrà sostituito (ma finirà a sua volta tra i backup).`,
      confirmLabel: "Ripristina",
      onConfirm: async () => {
        setConfirmBox(null);
        const list = parsed.map(normalizeSession).sort((a, c) => c.date.localeCompare(a.date));
        setSessions(list);
        await persist(list);
      },
    });
  };

  const runDiag = async () => {
    setDiag({ running: true, lines: ["Test in corso…"] });
    const r = await storageDiagnose();
    setDiag({ running: false, ...r });
  };

  const lastV4 = sessions.find((s) => ALL_V4_IDS.includes(s.day)) || null;
  const nextIdx = nextRotationIdx(sessions);

  /* ---------- render ---------- */

  const savedBadge = () => {
    const map = {
      idle: ["neutral", "Pronto"],
      dirty: ["amber", "Non salvato"],
      saving: ["teal", "Salvataggio…"],
      saved: ["green", "Salvato"],
      error: ["red", "Errore di salvataggio"],
    };
    const [tone, label] = map[saveState.status] || map.idle;
    return <Badge tone={tone}>{label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-40 font-sans text-stone-900">
      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-3xl px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-sm font-bold text-teal-800">Scheda V4 · rotazione A-B-C</div>
              <div className="text-xs text-stone-500">3 sedute da 60′</div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={toggleWake}
                className={`whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium ${
                  wakeOn ? "border-teal-600 bg-teal-50 text-teal-800" : "border-stone-300 text-stone-500"
                }`}
              >
                Schermo {wakeOn ? "acceso" : "auto"}
              </button>
              {hub.url && (
                <button
                  onClick={() => setView("dati")}
                  title={"Backup sul PC: " + hubLabel}
                  className={`whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium ${
                    hubTone === "green"
                      ? "border-emerald-300 text-emerald-700"
                      : hubTone === "amber"
                      ? "border-amber-300 bg-amber-50 text-amber-800"
                      : "border-stone-300 text-stone-500"
                  }`}
                >
                  PC {hub.busy ? "…" : hubTone === "green" ? "✓" : hubTone === "amber" ? "!" : "·"}
                </button>
              )}
              {savedBadge()}
            </div>
          </div>
          <nav className="mt-2 flex gap-1">
            {[
              ["allenamento", "Allenamento"],
              ["storico", "Storico"],
              ["dati", "Dati"],
              ["guida", "Programma"],
            ].map(([k, label]) => (
              <button
                key={k}
                onClick={() => setView(k)}
                className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold ${
                  view === k ? "bg-teal-700 text-white" : "bg-stone-100 text-stone-600"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {updateReady && (
        <div className="bg-teal-700 px-3 py-2 text-center text-xs text-white">
          Nuova versione disponibile.{" "}
          <button
            onClick={() => (window.__schedaApplyUpdate ? window.__schedaApplyUpdate() : window.location.reload())}
            className="ml-1 rounded bg-white px-2 py-0.5 font-semibold text-teal-800"
          >
            Aggiorna
          </button>
        </div>
      )}

      <main className="mx-auto max-w-3xl px-3 py-3">
        {notice && (
          <div className="mb-3 flex items-start gap-2 rounded-xl border border-teal-200 bg-teal-50 p-3 text-xs text-teal-900">
            <span className="flex-1">{notice}</span>
            <button onClick={() => setNotice(null)} className="font-semibold text-teal-700">
              OK
            </button>
          </div>
        )}
        {!loaded && <div className="p-6 text-center text-sm text-stone-500">Carico l'archivio…</div>}

        {/* ---------------- ALLENAMENTO ---------------- */}
        {loaded && view === "allenamento" && (
          <>
            <div className="mb-3 flex gap-1">
              {PROGRAM.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => switchDay(i)}
                  className={`flex-1 rounded-lg border px-2 py-2 text-xs font-semibold ${
                    i === dayIdx ? "border-teal-700 bg-teal-50 text-teal-800" : "border-stone-200 bg-white text-stone-500"
                  }`}
                >
                  <div className="text-base font-bold">{p.tag}</div>
                  <div className="mt-0.5 text-xs font-normal leading-tight">{p.short}</div>
                  {i === nextIdx && <div className="mt-0.5 text-xs font-semibold text-amber-700">prossima</div>}
                </button>
              ))}
            </div>

            <div className="mb-3 rounded-xl border border-stone-200 bg-white p-3">
              <h2 className="text-base font-bold leading-tight text-stone-900">{day.name}</h2>
              <p className="mt-0.5 text-xs text-stone-500">{day.focus}</p>
              {lastV4 && (
                <p className="mt-1 text-xs text-stone-500">
                  Ultima seduta V4: {lastV4.dayName.split(" — ")[0]} del {fmtDateIT(lastV4.date)}
                </p>
              )}
              <div className="mt-2 flex items-center gap-2">
                <label className="text-xs font-medium text-stone-500">Data</label>
                <input
                  type="date"
                  value={draft.date}
                  onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
                  className="rounded-lg border border-stone-300 px-2 py-1 text-sm"
                />
              </div>
              <details className="mt-2">
                <summary className="cursor-pointer text-xs font-semibold text-teal-700">Riscaldamento</summary>
                <ul className="mt-1 list-inside list-disc text-xs text-stone-600">
                  {WARMUP.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </details>
            </div>

            {day.exercises.map((def, i) => (
              <ExerciseCard
                key={def.name + i}
                index={i}
                def={def}
                entry={draft.exercises[i]}
                history={historyFor(def)}
                onSet={(setIdx, field, v) => updateSet(i, setIdx, field, v)}
                onNotes={(v) => updateNotes(i, v)}
                onRepeatPrev={() => repeatPrevious(i, def)}
                timer={timer}
              />
            ))}

            <div className="mb-3 rounded-xl border border-stone-200 bg-white p-3">
              <label className="text-xs font-semibold text-stone-500">Note generali della sessione</label>
              <textarea
                value={draft.generalNotes}
                onChange={(e) => setDraft((d) => ({ ...d, generalNotes: e.target.value }))}
                rows={2}
                className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                placeholder="Sensazioni, dolori, condizioni…"
              />
            </div>

            <button
              onClick={saveSession}
              disabled={saveState.status === "saving"}
              className="mb-2 w-full rounded-xl bg-teal-700 py-4 text-base font-bold text-white active:bg-teal-800"
            >
              {saveState.status === "saving" ? "Salvataggio in corso…" : "Salva sessione"}
            </button>
            {saveState.message && (
              <p className={`text-center text-xs ${saveState.status === "error" ? "text-red-600" : "text-stone-500"}`}>
                {saveState.message}
              </p>
            )}
          </>
        )}

        {/* ---------------- STORICO ---------------- */}
        {loaded && view === "storico" && (
          <div>
            <div className="mb-3 rounded-xl border border-stone-200 bg-white p-3 text-sm">
              <span className="font-semibold">{sessions.length}</span> sessioni in archivio
              {sessions.length > 0 && (
                <span className="text-stone-500">
                  {" "}
                  · dal {fmtDateIT(sessions[sessions.length - 1].date)} al {fmtDateIT(sessions[0].date)}
                </span>
              )}
            </div>
            {sessions.length === 0 && (
              <div className="rounded-xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">
                Nessuna sessione ancora. Importa il backup JSON della V3 dalla scheda Dati oppure registra il primo
                allenamento.
              </div>
            )}
            {sessions.map((s) => (
              <div key={s.id} className="mb-2 rounded-xl border border-stone-200 bg-white p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-bold text-stone-900">{fmtDateIT(s.date)}</div>
                    <div className="text-xs text-stone-500">
                      {!ALL_V4_IDS.includes(s.day) && <span className="mr-1 rounded bg-stone-100 px-1 font-semibold">V3</span>}
                      {s.dayName}
                    </div>
                  </div>
                  <button onClick={() => deleteSession(s.id)} className="text-xs font-medium text-red-600">
                    Elimina
                  </button>
                </div>
                <ul className="mt-2 space-y-0.5 text-xs text-stone-700">
                  {s.exercises.map((ex, i) => {
                    const done = ex.sets.filter((st) => String(st.reps || "").trim() !== "");
                    if (!done.length) return null;
                    return (
                      <li key={i}>
                        <span className="font-medium">{ex.name}:</span>{" "}
                        {done.map((st) => `${String(st.weight || 0).replace(".", ",")}×${st.reps}`).join(" · ")}
                        {ex.notes ? ` — ${ex.notes}` : ""}
                      </li>
                    );
                  })}
                </ul>
                {s.generalNotes && <p className="mt-1 text-xs italic text-stone-500">{s.generalNotes}</p>}
              </div>
            ))}
          </div>
        )}

        {/* ---------------- DATI ---------------- */}
        {loaded && view === "dati" && (
          <div className="space-y-3">
            <div className="rounded-xl border border-teal-200 bg-white p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold">Backup automatico sul PC</h3>
                <Badge tone={hubTone}>{hubLabel}</Badge>
              </div>
              <p className="mb-2 text-xs text-stone-500">
                Dopo ogni salvataggio l'app invia una copia dell'archivio al PC di casa tramite Tailscale. Se il PC non
                risponde riprova da sola alla prossima apertura. Le copie finiscono in{" "}
                <em>Personal Trainer/backup-scheda-v4</em> su OneDrive.
              </p>
              <label htmlFor="hubUrl" className="mb-1 block text-xs font-semibold text-stone-600">
                Indirizzo del PC
              </label>
              <input
                id="hubUrl"
                type="url"
                inputMode="url"
                autoComplete="off"
                spellCheck={false}
                value={hubUrlInput}
                onChange={(e) => setHubUrlInput(e.target.value)}
                placeholder="https://nome-pc.xxxx.ts.net:8443"
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  onClick={saveHubUrl}
                  disabled={hub.busy}
                  className="rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                >
                  Salva e prova
                </button>
                <button
                  onClick={() => hubSync(true)}
                  disabled={hub.busy || !hub.url}
                  className="rounded-lg border border-stone-300 px-3 py-2 text-xs font-semibold text-stone-700 disabled:opacity-50"
                >
                  Invia backup ora
                </button>
                <button
                  onClick={restoreFromPc}
                  disabled={hub.busy || !hub.url}
                  className="rounded-lg border border-teal-300 px-3 py-2 text-xs font-semibold text-teal-800 disabled:opacity-50"
                >
                  Recupera dal PC
                </button>
              </div>
              <p role="status" className="mt-2 text-xs text-stone-600">
                {hubStatusText}
              </p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-3">
              <h3 className="mb-2 text-sm font-bold">Esporta (fallo dopo ogni sessione)</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => doExport("json")}
                  className="rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white"
                >
                  Esporta JSON completo
                </button>
                <button
                  onClick={() => doExport("md")}
                  className="rounded-lg border border-stone-300 px-3 py-2 text-xs font-semibold text-stone-700"
                >
                  Esporta riepilogo leggibile
                </button>
              </div>
              <p className="mt-2 text-xs text-stone-500">
                Il JSON è il formato da conservare: si reimporta senza perdite. Il riepilogo serve per rileggere i
                progressi o per incollarli in chat.
              </p>
            </div>

            <div className="rounded-xl border border-stone-200 bg-white p-3">
              <h3 className="mb-2 text-sm font-bold">Importa</h3>
              <p className="mb-2 text-xs text-stone-500">
                Accetta il JSON della V3 e della V4 (file o testo incollato), le singole sessioni e il riepilogo
                testuale. Le sessioni già presenti non vengono duplicate.
              </p>
              <input ref={fileRef} type="file" accept=".json,.txt,application/json,text/plain" onChange={importFromFile} className="hidden" />
              <button
                onClick={() => fileRef.current && fileRef.current.click()}
                className="mb-2 rounded-lg border border-teal-300 px-3 py-2 text-xs font-semibold text-teal-800"
              >
                Scegli un file .json
              </button>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                rows={5}
                placeholder="Incolla qui il contenuto da importare…"
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs"
              />
              <button
                onClick={doImport}
                className="mt-2 rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white"
              >
                Importa
              </button>
              {importReport && (
                <ul className={`mt-2 text-xs ${importReport.ok ? "text-stone-600" : "text-red-600"}`}>
                  {importReport.lines.map((l, i) => (
                    <li key={i}>· {l}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl border border-stone-200 bg-white p-3">
              <h3 className="mb-2 text-sm font-bold">Diagnostica salvataggio</h3>
              <p className="mb-2 text-xs text-stone-500">
                Verifica scrittura e rilettura, persistenza concessa dal browser, spazio usato e modalità installata.
              </p>
              <button
                onClick={runDiag}
                className="rounded-lg border border-stone-300 px-3 py-2 text-xs font-semibold text-stone-700"
              >
                Esegui test
              </button>
              {diag && (
                <ul className={`mt-2 text-xs ${diag.ok ? "text-emerald-700" : "text-red-600"}`}>
                  {diag.lines.map((l, i) => (
                    <li key={i}>· {l}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl border border-stone-200 bg-white p-3">
              <h3 className="mb-2 text-sm font-bold">Backup automatici</h3>
              <p className="mb-2 text-xs text-stone-500">
                Prima di ogni salvataggio l'archivio precedente viene copiato qui ({MAX_BACKUPS} copie a rotazione, sullo
                stesso dispositivo). Non sostituiscono l'export JSON.
              </p>
              {backups.length === 0 && <p className="text-xs text-stone-400">Nessun backup ancora.</p>}
              {backups.map((b, i) => {
                let n = 0;
                try {
                  n = JSON.parse(b.data).length;
                } catch (e) {
                  n = 0;
                }
                return (
                  <div key={i} className="mb-1 flex items-center justify-between gap-2 text-xs">
                    <span className="text-stone-600">
                      {new Date(b.at).toLocaleString("it-IT")} · {n} sessioni
                    </span>
                    <button onClick={() => restoreBackup(b)} className="font-semibold text-teal-700">
                      Ripristina
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="rounded-xl border border-stone-200 bg-white p-3">
              <h3 className="mb-2 text-sm font-bold">Azzera archivio</h3>
              <button
                onClick={() =>
                  setConfirmBox({
                    title: "Cancellare tutto l'archivio?",
                    body: "Verranno rimosse tutte le sessioni salvate. Esporta prima un backup JSON.",
                    confirmLabel: "Cancella tutto",
                    danger: true,
                    onConfirm: async () => {
                      setConfirmBox(null);
                      setSessions([]);
                      await persist([]);
                    },
                  })
                }
                className="rounded-lg border border-red-300 px-3 py-2 text-xs font-semibold text-red-700"
              >
                Cancella tutte le sessioni
              </button>
            </div>
          </div>
        )}

        {/* ---------------- PROGRAMMA ---------------- */}
        {loaded && view === "guida" && (
          <div className="space-y-3">
            <div className="rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-700">
              <h3 className="mb-1 text-sm font-bold text-stone-900">Rotazione</h3>
              <p className="mb-2">
                Esegui A → B → C in sequenza, senza legare le sedute ai giorni della settimana. Se salti un giorno riparti
                dalla lettera successiva a quella fatta: l'app la segna come <span className="font-semibold">prossima</span>.
                Ogni seduta contiene un esercizio per le gambe.
              </p>
              <h3 className="mb-1 text-sm font-bold text-stone-900">Come progredire</h3>
              <p className="mb-2">
                <span className="font-semibold">Doppia progressione.</span> Quando tutte le serie arrivano al massimo del
                range con il RIR indicato, sali di uno scalino di manubrio e riparti dal minimo del range.
              </p>
              <p className="mb-2">
                <span className="font-semibold">Salti grandi (oltre il 20%).</span> Prime serie con il carico nuovo,
                completa con quello vecchio finché non tieni tutto il range.
              </p>
              <p className="mb-2">
                <span className="font-semibold">Carico massimo (24,5 kg).</span> In ordine: discesa in 3", fermo di 2" nel
                punto difficile, una serie in più, variante unilaterale o più difficile.
              </p>
              <p className="mb-2">
                <span className="font-semibold">Stallo.</span> 3 sedute consecutive senza aumenti di carico o ripetizioni:
                l'app lo segnala e si cambia leva o variante.
              </p>
              <p>
                <span className="font-semibold">Recuperi.</span> 2'-2'30 sui fondamentali, 1'15-1'30 sugli altri, 1' su
                core e polpacci. Nelle superserie il recupero parte dopo il secondo esercizio.
              </p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-3 text-xs text-stone-700">
              <h3 className="mb-1 text-sm font-bold text-stone-900">Su cosa si basa (fonti PubMed)</h3>
              <ul className="space-y-1.5">
                {SOURCES.map((s) => (
                  <li key={s.doi}>
                    <span className="font-semibold">{s.ref}.</span> {s.text}{" "}
                    <a href={`https://doi.org/${s.doi}`} target="_blank" rel="noreferrer" className="text-teal-700 underline">
                      DOI
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-stone-500">
                Non verificati in letteratura: i carichi indicati come stima, il metodo 1½, il leg curl scivolato e le
                durate delle sedute. Sono scelte pratiche.
              </p>
            </div>
            {PROGRAM.map((p) => (
              <div key={p.id} className="rounded-xl border border-stone-200 bg-white p-3">
                <h3 className="text-sm font-bold text-stone-900">
                  {p.name}
                </h3>
                <p className="mb-2 text-xs text-stone-500">{p.focus}</p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 text-left text-stone-500">
                      <th className="py-1">Esercizio</th>
                      <th className="py-1">Serie × rip</th>
                      <th className="py-1">Carico</th>
                      <th className="py-1">Rec</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.exercises.map((e) => (
                      <tr key={e.name} className="border-b border-stone-100 align-top">
                        <td className="py-1.5 pr-2">{e.name}</td>
                        <td className="py-1.5 pr-2 whitespace-nowrap">{e.prescribed}</td>
                        <td className="py-1.5 pr-2 whitespace-nowrap">{e.load}</td>
                        <td className="py-1.5 whitespace-nowrap">{fmtClock(e.rest)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </main>

      <TimerBar timer={timer} />

      {/* MODALE DI CONFERMA */}
      <Modal
        open={!!confirmBox}
        title={confirmBox?.title}
        onClose={() => setConfirmBox(null)}
        actions={
          confirmBox && (
            <button
              onClick={confirmBox.onConfirm}
              className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${
                confirmBox.danger ? "bg-red-600" : "bg-teal-700"
              }`}
            >
              {confirmBox.confirmLabel}
            </button>
          )
        }
      >
        {confirmBox?.body}
      </Modal>

      {/* PANNELLO DI RECUPERO DATI */}
      <Modal
        open={!!rescue}
        title="Il salvataggio non è riuscito"
        onClose={() => setRescue(null)}
        actions={
          <>
            <button onClick={retrySave} className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white">
              Riprova a salvare
            </button>
            <button
              onClick={() => copyText(rescue.full, rescueRef)}
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700"
            >
              Copia
            </button>
            <button
              onClick={() => doDownload(`scheda-v4-${todayISO()}.json`, rescue.full)}
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700"
            >
              Scarica
            </button>
          </>
        }
      >
        {rescue && (
          <>
            <p className="mb-2">
              Motivo tecnico: <span className="font-mono text-xs text-red-700">{rescue.error}</span>
            </p>
            <p className="mb-2">
              I dati non sono persi: sono ancora in memoria e li trovi qui sotto. Copiali o scaricali, poi reimportali
              dalla scheda <span className="font-semibold">Dati</span> quando il salvataggio tornerà a funzionare.
            </p>
            <textarea
              ref={rescueRef}
              readOnly
              value={rescue.full}
              rows={8}
              onFocus={(e) => e.target.select()}
              className="w-full rounded-lg border border-stone-300 p-2 font-mono text-xs"
            />
          </>
        )}
      </Modal>

      {/* PANNELLO EXPORT */}
      <Modal
        open={!!exportText}
        title={exportText?.kind === "json" ? "Backup JSON" : "Riepilogo allenamenti"}
        onClose={() => setExportText(null)}
        actions={
          exportText && (
            <>
              <button
                onClick={() => copyText(exportText.text, rescueRef)}
                className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white"
              >
                Copia
              </button>
              <button
                onClick={() =>
                  doDownload(
                    `scheda-v4-${todayISO()}.${exportText.kind === "json" ? "json" : "txt"}`,
                    exportText.text
                  )
                }
                className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700"
              >
                Scarica
              </button>
            </>
          )
        }
      >
        {exportText && (
          <textarea
            ref={rescueRef}
            readOnly
            value={exportText.text}
            rows={10}
            onFocus={(e) => e.target.select()}
            className="w-full rounded-lg border border-stone-300 p-2 font-mono text-xs"
          />
        )}
      </Modal>
    </div>
  );
}
