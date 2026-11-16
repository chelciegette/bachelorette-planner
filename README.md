# Bachelorette Planner ✦

A small, pretty site for collecting your bridesmaids' availability and picking the best weekend.

- **Bridesmaids** enter their name and tap the weekends they **can't** make. They get a personal link/code to change their answer later — no account.
- **You** get an organizer dashboard: who replied, a ranked list of weekends, a colour-coded heatmap, and a "who can / can't come" view for every weekend.

Built with React, Vite and Tailwind CSS. It starts in **demo mode** (answers saved in your browser's `localStorage`, nothing to set up). When you're ready to share it, [connect Supabase](#go-live-supabase) and the same site becomes the real thing — shared, editable from any device, with a locked-down organizer dashboard.

> **Until Supabase is connected, the data is private to each browser.** Your bridesmaids' phones can't write into *your* dashboard in demo mode, so don't send them the link yet.

---

## Run it locally

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
cd bachelorette-planner
npm install
npm run dev
```

Open the address Vite prints (usually <http://localhost:5173>; it picks the next free port if that one is taken).

| Command           | What it does                                                          |
| ----------------- | --------------------------------------------------------------------- |
| `npm run dev`     | Local dev server with hot reload                                      |
| `npm run build`   | Production build into `dist/`                                         |
| `npm run preview` | Serve the production build locally                                    |
| `npm test`        | Unit tests — calculations, calendar, data layers, **and the database rules** (the SQL is run in an in-process Postgres) |
| `npm run lint`    | ESLint                                                                |

## Try the whole thing (2 minutes, demo mode)

The app starts with **8 sample bridesmaids**, so the dashboard is full right away.

1. **Bridesmaid view** (`/#/`) — type a name, tap a few weekends (tap again to undo), watch the summary, press **Submit My Dates**.
2. On the confirmation, copy your **edit link** or **code**.
3. Open that link (or use **Already responded? Update your dates** on the home page), change some weekends, press **Update My Dates**. Your answer is *replaced* — there's still only one "you".
4. **Organizer view** (`/#/organizer`) — click **Enter the demo dashboard**. The top summary, heatmap and ranking already include your answer. Tap any weekend to see exactly who can and can't come (← / → step through weekends, Esc closes).
5. Back to the original data any time with **Reset demo data** in the yellow bar at the top. **Start empty** clears everything so you can see the first-reply experience.

Edit codes for the sample bridesmaids, if you want to try editing one of them (open `/#/edit/<code>`, or use the organizer's **Open edit page** buttons):

| Maya | Priya | Jess | Olivia | Hannah | Camille | Sofia | Brooke |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `ROSE-MAYA2` | `PEONY-PRIYA` | `LILAC-JESS2` | `PEARL-OLIVIA` | `DAISY-HANNAH` | `DOVE-CAMILLE` | `SILK-SOFIA` | `LACE-BROOKE` |

Codes ignore capitals, spaces and hyphens (`rose maya2` works).

## Change the dates or what counts as a weekend

Everything lives in one file: [`src/config/trip.js`](src/config/trip.js).

```js
dateRange: { start: '2027-01-01', end: '2027-09-30' },
weekend:   { startDay: 5, lengthDays: 3 },   // Fri → Sun
```

- Want Thursday → Sunday? `{ startDay: 4, lengthDays: 4 }`.
- Set `brideName: 'Sam'` to show "Sam's Bachelorette" above the heading.
- The calendars, counts, rankings and sample data all follow automatically. Click **Reset demo data** afterwards so the samples are rebuilt for the new dates. (Saved answers are matched by weekend start date, so changing the weekend definition after real replies exist would orphan them — decide that before sending the link.)

---

## Go live (Supabase)

Takes about 10 minutes. The site switches from demo to live **purely by whether two settings exist** — no code changes.

### 1. Create a Supabase project

At <https://supabase.com> create a **new** project for this (the free tier is plenty). Keep it separate from any other project — e.g. your wedding address collector — so guest addresses and availability never share a database.

### 2. Create the tables and access rules

Dashboard → **SQL Editor** → paste the whole of [`supabase/migrations/20261116000000_bachelorette_planner.sql`](supabase/migrations/20261116000000_bachelorette_planner.sql) → **Run**. (With the Supabase CLI linked to the project, `supabase db push` does the same.)

### 3. Create your organizer login

1. **Authentication → Users → Add user → Create new user.** Use your email and a strong password, and tick **Auto Confirm User** if offered.
2. In the **Authentication** settings, turn **off** "Allow new users to sign up" (look under *Sign In / Providers*), so nobody else can create accounts. Supabase moves things around occasionally — search the Authentication pages for that label.
3. Make that account an organizer — in the **SQL Editor**, with your real email:

   ```sql
   insert into public.organizers (user_id)
   select id from auth.users where email = 'you@example.com';
   ```

Being signed in isn't enough on its own: only accounts listed in `public.organizers` can read responses, and that rule is enforced by the database.

### 4. Point the site at it

Copy [`.env.example`](.env.example) to `.env.local` and fill in the project URL and the **publishable** key (both are shown by the **Connect** button at the top of your project; the key is also under **Settings → API Keys**). Restart `npm run dev`. The yellow demo bar disappears — you're live.

> Never put a `service_role` / secret key in these variables. Everything prefixed `VITE_` is shipped to every visitor's browser. The publishable key is designed to be public; the database rules are what protect your data.

### 5. Quick check (2 minutes)

- Submit a response in a **private window**, then open its edit link in a **different browser** — it should load and be editable.
- Open `/#/organizer` and sign in. The response appears. (Deleting is available on each card.)
- Sign in with any account that isn't in `organizers` — you should be told it isn't set up as an organizer.
- Confirm strangers can't read the table (replace the two values):

  ```bash
  curl "https://YOUR-PROJECT.supabase.co/rest/v1/responses?select=*" -H "apikey: YOUR_PUBLISHABLE_KEY"
  ```

  You should get a *permission denied* error, **not** a list of names.

### 6. Host it

The build is host-agnostic (relative asset paths, hash routing). For **GitHub Pages**: push this folder as its own repo, set *Settings → Pages → Source* to **GitHub Actions**, add the two values as repository **variables** (*Settings → Secrets and variables → Actions → Variables*: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`), and the included [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds and publishes on every push to `main`. Netlify, Vercel, Cloudflare Pages or any static host also work: set the same two variables, run `npm run build`, serve `dist/`.

The page carries `noindex` so search engines skip it, but the link itself isn't secret — see below.

### What the database enforces (and what it doesn't)

- **Visitors can't touch the table.** Anonymous requests can only call two functions, `save_response` and `get_my_response`. Neither returns anyone else's data. Verified by the tests, which run the real SQL as an anonymous user, a signed-in stranger, and the organizer.
- **Edit codes are generated by the database** (random, ~48 bits) and are the only way back into a response. Anyone *with* a code can edit that one response; the organizer can see codes (to resend a link).
- **Replacing, not duplicating.** An edit updates the same row; names are unique (case-insensitive).
- **Organizer access is checked in the database,** not the page. Hiding the organizer link doesn't matter; signing in without being listed returns nothing.
- **Known limits.** Anyone with the bridesmaid link can submit (capped at 100 responses so a leaked link can't flood the table), there's no CAPTCHA, and trying a name tells you whether it's taken. Fine for a bridal party; if you ever need more, Cloudflare Turnstile (as on your address collector) is the next step.

---

## How it's organised

```
src/
  config/trip.js            ← the one place to edit dates / weekend rules
  lib/                      ← pure logic: weekends, calendar grids, availability maths, heat colours; supabase.js
  data/                     ← ALL storage goes through here (one contract, two implementations)
    repository.js             the contract
    localStorageRepository.js demo mode
    supabaseRepository.js     live mode
    seed.js                   realistic sample bridesmaids (demo)
    index.js                  picks one based on the env vars
  auth/                     ← organizer sign-in boundary: demo adapter + real Supabase sign-in
  pages/                    ← PlanPage (bridesmaids), OrganizerPage
  components/
    calendar/                 shared month grid used by both the picker and the heatmap
    plan/                     bridesmaid experience
    organizer/                dashboard pieces
supabase/migrations/        ← the database: tables, access rules, public functions
```

Routing uses the URL hash (`/#/organizer`), so it works on static hosts with no server rules.

## Accessibility & motion

Weekends are real buttons (keyboard + screen-reader friendly, with full-date labels), colours are never the only signal (counts, ✕ marks and sparkles carry meaning too), and animations switch off for people who prefer reduced motion.
