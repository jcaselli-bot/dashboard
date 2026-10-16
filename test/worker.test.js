import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.js";
import { DASHBOARD_HTML } from "../src/ui.js";
import { APPOINTMENT_SET_DATE_PROPERTY } from "../src/report.js";

test("excludes Unknown sources before deduplication and both appointment totals", async (t) => {
  const sourceOptions = [
    { value:"901", label:"Unknown" },
    { value:"55", label:"Referral" },
    { value:"81234", label:"LEADer" },
  ];
  const properties = [
    { name:"hs_analytics_source", label:"Original Traffic Source", options:[] },
    { name:"lead_source", label:"Lead Source", options:sourceOptions },
    { name:"channel_choice", label:"Lead Source", options:sourceOptions },
    { name:APPOINTMENT_SET_DATE_PROPERTY, label:"Date entered Appointment Set", options:[] },
  ];
  const makeContact = (id, date, overrides = {}) => ({
    id:String(id),
    createdAt:date,
    updatedAt:date,
    properties:{
      email:`contact${id}@example.com`,
      hs_analytics_source:"PAID_SOCIAL",
      lead_source:"55",
      service:"Roofing",
      [APPOINTMENT_SET_DATE_PROPERTY]:"2026-08-19T14:00:00.000Z",
      ...overrides,
    },
  });
  const contacts = [
    makeContact(1, "2026-08-18T10:00:00.000Z", { lead_source:"901", email:"shared@example.com" }),
    makeContact(2, "2026-08-19T10:00:00.000Z", { email:"shared@example.com" }),
    makeContact(3, "2026-08-19T10:00:00.000Z", { lead_source:"901" }),
    makeContact(4, "2026-08-19T10:00:00.000Z", { lead_source:"Unknown source" }),
    makeContact(5, "2026-08-19T10:00:00.000Z", { hs_analytics_source:"" }),
    makeContact(6, "2026-08-19T10:00:00.000Z", { lead_source:"81234" }),
    makeContact(7, "2026-08-19T10:00:00.000Z", { hs_analytics_source:"OFFLINE", hs_analytics_source_data_2:"48415030" }),
    makeContact(8, "2026-08-01T10:00:00.000Z", { service:"Solar" }),
    makeContact(9, "2026-08-19T10:00:00.000Z", { lead_source:"", [APPOINTMENT_SET_DATE_PROPERTY]:"" }),
    makeContact(10, "2026-08-01T10:00:00.000Z", { lead_source:"901" }),
    makeContact(11, "2026-08-19T10:00:00.000Z", { channel_choice:"901" }),
  ];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    if (url.includes("/properties/contacts")) return Response.json({ results:properties });
    if (url.includes("/owners")) return Response.json({ results:[] });
    assert.equal(url, "https://api.hubapi.com/crm/v3/objects/contacts/search");
    const body = JSON.parse(options.body);
    assert.ok(body.properties.includes("lead_source"));
    assert.ok(body.properties.includes("channel_choice"));
    assert.equal(body.filterGroups[0].filters[0].value, "0", "deduplication still scans earlier history");
    return Response.json({ total:contacts.length, results:contacts });
  });
  const response = await worker.fetch(new Request("https://dashboard.test/api/report", {
    method:"POST",
    headers:{ "content-type":"application/json" },
    body:JSON.stringify({
      start:"2026-08-19T00:00:00.000Z",
      end:"2026-08-20T00:00:00.000Z",
      mapping:{ service:"service", leadSource:"hs_analytics_source" },
      scheduleSource:"properties",
    }),
  }), { ALLOW_UNAUTHENTICATED:"true", HUBSPOT_ACCESS_TOKEN:"test-placeholder-not-a-credential" });
  assert.equal(response.status, 200);
  const report = await response.json();
  assert.deepEqual(report.rows.map((row) => row.id).sort(), ["2", "9"]);
  assert.deepEqual(report.bookingRows.map((row) => row.id).sort(), ["2", "8"]);
  assert.equal(report.summary.uniqueLeads, 2);
  assert.equal(report.summary.appointmentsSetFromNewLeads, 1);
  assert.equal(report.summary.appointmentsSetInRange, 2);
  assert.equal(report.summary.excludedUnknownSource, 4);
  assert.equal(report.summary.excludedUnknownSourceHistory, 6);
  assert.equal(report.summary.excludedLeader, 1);
  assert.equal(report.summary.excludedAhoyConnection, 1);
  assert.equal(report.summary.historyRecordsScanned, 11);
  assert.equal(report.summary.duplicatesRemoved, 0);
  assert.equal(report.duplicateAudit.length, 0);
  assert.ok(report.warnings.some((warning) => /6 Unknown-source contacts/.test(warning)));
});

