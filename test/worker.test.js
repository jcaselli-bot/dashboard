import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.js";
import { DASHBOARD_HTML } from "../src/ui.js";

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
