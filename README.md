# Velocity Lead Dashboard

A secure, read-only Cloudflare Worker dashboard for HubSpot contact reporting. It shows:

- unique new leads for any date range, defaulting to the past three weeks;
- two appointment totals: new leads with an appointment date and appointments dated in the selected range;
- the current HubSpot **Lifecycle stage** for each appointment occurring in the selected range, normalized into Scheduled, Rescheduled, Completed, Canceled, No-show, Other / review, or Not scheduled;
- lead and appointment performance by service;
- lead source mix, owner, detailed records, filters, privacy masking, and CSV export;
- an audit of every duplicate record removed;
- missing contact information, missing service assignments, and scheduling statuses that need review.

## The duplicate rule

Contacts are linked into a duplicate group when they have the same normalized email address **or** the same full phone number. Inside each group, the dashboard:

1. retains the HubSpot contact with the oldest create date;
2. uses scheduling completeness, then overall lead completeness, only when create dates are exactly tied;
3. consolidates nonblank values from every duplicate into that retained dashboard row;
4. lets the most recently updated record supply conflicting values, including appointment status, date, type, and service;
5. considers associated scheduling activities attached to every contact in the duplicate group, while blank values never erase existing data.

Duplicate grouping happens across HubSpot contact history through the selected end date **before** the selected start date is applied. If a contact created August 19 duplicates an original created August 18, an August 19-only report excludes that duplicate because the group's original create date is August 18.

The duplicate audit shows the HubSpot ID that was retained and every ID that was suppressed. Consolidation happens only in the read-only dashboard response; the dashboard does not merge, delete, or edit anything in HubSpot.

## Saved dashboard settings

Property mappings, the scheduling source, and the duplicate-match option are stored with the Worker in a SQLite-backed Cloudflare Durable Object. The Durable Object is provisioned automatically from `wrangler.jsonc` during deployment. Settings therefore follow the dashboard across browsers and devices after **Apply & refresh** is clicked. Browser storage remains as a fallback and is migrated automatically the first time this version loads.

Contacts are excluded as Ahoy-Connection records when Original Traffic Source is Offline Sources and either source drill-down contains the displayed label `Ahoy-Connection` or HubSpot's internal value `48415030`.

Contacts whose mapped **Lead source** property is `LEADer` are also excluded before duplicate grouping. The dashboard recognizes both the displayed option label and its internal HubSpot value.

Appointment details from every duplicate are consolidated into the retained oldest contact, so a date added to a newer duplicate still counts without changing the original create date used for the new-lead cohort.

## HubSpot setup

Create a HubSpot private app and grant these read permissions:

- `crm.objects.contacts.read`
- `crm.schemas.contacts.read`
- `crm.objects.owners.read`
- `crm.objects.appointments.read` (optional; only needed for HubSpot Appointment objects)

Meeting activities can be read with contact access. If your scheduling data is stored only in custom contact fields, choose **Mapped contact properties only** inside the dashboard.

The HubSpot token must be stored as an encrypted Cloudflare Worker secret. Never put a live token in this repository, a ZIP, or a GitHub variable that is exposed to the build output.

## Deploy to Cloudflare

1. From this folder, sign into Cloudflare if needed:

   ```bash
   npx wrangler@latest login
   ```

2. Add the replacement HubSpot private-app token directly to Cloudflare. Do not paste it into the code or GitHub:

   ```bash
   npx wrangler@latest secret put HUBSPOT_ACCESS_TOKEN
   ```

3. Add a strong dashboard password. The dashboard fails closed without it:

   ```bash
   npx wrangler@latest secret put DASHBOARD_PASSWORD
   ```

4. Optional: change the Basic Authentication username from the default `velocity`:

   ```bash
   npx wrangler@latest secret put DASHBOARD_USERNAME
   ```

5. Deploy:

   ```bash
   npm run deploy
   ```

Open the deployed Worker URL and enter the dashboard username and password when your browser prompts you.

In the Cloudflare dashboard, add both values under **Workers & Pages → dashboard → Settings → Variables and Secrets** with type **Secret**. Use the exact names `HUBSPOT_ACCESS_TOKEN` and `DASHBOARD_PASSWORD`, then save/deploy the settings change.

## First-time dashboard configuration

Open **Configure** and map these HubSpot contact properties:

- service;
- appointment status;
- appointment date/time;
- appointment type;
- lead source and source detail;
- contact owner.

The dashboard reads the property definitions in your account and recommends likely matches. You can enter an internal property name manually if needed. These mappings are saved to the Worker's Cloudflare Durable Object, with browser storage as a fallback; the HubSpot token remains server-side.

The mapped appointment-date field supplies both visible appointment totals. Lifecycle stage supplies the status breakdown.

For scheduling source, choose:

- **Auto** to consider associated Appointments, Meetings, and mapped contact fields;
- **Mapped contact properties only** when your appointment data lives on contacts;
- **Associated meetings** when appointments are HubSpot meeting activities;
- **Associated appointments** when your account uses HubSpot's Appointment object.

## Local demo

No credentials are required to preview the interface with fictional data:

```bash
npm run preview
```

Then open `http://localhost:4173`. The local preview explicitly enables unauthenticated demo mode; the deployed dashboard does not.

The built-in local preview intentionally uses fictional demo data so a local port cannot expose real contacts without authentication. To test the deployed Worker with live data, use Wrangler after configuring the dashboard password.

To test locally with HubSpot, copy `.dev.vars.example` to `.dev.vars`, add the token, and run:

```bash
npx wrangler@latest dev
```

Never commit `.dev.vars`.

## Tests

```bash
npm test
```

The test suite covers oldest-created duplicate selection, newer-information consolidation, transitive duplicate groups, scheduling normalization, aggregate service totals, demo-mode rendering, and the fail-closed security default.

## Important reporting definitions

- **New lead:** a HubSpot contact whose retained original `createdate` falls inside the selected date range.
- **Unique new lead:** a duplicate group whose oldest contact was created inside the selected date range. Duplicate grouping is completed before the start-date filter is applied.
- **Appointment in range:** a deduplicated contact whose selected appointment date falls inside the chosen range, regardless of when the original lead was created.
- **New lead with appointment date:** a unique new lead whose retained original create date is inside the chosen range and whose mapped appointment-date field is filled. The appointment itself may occur outside the chosen range.
- **Appointments dated in range:** a deduplicated contact whose mapped appointment date falls inside the chosen range, regardless of its original create date.
- **Appointments occurring:** the same appointment-date-only population shown as **Appointments dated in range**. This is separate from contact create date.
- **Lifecycle stage breakdown:** appointments occurring in the chosen range grouped from their current `lifecyclestage` value. The dashboard translates HubSpot internal option values to their displayed labels before categorizing them; mapped appointment status is used only as a fallback when lifecycle stage is blank.

HubSpot search can return up to 200 records per page and 10,000 records per query. The integration automatically splits large date windows before that limit is reached.
