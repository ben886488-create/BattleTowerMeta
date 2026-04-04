// download-limitless-pocket-sprites.mjs
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const START_URL = "https://play.limitlesstcg.com/decks?game=POCKET";
const OUT_DIR = path.resolve("limitless-pocket-sprites");
const CONCURRENCY = 8;

const HEADERS = {
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36",
  referer: "https://play.limitlesstcg.com/",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function expandAllDecks(page) {
  while (true) {
    const button = page.getByText("Show all decks", { exact: true }).first();
    const visible = await button.isVisible().catch(() => false);
    if (!visible) break;

    const before = await page
      .locator('a[href*="r2.limitlesstcg.net/pokemon/gen9/"]')
      .count();

    await button.click();
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(1500);

    const after = await page
      .locator('a[href*="r2.limitlesstcg.net/pokemon/gen9/"]')
      .count();

    if (after <= before) break;
  }
}

async function collectSpriteUrls() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ userAgent: HEADERS["user-agent"] });

  await page.goto(START_URL, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  await expandAllDecks(page);

  const urls = await page.evaluate(() => {
    const re = /\/pokemon\/gen9\/[^/?#]+\.png$/i;
    const set = new Set();

    for (const a of document.querySelectorAll(
      'a[href*="r2.limitlesstcg.net/pokemon/gen9/"]'
    )) {
      if (re.test(a.href)) set.add(a.href);
    }

    for (const img of document.querySelectorAll(
      'img[src*="r2.limitlesstcg.net/pokemon/gen9/"]'
    )) {
      const src = img.currentSrc || img.src;
      if (re.test(src)) set.add(src);
    }

    return [...set].sort();
  });

  await browser.close();
  return urls;
}

async function downloadSprite(url) {
  const filename = decodeURIComponent(path.basename(new URL(url).pathname));
  const filePath = path.join(OUT_DIR, filename);

  try {
    await fs.access(filePath);
    return "skip";
  } catch {
    // file not exists
  }

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { headers: HEADERS });
      if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText}`);
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      await fs.writeFile(filePath, buffer);
      return "ok";
    } catch (err) {
      if (attempt === 3) throw err;
      await sleep(attempt * 1000);
    }
  }
}

async function mapLimit(items, limit, fn) {
  const results = [];
  const running = new Set();

  for (const item of items) {
    const p = Promise.resolve().then(() => fn(item));
    results.push(p);
    running.add(p);

    const cleanup = () => running.delete(p);
    p.then(cleanup, cleanup);

    if (running.size >= limit) {
      await Promise.race(running);
    }
  }

  return Promise.all(results);
}

await fs.mkdir(OUT_DIR, { recursive: true });

console.log("Collecting sprite URLs...");
const urls = await collectSpriteUrls();

console.log(`Found ${urls.length} unique sprite URLs`);
console.log(urls.slice(0, 10).join("\n"));

let ok = 0;
let skip = 0;
let fail = 0;

await mapLimit(urls, CONCURRENCY, async (url) => {
  try {
    const result = await downloadSprite(url);
    if (result === "ok") ok++;
    else skip++;
  } catch (err) {
    fail++;
    console.error(`\nFAIL: ${url}`);
    console.error(err.message);
  }

  const done = ok + skip + fail;
  process.stdout.write(
    `\rDone ${done}/${urls.length} | ok ${ok} | skip ${skip} | fail ${fail}`
  );
});

console.log("\nFinished.");