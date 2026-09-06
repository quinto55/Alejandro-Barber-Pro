# Turning on the phone number at booking

**For Alejandro.** Spanish version: `cal-booking-questions.es.md` — that
is the one to actually send him. Takes about five minutes. You need to do it six times —
once per service — because Cal.com stores the booking form separately for
each one.

## Why

Right now the booking form only asks for a name and an email address. If
someone needs to move or cancel a same-day appointment, or you're running
behind and need to tell them, you have no number to call. After this change
every booking arrives with a phone number attached.

## Do this, once per service

1. Go to **cal.com** and sign in.
2. Open **Event Types** and click the first service in the list below.
3. Click the **Advanced** tab (along the top of the event, next to Setup,
   Availability, Limits).
4. Scroll down to the section headed **Booking questions**. You'll see a list
   of the fields the client fills in — Your name, Email Address, Phone Number,
   Additional notes, and so on.
5. Find the **Phone Number** row. Two things to change on it:
   - Turn on the **toggle on the right** of that row, so the field is shown
     rather than hidden.
   - Click **Edit** on that row, set **Required** to **Yes**, and save the
     row.
6. Click **Save** at the top right of the event type.

Then go back to Event Types and repeat for the next one.

## The six services

Tick these off as you go — the whole point is that none gets missed:

- [ ] Haircut
- [ ] Haircut-Beard
- [ ] Kids haircut, ages 6–12
- [ ] Platinum highlights
- [ ] Platinum Colour and hydration
- [ ] Sunday & after-hours VIP

## One thing NOT to touch

At the top of the **Booking questions** panel there is a **Confirmation**
setting with an **Email / Phone** toggle. Leave it on **Email**.

That toggle does something different from what we want: it *replaces* email
with phone as the one field you collect. We want both — the email is what
sends your client their confirmation and their reminder. If you flip it, those
stop going out. Change only the **Phone Number** row in the list below it.

## Checking it worked

Tell Anthony when you've done all six and he'll verify it from his side
(`node scripts/check-cal-fields.mjs` reads all six live booking pages and
reports which ones are correct). You can also just open
https://alejandrobarberpro.com, pick a service, and look at the form — the
phone box should be there with a red asterisk on it.
