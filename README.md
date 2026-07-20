# 🥾 Our Walk Challenge

A tiny, private web app for a monthly walking/step challenge between two people (e.g. you and your wife). Hosted free on **GitHub Pages** — no server, no database.

- 📅 One challenge per month
- 🏆 Higher step count wins
- 🎁 Winner gets a **random ~20 CHF surprise** from Galaxus (you pick the categories)
- 🔔 In-app reminder banner on the **1st–5th** of each month to "check last month"
- 📱 Enter steps **manually** or **import from Apple Health**
- 💾 Data stays on your phone (localStorage); Export/Import keeps both phones in sync

---

## How it works (the honest bits)

GitHub Pages only serves static files, so two things are handled simply:

| Want | How it's done here |
|------|--------------------|
| Read iPhone Health steps | Not possible automatically from a website. Instead, **export** your steps from the Apple Health app (or just type the total) and upload the file — the app sums it for the month. |
| Remind on the 1st | An in-app banner appears on the 1st–5th saying "time to check last month". (No email server needed.) |
| Decide the winner | Whoever opens the app enters **both** people's step totals (text each other), and it computes the winner + prize instantly. |

Because data lives per-phone, use **Settings → Export / Import** to copy the data between your two phones (or just both type the numbers).

---

## Deploy to GitHub Pages (5 minutes)

1. **Create a repo** on GitHub (e.g. `walk-challenge`). Make it **Public** (GitHub Pages needs this on free plans).
2. **Upload** these 3 files to the repo root:
   - `index.html`
   - `styles.css`
   - `app.js`
3. In the repo go to **Settings → Pages → Build and deployment**:
   - Source: **Deploy from a branch**
   - Branch: `main` (or `master`), folder: `/ (root)`
   - Save.
4. Wait ~1 minute, then open `https://<your-user>.github.io/<repo>/`.

That's it — open it on both phones, add to home screen (Share → Add to Home Screen) for an app-like feel.

---

## Using the app

1. **Record steps** for a month:
   - Type both totals and tap *Save & check winner*, **or**
   - Tap *Choose export* and upload your Apple Health `export.xml` (Health → profile → Export All Health Data → unzip → `export.xml`). The app asks which person this phone is and fills it in.
2. The **winner** and a **random Galaxus prize** appear. Tap *Find on Galaxus* to shop, or *🎲 Re-roll prize* for a different one.
3. **On the 1st–5th**, a banner reminds you to check the previous month.
4. **Settings (⚙️):**
   - Rename the two participants
   - Set the prize budget (default 20 CHF)
   - Toggle prize categories and their weights (Tech is weighted higher by default — change to taste)
   - Export / Import / Reset data

---

## Files

- `index.html` — markup + modal
- `styles.css` — mobile-first styling
- `app.js` — all logic (steps, health import, prize picker, history, settings)

No build step, no dependencies, no tracking.
