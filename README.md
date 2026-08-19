Velocity Lead Dashboard
A secure, read-only Cloudflare Worker dashboard for HubSpot contact reporting. It shows:
unique new leads for any date range, defaulting to the past three weeks;
appointment-set rate and normalized outcomes (scheduled, completed, canceled, no-show, and more);
lead and appointment performance by service;
lead source mix, owner, detailed records, filters, privacy masking, and CSV export;
an audit of every duplicate record removed;
missing contact information, missing service assignments, and scheduling statuses that need review.
The duplicate rule
Contacts are linked into a duplicate group when they have the same normalized email address or the same full phone number. Inside each group, the dashboard:
retains the HubSpot contact with the oldest create date;
uses scheduling completeness, then overall lead completeness, only when create dates are exactly tied;
consolidates nonblank values from every duplicate into that retained dashboard row;
lets the most recently updated record supply conflicting values, including appointment status, date, type, and service;
considers associated scheduling activities attached to every contact in the duplicate group, while blank values never erase existing data.
The duplicate audit shows the HubSpot ID that was retained and every ID that was suppressed. Consolidation happens only in the read-only dashboard response; the dashboard does not merge, delete, or edit anything in HubSpot.
HubSpot setup
Create a HubSpot private app and grant these read permissions:
`crm.objects.contacts.read`
`crm.schemas.contacts.read`
`crm.objects.owners.read`
`crm.objects.appointments.read` (optional; only needed for HubSpot Appointment objects)
Meeting activities can be read with contact access. If your scheduling data is stored only in custom contact fields, choose Mapped contact properties only inside the dashboard.
The HubSpot token must be stored as an encrypted Cloudflare Worker secret. Never put a live token in this repository, a ZIP, or a GitHub variable that is exposed to the build output.
Deploy to Cloudflare
From this folder, sign into Cloudflare if needed:
```bash
   npx wrangler@latest login
   ```
Add the replacement HubSpot private-app token directly to Cloudflare. Do not paste it into the code or GitHub:
```bash
   npx wrangler@latest secret put HUBSPOT_ACCESS_TOKEN
   ```
Add a strong dashboard password. The dashboard fails closed without it:
```bash
   npx wrangler@latest secret put DASHBOARD_PASSWORD
   ```
Optional: change the Basic Authentication username from the default `velocity`:
```bash
   npx wrangler@latest secret put DASHBOARD_USERNAME
   ```
Deploy:
```bash
   npm run deploy
   ```
Open the deployed Worker URL and enter the dashboard username and password when your browser prompts you.
In the Cloudflare dashboard, add both values under Workers & Pages → dashboard → Settings → Variables and Secrets with type Secret. Use the exact names `HUBSPOT_ACCESS_TOKEN` and `DASHBOARD_PASSWORD`, then save/deploy the settings change.
First-time dashboard configuration
Open Configure and map these HubSpot contact properties:
service;
appointment status;
appointment date/time;
appointment type;
lead source and source detail;
contact owner.
The dashboard reads the property definitions in your account and recommends likely matches. You can enter an internal property name manually if needed. These mappings are saved only in that browser's local storage; the HubSpot token remains server-side.
For scheduling source, choose:
Auto to consider associated Appointments, Meetings, and mapped contact fields;
Mapped contact properties only when your appointment data lives on contacts;
Associated meetings when appointments are HubSpot meeting activities;
Associated appointments when your account uses HubSpot's Appointment object.
Local demo
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
Tests
```bash
npm test
```
The test suite covers oldest-created duplicate selection, newer-information consolidation, transitive duplicate groups, scheduling normalization, aggregate service totals, demo-mode rendering, and the fail-closed security default.
Important reporting definitions
New lead: a HubSpot contact whose `createdate` falls inside the selected date range.
Unique new lead: a new lead remaining after duplicate grouping.
Appointment set: any normalized scheduled, rescheduled, completed, canceled, or no-show appointment. This answers whether an appointment was ever created, even if it later changed outcome.
Active scheduled: currently scheduled or rescheduled.
Appointment rate: appointment-set leads divided by unique new leads.
HubSpot search can return up to 200 records per page and 10,000 records per query. The integration automatically splits large date windows before that limit is reached.
