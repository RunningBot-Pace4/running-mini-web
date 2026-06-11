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


## Loading Overlay Fix

The loading overlay now renders through a React portal directly into `document.body`, uses the highest z-index, locks page scrolling, and captures mouse/touch/keyboard events while pending. This prevents users from clicking other controls during slow saves or redirects.


## Update: navigation loading and premium running theme

This package fixes the previous loading issue where the overlay could remain visible after clicking top navigation links. The logo, Events, Account, and Admin links now reset loading state automatically when the route changes.

Changes included:

- Brand logo click now shows loading.
- Loading overlay fully blocks page interaction while an action is running.
- Loading overlay resets after route changes and has a safety timeout.
- Event detail page no longer shows the auto-close timestamp line.
- Home page has a more premium running club experience with a challenge cockpit, club momentum meter, interactive lane cards, and stronger card/button hover effects.


## Update: premium race hero and creative loading

This package redesigns the home hero into a more premium race-club style screen with animated track orbit, score ticket, live challenge chip, next-focus card, and improved mobile layout.

The loading screen is also updated to a stadium-style full-screen overlay with animated lanes, runner stage, progress bar, and stronger click-blocking behavior.


## China Super-App Inspired Design Update

This version refreshes the public/member home page and loading experience with a more interactive mini-program style:

- Mobile-first hero with red/gold running challenge visual language
- Mini-program phone card preview
- Gamified task cards and member progress cards
- Reward-style scoring ticket
- More interactive event cards
- Full-screen creative loading screen that blocks repeat clicks
- No database change required

## Latest UI Update: China-Inspired Mini App Experience

This package includes a full visual redesign inspired by China mobile mini-program patterns:

- App-like top navigation and mobile bottom tab bar
- Premium running club hero section
- Reward/red-packet style scoring cards
- Mission map: Vote → Run → Submit → Share
- Interactive event cards with stronger hover and mobile polish
- Event detail page redesigned as a challenge mission board
- More creative full-screen loading overlay
- Existing features remain unchanged: admin event creation, Strava/manual distance, voting, scoring, account, change password, and admin controls

No database migration is required for this UI-only update.


## Auto close bug fix

Expired open events are now auto-synchronized to `CLOSED` when the admin dashboard, event detail page, or public event board loads.

Rule:

```text
If event.status = OPEN and current time > event.endAt + EVENT_AUTO_CLOSE_AFTER_HOURS,
the system updates the database status to CLOSED.
```

Default:

```env
EVENT_AUTO_CLOSE_AFTER_HOURS=8
```

This means admin will no longer see an expired event as `OPEN` after the auto-close window has passed.


## Latest update: manual reopen and premium loading

- Admin can still manually set an event to `OPEN` after the normal auto-close window.
- Auto-close still works for normal events: `endAt + EVENT_AUTO_CLOSE_AFTER_HOURS`.
- When admin manually reopens an expired event, members can vote ATTEND and key in Event KM/manual distance again.
- If admin sets the event to `CLOSED`, `DRAFT`, or `ARCHIVED`, submissions are blocked again.
- Added a cleaner premium full-screen loading overlay that locks all clicks while actions are saving.

Database note: this update adds `Event.manualOpenAt`. Keep Vercel build command:

```bash
npx prisma db push --accept-data-loss && npm run seed && npm run build
```


### Admin status sync fix

The event detail page now keeps the **Edit event details** status dropdown synced with the quick status buttons.
If admin clicks **OPEN**, **CLOSED**, **DRAFT**, or **ARCHIVED** in the quick status controls, the dropdown below updates to the same value after the page refreshes.


## Latest update: Strava diagnostic + admin approval setting

### Strava connection

Admin dashboard now includes **Strava connection check**. It shows:

- whether `STRAVA_CLIENT_ID` is set
- whether `STRAVA_CLIENT_SECRET` is set
- the exact redirect URI used by the app
- the exact callback domain to put into Strava

For Vercel, make sure these values are configured:

```env
APP_URL=https://your-fixed-vercel-domain.vercel.app
STRAVA_REDIRECT_URI=https://your-fixed-vercel-domain.vercel.app/api/strava/callback
STRAVA_CLIENT_ID=your_strava_client_id
STRAVA_CLIENT_SECRET=your_strava_client_secret
STRAVA_APPROVAL_PROMPT=force
SESSION_SECRET=use-a-long-random-secret
```

In Strava API settings, the **Authorization Callback Domain** must be only:

```text
your-fixed-vercel-domain.vercel.app
```

Do not include `https://` and do not include `/api/strava/callback`.

### Submission approval setting

Admin can now choose whether submitted KM needs approval before points count.

Open:

```text
/admin → Edit scoring rules
```

Enable:

```text
Require admin approval before points count
```

When enabled:

- Strava/manual submissions become `PENDING`
- pending submissions do not count in leaderboard/account totals/share pages
- admin approves/rejects from `/admin → Manage event`
- approving recalculates points using the current scoring rules

Database note: this update adds:

- `SubmissionStatus.PENDING`
- `ScoreSetting.requireSubmissionApproval`

Keep Vercel build command:

```bash
npx prisma db push --accept-data-loss && npm run seed && npm run build
```

## Loading Overlay Redesign

