import test from "node:test";
import assert from "node:assert/strict";
import { buildReport, dedupeContacts, getScheduleSnapshot } from "../src/report.js";

const mapping = {
  service: "service",
  appointmentStatus: "appointment_status",
  appointmentDate: "appointment_date",
  appointmentType: "appointment_type",
  leadSource: "source",
  leadSubsource: "",
  owner: "owner",
};

function contact(id, properties = {}, updatedAt = "2026-08-01T00:00:00.000Z") {
  return {
    id:String(id),
    createdAt:"2026-08-01T00:00:00.000Z",
    updatedAt,
    properties:{ firstname:"Test", lastname:`Lead ${id}`, ...properties },
    scheduleItems:[],
  };
}

test("keeps the duplicate with more complete scheduling data", () => {
  const lessComplete = contact(1, { email:"lead@example.com", service:"Roofing" });
  const moreComplete = contact(2, {
    email:"LEAD@example.com",
    service:"Roofing",
    appointment_status:"SCHEDULED",
    appointment_date:"2026-08-25T14:00:00.000Z",
    appointment_type:"In-home quote",
  });
  const result = dedupeContacts([lessComplete, moreComplete], mapping, { now:new Date("2026-08-19T12:00:00.000Z") });
  assert.equal(result.records.length, 1);
  assert.equal(result.records[0].id, "2");
  assert.deepEqual(result.records[0].duplicateIds, ["1"]);
  assert.equal(result.duplicatesRemoved, 1);
});

test("joins duplicate chains connected by email or phone", () => {
  const first = contact(1, { email:"same@example.com", phone:"856-555-0101" });
  const second = contact(2, { email:"same@example.com", phone:"856-555-0199" });
  const third = contact(3, { email:"other@example.com", phone:"8565550199", appointment_status:"SCHEDULED", appointment_date:"2026-08-22" });
  const result = dedupeContacts([first, second, third], mapping, { now:new Date("2026-08-19") });
  assert.equal(result.records.length, 1);
  assert.equal(result.records[0].id, "3");
  assert.equal(result.duplicatesRemoved, 2);
});

test("does not merge conflicting appointment fields into the chosen primary", () => {
  const primary = contact(1, {
    email:"same@example.com",
    appointment_status:"COMPLETED",
    appointment_date:"2026-08-10",
    service:"",
  });
  const secondary = contact(2, {
    email:"same@example.com",
    appointment_status:"CANCELED",
    appointment_date:"2026-08-11",
    service:"Solar",
  });
  const result = dedupeContacts([primary, secondary], mapping, { now:new Date("2026-08-19") });
  assert.equal(result.records[0].properties.appointment_status, "COMPLETED");
  assert.equal(result.records[0].properties.appointment_date, "2026-08-10");
  assert.equal(result.records[0].properties.service, "Solar");
});

test("normalizes common meeting outcomes", () => {
  const record = contact(1, {});
  record.scheduleItems = [{ source:"meeting", sourceLabel:"HubSpot meeting", status:"NO_SHOW", date:"2026-08-18", type:"Consultation" }];
  const snapshot = getScheduleSnapshot(record, mapping, new Date("2026-08-19"));
  assert.equal(snapshot.category, "No-show");
  assert.equal(snapshot.everScheduled, true);
});

test("builds service and appointment totals after deduplication", () => {
  const records = [
    contact(1, { email:"a@example.com", service:"Roofing", appointment_status:"SCHEDULED", appointment_date:"2026-08-22" }),
    contact(2, { email:"a@example.com", service:"Roofing" }),
    contact(3, { email:"b@example.com", service:"Solar" }),
  ];
  const report = buildReport(records, { mapping, now:new Date("2026-08-19") });
  assert.equal(report.summary.uniqueLeads, 2);
  assert.equal(report.summary.duplicatesRemoved, 1);
  assert.equal(report.summary.appointmentSet, 1);
  assert.equal(report.summary.appointmentRate, 0.5);
  assert.deepEqual(report.services.map((item) => [item.service,item.leads,item.appointmentSet]), [
    ["Roofing",1,1],
    ["Solar",1,0],
  ]);
});
 
