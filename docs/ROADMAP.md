# Chazak — Roadmap verso l'app multi-cooperatore

> Documento di lavoro per le prossime sessioni. Leggere prima `CLAUDE.md` (struttura e regole del progetto).
> Ultimo aggiornamento: 20 ottobre 2026.

## Come lavorare con Eduardo (importante)

- Eduardo non è un programmatore esperto. Parlare sempre in **italiano**, con parole semplici. Ogni termine tecnico (RLS, DNS, branch, commit…) va spiegato in una frase.
- Procedere **un passo alla volta**. Dopo ogni passo spiegare cosa è stato fatto, cosa cambia per lui e cosa viene dopo, poi **aspettare il suo ok**.
- Quando deve fare qualcosa lui (su Supabase, GitHub, il sito del dominio, il telefono), dare istruzioni precise: quale pagina aprire, quale pulsante premere, cosa scrivere e cosa dovrebbe vedere alla fine. Se qualcosa non torna, chiedere uno screenshot.
- Prima di qualsiasi cosa difficile da annullare (cancellare dati, riscrivere la cronologia git, cambiare il database, pubblicare su `main`) spiegare i rischi e chiedere una **conferma esplicita**.
- **Mai** chiedere la chiave `service_role`/secret di Supabase, la password del database o token GitHub. Se servono, spiegare come usarli lui senza mostrarli.
- Lavorare su **branch separati** e non fare mai merge su `main` da soli: la pubblicazione la decide lui.
- L'interfaccia dell'app resta in **portoghese**; con Eduardo si parla in italiano.

## Dove siamo

- **v5.8.0 online.** La Fase 1 (divisione di `index.html` in `css/` + `js/`) è completata e verificata.
- **Supabase attivo** (`https://lqrmnkbcahtxhvxpgjag.supabase.co`, regione UE):
  - tabella `public.backups` (`user_id`, `dati` jsonb, `updated_at`) con RLS "solo il proprio": ogni account vede solo la propria riga;
  - l'app si sincronizza da sola salvando tutto il db dell'utente in quella riga (`js/nuvem.js`);
  - iscrizioni pubbliche **disattivate**: gli account li crea Eduardo dal pannello;
  - "Esponi automaticamente le nuove tabelle" **disattivato** → ogni nuova tabella richiede `GRANT` espliciti. "RLS automatico" è attivo.
- Restano il backup su Gist (manuale) e l'export JSON come copie di sicurezza.

## Obiettivo

Chazak diventa un'app per **più cooperatori**: alcune parti comuni a tutti, altre personali.

### 1. Utenti e ruoli
- Due ruoli: **admin** (Eduardo) e **membro** (gli altri cooperatori).
- Gli account li crea Eduardo dal pannello Supabase: Authentication → Users → Add user → Auto Confirm User (spiegare i passi ogni volta).
- Tabella `membri` con nome, ruolo, gruppo e flag attivo/disattivo. Un membro disattivato **non vede più niente**, anche se ha ancora la password.
- Pagina "Membros" in Dados, visibile solo all'admin: elenco membri, attivare/disattivare, cambiare ruolo.
- Colonna `gruppo_id` fin dall'inizio, così in futuro un'altra mocidade potrà avere i suoi dati separati.

### 2. Password
- Al primo accesso con la password temporanea, l'app chiede di sceglierne una nuova.
- In Dados, pulsante "Alterar palavra-passe".
- Password dimenticata: all'inizio la reimposta Eduardo dal pannello Supabase (spiegare come). Il recupero via email può venire più avanti: spiegare pro, contro e limiti dell'email gratuita di Supabase.

### 3. Permessi (già decisi)

| Sezione | Chi vede | Chi aggiunge/modifica | Chi elimina |
|---|---|---|---|
| Jovens (scheda) | Tutti | Tutti | Solo admin, con **cestino** recuperabile visibile solo all'admin |
| Interazioni (presente, conversa, viagem, outro) | Tutti | Tutti aggiungono; ognuno modifica le proprie | Autore e admin |
| Note private delle interazioni | Solo autore e admin | Autore | Autore e admin |
| Presenze, Viagens, Encontros | Tutti | Tutti | Chi l'ha creato e admin |
| Agenda | Tutti | Tutti aggiungono; ognuno modifica i propri eventi | Autore e admin |
| Ideias | Tutti | Tutti aggiungono; ognuno modifica le proprie | Autore e admin |
| Localidades | Tutti | Tutti | Solo admin |
| Palavras e Bíblia | Solo il proprietario | Solo il proprietario | Solo il proprietario |

