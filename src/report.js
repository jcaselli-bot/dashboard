const SCHEDULE_CATEGORIES = [
  "Scheduled",
  "Rescheduled",
  "Completed",
  "Canceled",
  "No-show",
  "Other / review",
  "Not scheduled",
];

const BLANKISH = new Set(["", "null", "undefined", "n/a", "na", "none", "unknown", "-"]);
const AHOY_CONNECTION_INTERNAL_VALUES = new Set(["48415030"]);
const LIFECYCLE_STAGE_PROPERTY = "lifecyclestage";

export const STANDARD_PROPERTIES = [
  "firstname",
  "lastname",
  "email",
  "phone",
  "mobilephone",
  "createdate",
  "lastmodifieddate",
  "hubspot_owner_id",
  "hs_analytics_source",
  "hs_analytics_source_data_1",
  "hs_analytics_source_data_2",
  "lifecyclestage",
  "lead_status",
];

export const DEFAULT_MAPPING = {
  service: "",
  appointmentStatus: "",
  appointmentDate: "",
  appointmentType: "",
  leadSource: "hs_analytics_source",
  leadSubsource: "hs_analytics_source_data_1",
  owner: "hubspot_owner_id",
};

function clean(value) {
  if (value === null || value === undefined) return "";
  const stringValue = String(value).trim();
  return BLANKISH.has(stringValue.toLowerCase()) ? "" : stringValue;
}

export function classifyServiceSegments(value) {
  const normalized = clean(value).toLowerCase();
  const segments = [];
  if (/roof|shingle|storm|insurance/.test(normalized)) segments.push("Roofing");
  if (/solar|photovoltaic|\bpv\b/.test(normalized)) segments.push("Solar");
  return segments;
}

export function isOfflineAhoyConnectionContact(record) {
  const props = record?.properties || {};
  const source = clean(props.hs_analytics_source).toLowerCase().replace(/[^a-z0-9]+/g, " ");
  const rawDetails = [
    props.hs_analytics_source_data_1,
    props.hs_analytics_source_data_2,
  ].map(clean);
  const details = rawDetails.map((value) => value.toLowerCase().replace(/[^a-z0-9]+/g, " "));
  const isOffline = source === "offline" || source === "offline sources";
  const isAhoyConnection = rawDetails.some((value) => AHOY_CONNECTION_INTERNAL_VALUES.has(value))
    || details.some((value) => value.includes("ahoy connection"));
  return isOffline && isAhoyConnection;
}

