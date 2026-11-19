// Kept self-contained so the same calculation can run in the dashboard's inline script.
export function buildLeadTiming(rows, timeZone = "America/New_York") {
  const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const days = dayNames.map((day) => ({ day, total:0, hours:Array(24).fill(0) }));
  const hours = Array.from({ length:24 }, (_, hour) => ({
    hour,
    label:(hour % 12 || 12) + (hour < 12 ? " AM" : " PM"),
    count:0,
  }));
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone, weekday:"long", hour:"numeric", hourCycle:"h23",
  });
  let total = 0;
  let missingCreatedDate = 0;
  for (const row of rows || []) {
    const date = row?.createdAt ? new Date(row.createdAt) : null;
    if (!date || Number.isNaN(date.getTime())) {
      missingCreatedDate += 1;
      continue;
    }
    const parts = formatter.formatToParts(date);
    const day = days.find((item) => item.day === parts.find((part) => part.type === "weekday")?.value);
    const hour = Number(parts.find((part) => part.type === "hour")?.value);
    if (!day || !Number.isInteger(hour) || hour < 0 || hour > 23) {
      missingCreatedDate += 1;
      continue;
    }
    day.hours[hour] += 1;
    day.total += 1;
    hours[hour].count += 1;
    total += 1;
  }
  return { timeZone, total, missingCreatedDate, days, hours };
}
