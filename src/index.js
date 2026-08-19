import { DASHBOARD_HTML, SETUP_HTML } from "./ui.js";
import { buildReport, DEFAULT_MAPPING, recommendMapping } from "./report.js";
import {
  addScheduleActivities,
  fetchContactProperties,
  fetchContacts,
  fetchOwners,
  HubSpotError,
} from "./hubspot.js";
import { buildDemoData } from "./demo.js";

const SECURITY_HEADERS = {
  "Content-Security-Policy": "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Cache-Control": "no-store, private",
};

function response(body, status = 200, headers = {}) {
  return new Response(body, { status, headers: { ...SECURITY_HEADERS, ...headers } });
}

function json(payload, status = 200) {
  return response(JSON.stringify(payload), status, { "Content-Type": "application/json; charset=utf-8" });
}

function html(payload, status = 200) {
  return response(payload, status, { "Content-Type": "text/html; charset=utf-8" });
}

function constantTimeEqual(a, b) {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

function decodeBasicAuth(value) {
  if (!value?.startsWith("Basic ")) return null;
  try {
    const decoded = atob(value.slice(6));
    const separator = decoded.indexOf(":");
    if (separator < 0) return null;
    return { username: decoded.slice(0, separator), password: decoded.slice(separator + 1) };
  } catch {
    return null;
  }
}

function isAuthorized(request, env) {
  if (env.ALLOW_UNAUTHENTICATED === "true") return true;
  if (!env.DASHBOARD_PASSWORD) return false;
  const credentials = decodeBasicAuth(request.headers.get("Authorization"));
  if (!credentials) return false;
  const expectedUser = env.DASHBOARD_USERNAME || "velocity";
  return constantTimeEqual(credentials.username, expectedUser)
    && constantTimeEqual(credentials.password, env.DASHBOARD_PASSWORD);
}

function authenticationResponse(env) {
  if (!env.DASHBOARD_PASSWORD && env.ALLOW_UNAUTHENTICATED !== "true") {
    return html(SETUP_HTML, 503);
  }
  return response("Authentication required", 401, {
    "Content-Type": "text/plain; charset=utf-8",
    "WWW-Authenticate": 'Basic realm="Velocity Lead Dashboard", charset="UTF-8"',
  });
}

function ownerMap(owners) {
  return Object.fromEntries((owners || []).map((owner) => {
    const name = [owner.firstName, owner.lastName].filter(Boolean).join(" ") || owner.email || `Owner ${owner.id}`;
    return [String(owner.id), name];
  }));
}

function propertyMap(properties) {
  return Object.fromEntries((properties || []).map((property) => [property.name, {
    name: property.name,
    label: property.label,
    type: property.type,
    fieldType: property.fieldType,
    groupName: property.groupName,
    options: (property.options || []).map((option) => ({ label: option.label, value: option.value })),
  }]));
}

function hubspotToken(env) {
  return env.HUBSPOT_ACCESS_TOKEN || "";
}

function serializeProperties(properties) {
  return (properties || []).map((property) => ({
    name: property.name,
    label: property.label,
    type: property.type,
    fieldType: property.fieldType,
    groupName: property.groupName,
    options: (property.options || []).map((option) => ({ label: option.label, value: option.value })),
  })).sort((a, b) => (a.label || a.name).localeCompare(b.label || b.name));
}

async function bootstrap(env) {
  const token = hubspotToken(env);
  if (!token) {
    return json({
      connected: false,
      demoMode: true,
      properties: [],
      owners: [],
      recommendedMapping: DEFAULT_MAPPING,
      message: "HubSpot is not connected yet. Demo data is active until the private-app token is added.",
    });
  }

  const warnings = [];
  let properties = [];
  let owners = [];
  try {
    [properties, owners] = await Promise.all([
      fetchContactProperties(token),
      fetchOwners(token).catch(() => {
        warnings.push("Contact owners could not be loaded. Owner IDs will still appear in reports.");
        return [];
      }),
    ]);
  } catch (error) {
    if (error instanceof HubSpotError && error.status === 403) {
      return json({
        connected: true,
        schemaAccess: false,
        demoMode: false,
        properties: [],
        owners: [],
        recommendedMapping: DEFAULT_MAPPING,
        warnings: ["The token can be saved, but property discovery needs crm.schemas.contacts.read."],
      });
    }
    throw error;
  }

  return json({
    connected: true,
    schemaAccess: true,
    demoMode: false,
    properties: serializeProperties(properties),
    owners: owners.map((owner) => ({ id: String(owner.id), name: ownerMap([owner])[String(owner.id)] })),
    recommendedMapping: { ...DEFAULT_MAPPING, ...recommendMapping(properties) },
    warnings,
  });
}

function parseMapping(mapping) {
  const output = { ...DEFAULT_MAPPING };
  for (const key of Object.keys(output)) {
    const value = mapping?.[key];
    if (typeof value === "string" && value.length <= 200) output[key] = value.trim();
  }
  return output;
}

function validateRange(start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate <= startDate) {
    throw new HubSpotError("Choose a valid start and end date.", 400);
  }
  const days = (endDate - startDate) / 86400000;
  if (days > 366) throw new HubSpotError("Choose a date range of 366 days or less.", 400);
}

