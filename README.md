# Velocity Lead Dashboard

A secure, read-only Cloudflare Worker dashboard for HubSpot contact reporting. It shows:

- unique new leads for any date range, defaulting to the past three weeks;
- appointment-set rate and normalized outcomes (scheduled, completed, canceled, no-show, and more);
- lead and appointment performance by service;
- lead source mix, owner, detailed records, filters, privacy masking, and CSV export;
- an audit of every duplicate record removed;
- missing contact information, missing service assignments, and scheduling statuses that need review.

## The duplicate rule

Contacts are linked into a duplicate group when they have the same normalized email address **or** the same full phone number. Inside each group, the dashboard:

1. keeps the record with the most complete scheduling data;
2. uses overall lead completeness as the first tie-breaker;
3. uses the most recently updated contact as the final tie-breaker;
4. fills blank non-scheduling fields from suppressed duplicates;
5. never combines conflicting appointment fields.

The duplicate audit shows the HubSpot ID that was kept and every ID that was suppressed. The dashboard does not merge, delete, or edit anything in HubSpot.

## HubSpot setup

Create a HubSpot private app and grant these read permissions:

- `crm.objects.contacts.read`
- `crm.schemas.contacts.read`
- `crm.objects.owners.read`
- `crm.objects.appointments.read` (optional; only needed for HubSpot Appointment objects)

Meeting activities can be read with contact access. If your scheduling data is stored only in custom contact fields, choose **Mapped contact properties only** inside the dashboard.

This package was prepared for a single owner and already contains its private-app access token in a server-only Worker module. The token is not included in the browser-facing HTML or API responses. Because the source package contains a live credential, do not share it, upload it to a public repository, or give the ZIP to another person.

## Deploy to Cloudflare

1. From this folder, sign into Cloudflare if needed:

   ```bash
   npx wrangler@latest login
   ```

2. Add a strong dashboard password. The dashboard fails closed without it:

   ```bash
   npx wrangler@latest secret put DASHBOARD_PASSWORD
   ```

3. Optional: change the Basic Authentication username from the default `velocity`:

   ```bash
   npx wrangler@latest secret put DASHBOARD_USERNAME
   ```

4. Deploy:

   ```bash
   npm run deploy
   ```

Open the deployed Worker URL and enter the dashboard username and password when your browser prompts you.

## First-time dashboard configuration

Open **Configure** and map these HubSpot contact properties:

- service;
- appointment status;
- appointment date/time;
- appointment type;
- lead source and source detail;
- contact owner.

The dashboard reads the property definitions in your account and recommends likely matches. You can enter an internal property name manually if needed. These mappings are saved only in that browser's local storage; the HubSpot token remains server-side.

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

To override the embedded HubSpot token later, copy `.dev.vars.example` to `.dev.vars`, add the replacement token, and run:

```bash
npx wrangler@latest dev
```

Never commit `.dev.vars`.

## Tests

```bash
npm test
```

The test suite covers scheduling-first duplicate selection, transitive duplicate groups, conflict-safe field consolidation, scheduling normalization, aggregate service totals, demo-mode rendering, and the fail-closed security default.

## Important reporting definitions

- **New lead:** a HubSpot contact whose `createdate` falls inside the selected date range.
- **Unique new lead:** a new lead remaining after duplicate grouping.
- **Appointment set:** any normalized scheduled, rescheduled, completed, canceled, or no-show appointment. This answers whether an appointment was ever created, even if it later changed outcome.
- **Active scheduled:** currently scheduled or rescheduled.
- **Appointment rate:** appointment-set leads divided by unique new leads.

HubSpot search can return up to 200 records per page and 10,000 records per query. The integration automatically splits large date windows before that limit is reached.
