import { validateCity, validateRecord } from "./schema.js";
import { attachEvents } from "./derive.js";

const fetchJson = async (url) => {
  const res = await fetch(url, { cache: "no-cache" });
  if (!res.ok) throw new Error(`無法載入 ${url}（HTTP ${res.status}）`);
  try {
    return await res.json();
  } catch (err) {
    throw new Error(`${url} 不是合法的 JSON：${err.message}`);
  }
};

const loadRecords = async (base, zone, fearIds) => {
  const url = new URL(`records/${zone.id}.json`, base).href;
  const list = await fetchJson(url);
  if (!Array.isArray(list)) throw new Error(`${zone.id}.json 必須是陣列`);
  return list.map((rec, i) => validateRecord(rec, `${zone.id}[${i}]`, fearIds));
};

export const loadCity = async (src) => {
  const base = new URL(src, location.href);
  const city = validateCity(await fetchJson(base.href));
  const fearIds = new Set(city.fear.map((f) => f.id));
  const lists = await Promise.all(
    city.zones.map((z) => loadRecords(base, z, fearIds)),
  );
  const recordsByZone = Object.fromEntries(
    city.zones.map((z, i) => [z.id, lists[i]]),
  );
  return {
    ...city,
    zones: attachEvents(city.zones, recordsByZone, city.meta.period.from),
  };
};