Regole che valgono ovunque:
- Ogni elemento comune mostra **chi l'ha creato e quando**. Il database registra anche chi l'ha modificato.
- Note private: gli altri vedono che l'interazione c'è stata (conta per lo stato Atenção/Em dia), ma non il testo; vedono "🔒 nota privada". Quando si segna una nota come privata, l'app scrive chiaramente "visível só para ti e para o admin".
- Lo stato "Inativo" dei jovens resta disponibile a tutti, come alternativa all'eliminazione.

### 4. Backend (Supabase), architettura ibrida
- **Dati comuni** (jovens, interazioni, note private in una tabella separata, presenze, viagens, encontros, agenda, ideias, localidades) in tabelle vere, con RLS che applica la tabella dei permessi.
- **Dati personali** (Palavras, Bíblia) restano un blocco unico per utente nella tabella `backups`, funzionanti anche offline come adesso.
- I dati comuni sono **online-first**: offline si possono consultare, ma per salvare serve internet, e l'app deve dirlo chiaramente.
- Lo SQL lo esegue Eduardo: darlo **a pezzi piccoli**, spiegando cosa fa ogni pezzo, con i `GRANT` espliciti, e dopo ogni pezzo spiegare come verificare che sia andato bene.
- **Migrazione:** i dati attuali di Eduardo vanno nelle tabelle comuni (parte condivisa) e nel suo blocco personale (Palavras, Bíblia), senza perdere niente. **Prima** della migrazione: backup Gist e JSON fatti e verificati.
- Va adattato `js/nuvem.js`, che oggi salva tutto nel blocco unico.
- Nei test solo **dati finti**, mai i nomi veri dei ragazzi.

### 5. Dominio
- Un indirizzo più ufficiale di `djeduardo13-glitch.github.io/Chazak`. Nome ancora da scegliere: aiutare a sceglierlo spiegando estensioni (.app, .it, .org…), costi indicativi e dove comprarlo.
- Guida passo per passo: acquisto, record DNS (A e CNAME per GitHub Pages), Custom domain ed Enforce HTTPS su GitHub, verifica del dominio, aggiornamento di Site URL e Redirect URLs in Supabase Auth.
- Cambiando indirizzo l'app installata va reinstallata e il localStorage riparte vuoto; con il login i dati tornano dalla nuvola. Va fatto **prima** di dare l'app agli altri.

### 6. Privacy
- ✅ **Fatto il 20/10/2026.** I dati dei ragazzi (62 nomi con categoria e compleanno) erano in 37 dei 54 commit vecchi. Scelta fatta: **repo ricreata da zero** (non `git filter-repo`, perché le PR conservavano la storia vecchia e GitHub non permette di cancellarle da soli). La repo nuova ha lo stesso nome, quindi stesso indirizzo e stessi dati sui telefoni, e parte da un solo commit "Chazak v5.8.0". Verificato che i commit vecchi e le PR #1/#2 non sono più raggiungibili.
- La cartella di lavoro è ora `Documenti\GitHub\Chazak-pulito`. La vecchia `Documenti\GitHub\Chazak` contiene ancora la storia con i dati: è un archivio privato, **scollegato da GitHub**, e non va **mai** più caricata online.
- GitHub conserva per 90 giorni una copia ripristinabile della repo cancellata, visibile solo a Eduardo: non ripristinarla.
- Il Gist "segreto" del backup non è davvero privato: chiunque abbia il link può aprirlo. Non condividerlo, e ripensare il backup Gist dopo le fasi D–E.
- Con più persone che vedono dati di minori, ricordare le buone pratiche: accesso solo a chi serve, disattivare subito chi non serve più.

### 7. Piccoli miglioramenti (alla fine)
- `README.md` aggiornato (parla ancora di un file unico e di un tema scuro che non esiste).
- Togliere `user-scalable=no` dal viewport, così si può zoomare.
- Etichette sulle sotto-schede che hanno solo emoji.
- Aggiungere `navigator.storage.persist()`.
- Margine (safe zone) all'icona maskable.
- Tenere il pulsante + dentro la colonna dell'app su desktop.

## Ordine delle fasi

| Fase | Contenuto | Stato |
|---|---|---|
| A | Salvare questo riassunto in `docs/ROADMAP.md` | ✅ fatto |
| B | Pulizia della cronologia (privacy) | ✅ fatto (repo ricreata) |
| C | Dominio | da fare |
| D | Database: tabelle e RLS | da fare |
| E | Migrazione dei dati di Eduardo | da fare |
| F | App: login, permessi, autore, note private, cestino, password, pagina Membros | da fare |
| G | Test con una persona di fiducia, poi con tutti | da fare |
| H | Piccoli miglioramenti | da fare |

Ogni release aumenta `CACHE_NAME` e la versione, come dice `CLAUDE.md`.
