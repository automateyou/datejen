# A Virtual Typing Date with Jen — FREE setup (Google Gemini)

A Hinge-style chat where matches talk to an AI version of Jen for 10 minutes.
Jen responds naturally (typed out one letter at a time), works in Jen's real
questions, captures the match's name/email/phone, and gives Jen a private read
at the end. There's a hidden admin panel to review every conversation.

This version runs on Google Gemini's FREE tier — no credit card required.

## Why this needs hosting
The page CANNOT call the AI directly from a browser (it would expose a secret
key and browsers block it). So there's a tiny backend (`/api/chat`,
`/api/debrief`) that holds your key and talks to Gemini. Deploying puts both on
one URL.

## Step 1 — Get a FREE Gemini API key (no card)
1. Go to aistudio.google.com and sign in with a Google account.
2. Click "Get API key" (left sidebar) -> "Create API key".
3. Copy the key and save it somewhere safe.
   - The free tier needs no credit card. It's rate-limited (roughly 10-15
     requests/minute, a few hundred to ~1,000 chats/day) which is plenty for
     one-at-a-time dating chats. Heavy simultaneous traffic may briefly wait.

## Step 2 — Deploy to Vercel (free, ~5 minutes)
1. Make a free account at vercel.com and install the CLI: `npm i -g vercel`
2. In this folder, run: `vercel`  (accept the defaults; it gives you a URL).
3. Add your key so the backend works: `vercel env add GEMINI_API_KEY`
   - Paste your key, choose all environments.
4. Redeploy so the key takes effect: `vercel --prod`
5. Open the URL. Jen now responds live and types one letter at a time.

(You can also do it all on the website: drag this folder into vercel.com, then
add GEMINI_API_KEY under Settings -> Environment Variables, then redeploy.)

## Admin panel
Open your live URL and press **Ctrl + Shift + J**, or add **?admin** to the URL.
Note: conversations are stored in the browser they happened in. For a true
central inbox + instant notifications across devices, the next step is a small
database — ask and I'll wire it in.

## Switching to Claude later (optional)
If you ever want Jen back on Claude instead of Gemini, the model call lives in
`api/chat.js` and `api/debrief.js` — easy to swap.

## Files
- `public/index.html`  the chat page (front-end)
- `api/chat.js`        the endpoint that plays Jen (holds the personality)
- `api/debrief.js`     the end-of-date private read
- `vercel.json`        routing config

## Email notifications (FREE) — every conversation to your inbox
Each finished chat (transcript + alignment score + match's name/email/phone)
gets emailed to you, for both Jen and Leah.

1. Open `notify-email-AppsScript.gs` (in this folder) and follow the steps at
   the top — it's a free Google Apps Script that does the emailing.
2. It currently sends to: longevityoffices@gmail.com  (change SEND_TO to edit).
3. After deploying the script, copy its Web App URL and add it to Vercel:
   Settings -> Environment Variables -> NOTIFY_WEBHOOK = <that URL> -> redeploy.

If NOTIFY_WEBHOOK isn't set, the site still works fine — it just won't email.
