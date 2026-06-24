# Murmura — il muro anonimo del tuo evento

Bacheca anonima per eventi (discoteche, party, concerti). Chiunque abbia il link
scrive in anonimo; un'AI (Gemini) **modera in automatico**, **organizza i messaggi
per tema** e genera un **report visibile solo all'organizzatore**. Spazi pubblicitari
e "evento promosso" già predisposti per il modello di ricavo.

Stack: **Next.js 14** (frontend + API) · **Supabase / Postgres** (database) ·
**Gemini** (AI, lato server) · deploy gratuito su **Vercel**.

---

## 1. Cosa ti serve (tutto con piano gratuito)
- Account **GitHub** (per il deploy)
- Account **Supabase** → https://supabase.com
- Account **Vercel** → https://vercel.com
- Chiave **Gemini** da **Google AI Studio** → https://aistudio.google.com/apikey

## 2. Database (Supabase)
1. Crea un nuovo progetto su Supabase.
2. Apri **SQL Editor** → incolla il contenuto di `supabase/schema.sql` → **Run**.
3. Vai in **Project Settings → API** e copia:
   - **Project URL** → `SUPABASE_URL`
   - chiave **`service_role`** (sezione "Project API keys") → `SUPABASE_SERVICE_ROLE_KEY`
   ⚠️ La `service_role` è segreta: va SOLO nelle variabili server, mai nel browser.

## 3. Chiave Gemini
1. Su Google AI Studio → **Get API key** → copia in `GEMINI_API_KEY`.
2. Modelli consigliati (free tier 2026, già impostati di default):
   - moderazione → `gemini-2.5-flash-lite`
   - report → `gemini-2.5-flash`

## 4. Avvio in locale
```bash
cp .env.example .env        # poi compila i valori
npm install
npm run dev                 # http://localhost:3000
```

## 5. Deploy su Vercel
1. Carica la cartella su un repo GitHub.
2. Su Vercel → **New Project** → importa il repo (Vercel riconosce Next.js).
3. In **Settings → Environment Variables** aggiungi tutte le variabili di `.env.example`.
   Imposta `NEXT_PUBLIC_BASE_URL` con l'URL Vercel (es. `https://murmura.vercel.app`).
4. **Deploy**. Il link condivisibile di ogni muro sarà `TUO_DOMINIO/w/CODICE`.

---

## Come funziona
- **Organizzatore**: home → *Crea un muro* → ottiene **codice**, **chiave privata** e **link**.
  Pannello: `/w/CODICE/admin?key=CHIAVE` (report, moderazione, stats, pubblicità).
- **Ospite**: apre il link `/w/CODICE` → scrive in anonimo (pseudonimo casuale).
- **Moderazione**: ogni messaggio passa da Gemini *prima* di essere pubblicato.
  Se l'AI è irraggiungibile (rate limit), `MODERATION_FAIL_MODE`:
  `open` = pubblica e segnala nel pannello · `closed` = blocca.
- **Sezioni + report**: l'organizzatore preme *Aggiorna report AI*; Gemini raggruppa
  i messaggi in sezioni a tema (visibili anche sul muro) e genera il report privato.

## Sicurezza
- Tutte le scritture passano dalle API server (chiave `service_role`); le tabelle hanno
  **RLS attiva senza policy** → nessun accesso anonimo diretto al DB.
- L'accesso al pannello richiede la **chiave organizzatore**. *Per la produzione vera
  conviene passare a un login proprio (Supabase Auth) invece della chiave in URL.*
- Gli IP vengono salvati **anonimizzati** (hash) per gestione abusi/obblighi di legge.

---

## ⚠️ Da sistemare PRIMA del lancio reale (importante)
1. **Gemini in UE**: sul free tier Google può usare i messaggi per addestrare i modelli,
   e i termini Google richiedono il **piano a pagamento** per utenti in UE/Italia.
   Per il lancio vero attiva il billing Gemini (Flash-Lite costa pochissimo). Re-verifica
   sempre la pagina pricing ufficiale: i modelli e i limiti cambiano spesso.
2. **Rate limit free tier** (~10–15 richieste/min): un evento affollato li supera.
   Già gestito con retry + fail-safe, ma per serate vere serve il piano a pagamento.
3. **Privacy/GDPR**: serve informativa privacy, base giuridica, gestione dati e una
   policy di cancellazione. Anonimo tra utenti ≠ anonimo verso di te (conservi gli IP hashati).
4. **Minori**: se l'evento coinvolge minorenni servono tutele extra (moderazione più severa,
   termini d'uso, eventuale verifica età). Valuta con un legale.
5. **Moderazione**: aggiungi una segnalazione manuale ("Segnala") e la possibilità per
   l'organizzatore di rimuovere singoli messaggi.

## Costi indicativi (start)
- Supabase free, Vercel free, dominio ~€10/anno.
- Gemini: free per testare; in produzione Flash-Lite ~$0.10–$0.40 per 1M token (pochi €/serata).

## Passare a Gemini diverso o ad altra AI
Tutta la logica AI è isolata in `lib/gemini.js`. Per cambiare modello basta la variabile
`GEMINI_MODERATION_MODEL` / `GEMINI_ANALYSIS_MODEL`. Per cambiare provider, modifica solo
le funzioni `moderate()` e `analyze()`.
