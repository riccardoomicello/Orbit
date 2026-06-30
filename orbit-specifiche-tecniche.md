# Orbit — Portale Personale di Riccardo

Documento di specifiche per lo sviluppo. Progetto **personale**, separato da qualsiasi infrastruttura Evolvia (account Supabase, GitHub e Vercel dedicati e nuovi).

## Visione generale

Orbit è un hub personale per gestire appuntamenti, routine, finanza personale e tutto ciò che riguarda la vita quotidiana di Riccardo. Deve essere sempre a portata di mano, anche da smartphone, con notifiche push.

## Stack tecnico

- **Frontend**: React + Vite
- **Backend / Database / Auth**: Supabase (Postgres + autenticazione integrata)
- **Hosting**: Vercel
- **Tipo applicazione**: PWA (Progressive Web App) — installabile su smartphone, con service worker e supporto a notifiche push (tenere conto delle limitazioni di iOS su push notification per PWA)
- **Accesso**: online, protetto da login personale (singolo utente: Riccardo)
- **Tema**: switch light/dark

## Nome progetto

**Orbit** — da usare come nome app, titolo PWA, e branding generale.

## Architettura generale

Dashboard centrale + 4 moduli indipendenti ma interconnessi dove rilevante.

### Dashboard (home)
- Riepilogo prossimi appuntamenti
- Routine di oggi da completare (con stato mattina/pomeriggio/sera)
- Saldo/budget del mese corrente
- Note/obiettivi in evidenza

---

## Modulo 1 — Appuntamenti

**Viste**: mensile, settimanale, lista/agenda (tutte e tre disponibili, navigabili).

**Eventi**:
- Titolo, descrizione, data/ora
- Categoria con colore dedicato: Salute, Scadenze/Burocrazia, Hobby/Tempo libero, Viaggi, Lavoro (Evolvia — solo visualizzazione, non gestione operativa aziendale)
- Location: campo indirizzo + campo link (es. Meet/Zoom)
- Sotto-checklist opzionale per eventi complessi (es. "Partenza Mykonos" → passaporto, valigia, check-in)
- Possibilità di marcare eventi come ricorrenti

**Notifiche**: push browser/PWA per promemoria eventi.

**Collegamento con Routine**: gli eventi ricorrenti (es. palestra ogni lunedì) devono essere visibili sia nel calendario Appuntamenti sia nel modulo Routine — stessa fonte dati, doppia vista.

---

## Modulo 2 — Routine

**Struttura**: routine organizzate per fascia oraria (mattina / pomeriggio / sera).

**Frequenza**: giornaliere.

**Stati per ogni routine/giorno** (3 stati, non solo sì/no):
1. **Fatto** ✅
2. **Non fatto** ❌ (rompe lo streak)
3. **Riposo programmato** 💤 (es. giorno di riposo pianificato — non conta come fallimento, non rompe lo streak)

**Tracking**: streak (giorni consecutivi) + visualizzazione tipo "contribution graph" (stile GitHub) per vedere lo storico a colpo d'occhio.

---

## Modulo 3 — Finanza Personale

**Conti multipli**: contanti, banca, crypto — gestiti separatamente con saldo totale aggregato in dashboard.

**Transazioni**: entrate/uscite con categorie personalizzabili.

**Budget**: budget mensile impostabile per categoria, con alert visivo quando ci si avvicina/supera il limite.

**Spese ricorrenti/abbonamenti**: tracker dedicato (Netflix, palestra, ecc.) con avviso prima della data di rinnovo.

**Inserimento spese**: oltre al form classico, un widget di inserimento rapido ("+spesa") sempre accessibile (es. fisso in dashboard o floating button).

**Fuori scope MVP** (da considerare per fase 2):
- Tracking valore di mercato live degli asset crypto (richiederebbe integrazione API tipo CoinGecko)
- Export CSV/Excel per commercialista (gestito già con file separato, non necessario qui)

---

## Modulo 4 — Extra / Vita

- **Note veloci**: blocco appunti libero, sempre accessibile
- **Obiettivi/Goal tracker**: obiettivi a medio termine con progress bar (es. "perdere X kg entro agosto", "finire questbook Meatball Craft")
- **Liste/checklist riutilizzabili**: template di liste salvabili e riusabili (valigia viaggio, spesa settimanale, ecc.)
- **Bacheca idee/wishlist**: cose da comprare, libri da leggere, posti da visitare

Esplicitamente escluso: nessun diario/journaling giornaliero.

---

## Ordine di sviluppo suggerito

1. Setup infrastruttura: progetto Supabase + repo GitHub + deploy Vercel iniziale
2. Auth (login personale) + shell applicazione (navigazione, layout, dashboard vuota)
3. Setup PWA: manifest, service worker, notifiche push
4. Moduli applicativi, uno alla volta (nessuna priorità tra loro, costruibili in qualsiasi ordine):
   - Appuntamenti
   - Routine
   - Finanza Personale
   - Extra/Vita
5. Collegamenti incrociati tra moduli (es. eventi ricorrenti ↔ routine) una volta che i moduli base sono stabili
6. Rifinitura dashboard con dati aggregati da tutti i moduli

## Note per Claude Code

- Account Supabase, GitHub e Vercel sono **personali** di Riccardo, separati da quelli usati per Evolvia — nessuna condivisione di credenziali o progetti.
- Mantenere il database ben normalizzato fin dall'inizio per supportare i collegamenti incrociati futuri (es. eventi ↔ routine).
- Prestare attenzione alle differenze di comportamento delle notifiche push tra iOS e Android in contesto PWA.