test("serves the dashboard and demo report without external credentials", async () => {
  const env = { ALLOW_UNAUTHENTICATED:"true" };
  const page = await worker.fetch(new Request("https://dashboard.test/"), env, {});
  assert.equal(page.status, 200);
  const pageHtml = await page.text();
  assert.match(pageHtml, /Velocity Lead Intelligence/);
  assert.match(pageHtml, /Appointments set from new leads/);
  assert.match(pageHtml, /Appointments set in range/);
  assert.match(pageHtml, /Date entered Appointment Set in range/);
  assert.doesNotMatch(pageHtml, /New leads with appointment date|Appointments dated in range|Booked from new leads|New-lead booking rate|Total booked in range/);
  assert.doesNotMatch(pageHtml, /pat-na1-/);

  const healthResponse = await worker.fetch(new Request("https://dashboard.test/api/health"), env, {});
  const health = await healthResponse.json();
  assert.equal(health.hubspotConfigured, false);

  const reportResponse = await worker.fetch(new Request("https://dashboard.test/api/demo", {
    method:"POST",
    headers:{ "content-type":"application/json" },
    body:JSON.stringify({ dedupeBy:"email_phone", mapping:{} }),
  }), env, {});
  assert.equal(reportResponse.status, 200);
  const report = await reportResponse.json();
  assert.equal(report.mode, "demo");
  assert.equal(report.summary.duplicatesRemoved, 3);
  assert.ok(report.summary.uniqueLeads > 30);
});

test("ships browser JavaScript that parses successfully", () => {
  const match = DASHBOARD_HTML.match(/<script>([\s\S]*?)<\/script>/);
  assert.ok(match, "dashboard inline script is present");
  assert.doesNotThrow(() => new Function(match[1]));
});

test("fails closed when the dashboard password is not configured", async () => {
  const response = await worker.fetch(new Request("https://dashboard.test/"), {}, {});
  assert.equal(response.status, 503);
  assert.match(await response.text(), /Secure access needs one setting/);
});

test("persists validated dashboard settings through the Cloudflare storage binding", async () => {
  let stored = null;
  const env = {
    ALLOW_UNAUTHENTICATED:"true",
    DASHBOARD_SETTINGS:{
      getByName() {
        return {
          async getSettings() { return stored; },
          async saveSettings(settings) { stored = settings; return stored; },
        };
      },
    },
  };
  const saveResponse = await worker.fetch(new Request("https://dashboard.test/api/settings", {
    method:"PUT",
    headers:{ "content-type":"application/json" },
    body:JSON.stringify({
      scheduleSource:"properties",
      dedupeBy:"email",
      mapping:{ service:"appointment_set_as", appointmentStatus:"appointment_status" },
    }),
  }), env, {});
  assert.equal(saveResponse.status, 200);
  assert.equal(stored.scheduleSource, "properties");
  assert.equal(stored.dedupeBy, "email");
  assert.equal(stored.mapping.service, "appointment_set_as");

  const bootstrapResponse = await worker.fetch(new Request("https://dashboard.test/api/bootstrap"), env, {});
  const bootstrap = await bootstrapResponse.json();
  assert.equal(bootstrap.settingsPersistenceConfigured, true);
  assert.equal(bootstrap.savedSettings.mapping.appointmentStatus, "appointment_status");
});
