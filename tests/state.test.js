import { test } from "node:test";
import assert from "node:assert/strict";
import { createStore, toggleIn } from "../js/state.js";

test("set merges a patch immutably and notifies with changed keys", () => {
  const store = createStore({ a: 1, b: 2 });
  const before = store.get();
  const calls = [];
  store.subscribe((state, prev, changed) =>
    calls.push({ state, prev, changed }),
  );
  store.set({ a: 5 });
  assert.deepEqual(before, { a: 1, b: 2 });
  assert.equal(Object.isFrozen(store.get()), true);
  assert.deepEqual(calls[0].changed, ["a"]);
  assert.equal(calls[0].prev.a, 1);
});

test("set skips notification when nothing changed", () => {
  const store = createStore({ a: 1 });
  let count = 0;
  store.subscribe(() => {
    count += 1;
  });
  store.set({ a: 1 });
  assert.equal(count, 0);
});

test("nested set from a subscriber is applied after the current pass, in order", () => {
  const store = createStore({ zone: null, side: true });
  const seen = [];
  store.subscribe((state, prev, changed) => {
    if (changed.includes("zone") && state.zone) store.set({ side: false });
  });
  store.subscribe((state, prev, changed) =>
    seen.push({ changed, side: state.side, zone: state.zone }),
  );
  store.set({ zone: "gun" });
  assert.deepEqual(seen, [
    { changed: ["zone"], side: true, zone: "gun" },
    { changed: ["side"], side: false, zone: "gun" },
  ]);
  assert.deepEqual(store.get(), { zone: "gun", side: false });
});

test("a throwing subscriber does not block other listeners or queued patches, and the error still surfaces", () => {
  const store = createStore({ a: 0, b: 0 });
  const seen = [];
  store.subscribe((state, prev, changed) => {
    if (changed.includes("a")) store.set({ b: 1 });
  });
  store.subscribe((state) => {
    if (state.a === 1 && state.b === 0) throw new Error("boom");
  });
  store.subscribe((state, prev, changed) => seen.push(changed.join()));
  assert.throws(() => store.set({ a: 1 }), /boom/);
  assert.deepEqual(seen, ["a", "b"]);
  assert.deepEqual(store.get(), { a: 1, b: 1 });
  store.set({ a: 2 });
  assert.equal(store.get().a, 2);
});

test("a throwing or invalid patch surfaces an error without wedging the store", () => {
  const store = createStore({ a: 0 });
  assert.throws(
    () =>
      store.set(() => {
        throw new Error("bad patch");
      }),
    /bad patch/,
  );
  assert.throws(() => store.set(() => null), TypeError);
  store.set({ a: 3 });
  assert.equal(store.get().a, 3);
});

test("toggleIn adds or removes without mutating", () => {
  const list = ["G"];
  assert.deepEqual(toggleIn(list, "X"), ["G", "X"]);
  assert.deepEqual(toggleIn(list, "G"), []);
  assert.deepEqual(list, ["G"]);
});
