const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const isText = (v) => typeof v === "string" && v.trim().length > 0;
const isCell = (v) => Array.isArray(v) && v.length === 2 && v.every(Number.isInteger);

export class SchemaError extends Error {
  constructor(path, problem) {
    super(`${path}: ${problem}`);
    this.name = "SchemaError";
  }
}

const need = (ok, path, problem) => {
  if (!ok) throw new SchemaError(path, problem);
};

export const isSafeUrl = (url) => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
};

const validateSource = (src, path) => {
  need(src && typeof src === "object", path, "來源必須是物件");
  need(isText(src.title), `${path}.title`, "缺少標題");
  need(isText(src.outlet), `${path}.outlet`, "缺少媒體名稱");
  need(isSafeUrl(src.url), `${path}.url`, "網址格式錯誤");
};

export const validateRecord = (rec, path, fearIds) => {
  need(rec && typeof rec === "object", path, "事件必須是物件");
  ["id", "name", "place", "plain"].forEach((k) => need(isText(rec[k]), `${path}.${k}`, "缺少文字欄位"));
  need(DATE_RE.test(rec.date ?? ""), `${path}.date`, "日期需為 YYYY-MM-DD");
  need(Array.isArray(rec.facts ?? []), `${path}.facts`, "facts 必須是陣列");
  need(Array.isArray(rec.fear) && rec.fear.length > 0, `${path}.fear`, "至少要有一個事件類型");
  rec.fear.forEach((f, i) => need(fearIds.has(f), `${path}.fear[${i}]`, `未知的類型 ${f}`));
  need(Array.isArray(rec.sources) && rec.sources.length > 0, `${path}.sources`, "至少要有一則來源");
  rec.sources.forEach((s, i) => validateSource(s, `${path}.sources[${i}]`));
  return rec;
};

const validateZone = (zone, path) => {
  ["id", "name", "place", "model", "summary", "tag"].forEach((k) => need(isText(zone[k]), `${path}.${k}`, "缺少文字欄位"));
  need(Number.isInteger(zone.number), `${path}.number`, "編號需為整數");
  need(isCell(zone.cell), `${path}.cell`, "cell 需為 [col,row]");
};

const validateUniqueCells = (cells) => {
  const keys = cells.map((c) => c.join(","));
  const dup = keys.find((k, i) => keys.indexOf(k) !== i);
  need(!dup, "cells", `格子重複 ${dup}`);
};

export const validateCity = (city) => {
  need(city && typeof city === "object", "city", "設定檔必須是物件");
  need(isText(city.meta?.title), "meta.title", "缺少標題");
  need(DATE_RE.test(city.meta?.period?.from ?? ""), "meta.period.from", "缺少收錄起始日");
  need(Array.isArray(city.fear) && city.fear.length > 0, "fear", "缺少事件類型");
  need(Array.isArray(city.zones) && city.zones.length > 0, "zones", "缺少島嶼");
  city.zones.forEach((z, i) => validateZone(z, `zones[${i}]`));
  validateUniqueCells([...city.zones.map((z) => z.cell), ...(city.wilds ?? []).map((w) => w.cell)]);
  return city;
};
