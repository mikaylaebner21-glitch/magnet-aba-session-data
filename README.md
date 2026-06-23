# Magnet ABA — session data collection

A CentralReach-styled session data app for RBTs: discrete trial (NET) targets with
correct/incorrect + prompt level buttons, continuous duration tracking with a
start/stop timer, frequency tallies, whole/partial interval recording, ABC data
collection, and a session note — all wrapped up and emailed to the tech on submit.

## Run locally

```
npm install
npm run dev
```

## Connect the submit button to an email (Make.com)

The app posts a single JSON payload to a webhook URL when the RBT taps
**Submit & email session**. To wire that up:

1. In Make, create a new scenario starting with the **Webhooks** app, module
   **Custom webhook**. Click "Add" to generate a webhook, then copy the URL it
   gives you.
2. Add a module after it (Gmail / Outlook / whatever you use for the Jotform
   flows) with action **Send an email**.
   - To: map to `techEmail` from the webhook payload
   - Subject: something like `Session data — {{clientName}}`
   - Body: pull in whatever fields you want from the payload (trials,
     frequencyBehaviors, durationBehaviors, intervalSessions, abcEntries,
     sessionNote) — these all arrive as structured JSON so Make can map them
     directly into a formatted email, similar to how you've mapped Jotform
     fields before.
3. Paste the webhook URL into a `.env` file in this project:

   ```
   VITE_MAKE_WEBHOOK_URL=https://hook.make.com/your-webhook-id-here
   ```

4. Redeploy (or restart `npm run dev`) so the new env var is picked up.

The payload shape sent to the webhook:

```json
{
  "techEmail": "string",
  "clientName": "string | null",
  "sessionDurationSeconds": 0,
  "submittedAt": "ISO timestamp",
  "trials": [{ "target": "string", "phase": "string", "data": [{ "trial": 1, "result": "correct|incorrect", "prompt": "full|partial|null" }] }],
  "frequencyBehaviors": [{ "name": "string", "phase": "string", "count": 0 }],
  "durationBehaviors": [{ "name": "string", "entries": [12.4, 30.1] }],
  "intervalSessions": [{ "behavior": "string", "method": "whole|partial", "occurred": 0, "total": 10 }],
  "abcEntries": [{ "time": "string", "antecedent": "string", "behavior": "string", "consequence": "string", "who": "string", "location": "string" }],
  "sessionNote": "string"
}
```

## Deploy to Vercel

1. Push this folder to a new GitHub repo (same pattern as your booking app).
2. In Vercel, "Add New Project" → import that repo. Vercel auto-detects Vite,
   no config needed.
3. In the Vercel project settings → Environment Variables, add
   `VITE_MAKE_WEBHOOK_URL` with your Make webhook URL (same value as your
   local `.env`). Redeploy after adding it.
4. Share the resulting `*.vercel.app` URL with your RBTs.

## Notes / things you may want to adjust

- Targets, frequency behaviors, and duration behaviors are seeded with
  placeholder examples on load. RBTs can add/remove their own per session —
  there's no persistence between sessions yet (each page load starts fresh).
  If you want targets to persist across sessions per client, that would need
  a small backend (Supabase, same as your booking app) rather than this
  static front-end-only setup.
- The "Bx" field in ABC collection is free text by design, not a fixed list.
- No client identification/lookup is wired in yet, per your last instruction
  — it's just a free-text name field.
