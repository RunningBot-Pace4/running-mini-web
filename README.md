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


## Update in this package

This package fixes:

- Event date display now includes time.
- Date display format is `dd/mm/yyyy, HH:mm`.
- Event descriptions keep line breaks and display simple headings such as `Main`, `Warm up`, and `Drills`.
- Strava connect redirects back to the event and shows clearer error messages.
- Login remembers email on the same device. Passwords are not stored by the app; browser password managers handle password saving.
- Forgot password and reset password pages were added.

## Event date/time configuration

For Malaysia/Singapore time, keep these values:

```env
APP_TIME_ZONE="Asia/Kuala_Lumpur"
EVENT_TIME_ZONE_OFFSET="+08:00"
```

Vercel also needs these values in Project Settings → Environment Variables.

## Forgot password setup

The app includes:

```text
/forgot-password
/reset-password?token=...
```

For real email delivery, configure:

```env
RESEND_API_KEY="your_resend_api_key"
RESEND_FROM="Run Mini <noreply@yourdomain.com>"
```

For testing only, you can set:

```env
SHOW_RESET_LINK="true"
```

This shows the reset link on screen after requesting reset. Do not use this for public production unless you understand the risk.

## Vercel deployment command

Use:

```bash
npx prisma db push && npm run seed && npm run build
```

Because this update adds a `PasswordResetToken` table, Vercel must run `prisma db push` again.


## Admin Event Editing

Admins can edit existing event details from:

```text
/admin → Manage
```

The manage page now supports updating:

- title
- multi-line description
- start date/time
- end date/time
- status

No database migration is required for this admin editing update.


## Latest UI update

This version refreshes the public mini web with a running-themed design:

- Hero banner with running challenge messaging
- Event board with richer cards
- Better workout preview formatting
- Event descriptions keep line breaks and now show more lines on home
- Dynamic rendering is forced for home, public event and admin pages so edited event descriptions show after redeploy
- Admin can still edit event title, description, date/time and status from `/admin -> Manage`

If an edited description still does not show online, check that you have pushed the latest files to GitHub and redeployed Vercel.


## Admin description editor

The admin create/edit event forms now include simple formatting tools for the event description:

- Bold inserts `**text**`
- Underline inserts `__text__`
- Color buttons insert `[orange]text[/orange]`, `[green]text[/green]`, `[blue]text[/blue]`, or `[red]text[/red]`

The public event page renders these safely without using raw HTML.


## Home page content management

Admins can edit the public home page hero from:

```text
/admin → Edit home page hero
```

Editable fields:

- small heading
- large home title
- home description

The home description uses the same toolbar as event descriptions: bold, underline, and colored text.

This update adds a `SiteContent` table. For Vercel, keep the build command:

```bash
npx prisma db push && npm run seed && npm run build
```


## Full rich text toolbar update

The event description editor and home description editor now use a richer WYSIWYG toolbar powered by Tiptap.

Available tools:

- alignment: left, center, right, justify
- bold, italic, underline, strikethrough
- headings, paragraph, quote, code block
- font size
- text color
- bullet and numbered lists
- indent and outdent for list items
- undo and redo
- link insertion
- fullscreen editor mode

This update changes editor dependencies in `package.json`, so Vercel must run `npm install` during deployment. No database migration is required.


## Latest feature update

- Home workout preview "View full workout plan" now links to the full event page.
- Admin can edit scoring rules from `/admin`.
- Attendance vote buttons now use the same neutral style and show color only on hover/press.
- Logged-in users can open `/account` to view profile details, Strava connection status, votes, submissions, distance, and points.
- Scoring settings are stored in `ScoreSetting`; run `npx prisma db push` on deployment.


## Change password

Logged-in users can open `/account` and use **Change password**.

The form requires:

- Old password
- New password
- Confirm new password

The new password must be at least 8 characters and must be different from the old password.


## Latest behaviour update

- Guests now see a running club introduction page only. Event board and account information are shown after login.
- Attendance vote buttons show the selected state: ATTEND is green and NOT_ATTEND is red.
- Event distance submission supports two methods:
  - Strava synced run
  - Manual distance entry in kilometres
- Manual/Strava distance submission is only allowed when the user has voted ATTEND.
- If the user votes NOT_ATTEND, the distance input is blocked.
- Events automatically stop accepting votes and submissions 8 hours after the event end date/time.
- Most navigation buttons now show a loading spinner while redirecting.
- Optional environment variable:

```env
EVENT_AUTO_CLOSE_AFTER_HOURS=8
```

No database migration is required for this update.


## Latest UI update

- Attendance vote buttons now keep a clear selected state:
  - ATTEND = green
  - NOT_ATTEND = red
  - no vote = neutral
- Long-running actions now show a full-page loading overlay to stop duplicate clicks.
- Home page has a more creative running-club experience with runner pass, mission steps, vibe cards, and stronger event cards.
