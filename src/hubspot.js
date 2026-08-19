import { STANDARD_PROPERTIES } from "./report.js";

const API_BASE = "https://api.hubapi.com";
const CONTACT_SEARCH_PATH = "/crm/v3/objects/contacts/search";

export class HubSpotError extends Error {
  constructor(message, status = 500, details = {}) {
    super(message);
    this.name = "HubSpotError";
    this.status = status;
    this.details = details;
  }
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function chunks(values, size) {
  const output = [];
  for (let index = 0; index < values.length; index += size) output.push(values.slice(index, index + size));
  return output;
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function readJson(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { message: text.slice(0, 500) };
  }
}

function friendlyApiMessage(payload, status) {
  if (status === 401) return "HubSpot rejected the access token. Check that the private-app token is current.";
  if (status === 403) return "The HubSpot private app is missing a required read permission.";
  if (status === 429) return "HubSpot is rate limiting requests. Try the refresh again in a moment.";
  return payload?.message || `HubSpot returned HTTP ${status}.`;
}

export async function hubspotJson(token, path, options = {}, attempt = 0) {
  if (!token) throw new HubSpotError("HUBSPOT_ACCESS_TOKEN is not configured.", 503);
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if ((response.status === 429 || response.status >= 500) && attempt < 3) {
    const retryHeader = Number(response.headers.get("retry-after"));
    const delay = Number.isFinite(retryHeader) && retryHeader > 0
      ? Math.min(retryHeader * 1000, 5000)
      : 350 * (2 ** attempt);
    await wait(delay);
    return hubspotJson(token, path, options, attempt + 1);
  }

  const payload = await readJson(response);
  if (!response.ok) {
    throw new HubSpotError(friendlyApiMessage(payload, response.status), response.status, {
      category: payload?.category,
      subCategory: payload?.subCategory,
      correlationId: payload?.correlationId,
      context: payload?.errors?.[0]?.context,
    });
  }
  return payload;
}

export async function fetchContactProperties(token) {
  const payload = await hubspotJson(token, "/crm/v3/properties/contacts?archived=false");
  return (payload.results || []).filter((property) => !property.archived);
}

export async function fetchOwners(token) {
  const owners = [];
  let after = "";
  do {
    const query = new URLSearchParams({ limit: "500", archived: "false" });
    if (after) query.set("after", after);
    const payload = await hubspotJson(token, `/crm/v3/owners?${query}`);
    owners.push(...(payload.results || []));
    after = payload.paging?.next?.after || "";
  } while (after);
  return owners;
}

async function searchContactWindow(token, startMs, endMs, properties, depth = 0) {
  const initialBody = {
    filterGroups: [{
      filters: [
        { propertyName: "createdate", operator: "GTE", value: String(startMs) },
        { propertyName: "createdate", operator: "LT", value: String(endMs) },
      ],
    }],
    properties,
    sorts: [{ propertyName: "createdate", direction: "DESCENDING" }],
    limit: 200,
  };

  const first = await hubspotJson(token, CONTACT_SEARCH_PATH, {
    method: "POST",
    body: JSON.stringify(initialBody),
  });

  if ((first.total || 0) >= 10000 && depth < 12 && endMs - startMs > 60000) {
    const midpoint = Math.floor((startMs + endMs) / 2);
    const [left, right] = await Promise.all([
      searchContactWindow(token, startMs, midpoint, properties, depth + 1),
      searchContactWindow(token, midpoint, endMs, properties, depth + 1),
    ]);
    const byId = new Map([...left, ...right].map((record) => [String(record.id), record]));
    return [...byId.values()];
  }

  const results = [...(first.results || [])];
  let after = first.paging?.next?.after || "";
  let pageCount = 1;
  while (after) {
    if (pageCount >= 50) {
      throw new HubSpotError("The selected period contains more than HubSpot's 10,000-result search window. Use a shorter date range.", 422);
    }
    const payload = await hubspotJson(token, CONTACT_SEARCH_PATH, {
      method: "POST",
      body: JSON.stringify({ ...initialBody, after }),
    });
    results.push(...(payload.results || []));
    after = payload.paging?.next?.after || "";
    pageCount += 1;
  }
  return results;
}

export async function fetchContacts(token, start, end, mapping) {
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    throw new HubSpotError("Choose a valid start and end date.", 400);
  }
  const properties = unique([
    ...STANDARD_PROPERTIES,
    mapping.service,
    mapping.appointmentStatus,
    mapping.appointmentDate,
    mapping.appointmentType,
    mapping.leadSource,
    mapping.leadSubsource,
    mapping.owner,
  ]);
  return searchContactWindow(token, startMs, endMs, properties);
}

