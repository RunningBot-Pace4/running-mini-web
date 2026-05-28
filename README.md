# Running Responsive Mini Web

Mobile-first MVP for a running event web app with registration, admin-created events, RSVP voting, Strava activity sync, event-scoped submission, scoring, leaderboard, and mobile sharing.

## Stack

- Next.js App Router
- PostgreSQL
- Prisma ORM
- Built-in cookie sessions stored in database
- Strava OAuth2
- Mobile Web Share API with copy-link fallback

## Setup

```bash
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run seed
npm run dev
```

Open `http://localhost:3000`.

## Admin login

Use the `ADMIN_EMAIL` and `ADMIN_PASSWORD` values from `.env` after running:

```bash
npm run seed
```

## Strava setup

1. Create an application in Strava developer settings.
2. Set callback domain to your app domain.
3. Set `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, and `STRAVA_REDIRECT_URI`.
4. Users connect Strava from an event page.
5. The app syncs running activities within the event start/end date window.

## Scoring

- User must RSVP `ATTEND` for an event before submitting.
- Attendance: `1 point`.
- Running distance: `2 points per completed 1km`.
- Formula: `1 + floor(distance_km) * 2`.

Example: 5.9km = `1 + 5*2 = 11 points`.

## Production notes

- Store Strava tokens encrypted at rest before production launch.
- Add CAPTCHA or rate limiting on registration/login.
- Use HTTPS for Web Share API and OAuth redirect.
- Use Strava webhooks later for automatic syncing; this MVP uses manual sync.


## Admin event management

After login as admin, open:

```text
/admin
```

Use **Manage** beside an event to:

- view who voted ATTEND or NOT_ATTEND
- see submitted runs
- close, reopen, draft, or archive the event

When an event is set to `CLOSED`, users cannot vote or submit new runs for that event.