function normalizedComparableLabel(value) {
  return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function isLeaderSourceContact(record, sourceProperties = [], propertyDefinitions = {}) {
  const props = record?.properties || {};
  const propertyNames = [...new Set([
    ...sourceProperties,
    "lead_source",
    "leadsource",
  ].filter(Boolean))];
  return propertyNames.some((propertyName) => {
    const rawValue = clean(props[propertyName]);
    if (!rawValue) return false;
    const displayedValue = displayPropertyValue(propertyName, rawValue, propertyDefinitions);
    return [rawValue, displayedValue]
      .flatMap((value) => String(value).split(";"))
      .some((value) => normalizedComparableLabel(value) === "leader");
  });
}

export function normalizeEmail(value) {
  return clean(value).toLowerCase().replace(/^mailto:/, "");
}

export function normalizePhone(value) {
  const digits = clean(value).replace(/\D/g, "");
  if (digits.length < 10) return "";
  return digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
}

export function parseDateValue(value) {
  const normalized = clean(value);
  if (!normalized) return null;
  const numeric = Number(normalized);
  const date = Number.isFinite(numeric) && numeric > 1000000000
    ? new Date(numeric < 100000000000 ? numeric * 1000 : numeric)
    : new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function recordCreatedInRange(record, start, end) {
  const created = parseDateValue(record?.createdAt || record?.properties?.createdate)?.getTime();
  const startMs = parseDateValue(start)?.getTime();
  const endMs = parseDateValue(end)?.getTime();
  if (![created, startMs, endMs].every(Number.isFinite)) return false;
  return created >= startMs && created < endMs;
}

function dateValueInRange(value, start, end) {
  const dateMs = parseDateValue(value)?.getTime();
  const startMs = parseDateValue(start)?.getTime();
  const endMs = parseDateValue(end)?.getTime();
  if (![dateMs, startMs, endMs].every(Number.isFinite)) return false;
  return dateMs >= startMs && dateMs < endMs;
}

function categoryFromStatus(status, dateValue, source = "property") {
  const value = clean(status).toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
  if (/no\s*show|noshow|did not show|missed/.test(value)) return "No-show";
  if (/no\s*sit|porched/.test(value)) return "No-show";
  if (/cancel|declin|called off/.test(value)) return "Canceled";
  if (/^dq$|disqualif|credit fail/.test(value)) return "Canceled";
  if (/resched|rebook/.test(value)) return "Rescheduled";
  if (/^sold$|^sat$|^sit$/.test(value)) return "Completed";
  if (/complete|completed|held|showed|attended|met|finished|done/.test(value)) return "Completed";
  if (/scheduled|booked|confirmed|appointment set|appt set|set appointment/.test(value)) return "Scheduled";
  if (/not scheduled|unscheduled|no appointment|not set|new lead|new|open|contacting|attempting|follow.?up|unqualified|bad lead|duplicate/.test(value)) {
    return "Not scheduled";
  }
  if (dateValue && source !== "property") return "Scheduled";
  if (dateValue && !value) return "Scheduled";
  return value ? "Other / review" : "Not scheduled";
}

function activityPriority(activity, nowMs) {
  const date = parseDateValue(activity.date);
  const category = categoryFromStatus(activity.status, date, activity.source);
  const isFuture = date && date.getTime() >= nowMs;
  const base = {
    Scheduled: isFuture ? 120 : 82,
    Rescheduled: isFuture ? 115 : 78,
    Completed: 105,
    "No-show": 62,
    Canceled: 58,
    "Other / review": 45,
    "Not scheduled": 0,
  }[category] ?? 0;
  const completeness = [activity.status, activity.date, activity.type, activity.title].filter(clean).length;
  return base + completeness * 3 + (date ? Math.min(date.getTime() / 1e15, 1) : 0);
}

export function getScheduleSnapshot(record, mapping = DEFAULT_MAPPING, now = new Date()) {
  const props = record.properties || {};
  const propertySchedule = {
    source: "property",
    sourceLabel: "Contact property",
    status: clean(props[mapping.appointmentStatus]),
    date: clean(props[mapping.appointmentDate]),
    type: clean(props[mapping.appointmentType]),
    title: "",
    id: "",
  };
  const candidates = [propertySchedule, ...(record.scheduleItems || [])]
    .filter((item) => [item.status, item.date, item.type, item.title].some(clean));

  if (!candidates.length) {
    return {
      ...propertySchedule,
      category: "Not scheduled",
      everScheduled: false,
      completeness: 0,
    };
  }

  candidates.sort((a, b) => activityPriority(b, now.getTime()) - activityPriority(a, now.getTime()));
  const selected = candidates[0];
  const date = parseDateValue(selected.date);
  const category = categoryFromStatus(selected.status, date, selected.source);
  const everScheduled = !["Not scheduled", "Other / review"].includes(category) || Boolean(date);
  return {
    ...selected,
    category,
    everScheduled,
    completeness: [selected.status, selected.date, selected.type, selected.title].filter(clean).length,
  };
}

function contactCompleteness(record, mapping) {
  const props = record.properties || {};
  return [
    props.firstname,
    props.lastname,
    props.email,
    props.phone,
    props.mobilephone,
    props[mapping.service],
    props[mapping.leadSource],
    props[mapping.owner],
  ].filter(clean).length;
}

function recordCreatedTime(record) {
  return parseDateValue(record.createdAt || record.properties?.createdate)?.getTime();
}

function recordUpdatedTime(record) {
  return parseDateValue(record.updatedAt || record.properties?.lastmodifieddate)?.getTime();
}

export function schedulingScore(record, mapping = DEFAULT_MAPPING, now = new Date()) {
  const snapshot = getScheduleSnapshot(record, mapping, now);
  const categoryPoints = {
    Scheduled: 40,
    Rescheduled: 38,
    Completed: 36,
    "No-show": 28,
    Canceled: 26,
    "Other / review": 12,
    "Not scheduled": 0,
  }[snapshot.category] ?? 0;
  return categoryPoints + snapshot.completeness * 8 + (snapshot.date ? 12 : 0) + (snapshot.type ? 4 : 0);
}

class UnionFind {
  constructor(size) {
    this.parent = Array.from({ length: size }, (_, index) => index);
    this.rank = new Array(size).fill(0);
  }

  find(value) {
    if (this.parent[value] !== value) this.parent[value] = this.find(this.parent[value]);
    return this.parent[value];
  }

  union(a, b) {
    const rootA = this.find(a);
    const rootB = this.find(b);
    if (rootA === rootB) return;
    if (this.rank[rootA] < this.rank[rootB]) this.parent[rootA] = rootB;
    else if (this.rank[rootA] > this.rank[rootB]) this.parent[rootB] = rootA;
    else {
      this.parent[rootB] = rootA;
      this.rank[rootA] += 1;
    }
  }
}

function canonicalComparator(mapping, now) {
  return (a, b) => {
    const aCreated = recordCreatedTime(a);
    const bCreated = recordCreatedTime(b);
    const aHasCreated = Number.isFinite(aCreated);
    const bHasCreated = Number.isFinite(bCreated);
    if (aHasCreated && bHasCreated && aCreated !== bCreated) return aCreated - bCreated;
    if (aHasCreated !== bHasCreated) return aHasCreated ? -1 : 1;

    const scheduleDelta = schedulingScore(b, mapping, now) - schedulingScore(a, mapping, now);
    if (scheduleDelta) return scheduleDelta;
    const dataDelta = contactCompleteness(b, mapping) - contactCompleteness(a, mapping);
    if (dataDelta) return dataDelta;
    const updatedDelta = (recordUpdatedTime(b) || 0) - (recordUpdatedTime(a) || 0);
    if (updatedDelta) return updatedDelta;
    return String(a.id).localeCompare(String(b.id));
  };
}

function informationRecencyComparator(a, b) {
  const aUpdated = recordUpdatedTime(a) ?? recordCreatedTime(a) ?? 0;
  const bUpdated = recordUpdatedTime(b) ?? recordCreatedTime(b) ?? 0;
  if (aUpdated !== bUpdated) return aUpdated - bUpdated;

  const aCreated = recordCreatedTime(a) ?? 0;
  const bCreated = recordCreatedTime(b) ?? 0;
  if (aCreated !== bCreated) return aCreated - bCreated;
  return String(a.id).localeCompare(String(b.id));
}

function scheduleItemKey(item) {
  const stableId = clean(item?.id);
  if (stableId) return [item?.source, stableId].map(clean).join("\u0000");
  return [item?.source, item?.status, item?.date, item?.type, item?.title]
    .map(clean)
    .join("\u0000");
}

function propertyHistoryItemKey(item) {
  return [item?.value, item?.timestamp, item?.sourceType, item?.sourceId, item?.updatedByUserId]
    .map(clean)
    .join("\u0000");
}

function mergePropertyHistories(records) {
  const histories = {};
  for (const record of records) {
    for (const [propertyName, entries] of Object.entries(record.propertiesWithHistory || {})) {
      if (!histories[propertyName]) histories[propertyName] = new Map();
      for (const entry of Array.isArray(entries) ? entries : []) {
        histories[propertyName].set(propertyHistoryItemKey(entry), entry);
      }
    }
  }
  return Object.fromEntries(Object.entries(histories).map(([propertyName, entries]) => [
    propertyName,
    [...entries.values()].sort((a, b) => (
      (parseDateValue(a?.timestamp)?.getTime() || 0) - (parseDateValue(b?.timestamp)?.getTime() || 0)
    )),
  ]));
}

export function dedupeContacts(records, mapping = DEFAULT_MAPPING, options = {}) {
  const now = options.now || new Date();
  const dedupeBy = options.dedupeBy || "email_phone";
  const uf = new UnionFind(records.length);
  const emailOwners = new Map();
  const phoneOwners = new Map();

  records.forEach((record, index) => {
    const props = record.properties || {};
    const email = normalizeEmail(props.email);
    const phones = [normalizePhone(props.phone), normalizePhone(props.mobilephone)].filter(Boolean);
    if (dedupeBy !== "phone" && email) {
      if (emailOwners.has(email)) uf.union(index, emailOwners.get(email));
      else emailOwners.set(email, index);
    }
    if (dedupeBy !== "email") {
      phones.forEach((phone) => {
        if (phoneOwners.has(phone)) uf.union(index, phoneOwners.get(phone));
        else phoneOwners.set(phone, index);
      });
    }
  });

  const groups = new Map();
  records.forEach((record, index) => {
    const root = uf.find(index);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(record);
  });

  const canonical = [];
  const duplicateGroups = [];
  for (const group of groups.values()) {
    const sorted = [...group].sort(canonicalComparator(mapping, now));
    const primary = sorted[0];
    const informationOrder = [...group].sort(informationRecencyComparator);
    const newestInformation = informationOrder[informationOrder.length - 1];
    const scheduleItemsByKey = new Map();
    for (const record of informationOrder) {
      for (const item of record.scheduleItems || []) {
        scheduleItemsByKey.set(scheduleItemKey(item), item);
      }
    }
    const scheduleItems = [...scheduleItemsByKey.values()];
    const merged = {
      ...primary,
      properties: { ...(primary.properties || {}) },
      propertiesWithHistory: mergePropertyHistories(informationOrder),
      updatedAt: newestInformation?.updatedAt
        || newestInformation?.properties?.lastmodifieddate
        || primary.updatedAt,
      scheduleItems,
      duplicateIds: sorted.slice(1).map((record) => String(record.id)),
      duplicateCount: Math.max(0, sorted.length - 1),
    };

    for (const informationSource of informationOrder) {
      for (const [key, value] of Object.entries(informationSource.properties || {})) {
        if (key !== "createdate" && clean(value)) merged.properties[key] = value;
      }
    }
    canonical.push(merged);

    if (sorted.length > 1) {
      duplicateGroups.push({
        keptId: String(primary.id),
        removedIds: sorted.slice(1).map((record) => String(record.id)),
        keptScheduleScore: schedulingScore(primary, mapping, now),
        records: sorted,
      });
    }
  }

  return {
    records: canonical,
    duplicateGroups,
    duplicatesRemoved: records.length - canonical.length,
  };
}

function optionMap(property) {
  return new Map((property?.options || []).map((option) => [String(option.value), option.label || option.value]));
}

function displayPropertyValue(propertyName, value, propertyDefinitions) {
  const normalized = clean(value);
  if (!normalized) return "";
  const property = propertyDefinitions?.[propertyName];
  const options = optionMap(property);
  const parts = normalized.includes(";") ? normalized.split(";").filter(clean) : [normalized];
  return parts.map((part) => options.get(part) || part).join(" + ");
}

function lifecycleAppointmentSetDates(record, propertyDefinitions) {
  const entries = record?.propertiesWithHistory?.[LIFECYCLE_STAGE_PROPERTY];
  if (!Array.isArray(entries)) return [];
  return [...new Set(entries
    .filter((entry) => {
      const displayed = displayPropertyValue(LIFECYCLE_STAGE_PROPERTY, entry?.value, propertyDefinitions);
      return normalizedComparableLabel(displayed || entry?.value) === "appointmentset";
    })
    .map((entry) => safeIso(entry?.timestamp))
    .filter(Boolean))]
    .sort();
}

function titleCase(value) {
  const normalized = clean(value).replace(/[_-]+/g, " ");
  if (!normalized) return "";
  return normalized.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function sourceLabel(raw) {
  const known = {
    ORGANIC_SEARCH: "Organic Search",
    PAID_SEARCH: "Paid Search",
    PAID_SOCIAL: "Paid Social",
    SOCIAL_MEDIA: "Organic Social",
    REFERRALS: "Referrals",
    EMAIL_MARKETING: "Email Marketing",
    DIRECT_TRAFFIC: "Direct Traffic",
    OFFLINE: "Offline Sources",
    OTHER_CAMPAIGNS: "Other Campaigns",
  };
  return known[raw] || titleCase(raw) || "Unknown source";
}

function safeIso(value) {
  const date = parseDateValue(value);
  return date ? date.toISOString() : "";
}

function countBy(rows, keySelector) {
  const map = new Map();
  rows.forEach((row) => {
    const key = keySelector(row);
    map.set(key, (map.get(key) || 0) + 1);
  });
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function buildServiceBreakdown(rows) {
  const services = new Map();
  rows.forEach((row) => {
    const item = services.get(row.service) || {
      service: row.service,
      leads: 0,
      bookedFromNewLeads: 0,
      appointmentSet: 0,
      scheduled: 0,
      completed: 0,
      canceledNoShow: 0,
      notScheduled: 0,
    };
    item.leads += 1;
    if (row.bookedEver) item.bookedFromNewLeads += 1;
    if (row.everScheduled) item.appointmentSet += 1;
    if (["Scheduled", "Rescheduled"].includes(row.scheduleCategory)) item.scheduled += 1;
    if (row.scheduleCategory === "Completed") item.completed += 1;
    if (["Canceled", "No-show"].includes(row.scheduleCategory)) item.canceledNoShow += 1;
    if (!row.everScheduled) item.notScheduled += 1;
    services.set(row.service, item);
  });
  return [...services.values()]
    .map((item) => ({
      ...item,
      appointmentRate: item.leads ? item.appointmentSet / item.leads : 0,
      bookingRate: item.leads ? item.bookedFromNewLeads / item.leads : 0,
    }))
    .sort((a, b) => b.leads - a.leads || a.service.localeCompare(b.service));
}

function buildSegmentBreakdown(rows, appointmentRows = rows, bookingRows = []) {
  return ["Roofing", "Solar"].map((segment) => {
    const segmentRows = rows.filter((row) => row.serviceSegments.includes(segment));
    const segmentAppointments = appointmentRows.filter((row) => row.serviceSegments.includes(segment));
    const segmentBookings = bookingRows.filter((row) => row.serviceSegments.includes(segment));
    const leads = segmentRows.length;
    const appointmentSet = segmentAppointments.length;
    const newLeadsEverScheduled = segmentRows.filter((row) => row.everScheduled).length;
    const bookedFromNewLeads = segmentRows.filter((row) => row.bookedEver).length;
    return {
      segment,
      leads,
      appointmentSet,
      appointmentRate: leads ? newLeadsEverScheduled / leads : 0,
      bookedFromNewLeads,
      totalBookedInRange: segmentBookings.length,
      bookingRate: leads ? bookedFromNewLeads / leads : 0,
      activeScheduled: segmentAppointments.filter((row) => ["Scheduled", "Rescheduled"].includes(row.scheduleCategory)).length,
      completed: segmentAppointments.filter((row) => row.scheduleCategory === "Completed").length,
      notScheduled: segmentRows.filter((row) => !row.everScheduled).length,
    };
  });
}

function buildDailyTrend(rows, bookingRows = []) {
  const days = new Map();
  rows.forEach((row) => {
    const day = row.createdAt ? row.createdAt.slice(0, 10) : "Unknown";
    const item = days.get(day) || { date: day, leads: 0, booked: 0 };
    item.leads += 1;
    days.set(day, item);
  });
  bookingRows.forEach((row) => {
    const day = row.bookingDate ? row.bookingDate.slice(0, 10) : "Unknown";
    const item = days.get(day) || { date: day, leads: 0, booked: 0 };
    item.booked += 1;
    days.set(day, item);
  });
  return [...days.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function buildReport(records, config = {}) {
  const mapping = { ...DEFAULT_MAPPING, ...(config.mapping || {}) };
  const propertyDefinitions = config.propertyDefinitions || {};
  const owners = config.owners || {};
  const now = config.now || new Date();
  const dedupeResult = dedupeContacts(records, mapping, {
    now,
    dedupeBy: config.dedupeBy || "email_phone",
  });
  const hasCreatedRange = Boolean(config.rangeStart && config.rangeEnd);
  const inCreatedRange = (record) => !hasCreatedRange
    || recordCreatedInRange(record, config.rangeStart, config.rangeEnd);
  const inputRecordsInRange = records.filter(inCreatedRange);
  const canonicalRecordsInRange = dedupeResult.records.filter(inCreatedRange);
  const duplicateGroupsInRange = dedupeResult.duplicateGroups.filter((group) => (
    !hasCreatedRange || group.records.some(inCreatedRange)
  ));

  const makeRow = (record) => {
    const props = record.properties || {};
    const schedule = getScheduleSnapshot(record, mapping, now);
    const rawService = displayPropertyValue(mapping.service, props[mapping.service], propertyDefinitions);
    const service = rawService || "Unassigned service";
    const serviceSegments = classifyServiceSegments(service);
    const rawSource = displayPropertyValue(mapping.leadSource, props[mapping.leadSource], propertyDefinitions);
    const subsource = displayPropertyValue(mapping.leadSubsource, props[mapping.leadSubsource], propertyDefinitions);
    const ownerId = clean(props[mapping.owner]);
    const name = [clean(props.firstname), clean(props.lastname)].filter(Boolean).join(" ") || "Unnamed lead";
    const email = clean(props.email);
    const phone = clean(props.phone) || clean(props.mobilephone);
    const bookingDates = lifecycleAppointmentSetDates(record, propertyDefinitions);
    return {
      id: String(record.id),
      name,
      email,
      phone,
      service,
      serviceSegments,
      scheduleCategory: schedule.category,
      rawScheduleStatus: displayPropertyValue(mapping.appointmentStatus, schedule.status, propertyDefinitions) || clean(schedule.status),
      appointmentDate: safeIso(schedule.date),
      appointmentType: displayPropertyValue(mapping.appointmentType, schedule.type, propertyDefinitions) || clean(schedule.type),
      scheduleSource: schedule.sourceLabel || titleCase(schedule.source) || "Contact property",
      everScheduled: schedule.everScheduled,
      bookedEver: bookingDates.length > 0,
      firstBookedAt: bookingDates[0] || "",
      lastBookedAt: bookingDates[bookingDates.length - 1] || "",
      bookingDates,
      leadSource: sourceLabel(rawSource),
      leadSubsource: subsource,
      owner: owners[ownerId] || (ownerId ? `Owner ${ownerId}` : "Unassigned owner"),
      createdAt: safeIso(record.createdAt || props.createdate),
      updatedAt: safeIso(record.updatedAt || props.lastmodifieddate),
      duplicateCount: record.duplicateCount || 0,
      duplicateIds: record.duplicateIds || [],
      qualityFlags: [
        !email && !phone ? "No email or phone" : "",
        !rawService ? "Service missing" : "",
        schedule.category === "Other / review" ? "Status needs review" : "",
      ].filter(Boolean),
    };
  };
  const canonicalIdsInRange = new Set(canonicalRecordsInRange.map((record) => String(record.id)));
  const allRows = dedupeResult.records.map(makeRow);
  const rows = allRows.filter((row) => canonicalIdsInRange.has(row.id))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const appointmentRows = allRows.filter((row) => (
    Boolean(row.appointmentDate)
      && (!hasCreatedRange || dateValueInRange(row.appointmentDate, config.rangeStart, config.rangeEnd))
  )).sort((a, b) => b.appointmentDate.localeCompare(a.appointmentDate));
  const bookingRows = allRows.flatMap((row) => {
    const datesInRange = row.bookingDates.filter((date) => (
      !hasCreatedRange || dateValueInRange(date, config.rangeStart, config.rangeEnd)
    ));
    if (!datesInRange.length) return [];
    return [{ ...row, bookingDate: datesInRange[datesInRange.length - 1] }];
  }).sort((a, b) => b.bookingDate.localeCompare(a.bookingDate));

  const uniqueLeads = rows.length;
  const newLeadsEverScheduled = rows.filter((row) => row.everScheduled).length;
  const bookedFromNewLeads = rows.filter((row) => row.bookedEver).length;
  const totalBookedInRange = bookingRows.length;
  const appointmentSet = appointmentRows.length;
  const activeScheduled = appointmentRows.filter((row) => ["Scheduled", "Rescheduled"].includes(row.scheduleCategory)).length;
  const completed = appointmentRows.filter((row) => row.scheduleCategory === "Completed").length;
  const canceledNoShow = appointmentRows.filter((row) => ["Canceled", "No-show"].includes(row.scheduleCategory)).length;
  const notScheduled = rows.filter((row) => !row.everScheduled).length;

  const canonicalById = new Map(dedupeResult.records.map((record) => [String(record.id), record]));
  const allRowsById = new Map(allRows.map((row) => [row.id, row]));
  const duplicateAudit = duplicateGroupsInRange.map((group) => {
    const keptRecord = canonicalById.get(group.keptId);
    const kept = allRowsById.get(group.keptId)
      || (keptRecord ? makeRow(keptRecord) : null);
    return {
      keptId: group.keptId,
      keptName: kept?.name || "Unnamed lead",
      keptEmail: kept?.email || "",
      keptPhone: kept?.phone || "",
      removedIds: group.removedIds,
      reason: "Kept the oldest-created contact and consolidated the latest nonblank details, including scheduling data, from its duplicates.",
    };
  });

  return {
    generatedAt: now.toISOString(),
    summary: {
      importedRecords: inputRecordsInRange.length,
      historyRecordsScanned: records.length,
      uniqueLeads,
      duplicatesRemoved: Math.max(0, inputRecordsInRange.length - uniqueLeads),
      duplicateGroups: duplicateGroupsInRange.length,
      appointmentSet,
      newLeadsEverScheduled,
      appointmentRate: uniqueLeads ? newLeadsEverScheduled / uniqueLeads : 0,
      bookedFromNewLeads,
      bookingRate: uniqueLeads ? bookedFromNewLeads / uniqueLeads : 0,
      totalBookedInRange,
      bookingHistoryAvailable: config.bookingHistoryAvailable !== false,
      activeScheduled,
      completed,
      canceledNoShow,
      notScheduled,
    },
    statuses: SCHEDULE_CATEGORIES.map((label) => ({
      label,
      count: appointmentRows.filter((row) => row.scheduleCategory === label).length,
    })),
    rawStatuses: countBy(appointmentRows, (row) => row.rawScheduleStatus || row.scheduleCategory),
    services: buildServiceBreakdown(rows),
    serviceSegments: buildSegmentBreakdown(rows, appointmentRows, bookingRows),
    sources: countBy(rows, (row) => row.leadSource),
    owners: countBy(rows, (row) => row.owner),
    dailyTrend: buildDailyTrend(rows, bookingRows),
    dataQuality: {
      noContactMethod: rows.filter((row) => !row.email && !row.phone).length,
      missingService: rows.filter((row) => row.service === "Unassigned service").length,
      statusesToReview: rows.filter((row) => row.scheduleCategory === "Other / review").length,
    },
    duplicateAudit,
    bookingRows,
    appointmentRows,
    rows,
  };
}

export function recommendMapping(properties = []) {
  const has = (name) => properties.some((property) => property.name === name);
  const scored = (patterns, type) => properties
    .map((property) => {
      const text = `${property.name || ""} ${property.label || ""}`.toLowerCase();
      let score = 0;
      patterns.forEach(([pattern, points]) => {
        if (pattern.test(text)) score += points;
      });
      if (type && property.type === type) score += 2;
      if (property.archived || property.hidden) score -= 10;
      return { property, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)[0]?.property?.name || "";

  return {
    service: has("appointment_set_as")
      ? "appointment_set_as"
      : scored([[/appointment set as/, 12], [/appointment type/, 10], [/\bservice\b/, 8], [/project type/, 6], [/install type/, 5], [/product/, 3], [/vertical/, 3]]),
    appointmentStatus: has("appointment_status") ? "appointment_status" : scored([[/appointment status/, 10], [/appt status/, 9], [/booking status/, 8], [/disposition/, 5], [/schedule.*status/, 7]]),
    appointmentDate: has("appointment_date__time") ? "appointment_date__time" : scored([[/appointment date/, 10], [/appointment time/, 9], [/appt date/, 9], [/scheduled date/, 7], [/meeting date/, 5]], "datetime"),
    appointmentType: has("appointment_type_2") ? "appointment_type_2" : scored([[/appointment type/, 10], [/appt type/, 9], [/meeting type/, 6], [/consultation type/, 5]]),
    leadSource: has("hs_analytics_source") ? "hs_analytics_source" : scored([[/original source/, 8], [/lead source/, 7], [/source/, 2]]),
    leadSubsource: has("hs_analytics_source_data_1") ? "hs_analytics_source_data_1" : scored([[/source detail/, 7], [/subsource/, 7], [/campaign/, 3]]),
    owner: has("hubspot_owner_id") ? "hubspot_owner_id" : "",
  };
}
