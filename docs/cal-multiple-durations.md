# Letting the calendar make room for add-ons

**For Alejandro.** Spanish version: `cal-multiple-durations.es.md` — that
is the one to actually send him. About two minutes per service, and only
three services this time.

## Why

The website is getting an add-ons step: after choosing a haircut, a client
can add a design, eyebrows, a hair wash or a facial. Each one takes extra
time, and Cal.com has to be allowed to block that time.

Cal only lets an event offer lengths from its own fixed menu, so the site
rounds each appointment **up** to the next length on that menu — never
down, so you can never be double-booked. Once you've done the steps below,
a haircut with a design books 75 minutes, a haircut with a facial 75, a
haircut with everything 120. A plain haircut books 60 instead of 55.

Until you've done this, the website keeps the add-ons step hidden on
purpose: Cal would ignore the extra time and you'd have a facial squeezed
into a 55-minute slot.

## Do this, once per service

1. Go to **cal.com** and sign in.
2. Open **Event Types** and click the first service in the list below.
3. Stay on the **Setup** tab (the first one). Scroll down to **Duration**.
4. Turn on **Allow multiple durations**.
5. In **Available durations**, tick exactly the lengths listed for that
   service in the table below — no more, no fewer.
6. Set **Default duration** to the one in the table.
7. Tick **Hide duration selector in booking page**. This stops clients
   changing the length themselves; the website sets it for them.
8. Click **Save** at the top right.

Then go back to Event Types and repeat for the next one.

## The three services

| Service | Tick these durations | Default |
|---|---|---|
| Haircut | 60, 75, 80, 90, 120 mins | 60 mins |
| Haircut-Beard | 80, 90, 120, 150 mins | 80 mins |
| Kids haircut, ages 6–12 | 50, 60, 75, 80, 90, 120 mins | 50 mins |

Tick these off as you go:

- [ ] Haircut
- [ ] Haircut-Beard
- [ ] Kids haircut, ages 6–12

Two things you'll notice, both on purpose: Haircut's default goes from 55
to 60 minutes, and Kids goes from 55 to 50 (which is what your Booksy and
the website already say).

## Do NOT touch

- **Platinum highlights**, **Platinum Colour and hydration** and **Sunday &
  after-hours VIP** stay exactly as they are. No multiple durations on
  those.
- Nothing on the **Advanced** tab. The phone-number setting there is
  finally right.

## Checking it worked

Tell Anthony when you've done all three. `npm run check:cal` reads your
three live event types and says which ones match. When all three do, he
turns on the add-ons step on the website.
