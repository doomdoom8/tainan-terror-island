import { chromium } from "playwright";
import assert from "node:assert/strict";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:8731/";
const SHOTS = process.env.SHOTS_DIR;
const GPU_ARGS = [
  "--use-angle=metal",
  "--enable-gpu",
  "--ignore-gpu-blocklist",
];

const shot = async (page, name) => {
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png` });
};

const step = async (name, fn) => {
  await fn();
  console.log(`✔ ${name}`);
};

const openPage = async (browser, viewport) => {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    () => document.querySelector("#loading")?.classList.contains("done"),
    null,
    { polling: 250, timeout: 20000 },
  );
  await page.waitForTimeout(1200);
  return { page, errors };
};

const desktop = async (browser) => {
  const { page, errors } = await openPage(browser, {
    width: 1440,
    height: 900,
  });
  await step(
    "intro dialog shows on first visit and can be skipped",
    async () => {
      assert.equal(await page.isVisible("#intro"), true);
      await shot(page, "d01-intro");
      await page.click("#intro-skip");
      assert.equal(await page.isVisible("#intro"), false);
    },
  );
  await step("sidebar lists every island with counts", async () => {
    assert.equal(await page.locator(".zone-row").count(), 19);
    assert.match(await page.textContent("#side-count"), /19 座島・\d+ 則/);
    await shot(page, "d02-home");
  });
  await step("pause freezes animation so labels hold still", async () => {
    await page.click("[data-toggle='frozen']");
    assert.equal(
      await page.getAttribute("[data-toggle='frozen']", "aria-pressed"),
      "true",
    );
  });
  await step("clicking an island label opens its card", async () => {
    await page.click(".chip:has-text('槍擊島')");
    await page.waitForSelector("#card:not([hidden])");
    assert.match(await page.textContent("#card h2"), /槍擊島/);
    assert.ok((await page.locator(".card-events li").count()) >= 10);
    await page.waitForTimeout(1300);
    await shot(page, "d03-gun-card");
  });
  await step(
    "opening an event shows sources that open in a new tab",
    async () => {
      await page.click(".card-events li:first-child button");
      const links = page.locator(".sources a");
      assert.ok((await links.count()) >= 1);
      assert.equal(await links.first().getAttribute("target"), "_blank");
      assert.match(await links.first().getAttribute("rel"), /noopener/);
      await shot(page, "d04-event");
      await page.click(".back");
      assert.match(await page.textContent("#card h2"), /槍擊島/);
    },
  );
  await step("search narrows the island list", async () => {
    await page.fill("#search", "咖啡包");
    await page.waitForTimeout(100);
    const rows = await page.locator(".zone-row").count();
    assert.ok(rows >= 1 && rows < 19);
    await page.fill("#search", "");
  });
  await step("timeline slider selects a month and wakes islands", async () => {
    await page.click("#card-close");
    await page.locator("#tl").evaluate((el) => {
      el.value = String(Math.floor(Number(el.max) * 0.8));
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    assert.match(await page.textContent("#tl-month"), /年 \d+ 月・\d+ 則/);
    assert.ok((await page.locator(".tl-ev").count()) >= 1);
    assert.ok((await page.locator(".chip.awake").count()) >= 1);
    await shot(page, "d05-timeline");
    await page.click("#tl-all");
    assert.match(await page.textContent("#tl-month"), /全部/);
  });
  await step("fear filter dims non-matching islands", async () => {
    await page.click("[data-panel='fear']");
    await page.click(".term.fear:has-text('槍擊暴力')");
    assert.match(await page.textContent("#status"), /顯示 \d+ \/ 19/);
    assert.ok((await page.locator(".chip.off").count()) >= 10);
    await shot(page, "d06-filter");
    await page.click(".term.clear");
    assert.equal(await page.textContent("#status"), "");
  });
  await step("time of day and overview toggles work", async () => {
    await page.click("[data-time='720']");
    await page.click("[data-toggle='overview']");
    assert.equal(await page.isVisible("#overview"), true);
    await page.waitForTimeout(600);
    await shot(page, "d07-day-overview");
    await page.click("#overview-close");
  });
  await step("timeline playback stops when home resets the map", async () => {
    await page.click("[data-panel='tl']");
    await page.click("#tl-play");
    await page.waitForTimeout(1200);
    await page.click("#home");
    await page.waitForTimeout(2000);
    assert.match(await page.textContent("#tl-month"), /全部/);
    assert.equal(await page.textContent("#tl-play"), "▶");
  });
  await step("tour runs, hides the toolbar, and exits", async () => {
    await page.click("#tour-start");
    await page.waitForTimeout(6000);
    assert.ok((await page.textContent("#tour-caption")).length > 5);
    assert.equal(await page.isVisible("#tour-start"), false);
    await shot(page, "d08-tour");
    await page.click("#tour-exit");
    assert.equal(
      await page.evaluate(() => document.body.classList.contains("touring")),
      false,
    );
  });
  await step(
    "about dialog explains policy, traps focus, and Escape leaves the card open",
    async () => {
      await page.click(".chip:has-text('毒駕島')");
      await page.waitForSelector("#card:not([hidden])");
      await page.click("#about-open");
      assert.match(
        await page.textContent("#about-body"),
        /2010 年 12 月 25 日/,
      );
      assert.equal(
        await page.evaluate(() => document.activeElement.id),
        "about-close",
      );
      assert.equal(
        await page.evaluate(() => document.querySelector("#sidebar").inert),
        true,
      );
      await page.keyboard.press("Tab");
      assert.ok(
        await page.evaluate(() =>
          document.querySelector("#about").contains(document.activeElement),
        ),
      );
      await page.keyboard.press("Escape");
      assert.equal(await page.isVisible("#about"), false);
      assert.equal(await page.isVisible("#card"), true);
      assert.equal(
        await page.evaluate(() => document.activeElement.id),
        "about-open",
      );
    },
  );
  await step("filter buttons keep keyboard focus after toggling", async () => {
    await page.click("[data-panel='fear']");
    await page.focus(".term.fear >> nth=0");
    await page.keyboard.press("Enter");
    assert.equal(
      await page.evaluate(() => document.activeElement.dataset.key),
      "fear:D",
    );
    await page.keyboard.press("Enter");
  });
  assert.deepEqual(errors, [], `console errors: ${errors.join("\n")}`);
  await page.close();
};

const mobile = async (browser) => {
  const { page, errors } = await openPage(browser, { width: 390, height: 844 });
  await step("mobile: page fits without horizontal scroll", async () => {
    await page.click("#intro-skip");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    assert.ok(overflow <= 0, `horizontal overflow ${overflow}px`);
    await shot(page, "m01-home");
  });
  await step(
    "mobile: list sheet opens and selecting an event shows the card",
    async () => {
      await page.click("#sidebar-toggle");
      await page.waitForTimeout(400);
      await shot(page, "m02-sheet");
      await page.click(".zone-row[data-zone='drug'] .zone-btn");
      await page.waitForTimeout(500);
      assert.equal(
        await page.evaluate(() =>
          document.body.classList.contains("side-open"),
        ),
        false,
      );
      assert.equal(await page.isVisible("#card"), true);
      await page.click(".card-events li:first-child button");
      assert.ok((await page.locator(".sources a").count()) >= 1);
      await page.waitForTimeout(1000);
      await shot(page, "m03-card");
    },
  );
  assert.deepEqual(errors, [], `console errors: ${errors.join("\n")}`);
  await page.close();
};

const browser = await chromium.launch({ channel: "chrome", args: GPU_ARGS });
try {
  await desktop(browser);
  await mobile(browser);
  console.log("E2E OK");
} finally {
  await browser.close();
}