The loading screen has been redesigned into a route-map style full-screen experience. It blocks user clicks, touch, scrolling, and keyboard input while an action is processing.


## Home screen shortcut / PWA install

The app includes a Progressive Web App manifest, icons, a lightweight service worker, and an install prompt.

After deployment over HTTPS, users can add Run Mini to their phone home screen.

### Android Chrome

1. Open the public website.
2. Tap the **Add Run Mini to Home Screen** prompt, or open browser menu **⋮**.
3. Choose **Install app** or **Add to Home screen**.

### iPhone Safari

1. Open the public website in Safari.
2. Tap the **Share** button.
3. Choose **Add to Home Screen**.
4. Tap **Add**.

If the prompt does not show, check that the public URL is HTTPS and the manifest loads at `/manifest.webmanifest`.


## Latest update: mobile logout, editable logo, editable theme colors

This version adds:

- Mobile bottom-tab logout button for logged-in users.
- Admin-editable header logo name and logo mark.
- Admin-editable theme colors:
  - Primary color
  - Highlight color
  - Background color
  - Dark/header color

Admin path:

```text
/admin → Edit home page hero → Brand logo and theme
```

After saving, the header logo and main theme colors update across the web.

Database note: this update adds new columns to `SiteContent`, so the Vercel build command should remain:

```bash
npx prisma db push --accept-data-loss && npm run seed && npm run build
```


## Option A design update: Sky + Sea + Sweat

This package includes a premium coastal running theme:

- Sky / sea / sunrise color palette
- Animated coastal hero section
- Sweat / route / wave loading screen
- Premium event cards with coastal scenery
- Admin editable brand colors
- Admin logo image upload

### Admin logo image

Go to:

```text
/admin → Edit home page hero → Brand logo & coastal theme
```

You can upload a PNG/JPG/WebP/SVG logo image. The app stores the image as a small data URL in the database for easy Vercel deployment. Recommended logo size: square image under 500KB.

### Database change

This update adds:

```text
SiteContent.logoImageDataUrl
```

Keep the Vercel build command:

```bash
npx prisma db push --accept-data-loss && npm run seed && npm run build
```


## Latest update: fixed 10-theme selector and new loading screen

Admin no longer needs to manually tune theme colors one by one.

Open:

```text
/admin → Edit home page hero
```

Then choose one of the 10 fixed themes:

1. Coastal Sunrise
2. Ocean Velocity
3. Sweat Orange
4. Midnight Run
5. Forest Trail
6. Desert Dawn
7. Neon Track
8. Clean Sky
9. Coral Energy
10. Royal Marathon

The selected theme automatically applies the correct primary, accent, background, and dark/header colors.

The loading screen has also been redesigned again with a route-map ocean launch animation, moving runner marker, sky/sea/sweat background, progress bar, and full click blocking.

Database note: this update adds:

```text
SiteContent.themePreset
```

Keep Vercel build command:

```bash
npx prisma db push --accept-data-loss && npm run seed && npm run build
```


## UI Fix

- Fixed admin logo remove checkbox so it appears as a normal checkbox instead of a large full-width tick box.


### Theme selection behavior

Admin can preview a fixed theme immediately by tapping a theme card in `/admin`.
To publish the theme for all users, click **Save home content** and redeploy/refresh open member tabs if needed.
The visible theme is now derived from `SiteContent.themePreset` so stale manual color fields cannot block the selected preset.


## Latest update: design-based theme presets

Admin theme selection now changes the full website design, not only colors.

Each fixed theme updates:

- page background artwork
- hero visual style
- card shape and surface
- button style
- event scenery artwork
- loading page mood
- mobile navigation feel

Themes available:

1. Coastal Sunrise
2. Ocean Velocity
3. Sweat Orange
4. Midnight Run
5. Forest Trail
6. Desert Dawn
7. Neon Track
8. Clean Sky
9. Coral Energy
10. Royal Marathon

Go to `/admin` → `Edit home page hero` → choose a theme → `Save home content`.


## Update: design theme v3, cleaner admin dashboard, new loading

This update changes three areas:

- Admin dashboard is separated into clear sections: Events, Brand & Design, Scoring, and Strava.
- Theme presets now change full visual style: background artwork, hero mood, card shape, button feel, event board, and loading mood.
- Loading page was redesigned into a cleaner premium route-map loader that blocks interaction while actions are processing.

No database change is required for this update.


## Update: simplified theme picker and loading screen

This version simplifies the admin theme selector:

- simple ready-made theme list
- selected theme preview area
- no busy design cards
- click a theme to preview, then save to publish

The loading overlay is also simplified:

- centered Run Mini logo mark
- short loading message
- clean progress bar
- full-screen click blocking while loading


## Latest update: loading logo sync

The loading overlay now uses the same logo image/mark and brand name shown in the top navigation.


## Latest update: collapsed admin panels and modern polish

- Admin dashboard sections now start collapsed by default so admins can manage the site part by part.
- The overall interface has a cleaner modern glass-card style with softer shadows, smoother buttons, and more polished mobile navigation.
- No database change is required for this update.


### Mobile logo / club name note

The header now always shows the club name on mobile. If the admin saved an empty or space-only logo name, the app falls back to `Run Mini`. Update it from `/admin → Brand & Design → Logo name`.
