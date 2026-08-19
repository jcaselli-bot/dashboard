import test from "node:test";
import assert from "node:assert/strict";
import {
  APPOINTMENT_SET_DATE_PROPERTY,
  buildReport,
  classifyServiceSegments,
  dedupeContacts,
  getScheduleSnapshot,
  isOfflineAhoyConnectionContact,
  isLeaderSourceContact,
  recommendMapping,
} from "../src/report.js";

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

test("uses scheduling completeness when duplicate create dates tie", () => {
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

test("retains the oldest-created contact while using newer scheduling information", () => {
  const oldest = contact(1, {
    email:"lead@example.com",
    service:"Roofing",
    appointment_status:"NOT SCHEDULED",
  }, "2026-07-02T00:00:00.000Z");
  oldest.createdAt = "2026-07-01T00:00:00.000Z";
  const newer = contact(2, {
    email:"LEAD@example.com",
    service:"Solar",
    appointment_status:"SCHEDULED",
    appointment_date:"2026-08-25T14:00:00.000Z",
    appointment_type:"In-home quote",
  }, "2026-08-10T00:00:00.000Z");
  newer.createdAt = "2026-08-01T00:00:00.000Z";

  const result = dedupeContacts([newer, oldest], mapping, { now:new Date("2026-08-19T12:00:00.000Z") });
  assert.equal(result.records[0].id, "1");
  assert.deepEqual(result.records[0].duplicateIds, ["2"]);
  assert.equal(result.records[0].properties.appointment_status, "SCHEDULED");
  assert.equal(result.records[0].properties.appointment_date, "2026-08-25T14:00:00.000Z");
  assert.equal(result.records[0].properties.appointment_type, "In-home quote");
  assert.equal(result.records[0].properties.service, "Solar");
  assert.equal(result.records[0].createdAt, "2026-07-01T00:00:00.000Z");
});

test("uses Date entered Appointment Set from newer duplicate contacts", () => {
  const oldest = contact(1, { email:"same@example.com", service:"Roofing" });
  oldest.createdAt = "2026-08-01T00:00:00.000Z";
  const newer = contact(2, {
    email:"same@example.com",
    service:"Roofing",
    [APPOINTMENT_SET_DATE_PROPERTY]:"2026-08-19T18:12:00.000Z",
  });
  newer.createdAt = "2026-08-19T10:00:00.000Z";

  const report = buildReport([oldest, newer], {
    mapping,
    rangeStart:"2026-08-19T04:00:00.000Z",
    rangeEnd:"2026-08-20T04:00:00.000Z",
    now:new Date("2026-08-20T12:00:00.000Z"),
  });
  assert.equal(report.summary.uniqueLeads, 0);
  assert.equal(report.summary.totalBookedInRange, 1);
  assert.equal(report.summary.bookingDateProperty, APPOINTMENT_SET_DATE_PROPERTY);
  assert.equal(report.bookingRows[0].id, "1");
  assert.equal(report.bookingRows[0].bookingDate, "2026-08-19T18:12:00.000Z");
});

test("deduplicates against earlier contacts before applying the selected create-date range", () => {
  const original = contact(18, {
    email:"same@example.com",
    service:"Roofing",
  }, "2026-08-18T10:00:00.000Z");
  original.createdAt = "2026-08-18T09:00:00.000Z";
  const duplicate = contact(19, {
    email:"SAME@example.com",
    service:"Roofing",
    appointment_status:"SCHEDULED",
    appointment_date:"2026-08-22T14:00:00.000Z",
  }, "2026-08-19T11:00:00.000Z");
  duplicate.createdAt = "2026-08-19T10:00:00.000Z";

  const august19Only = buildReport([original, duplicate], {
    mapping,
    now:new Date("2026-08-20T12:00:00.000Z"),
    rangeStart:"2026-08-19T00:00:00.000Z",
    rangeEnd:"2026-08-20T00:00:00.000Z",
  });
  assert.equal(august19Only.summary.importedRecords, 1);
  assert.equal(august19Only.summary.uniqueLeads, 0);
  assert.equal(august19Only.summary.duplicatesRemoved, 1);
  assert.equal(august19Only.rows.length, 0);
  assert.equal(august19Only.duplicateAudit[0].keptId, "18");

  const bothDates = buildReport([original, duplicate], {
    mapping,
    now:new Date("2026-08-20T12:00:00.000Z"),
    rangeStart:"2026-08-18T00:00:00.000Z",
    rangeEnd:"2026-08-20T00:00:00.000Z",
  });
  assert.equal(bothDates.summary.importedRecords, 2);
  assert.equal(bothDates.summary.uniqueLeads, 1);
  assert.equal(bothDates.summary.duplicatesRemoved, 1);
  assert.equal(bothDates.rows[0].id, "18");
  assert.equal(bothDates.rows[0].scheduleCategory, "Scheduled");
});

test("filters new leads by original create date and appointments by appointment date", () => {
  const olderLead = contact(1, {
    email:"older@example.com",
    service:"Solar",
    appointment_status:"SCHEDULED",
    appointment_date:"2026-08-19T15:00:00.000Z",
  }, "2026-08-18T12:00:00.000Z");
  olderLead.createdAt = "2026-08-01T12:00:00.000Z";
  const newLead = contact(2, {
    email:"new@example.com",
    service:"Roofing",
  }, "2026-08-19T13:00:00.000Z");
  newLead.createdAt = "2026-08-19T12:00:00.000Z";

  const report = buildReport([olderLead, newLead], {
    mapping,
    now:new Date("2026-08-20T12:00:00.000Z"),
    rangeStart:"2026-08-19T00:00:00.000Z",
    rangeEnd:"2026-08-20T00:00:00.000Z",
  });
  assert.deepEqual(report.rows.map((row) => row.id), ["2"]);
  assert.deepEqual(report.appointmentRows.map((row) => row.id), ["1"]);
  assert.equal(report.summary.uniqueLeads, 1);
  assert.equal(report.summary.appointmentSet, 1);
  assert.equal(report.statuses.find((item) => item.label === "Scheduled").count, 1);
});

test("separates cohort booking rate from all bookings made in the selected range", () => {
  const olderBookedToday = contact(1, {
    email:"older@example.com",
    service:"Solar",
    [APPOINTMENT_SET_DATE_PROPERTY]:"2026-08-19T18:12:00.000Z",
  });
  olderBookedToday.createdAt = "2026-07-01T12:00:00.000Z";
  const newBookedLater = contact(2, {
    email:"new-booked@example.com",
    service:"Roofing",
    [APPOINTMENT_SET_DATE_PROPERTY]:"2026-08-21T15:00:00.000Z",
  });
  newBookedLater.createdAt = "2026-08-19T12:00:00.000Z";
  const newNotBooked = contact(3, { email:"new@example.com", service:"Roofing" });
  newNotBooked.createdAt = "2026-08-19T13:00:00.000Z";

  const report = buildReport([olderBookedToday, newBookedLater, newNotBooked], {
    mapping,
    rangeStart:"2026-08-19T04:00:00.000Z",
    rangeEnd:"2026-08-20T04:00:00.000Z",
    now:new Date("2026-08-22T12:00:00.000Z"),
  });
  assert.equal(report.summary.uniqueLeads, 2);
  assert.equal(report.summary.bookedFromNewLeads, 1);
  assert.equal(report.summary.bookingRate, 0.5);
  assert.equal(report.summary.totalBookedInRange, 1);
  assert.deepEqual(report.bookingRows.map((row) => row.id), ["1"]);
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

test("uses the most recently updated nonblank values for conflicting fields", () => {
  const primary = contact(1, {
    email:"same@example.com",
    appointment_status:"COMPLETED",
    appointment_date:"2026-08-10",
    service:"",
  }, "2026-08-12T00:00:00.000Z");
  const secondary = contact(2, {
    email:"same@example.com",
    appointment_status:"CANCELED",
    appointment_date:"2026-08-11",
    service:"Solar",
  }, "2026-08-15T00:00:00.000Z");
  const result = dedupeContacts([primary, secondary], mapping, { now:new Date("2026-08-19") });
  assert.equal(result.records[0].properties.appointment_status, "CANCELED");
  assert.equal(result.records[0].properties.appointment_date, "2026-08-11");
  assert.equal(result.records[0].properties.service, "Solar");
});

test("never lets a blank newer value erase usable older information", () => {
  const older = contact(1, {
    email:"same@example.com",
    appointment_status:"SCHEDULED",
    appointment_date:"2026-08-21",
  }, "2026-08-10T00:00:00.000Z");
  const newer = contact(2, {
    email:"same@example.com",
    appointment_status:"",
    appointment_date:"",
  }, "2026-08-15T00:00:00.000Z");
  const result = dedupeContacts([older, newer], mapping, { now:new Date("2026-08-19") });
  assert.equal(result.records[0].properties.appointment_status, "SCHEDULED");
  assert.equal(result.records[0].properties.appointment_date, "2026-08-21");
});

test("normalizes common meeting outcomes", () => {
  const record = contact(1, {});
  record.scheduleItems = [{ source:"meeting", sourceLabel:"HubSpot meeting", status:"NO_SHOW", date:"2026-08-18", type:"Consultation" }];
  const snapshot = getScheduleSnapshot(record, mapping, new Date("2026-08-19"));
  assert.equal(snapshot.category, "No-show");
  assert.equal(snapshot.everScheduled, true);
});

test("uses lifecycle stage for the status breakdown and fixes Not Scheduled precedence", () => {
  const appointmentSet = contact(1, {
    email:"booked@example.com",
    lifecyclestage:"9001",
    appointment_status:"NOT SCHEDULED",
    appointment_date:"2026-08-19T15:00:00.000Z",
  });
  const lead = contact(2, {
    email:"lead@example.com",
    lifecyclestage:"lead",
    appointment_status:"SCHEDULED",
    appointment_date:"2026-08-19T16:00:00.000Z",
  });
  const report = buildReport([appointmentSet, lead], {
    mapping,
    propertyDefinitions:{
      lifecyclestage:{ options:[
        { value:"9001", label:"Appointment Set" },
        { value:"lead", label:"Lead" },
      ] },
    },
    rangeStart:"2026-08-19T00:00:00.000Z",
    rangeEnd:"2026-08-20T00:00:00.000Z",
    now:new Date("2026-08-20T12:00:00.000Z"),
  });
  assert.equal(report.appointmentRows.find((row) => row.id === "1").scheduleCategory, "Scheduled");
  assert.equal(report.appointmentRows.find((row) => row.id === "2").scheduleCategory, "Not scheduled");
  assert.equal(report.statuses.find((item) => item.label === "Scheduled").count, 1);
  assert.equal(report.statuses.find((item) => item.label === "Not scheduled").count, 1);
});

test("normalizes Velocity appointment outcomes", () => {
  for (const [status, category] of [["Sold","Completed"],["Sat","Completed"],["No Sit","No-show"],["Porched","No-show"],["DQ","Canceled"]]) {
    const snapshot = getScheduleSnapshot(contact(1, { appointment_status:status, appointment_date:"2026-08-18" }), mapping, new Date("2026-08-19"));
    assert.equal(snapshot.category, category, status);
    assert.equal(snapshot.everScheduled, true, status);
  }
});

test("classifies Roofing and Solar without duplicating the overall row", () => {
  assert.deepEqual(classifyServiceSegments("Retail Roofing"), ["Roofing"]);
  assert.deepEqual(classifyServiceSegments("Solar"), ["Solar"]);
  assert.deepEqual(classifyServiceSegments("Roofing & Solar"), ["Roofing", "Solar"]);
  assert.deepEqual(classifyServiceSegments("Unassigned"), []);
});

test("excludes only Offline Sources contacts whose drill-down is Ahoy-Connection", () => {
  assert.equal(isOfflineAhoyConnectionContact(contact(1, { hs_analytics_source:"OFFLINE", hs_analytics_source_data_1:"Ahoy-Connection" })), true);
  assert.equal(isOfflineAhoyConnectionContact(contact(2, { hs_analytics_source:"Offline Sources", hs_analytics_source_data_2:"ahoy connection" })), true);
  assert.equal(isOfflineAhoyConnectionContact(contact(5, { hs_analytics_source:"OFFLINE_SOURCES", hs_analytics_source_data_2:"Created by Ahoy-Connection integration" })), true);
  assert.equal(isOfflineAhoyConnectionContact(contact(6, { hs_analytics_source:"OFFLINE", hs_analytics_source_data_2:"48415030" })), true);
  assert.equal(isOfflineAhoyConnectionContact(contact(3, { hs_analytics_source:"PAID_SOCIAL", hs_analytics_source_data_1:"Ahoy-Connection" })), false);
  assert.equal(isOfflineAhoyConnectionContact(contact(7, { hs_analytics_source:"PAID_SOCIAL", hs_analytics_source_data_2:"48415030" })), false);
  assert.equal(isOfflineAhoyConnectionContact(contact(4, { hs_analytics_source:"OFFLINE", hs_analytics_source_data_1:"Trade show" })), false);
});

test("recognizes LEADer source labels and internal option values", () => {
  const definitions = {
    lead_source:{ options:[{ value:"81234", label:"LEADer" }, { value:"55", label:"Referral" }] },
  };
  assert.equal(isLeaderSourceContact(contact(1, { lead_source:"LEADer" }), ["lead_source"], definitions), true);
  assert.equal(isLeaderSourceContact(contact(2, { lead_source:"leader" }), ["lead_source"], definitions), true);
  assert.equal(isLeaderSourceContact(contact(3, { lead_source:"81234" }), ["lead_source"], definitions), true);
  assert.equal(isLeaderSourceContact(contact(4, { lead_source:"55" }), ["lead_source"], definitions), false);
  assert.equal(isLeaderSourceContact(contact(5, { lead_source:"Leaderboard" }), ["lead_source"], definitions), false);
});

test("recommends Velocity's service and original traffic source fields", () => {
  const properties = [
    { name:"appointment_set_as", label:"Appointment Set As" },
    { name:"appointment_status", label:"Appointment Status" },
    { name:"appointment_date__time", label:"Appointment Date & Time", type:"datetime" },
    { name:"appointment_type_2", label:"Appointment Type" },
    { name:"hs_analytics_source", label:"Original Traffic Source" },
    { name:"hs_analytics_source_data_1", label:"Original Traffic Source Drill-Down 1" },
    { name:"hubspot_owner_id", label:"Contact owner" },
  ];
  assert.deepEqual(recommendMapping(properties), {
    service:"appointment_set_as",
    appointmentStatus:"appointment_status",
    appointmentDate:"appointment_date__time",
    appointmentType:"appointment_type_2",
    leadSource:"hs_analytics_source",
    leadSubsource:"hs_analytics_source_data_1",
    owner:"hubspot_owner_id",
  });
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
  assert.deepEqual(report.serviceSegments.map((item) => [item.segment,item.leads,item.appointmentSet]), [
    ["Roofing",1,1],
    ["Solar",1,0],
  ]);
});

test("counts combined Roofing and Solar leads in both without duplicating the overall total", () => {
  const records = [
    contact(1, { email:"roof@example.com", service:"Retail Roofing", source:"PAID_SEARCH" }),
    contact(2, { email:"solar@example.com", service:"Solar", source:"PAID_SOCIAL" }),
    contact(3, { email:"both@example.com", service:"Roofing & Solar", source:"REFERRALS" }),
  ];
  const report = buildReport(records, { mapping, now:new Date("2026-08-19") });
  assert.equal(report.summary.uniqueLeads, 3);
  assert.deepEqual(report.serviceSegments.map((item) => [item.segment,item.leads]), [["Roofing",2],["Solar",2]]);
  assert.equal(report.rows.find((row) => row.id === "1").leadSource, "Paid Search");
  assert.equal(report.rows.find((row) => row.id === "2").leadSource, "Paid Social");
  assert.equal(report.rows.find((row) => row.id === "3").leadSource, "Referrals");
});
