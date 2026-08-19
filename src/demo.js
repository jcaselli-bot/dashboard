const FIRST_NAMES = ["Avery", "Jordan", "Taylor", "Morgan", "Cameron", "Riley", "Casey", "Logan", "Drew", "Quinn", "Sam", "Reese"];
const LAST_NAMES = ["Parker", "Rivera", "Miller", "Wilson", "Brown", "Davis", "Martinez", "Clark", "Lewis", "Young", "Hall", "King"];
const SERVICES = ["Roof Replacement", "Solar", "Roof + Solar", "Roof Repair", "Unassigned"];
const SOURCES = ["PAID_SOCIAL", "PAID_SEARCH", "ORGANIC_SEARCH", "REFERRALS", "DIRECT_TRAFFIC", "OFFLINE"];
const STATUSES = ["SCHEDULED", "COMPLETED", "", "", "CANCELED", "NO_SHOW", "SCHEDULED", "", "RESCHEDULED"];

function isoDaysAgo(now, days, hour = 15) {
  const date = new Date(now);
  date.setUTCDate(date.getUTCDate() - days);
  date.setUTCHours(hour, (days * 7) % 60, 0, 0);
  return date.toISOString();
}

export function buildDemoData(now = new Date()) {
  const records = [];
  for (let index = 0; index < 44; index += 1) {
    const first = FIRST_NAMES[index % FIRST_NAMES.length];
    const last = LAST_NAMES[(index * 5) % LAST_NAMES.length];
    const createdAt = isoDaysAgo(now, index % 21, 11 + (index % 7));
    const status = STATUSES[index % STATUSES.length];
    const booked = Boolean(status);
    const service = SERVICES[(index * 3) % SERVICES.length];
    const phoneNumber = `856555${String(1000 + index).slice(-4)}`;
    const record = {
      id: String(900000 + index),
      createdAt,
      updatedAt: isoDaysAgo(now, Math.max(0, (index % 21) - 2), 16),
      properties: {
        firstname: first,
        lastname: last,
        email: index % 13 === 0 ? "" : `${first}.${last}.${index}@example.com`.toLowerCase(),
        phone: index % 11 === 0 ? "" : `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6)}`,
        createdate: createdAt,
        lastmodifieddate: isoDaysAgo(now, Math.max(0, (index % 21) - 2), 16),
        service_interest: service === "Unassigned" ? "" : service,
        appointment_status: index % 4 === 0 ? status : "",
        appointment_date: index % 4 === 0 && status ? isoDaysAgo(now, -(index % 6), 18) : "",
        appointment_type: index % 4 === 0 && status ? "In-home consultation" : "",
        lifecyclestage: booked ? "appointment_set" : "lead",
        hs_analytics_source: SOURCES[index % SOURCES.length],
        hubspot_owner_id: String(100 + (index % 4)),
      },
      propertiesWithHistory: {
        lifecyclestage: [
          { value:"lead", timestamp:createdAt, sourceType:"CRM_UI" },
          ...(booked ? [{ value:"appointment_set", timestamp:isoDaysAgo(now, Math.max(0, (index % 21) - 1), 16), sourceType:"CRM_UI" }] : []),
        ],
      },
      scheduleItems: index % 4 !== 0 && status ? [{
        id: `meeting-${index}`,
        source: index % 2 ? "meeting" : "appointment",
        sourceLabel: index % 2 ? "HubSpot meeting" : "HubSpot appointment",
        status,
        date: isoDaysAgo(now, -(index % 5), 14 + (index % 4)),
        type: index % 3 === 0 ? "Virtual quote" : "In-home consultation",
        title: "Project consultation",
      }] : [],
    };
    records.push(record);
  }

  // Three duplicate groups. The second copy has richer appointment data and should win.
  [2, 15, 27].forEach((sourceIndex, duplicateIndex) => {
    const source = records[sourceIndex];
    records.push({
      ...source,
      id: String(990000 + duplicateIndex),
      createdAt: isoDaysAgo(now, Math.max(0, sourceIndex % 21 - 1), 13),
      updatedAt: isoDaysAgo(now, 0, 17),
      properties: {
        ...source.properties,
        appointment_status: "SCHEDULED",
        appointment_date: isoDaysAgo(now, -(duplicateIndex + 1), 19),
        appointment_type: "In-home consultation",
        lifecyclestage: "appointment_set",
      },
      propertiesWithHistory: {
        lifecyclestage: [
          ...(source.propertiesWithHistory?.lifecyclestage || []),
          { value:"appointment_set", timestamp:isoDaysAgo(now, 0, 17 + duplicateIndex), sourceType:"CRM_UI" },
        ],
      },
      scheduleItems: [{
        id: `appointment-duplicate-${duplicateIndex}`,
        source: "appointment",
        sourceLabel: "HubSpot appointment",
        status: "SCHEDULED",
        date: isoDaysAgo(now, -(duplicateIndex + 1), 19),
        type: "In-home consultation",
        title: "Roofing consultation",
      }],
    });
  });

  return {
    records,
    propertyDefinitions: {
      service_interest: { name: "service_interest", label: "Service interest", type: "enumeration", options: [] },
      appointment_status: { name: "appointment_status", label: "Appointment status", type: "enumeration", options: [] },
      appointment_date: { name: "appointment_date", label: "Appointment date", type: "datetime", options: [] },
      appointment_type: { name: "appointment_type", label: "Appointment type", type: "enumeration", options: [] },
      hs_analytics_source: { name: "hs_analytics_source", label: "Original source", type: "enumeration", options: [] },
      lifecyclestage: { name: "lifecyclestage", label: "Lifecycle stage", type: "enumeration", options: [
        { label:"Lead", value:"lead" },
        { label:"Appointment Set", value:"appointment_set" },
      ] },
      hubspot_owner_id: { name: "hubspot_owner_id", label: "Contact owner", type: "enumeration", options: [] },
    },
    owners: {
      100: "Gianna P.",
      101: "Mark C.",
      102: "Frank W.",
      103: "Sales Team",
    },
    mapping: {
      service: "service_interest",
      appointmentStatus: "appointment_status",
      appointmentDate: "appointment_date",
      appointmentType: "appointment_type",
      leadSource: "hs_analytics_source",
      leadSubsource: "",
      owner: "hubspot_owner_id",
    },
  };
}
