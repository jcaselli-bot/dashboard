import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { DASHBOARD_HTML } from "../src/ui.js";
import { buildReport } from "../src/report.js";

test("the dashboard timing grid follows business line, source, search, and date controls", async () => {
  const elements = new Map();
  const element = (selector) => {
    if (!elements.has(selector)) elements.set(selector, {
      value:"", innerHTML:"", textContent:"", disabled:false, style:{}, dataset:{},
      lastElementChild:{ textContent:"" },
      classList:{ add() {}, remove() {}, toggle() {} },
      listeners:{},
      addEventListener(name, callback) { this.listeners[name] = callback; },
      fire(name, value = this.value) { this.value = value; return this.listeners[name]({ target:this }); },
    });
    return elements.get(selector);
  };
  const contacts = [
    { id:"1", createdAt:"2026-11-16T13:10:00.000Z", updatedAt:"2026-11-16T13:10:00.000Z", properties:{ email:"roof@example.com", service:"Roofing", source:"PAID_SOCIAL" } },
    { id:"2", createdAt:"2026-11-17T19:00:00.000Z", updatedAt:"2026-11-17T19:00:00.000Z", properties:{ email:"roof@example.com", service:"Roofing", source:"PAID_SOCIAL" } },
    { id:"3", createdAt:"2026-11-17T19:30:00.000Z", updatedAt:"2026-11-17T19:30:00.000Z", properties:{ email:"solar@example.com", service:"Solar", source:"REFERRALS" } },
  ];
  const mapping = { service:"service", leadSource:"source" };
  const requests = [];
  const context = vm.createContext({
    document:{ querySelector:element, querySelectorAll:() => [] },
    localStorage:{ getItem:() => null, setItem() {} },
    Intl, Date, AbortController, setTimeout, clearTimeout,
    fetch:async (path, options = {}) => {
      requests.push(path);
      if (path === "/api/bootstrap") return Response.json({
        connected:true, properties:[], warnings:[], settingsPersistenceConfigured:false,
        savedSettings:{ mapping, scheduleSource:"properties", dedupeBy:"email_phone" },
      });
      assert.equal(path, "/api/report");
      const body = JSON.parse(options.body);
      return Response.json({
        ...buildReport(contacts, {
          mapping,
          rangeStart:body.start,
          rangeEnd:body.end,
          now:new Date("2026-11-19T12:00:00.000Z"),
        }),
        mode:"live", warnings:[],
      });
    },
  });
  const script = DASHBOARD_HTML.match(/<script>([\s\S]*?)<\/script>/)[1];
  const runnable = script.replace("      init();", "      globalThis.dashboardReady = init();");
  assert.notEqual(runnable, script);
  vm.runInContext(runnable, context);
  await context.dashboardReady;

  // Set an explicit range so this test does not depend on the machine's current day.
  await element("#start-date").fire("change", "2026-11-16");
  await element("#end-date").fire("change", "2026-11-17");
  await element("#refresh-btn").fire("click");
  const initialRequestCount = requests.length;
  assert.match(element("#lead-timing-sub").textContent, /^2 unique new leads/);
  assert.equal((element("#lead-timing-chart").innerHTML.match(/class="timing-cell /g) || []).length, 168);
  assert.match(element("#lead-timing-chart").innerHTML, /Monday, 8 AM–9 AM: 1 lead/);
  assert.match(element("#lead-timing-chart").innerHTML, /Tuesday, 2 PM–3 PM: 1 lead/);

  await element("#segment-filter").fire("change", "Roofing");
  assert.match(element("#lead-timing-sub").textContent, /^1 unique new lead/);
  assert.match(element("#lead-timing-chart").innerHTML, /Monday, 8 AM–9 AM: 1 lead/);
  assert.match(element("#lead-timing-chart").innerHTML, /Tuesday, 2 PM–3 PM: 0 leads/);
  await element("#segment-filter").fire("change", "Solar");
  assert.match(element("#lead-timing-chart").innerHTML, /Monday, 8 AM–9 AM: 0 leads/);
  assert.match(element("#lead-timing-chart").innerHTML, /Tuesday, 2 PM–3 PM: 1 lead/);

  await element("#segment-filter").fire("change", "");
  await element("#source-filter").fire("change", "Referrals");
  assert.match(element("#lead-timing-sub").textContent, /^1 unique new lead/);
  assert.match(element("#lead-timing-chart").innerHTML, /Tuesday, 2 PM–3 PM: 1 lead/);
  await element("#source-filter").fire("change", "");
  await element("#search").fire("input", "no-matching-lead-73921");
  assert.match(element("#lead-timing-sub").textContent, /^0 unique new leads/);
  assert.match(element("#lead-timing-chart").innerHTML, /No new leads match/);
  assert.doesNotMatch(element("#lead-timing-chart").innerHTML, /timing-table/);
  await element("#search").fire("input", "");
  assert.match(element("#lead-timing-sub").textContent, /^2 unique new leads/);
  assert.equal(requests.length, initialRequestCount, "timing and filters do not fetch more HubSpot data");

  await element("#start-date").fire("change", "2026-11-17");
  await element("#refresh-btn").fire("click");
  assert.match(element("#lead-timing-sub").textContent, /^1 unique new lead/);
  assert.match(element("#lead-timing-chart").innerHTML, /Monday, 8 AM–9 AM: 0 leads/);
  assert.match(element("#lead-timing-chart").innerHTML, /Tuesday, 2 PM–3 PM: 1 lead/);
});
