# Scheda V4 — PWA (versione 4.0.0)

## Contenuto
- `scheda-v4-pwa/` — cartella da pubblicare così com'è (contiene anche `.nojekyll`, file nascosto).
- `sorgenti/` — `src/app.jsx` (app), `src/main.jsx` (avvio + service worker), `public/` (index, manifest, sw, icone), `package.json`, `tailwind.config.js`.

## Pubblicazione su GitHub Pages
1. Crea un nuovo repository pubblico, per esempio `scheda-v4` (consigliato: lascia intatto quello della V3 come riserva).
2. Carica il **contenuto** di `scheda-v4-pwa/` nella radice del repository, incluso `.nojekyll`.
3. Settings → Pages → Source: *Deploy from a branch*, branch `main`, cartella `/ (root)`.
4. Dopo 1-2 minuti l'app è su `https://<utente>.github.io/scheda-v4/`.

## Installazione su Android
Apri l'indirizzo con Chrome → menu ⋮ → *Installa app*. Poi disinstalla o tieni la V3 come preferisci.

## Storico della V3
- **Automatico.** Se V3 e V4 sono pubblicate sullo stesso account GitHub (`<utente>.github.io/...`), condividono lo stesso archivio del browser: al primo avvio la V4 importa da sola le sessioni V3 (chiave `schedaV3_sessions`) e lo segnala con un avviso. Funziona solo se apri la V4 con **lo stesso browser** (Chrome) in cui usavi la V3.
- **Manuale (se l'avviso non compare).** Nella V3: Dati → Esporta JSON completo → Scarica. Nella V4: Dati → Scegli un file .json → Importa. I duplicati vengono scartati.

## Cosa fa di diverso dalla V3
- Rotazione A-B-C: dopo il salvataggio passa da sola alla seduta successiva; la prossima è segnata anche dopo una pausa.
- Lo storico degli esercizi rinominati viene letto anche dalle sessioni V3 (indicato come "Precedente (V3)").
- Suggerimenti di progressione: salto di carico oltre il 20% con serie miste, scala per il carico massimo, avviso di stallo dopo 3 sedute senza aumenti.
- Backup automatici (5 copie) ripristinabili da Dati; import da file; schermo sempre acceso; avviso di aggiornamento.

## Aggiornamenti futuri
Rigenera con `npm install && npm run build` (dentro `sorgenti/`), copia `dist/app.js` e `dist/styles.css` insieme ai file di `public/`, **cambia la stringa `CACHE` in `sw.js`** (es. `scheda-v4-4.0.1`) e ricarica i file su GitHub con gli stessi nomi. Lo storico non viene toccato.

## Backup automatico sul PC (dalla 4.1.0)
Dopo ogni salvataggio l'app manda una copia dell'archivio all'**Hub web app** su PC2, tramite Tailscale. L'hub la scrive come file nuovo (`scheda-v4-AAAA-MM-GG_hhmmss.json`, mai sovrascritto, ultimi 200) in `Personal Trainer/backup-scheda-v4` su OneDrive, **fuori dal repository**: lo storico non finisce mai su GitHub.
- **Attivazione:** Dati → *Backup automatico sul PC* → indirizzo `https://<pc2>.<tailnet>.ts.net:8443` → *Salva e prova*. L'indirizzo è lo stesso dell'app Guadagni e viene condiviso: se l'hai già impostato lì, qui compare da solo.
- **Quando invia:** dopo ogni salvataggio, all'apertura dell'app e quando torna la rete; solo se l'archivio è cambiato dall'ultimo invio riuscito.
- **Spia nell'header:** `PC ✓` ultimo invio riuscito, `PC !` PC non raggiungibile (riprova da sola), `PC …` invio in corso.
- **Telefono nuovo:** Dati → *Recupera dal PC* unisce l'ultimo backup all'archivio (niente duplicati, niente cancellato).
- **Requisiti:** Tailscale acceso sul telefono; l'app `scheda-v4` registrata in `Hub web app/hub_config.json` e hub riavviato su PC2.

## Limiti
- Senza backup sul PC attivo i dati restano solo su questo dispositivo e in questo browser: in quel caso esporta il JSON dopo ogni seduta.
- Cancellare i dati dei siti in Chrome cancella l'archivio (compresi i backup automatici).
- La sveglia di fine recupero richiede app in primo piano e schermo acceso.
