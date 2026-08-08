# Booking Worker — deploy checklist

This directory holds a Cloudflare Worker that connects the booking wizard to
Alejandro's real Google Calendar. **Nothing here has been deployed.** As of
this writing, no GCP project, service account, Cloudflare Worker, or secret
has been created in any real account. The code was written and syntax-checked
locally only (`node --check src/worker.js`) — it has never been executed
against a live Cloudflare or Google environment. Everything below is a
checklist to run later, by hand, when you're ready to go live.

The site works fine without any of this: `src/config.js` ships with
`USE_MOCK = true`, so the booking wizard uses a deterministic in-browser mock
until you flip the switch in Step 8.

## What you need

- A Google account that owns (or has admin rights on) Alejandro's Google
  Calendar.
- A Cloudflare account with Workers enabled.
- The `wrangler` CLI (`npm install -g wrangler`, or `npx wrangler`).

## Steps

1. **Create a GCP project.**
   Go to https://console.cloud.google.com/projectcreate, create a new
   project (e.g. `alejandro-barber-pro`), and select it.

2. **Enable the Google Calendar API.**
   In the new project, go to "APIs & Services" → "Library", search for
   "Google Calendar API", and click **Enable**.

3. **Create a service account.**
   Go to "APIs & Services" → "Credentials" → "Create Credentials" →
   "Service account". Give it a name (e.g. `abp-booking-bot`), skip the
   optional role grants, and click **Done**.

4. **Download the service account's JSON key.**
   Open the service account you just created → "Keys" tab → "Add Key" →
   "Create new key" → type **JSON** → **Create**. A `.json` file downloads.
   Keep it private — never commit it to this repo. From that file you'll
   need two values in later steps: `client_email` and `private_key`.

5. **Share Alejandro's calendar with the service account.**
   In Google Calendar (as Alejandro or an admin on his calendar), go to
   calendar Settings → "Share with specific people or groups" → **Add
   people** → paste the service account's `client_email` (it looks like
   `abp-booking-bot@alejandro-barber-pro.iam.gserviceaccount.com`) → set
   permission to **"Make changes to events"** → **Send**.

6. **Copy the calendar ID.**
   Still in calendar Settings, under "Integrate calendar", copy the
   **Calendar ID** (Alejandro's primary calendar ID looks like his Gmail
   address; a secondary calendar looks like a long string ending in
   `@group.calendar.google.com`).

7. **Set the four Worker secrets.**
   From `worker/`, run each of these and paste the corresponding value when
   prompted (wrangler will not echo it back):

   ```bash
   wrangler secret put GOOGLE_CLIENT_EMAIL
   wrangler secret put GOOGLE_PRIVATE_KEY
   wrangler secret put CALENDAR_ID
   wrangler secret put ALLOWED_ORIGIN
   ```

   - `GOOGLE_CLIENT_EMAIL` — the `client_email` from the JSON key (Step 4).
   - `GOOGLE_PRIVATE_KEY` — the `private_key` from the JSON key (Step 4),
     including the `-----BEGIN PRIVATE KEY-----` / `-----END PRIVATE KEY-----`
     lines. The recommended way to extract it is
     `jq -r '.private_key' key.json`, which prints the key with real
     newlines, ready to paste. If you instead copy the value straight out of
     the raw JSON text (where newlines appear as the two characters `\n`),
     that also works — the Worker normalizes both real and literal `\n`
     newlines before decoding the key.
   - `CALENDAR_ID` — the calendar ID from Step 6.
   - `ALLOWED_ORIGIN` — the exact origin the site is served from (e.g.
     `https://alejandrobarberpro.com`, no trailing slash). This is the only
     origin the Worker's CORS headers will allow.

8. **Deploy the Worker.**
   From `worker/`:

   ```bash
   wrangler deploy
   ```

   Wrangler prints the deployed URL (something like
   `https://abp-booking.<your-subdomain>.workers.dev`). Copy it.

9. **Point the site at the deployed Worker.**
   In `src/config.js`, set:

   ```js
   export const API_BASE = 'https://abp-booking.<your-subdomain>.workers.dev';
   export const USE_MOCK = false;
   ```

   Deploy/publish the site as usual so the updated config goes live.

10. **Verify one real booking end to end.**
    Load the live site, run through the booking wizard for a real (or
    disposable) date/time, and confirm:
    - The event appears on Alejandro's Google Calendar.
    - The client-facing confirmation shows a real `eventId`/start/end (not
      a `mock-...` id).
    - The calendar invite email actually arrives for the client email you
      used.
    - Booking the same slot a second time returns "slot taken" instead of
      double-booking.

11. **Delete the test event.**
    Remove the test booking from Alejandro's calendar so it doesn't show up
    as a real appointment, and so it doesn't count as a busy block that
    blocks real availability.

## Notes

- All four secrets are read only via `env.*` in `worker/src/worker.js` —
  none are hardcoded anywhere in this repo.
- The Worker imports `availableSlots` from `../../src/slots.js` and
  `validateBooking` from `../../src/booking-api.js` rather than
  reimplementing either, so the mock (browser) and live (Worker) paths for
  computing available slots and validating a booking can never drift apart.
- If you ever need to rotate the service-account key, repeat Steps 3–4 for a
  new key, re-run `wrangler secret put GOOGLE_CLIENT_EMAIL` and
  `GOOGLE_PRIVATE_KEY` with the new values, then revoke the old key in GCP.
