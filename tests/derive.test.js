import { test } from "node:test";
import assert from "node:assert/strict";
import {
  attachEvents,
  allEvents,
  monthsOf,
  eventsInMonth,
  searchZones,
  zoneVisible,
  countByYear,
  countByFear,
  formatMonth,
} from "../js/data/derive.js";

const ev = (id, date, fear = ["D"], extra = {}) => ({ id, date, fear, name: id, place: "東區", plain: "摘要", facts: [], ...extra });

const zones = [
  { id: "gun", name: "槍擊島", place: "中西區", tag: "槍擊", summary: "槍響" },
  { id: "drug", name: "毒駕島", place: "麻豆", tag: "毒品", summary: "咖啡包" },
];

const records = {
  gun: [ev("g1", "2023-05-01", ["G"]), ev("g0", "2009-01-01", ["G"]), ev("g2", "2024-01-10", ["G", "D"])],
  drug: [ev("d1", "2023-05-20", ["X"], { plain: "毒品咖啡包" })],
};

const built = attachEvents(zones, records, "2010-12-25");

test("attachEvents drops events before the period and sorts newest first", () => {
  assert.deepEqual(built[0].events.map((e) => e.id), ["g2", "g1"]);
  assert.equal(built[0].events[0].zoneId, "gun");
});

test("attachEvents collects fear codes per zone and leaves input untouched", () => {
  assert.deepEqual(built[0].fear.sort(), ["D", "G"]);
  assert.equal(zones[0].events, undefined);
  assert.equal(records.gun.length, 3);
});

test("attachEvents tolerates zones without records", () => {
  const [only] = attachEvents([{ id: "x" }], {}, "2010-12-25");
  assert.deepEqual(only.events, []);
});

test("monthsOf returns unique sorted months", () => {
  assert.deepEqual(monthsOf(allEvents(built)), ["2023-05", "2024-01"]);
});

test("eventsInMonth supports exact and cumulative modes", () => {
  const events = allEvents(built);
  assert.equal(eventsInMonth(events, "2023-05", false).length, 2);
  assert.equal(eventsInMonth(events, "2024-01", false).length, 1);
  assert.equal(eventsInMonth(events, "2024-01", true).length, 3);
});

test("searchZones matches zone fields or event text", () => {
  assert.deepEqual(searchZones(built, "咖啡").map((z) => z.id), ["drug"]);
  assert.equal(searchZones(built, "槍擊")[0].events.length, 2);
  assert.equal(searchZones(built, "").length, 2);
  assert.equal(searchZones(built, "不存在的字").length, 0);
});

test("zoneVisible applies isle and fear filters", () => {
  assert.equal(zoneVisible(built[0], { isle: null, fears: [] }), true);
  assert.equal(zoneVisible(built[0], { isle: "drug", fears: [] }), false);
  assert.equal(zoneVisible(built[1], { isle: null, fears: ["G"] }), false);
  assert.equal(zoneVisible(built[1], { isle: null, fears: ["G", "X"] }), true);
});

test("countByYear and countByFear aggregate events", () => {
  const events = allEvents(built);
  assert.deepEqual(countByYear(events), { 2023: 2, 2024: 1 });
  const fears = countByFear(events, [{ id: "G" }, { id: "X" }, { id: "Y" }]);
  assert.deepEqual(fears.map((f) => [f.id, f.count]), [["G", 2], ["X", 1]]);
});

test("formatMonth renders Chinese month label", () => {
  assert.equal(formatMonth("2024-03"), "2024 年 3 月");
});