function parseAssociationResponse(payload) {
  const map = new Map();
  for (const result of payload.results || []) {
    const contactId = String(result.from?.id || result.fromId || result.id || "");
    if (!contactId) continue;
    const ids = (result.to || result.results || [])
      .map((target) => target.toObjectId || target.id)
      .filter(Boolean)
      .map(String);
    map.set(contactId, ids);
  }
  return map;
}

async function fetchAssociations(token, contactIds, objectType) {
  const output = new Map();
  for (const batch of chunks(contactIds, 1000)) {
    const requestOptions = {
      method: "POST",
      body: JSON.stringify({ inputs: batch.map((id) => ({ id })) }),
    };
    let payload;
    try {
      payload = await hubspotJson(token, `/crm/associations/2026-03/contacts/${objectType}/batch/read`, requestOptions);
    } catch (error) {
      if (!(error instanceof HubSpotError) || error.status !== 404) throw error;
      payload = await hubspotJson(token, `/crm/v4/associations/contacts/${objectType}/batch/read`, requestOptions);
    }
    for (const [contactId, ids] of parseAssociationResponse(payload)) output.set(contactId, ids);
  }
  return output;
}

async function batchReadObjects(token, objectType, objectIds, properties, versioned = false) {
  const records = new Map();
  const pathPrefix = versioned ? "/crm/objects/2026-03" : "/crm/v3/objects";
  for (const batch of chunks(unique(objectIds), 100)) {
    const payload = await hubspotJson(token, `${pathPrefix}/${objectType}/batch/read`, {
      method: "POST",
      body: JSON.stringify({
        properties,
        inputs: batch.map((id) => ({ id })),
      }),
    });
    for (const record of payload.results || []) records.set(String(record.id), record);
  }
  return records;
}

function attachItems(contacts, associationMap, objectMap, mapper) {
  for (const contact of contacts) {
    const ids = associationMap.get(String(contact.id)) || [];
    const items = ids.map((id) => objectMap.get(String(id))).filter(Boolean).map(mapper);
    contact.scheduleItems = [...(contact.scheduleItems || []), ...items];
  }
}

async function addAppointments(token, contacts) {
  const associations = await fetchAssociations(token, contacts.map((contact) => String(contact.id)), "appointments");
  const appointmentIds = [...associations.values()].flat();
  if (!appointmentIds.length) return 0;
  const appointments = await batchReadObjects(token, "appointments", appointmentIds, [
    "hs_appointment_name",
    "hs_appointment_start",
    "hs_appointment_end",
    "hs_appointment_status",
    "hubspot_owner_id",
  ], true);
  attachItems(contacts, associations, appointments, (record) => ({
    id: String(record.id),
    source: "appointment",
    sourceLabel: "HubSpot appointment",
    status: record.properties?.hs_appointment_status || "",
    date: record.properties?.hs_appointment_start || "",
    type: record.properties?.hs_appointment_name || "",
    title: record.properties?.hs_appointment_name || "",
  }));
  return appointmentIds.length;
}

async function addMeetings(token, contacts) {
  const associations = await fetchAssociations(token, contacts.map((contact) => String(contact.id)), "meetings");
  const meetingIds = [...associations.values()].flat();
  if (!meetingIds.length) return 0;
  const meetings = await batchReadObjects(token, "meetings", meetingIds, [
    "hs_timestamp",
    "hs_meeting_title",
    "hs_meeting_start_time",
    "hs_meeting_end_time",
    "hs_meeting_outcome",
    "hs_activity_type",
    "hubspot_owner_id",
  ]);
  attachItems(contacts, associations, meetings, (record) => ({
    id: String(record.id),
    source: "meeting",
    sourceLabel: "HubSpot meeting",
    status: record.properties?.hs_meeting_outcome || "",
    date: record.properties?.hs_meeting_start_time || record.properties?.hs_timestamp || "",
    type: record.properties?.hs_activity_type || "",
    title: record.properties?.hs_meeting_title || "",
  }));
  return meetingIds.length;
}

export async function addScheduleActivities(token, contacts, scheduleSource = "properties") {
  const warnings = [];
  const counts = { appointments: 0, meetings: 0 };
  if (!contacts.length || scheduleSource === "properties") return { warnings, counts };

  if (["auto", "appointments"].includes(scheduleSource)) {
    try {
      counts.appointments = await addAppointments(token, contacts);
    } catch (error) {
      if (scheduleSource === "appointments") throw error;
      warnings.push("HubSpot appointment objects were unavailable, so the dashboard continued with meetings and contact fields.");
    }
  }

  if (["auto", "meetings"].includes(scheduleSource)) {
    try {
      counts.meetings = await addMeetings(token, contacts);
    } catch (error) {
      if (scheduleSource === "meetings") throw error;
      warnings.push("HubSpot meeting activities were unavailable, so the dashboard continued with appointments and contact fields.");
    }
  }

  return { warnings, counts };
}