async function liveReport(request, env) {
  const token = hubspotToken(env);
  if (!token) {
    return json({ error: "HubSpot is not connected. Add HUBSPOT_ACCESS_TOKEN or use demo mode." }, 503);
  }
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 30000) return json({ error: "The report request is too large." }, 413);
  const body = await request.json();
  const start = body.start;
  const end = body.end;
  validateRange(start, end);
  const mapping = parseMapping(body.mapping);
  const dedupeBy = ["email_phone", "email", "phone"].includes(body.dedupeBy) ? body.dedupeBy : "email_phone";
  const scheduleSource = ["properties", "auto", "meetings", "appointments"].includes(body.scheduleSource)
    ? body.scheduleSource
    : "properties";

  let propertyDefinitions = {};
  let owners = {};
  const warnings = [];
  const [propertyResult, ownerResult] = await Promise.allSettled([
    fetchContactProperties(token),
    fetchOwners(token),
  ]);
  if (propertyResult.status === "fulfilled") propertyDefinitions = propertyMap(propertyResult.value);
  else warnings.push("Property labels were unavailable; raw HubSpot values are shown.");
  if (ownerResult.status === "fulfilled") owners = ownerMap(ownerResult.value);
  else warnings.push("Owner names were unavailable; owner IDs are shown.");

  const contacts = await fetchContacts(token, start, end, mapping);
  const activityResult = await addScheduleActivities(token, contacts, scheduleSource);
  warnings.push(...activityResult.warnings);

  const report = buildReport(contacts, {
    mapping,
    propertyDefinitions,
    owners,
    dedupeBy,
    now: new Date(),
  });
  return json({
    ...report,
    mode: "live",
    range: { start, end },
    mapping,
    scheduleSource,
    activityCounts: activityResult.counts,
    warnings,
  });
}

async function demoReport(request) {
  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const demo = buildDemoData(new Date());
  const mapping = { ...demo.mapping, ...parseMapping(body.mapping) };
  // Preserve the demo defaults when the caller has not mapped custom fields yet.
  for (const [key, value] of Object.entries(demo.mapping)) if (!mapping[key]) mapping[key] = value;
  const report = buildReport(demo.records, {
    mapping,
    propertyDefinitions: demo.propertyDefinitions,
    owners: demo.owners,
    dedupeBy: body.dedupeBy || "email_phone",
    now: new Date(),
  });
  return json({
    ...report,
    mode: "demo",
    range: { start: body.start || "", end: body.end || "" },
    mapping,
    scheduleSource: "auto",
    activityCounts: { appointments: 12, meetings: 14 },
    warnings: ["Demo data is active. Connect the HubSpot token to load your real leads."],
  });
}

function errorResponse(error) {
  if (error instanceof HubSpotError) {
    return json({ error: error.message, details: error.details }, Math.min(Math.max(error.status, 400), 599));
  }
  if (error instanceof SyntaxError) return json({ error: "The request body was not valid JSON." }, 400);
  return json({ error: "The dashboard could not finish this request. Try again." }, 500);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return json({
        ok: true,
        authenticationConfigured: Boolean(env.DASHBOARD_PASSWORD) || env.ALLOW_UNAUTHENTICATED === "true",
        hubspotConfigured: Boolean(hubspotToken(env)),
      });
    }

    if (!isAuthorized(request, env)) return authenticationResponse(env);

    try {
      if (request.method === "GET" && url.pathname === "/") return html(DASHBOARD_HTML);
      if (request.method === "GET" && url.pathname === "/api/bootstrap") return bootstrap(env);
      if (request.method === "POST" && url.pathname === "/api/report") return liveReport(request, env);
      if (request.method === "POST" && url.pathname === "/api/demo") return demoReport(request);
      if (request.method === "OPTIONS") return response("", 204, { Allow: "GET, POST, OPTIONS" });
      return json({ error: "Not found" }, 404);
    } catch (error) {
      return errorResponse(error);
    }
  },
};
