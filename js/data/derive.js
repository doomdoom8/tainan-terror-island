export const monthKey = (date) => date.slice(0, 7);

export const inPeriod = (rec, from) => rec.date >= from;

const byDateDesc = (a, b) => b.date.localeCompare(a.date);

export const attachEvents = (zones, recordsByZone, from) =>
  zones.map((zone) => {
    const events = (recordsByZone[zone.id] ?? [])
      .filter((rec) => inPeriod(rec, from))
      .map((rec) => ({ ...rec, zoneId: zone.id }))
      .sort(byDateDesc);
    const fear = [...new Set(events.flatMap((e) => e.fear))];
    return { ...zone, events, fear };
  });

export const allEvents = (zones) =>
  zones.flatMap((z) => z.events).sort(byDateDesc);

export const monthsOf = (events) =>
  [...new Set(events.map((e) => monthKey(e.date)))].sort();

export const eventsInMonth = (events, month, cumulative) =>
  events.filter((e) =>
    cumulative ? monthKey(e.date) <= month : monthKey(e.date) === month,
  );

export const zoneIdsOf = (events) => new Set(events.map((e) => e.zoneId));

const normalise = (s) => s.toLowerCase().replace(/\s+/g, "");

const eventText = (e) =>
  [e.name, e.place, e.plain, ...(e.facts ?? [])].join(" ");

export const matchesQuery = (text, query) =>
  !query || normalise(text).includes(normalise(query));

export const searchZones = (zones, query) =>
  zones
    .map((zone) => {
      const zoneHit = matchesQuery(
        [zone.name, zone.place, zone.tag, zone.summary].join(" "),
        query,
      );
      const events = zoneHit
        ? zone.events
        : zone.events.filter((e) => matchesQuery(eventText(e), query));
      return { ...zone, events };
    })
    .filter(
      (zone) =>
        !query || zone.events.length > 0 || matchesQuery(zone.name, query),
    );

export const zoneVisible = (zone, { isle, fears }) =>
  (!isle || zone.id === isle) &&
  (fears.length === 0 || fears.some((f) => zone.fear.includes(f)));

export const countByYear = (events) =>
  events.reduce((acc, e) => {
    const year = e.date.slice(0, 4);
    return { ...acc, [year]: (acc[year] ?? 0) + 1 };
  }, {});

export const countByFear = (events, fearList) =>
  fearList
    .map((f) => ({
      ...f,
      count: events.filter((e) => e.fear.includes(f.id)).length,
    }))
    .filter((f) => f.count > 0)
    .sort((a, b) => b.count - a.count);

export const formatMonth = (month) => {
  const [y, m] = month.split("-");
  return `${y} 年 ${Number(m)} 月`;
};

export const formatDate = (date) => {
  const [y, m, d] = date.split("-");
  return `${y}.${m}.${d}`;
};
