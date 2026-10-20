# Chazak

PWA personale per il lavoro di cooperatore della mocidade (CCB): giovani, presenze, viaggi, agenda, servizi/parole, diario biblico. Interfaccia in **portoghese**. Pubblicata con GitHub Pages dal branch `main`, così com'è: niente build, niente dipendenze npm.

I dati stanno nel `localStorage` del dispositivo. Opzionalmente si sincronizzano con Supabase (login + RLS, una riga per account) o si salvano in un Gist privato o in un export JSON.

## Struttura

```
index.html        HTML (sezioni delle 5 schede + modali), carica CSS e JS
css/style.css     tutto il CSS
js/               script classici con <script defer>, eseguiti in questo ordine:
  core.js         esc/escJs, dialoghi chzAlert/chzConfirm, località, autocomplete, openModal/closeModal, db/loadDB/saveDB
  mocidade.js     scheda Mocidade: giovani, presenze, tracker, profilo, viaggi, FAB, interazioni, ideias, encontros
  palavras.js     scheda Palavras (id sezione "servicos")
  agenda.js       scheda Agenda: eventi, calendario, notifica compleanni
  biblia.js       scheda Bíblia: planner, libri, versetti (API), leitura, curiosità, preferiti
  gist.js         backup su GitHub Gist
  nuvem.js        sincronizzazione Supabase
  dados.js        scheda Dados: profilo, storico import, località, export/import
  navegacao.js    switchTab (unica), data nell'header, scroll-to-top, pulsante Indietro (popstate) e override di openPerfil/openViagemDetail/closeViagemDetail
  boot.js         DOMContentLoaded: avvio dell'app. Va sempre caricato per ultimo
sw.js             service worker: precache di tutti i file della versione
manifest.json, icon-*.png
```

Tutto è globale: ci sono centinaia di `onclick="..."` inline, sia nell'HTML sia nei template JS. Gli script condividono lo scope globale, `let`/`const` di primo livello compresi. Le dichiarazioni di funzione possono stare in qualsiasi file. Il codice eseguito subito al primo livello, invece, deve stare in un file caricato dopo quelli da cui dipende: in particolare gli override `x = function…` in `navegacao.js` vanno dopo `mocidade.js`.

## Regole

- **Niente build step.** Solo file statici e `<script defer>` classici, **niente moduli ES** (gli onclick inline chiamano funzioni globali).
- **Interfaccia in portoghese**, compresi testi, messaggi e dialoghi.
- **Mai dati personali di minori nel codice** (nomi, date, contatti…). La repo è pubblica: i dati arrivano solo da Gist privato, Supabase o backup JSON. Per i test usare solo dati fittizi.
- La chiave Supabase **publishable** (`sb_publishable_…`) può stare nel codice, perché la protezione è data dalla RLS. La chiave **service_role** non va **mai** nel codice né nella repo.
- **A ogni release** aumentare `CACHE_NAME` in `sw.js` e aggiornare la stessa versione nella scheda Dados (`index.html`) e nel nome del file di export (`js/dados.js`, `Chazak_backup_…_(vX.Y.Z).json`). Gli utenti ricevono i file nuovi **solo** quando cambia `CACHE_NAME`. Ogni file nuovo va aggiunto a `PRECACHE` in `sw.js`, e anche al tag `<script defer>` in `index.html` se è JS.
- **Non rinominare le chiavi di `localStorage`**, perché contengono i dati degli utenti: `cooperador_db`, `cooperador_perfil`, `cooperador_imports`, `chazak_sb_*`, `chazak_gh_token`, `chazak_gist_*`, `chazak_bv_dispensado`. Non rinominare nemmeno le funzioni chiamate dagli `onclick`.
