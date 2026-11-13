# TradeMe

> **New to the project?** Start with [SETUP.md](SETUP.md). Agents: read [AGENTS.md](AGENTS.md).

Progressive Web App for the TradeMe school project. The design lives in Figma, page **Screens V4**.

| Part | Where | Tech |
|---|---|---|
| App (PWA) | `app/` | Vite + React + TypeScript, `vite-plugin-pwa`, Lucide icons |
| Backend | `supabase/` | Supabase (Postgres, Auth, Realtime, Storage, pg_cron) |
| Server routes | `app/api/` | Vercel Functions (Stripe test mode) |
| Hosting | Vercel | every PR gets its own preview link |

Everything runs on free tiers.

---

## One-time setup (one person does this, then invites the others)

### 1. GitHub
Push this repo to GitHub and add the other two as collaborators.

### 2. Supabase
1. Create a project at [supabase.com](https://supabase.com) (region: Zürich or Frankfurt).
2. **Organization → Team**: invite the other two.
3. Apply the database schema with the Supabase CLI (see "Database changes" below): `npx supabase db push --remote`.
   If `pg_cron` fails, enable it under **Database → Extensions** first.
4. **Authentication → Sign In / Providers → Email**: switch **off** "Confirm email". The free tier only sends a few emails per hour, so confirmation emails get in the way while testing.
5. **Project Settings → API**: you'll need the URL, the `anon` key and the `service_role` key.

> The free tier pauses a project after about 1 week without activity. Restoring it is one click in the dashboard, so check before the presentation.

### 3. Vercel
1. [vercel.com](https://vercel.com) → **Add New → Project** → import the GitHub repo.
2. **Root Directory: `app`**. The framework (Vite) is detected automatically.
3. **Settings → Environment Variables**: set the two values from `app/.env` plus the secret ones from `app/.env.example`.
   *Optional:* instead connect Supabase through the **Vercel Marketplace**, which fills in the Supabase keys automatically.
4. **Settings → Deployment Protection**: switch off "Vercel Authentication". Otherwise only the owner can open preview links, because the free Hobby plan has no team members. The other two don't need a Vercel account: every push to GitHub deploys automatically.

### 4. Stripe (optional, for checkout B/05)
1. Create an account at [stripe.com](https://stripe.com) and stay in **test mode**. No real money moves.
2. Copy `sk_test_…` / `pk_test_…` into the Vercel env vars.
3. **Developers → Webhooks** → endpoint `https://<app>.vercel.app/api/stripe-webhook`, events `payment_intent.succeeded` and `payment_intent.payment_failed` → copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
4. Test card: `4242 4242 4242 4242`, any future date, any CVC. TWINT only works if the Stripe account is registered in Switzerland. Otherwise use card only.

---

## Daily work (everyone)

```bash
cd app
npm install                  # Supabase URL + anon key are already in app/.env
npm run dev
```

- **On your laptop:** http://localhost:5173
- **On your phone, quick test:** same Wi-Fi, open the `Network:` URL that `npm run dev` prints.
- **On your phone as an app:** open a Vercel link (production or PR preview) → Safari: Share → **Add to Home Screen** / Chrome: ⋮ → **Install app**. Installing requires HTTPS, so it only works with the Vercel links.

`/dev` in the app lists all routes with their owner and Figma frames.

### Workflow
1. Branch per feature: `git switch -c b/trade-erstellen`
2. Build the screen in `app/src/screens/…` and register it in `app/src/routes.tsx` under `built`.
3. Open a pull request → Vercel posts a preview link → test it on your phone → merge.

### Who builds what (same split as in Figma)
| Owner | Area | Routes |
|---|---|---|
| **A** | Profile & ratings | `/profil`, `/profil/:userId`, `/profil/bearbeiten`, `/trades/:id/bewerten` |
| **B** | Clients (Auftraggebende) | `/trades`, `/erstellen`, `/trades/:id`, `/trades/:id/checkout` |
| **C** | Helpers (Helfende) | `/entdecken`, `/auftraege/:id`, `/chat`, `/chat/:tradeId/:helperId` |

The full mapping of every V4 frame is in `app/src/screens/registry.ts`.

---

## Rules

- **Design tokens:** use only the variables in `app/src/styles/tokens.css` (names = Figma variables), no hex values or pixel numbers in components. If something is missing, take it from Figma and add it there.
- **Text styles:** `text-h1`, `text-h3`, `text-body`, `text-body-strong`, `text-label`, `text-caption`, `text-numeric`.
- **Changing status only through functions:** never `update trades set status = …` from the app. Use:

| Action | Call | Screen |
|---|---|---|
| Accept an offer | `supabase.rpc('accept_offer', { p_offer_id, p_method: 'twint' \| 'karte' \| 'bar' })` | B/05 |
| Report "done" | `supabase.rpc('report_done', { p_trade_id })` | C/06 |
| Release | `supabase.rpc('release_trade', { p_trade_id })` | B/08 |
| Report a problem | `supabase.rpc('report_problem', { p_trade_id, p_reason, p_details })` | B/15 |
| Cancel | `supabase.rpc('cancel_trade', { p_trade_id })` → returns 0 or 20 (% fee) | – |

- Making an offer: `insert into offers`. Chat: `insert into messages` + subscribe via `supabase.channel(…).on('postgres_changes', …)`.
- Photos: Storage bucket `photos`, path `<user-id>/<filename>`.
- **Database changes:** add a new file in `supabase/migrations/<timestamp>_<name>.sql` (never edit old ones), then apply it:
  ```bash
  npx supabase login                                        # once, opens the browser
  npx supabase link --project-ref cidewfxqgwbdhfvlluql      # once per laptop
  npx supabase db push --remote --dry-run                   # shows what would run
  npx supabase db push --remote                             # applies it
  ```
  Don't run migrations by hand in the SQL editor, because then the CLI doesn't know they ran.

### Business rules (built into the database)
- Payment methods: TWINT, card (held until release) or cash (no payment protection)
- Free cancellation until 48 h before the appointment, afterwards 20 %
- After "done" is reported: reminder on day 7, automatic release on day 10 (hourly `pg_cron` job)
- Problems can be reported until day 30, and the payout is paused meanwhile
- Platform fee 4 %, paid by the helper (`payments.payout_chf`, e.g. CHF 120 → 115.20)

### Simplifications (school project)
- Stripe charges right away. The "hold until release" exists only in our database, and payouts to helpers are not real.
- «Geprüft» (verified) = `profiles.is_verified`, set by hand in the Supabase Table Editor.
- Notifications are in-app (`notifications` table, live via Realtime), not push.
