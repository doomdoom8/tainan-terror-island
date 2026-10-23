import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { validateCity, validateRecord, isSafeUrl, SchemaError } from "../js/data/schema.js";

const root = new URL("../data/", import.meta.url);
const city = JSON.parse(readFileSync(new URL("tainan.json", root), "utf8"));
const fearIds = new Set(city.fear.map((f) => f.id));

const good = {
  id: "a",
  name: "名稱",
  date: "2024-01-01",
  place: "東區",
  plain: "摘要",
  facts: [],
  fear: ["G"],
  sources: [{ title: "標題", outlet: "中央社", url: "https://www.cna.com.tw/x" }],
};

test("city config passes validation", () => {
  assert.doesNotThrow(() => validateCity(city));
});

test("city config rejects duplicate cells", () => {
  const bad = { ...city, wilds: [{ cell: city.zones[0].cell, label: "重複" }] };
  assert.throws(() => validateCity(bad), SchemaError);
});

test("validateRecord accepts a well-formed record", () => {
  assert.equal(validateRecord(good, "r", fearIds), good);
});

test("validateRecord rejects bad date, unknown fear, missing sources and unsafe url", () => {
  assert.throws(() => validateRecord({ ...good, date: "2024/01/01" }, "r", fearIds), /YYYY-MM-DD/);
  assert.throws(() => validateRecord({ ...good, fear: ["?"] }, "r", fearIds), /未知/);
  assert.throws(() => validateRecord({ ...good, sources: [] }, "r", fearIds), /來源/);
  const js = { ...good, sources: [{ ...good.sources[0], url: "javascript:alert(1)" }] };
  assert.throws(() => validateRecord(js, "r", fearIds), /網址/);
});

test("isSafeUrl only allows http(s)", () => {
  assert.equal(isSafeUrl("https://a.tw"), true);
  assert.equal(isSafeUrl("data:text/html,x"), false);
  assert.equal(isSafeUrl("not a url"), false);
});

test("every published record file is valid, in period, and has unique ids", () => {
  const dir = new URL("records/", root);
  if (!existsSync(dir)) return;
  const zoneIds = new Set(city.zones.map((z) => z.id));
  const seen = new Set();
  readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .forEach((file) => {
      assert.ok(zoneIds.has(file.replace(".json", "")), `${file} 沒有對應的島`);
      const list = JSON.parse(readFileSync(new URL(file, dir), "utf8"));
      list.forEach((rec, i) => {
        validateRecord(rec, `${file}[${i}]`, fearIds);
        assert.ok(rec.date >= city.meta.period.from, `${file}[${i}] 早於收錄期間`);
        assert.ok(!seen.has(rec.id), `重複 id ${rec.id}`);
        seen.add(rec.id);
      });
    });
});
