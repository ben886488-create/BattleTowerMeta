// download-limitless-pocket-sprites.mjs
import fs from "node:fs/promises";
import path from "node:path";

const START_URL = "https://play.limitlesstcg.com/decks?game=POCKET";
const OUT_DIR = path.resolve("web/src/assets/deck-icons");
const TOP_DECKS_PATH = path.resolve("web/public/data/precomputed/top_decks.json");
const CONCURRENCY = 8;

const HEADERS = {
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36",
  referer: "https://play.limitlesstcg.com/",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function collectSpriteUrls() {
  const response = await fetch(START_URL, { headers: HEADERS });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const matches = html.match(
    /https:\/\/r2\.limitlesstcg\.net\/pokemon\/gen9\/[^"'<>?]+\.png/gi,
  ) ?? [];
  const urls = new Set(matches);

  try {
    const topDecks = JSON.parse(await fs.readFile(TOP_DECKS_PATH, "utf8"));
    for (const scope of Object.values(topDecks.scopes ?? {})) {
      for (const row of scope.rows ?? []) {
        for (const iconKey of row.iconKeys ?? []) {
          if (!iconKey) continue;
          urls.add(`https://r2.limitlesstcg.net/pokemon/gen9/${iconKey}.png`);
        }
      }
    }
  } catch (error) {
    console.warn(`Could not load ${TOP_DECKS_PATH}: ${error.message}`);
  }

  return [...urls].sort();
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

const manifestPath = path.join(OUT_DIR, "manifest.json");
let existingManifest = [];
try {
  existingManifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
} catch {
  // A missing or invalid manifest is rebuilt from the current source page.
}

const manifestBySlug = new Map(
  existingManifest.map((item) => [item.slug, item]),
);
for (const url of urls) {
  const file = decodeURIComponent(path.basename(new URL(url).pathname));
  const slug = path.parse(file).name;
  manifestBySlug.set(slug, { slug, file, src: url });
}

const manifest = [...manifestBySlug.values()].sort((a, b) =>
  a.slug.localeCompare(b.slug),
);
await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Updated ${manifestPath} (${manifest.length} entries).`);
