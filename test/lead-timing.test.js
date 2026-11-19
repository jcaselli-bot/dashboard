import test from "node:test";
import assert from "node:assert/strict";
import { buildLeadTiming } from "../src/lead-timing.js";
import { buildReport } from "../src/report.js";

test("groups original create dates by Eastern weekday and hour across midnight and noon", () => {
  const timing = buildLeadTiming([
    { createdAt:"2026-11-16T04:59:59.000Z" }, // Sunday, 11:59 PM Eastern.
    { createdAt:"2026-11-16T05:00:00.000Z" }, // Monday, 12 AM Eastern.
    { createdAt:"2026-11-16T17:00:00.000Z" }, // Monday, 12 PM Eastern.
    { createdAt:"2026-11-16T14:00:00.000Z" }, // Monday, 9 AM Eastern.
    { createdAt:"2026-11-16T14:59:59.000Z" }, // Same 9 AM hour.
    { createdAt:"2026-11-16T15:00:00.000Z" }, // Next hour.
  ]);
  assert.equal(timing.timeZone, "America/New_York");
  assert.deepEqual(timing.days.map((day) => day.day), ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]);
  assert.equal(timing.days[6].hours[23], 1);
  assert.equal(timing.days[0].hours[0], 1);
  assert.equal(timing.days[0].hours[12], 1);
  assert.equal(timing.days[0].hours[9], 2);
  assert.equal(timing.days[0].hours[10], 1);
  assert.equal(timing.days[0].total, 5);
  assert.equal(timing.hours[0].label, "12 AM");
  assert.equal(timing.hours[12].label, "12 PM");
  assert.equal(timing.hours[23].label, "11 PM");
  assert.equal(timing.hours[9].count, 2);
  assert.equal(timing.total, 6);
  assert.equal(timing.days.reduce((sum, day) => sum + day.total, 0), timing.total);
  assert.equal(timing.hours.reduce((sum, hour) => sum + hour.count, 0), timing.total);
});

test("uses daylight saving offsets and combines the repeated fall hour", () => {
  const timing = buildLeadTiming([
    { createdAt:"2026-03-08T06:30:00.000Z" }, // Sunday, 1:30 AM EST.
    { createdAt:"2026-03-08T07:30:00.000Z" }, // Sunday, 3:30 AM EDT.
    { createdAt:"2026-11-01T05:30:00.000Z" }, // Sunday, 1:30 AM EDT.
    { createdAt:"2026-11-01T06:30:00.000Z" }, // Sunday, 1:30 AM EST.
    { createdAt:"2026-07-15T13:15:00.000Z" }, // Wednesday, 9:15 AM EDT.
    { createdAt:"2026-01-14T14:15:00.000Z" }, // Wednesday, 9:15 AM EST.
  ]);
  assert.equal(timing.days[6].hours[1], 3);
  assert.equal(timing.days[6].hours[2], 0);
  assert.equal(timing.days[6].hours[3], 1);
  assert.equal(timing.days[2].hours[9], 2);
  assert.equal(timing.total, 6);
});

test("keeps empty or invalid create dates out of the midnight bucket", () => {
  const timing = buildLeadTiming([{}, null, { createdAt:"" }, { createdAt:"invalid" }]);
  assert.equal(timing.total, 0);
  assert.equal(timing.missingCreatedDate, 4);
  assert.ok(timing.days.every((day) => day.total === 0 && day.hours.every((count) => count === 0)));
  assert.ok(timing.hours.every((hour) => hour.count === 0));
  assert.equal(buildLeadTiming([]).missingCreatedDate, 0);
});

test("uses the retained original contact and selected create-date cohort before grouping times", () => {
  const contact = (id, createdAt, email, service = "Roofing") => ({
    id:String(id), createdAt, updatedAt:createdAt, properties:{ email, service },
  });
  const report = buildReport([
    contact(1, "2026-11-16T13:10:00.000Z", "duplicate@example.com"),
    contact(2, "2026-11-17T19:00:00.000Z", "duplicate@example.com"),
    contact(3, "2026-11-17T19:30:00.000Z", "solar@example.com", "Solar"),
    contact(4, "2026-11-15T23:00:00.000Z", "older@example.com"),
    contact(5, "2026-11-17T20:00:00.000Z", "older@example.com"),
    contact(6, "2026-11-18T05:00:00.000Z", "after-range@example.com"),
  ], {
    mapping:{ service:"service" },
    rangeStart:"2026-11-16T05:00:00.000Z",
    rangeEnd:"2026-11-18T05:00:00.000Z",
    now:new Date("2026-11-20T12:00:00.000Z"),
  });
  const timing = buildLeadTiming(report.rows);
  assert.equal(timing.total, 2);
  assert.equal(timing.days[0].hours[8], 1);
  assert.equal(timing.days[1].hours[14], 1);
  assert.equal(timing.days[1].hours[15], 0);
  const roofingTiming = buildLeadTiming(report.rows.filter((row) => row.serviceSegments.includes("Roofing")));
  assert.equal(roofingTiming.total, 1);
  assert.equal(roofingTiming.days[0].hours[8], 1);
  assert.equal(roofingTiming.days[1].total, 0);
});
