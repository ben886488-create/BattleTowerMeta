const pixelIconModules = import.meta.glob("../../assets/deck-icons/*.{png,webp,jpg,jpeg,svg}", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const pixelIconIndex = new Map<string, string>();

for (const [filePath, url] of Object.entries(pixelIconModules)) {
  const fileName = filePath.split("/").pop() ?? "";
  const key = normalizeImageKey(fileName.replace(/\.[^.]+$/, ""));
  if (key && !pixelIconIndex.has(key)) pixelIconIndex.set(key, url);
}

const regionalPrefixes: Record<string, string> = {
  alolan: "alola",
  galarian: "galar",
  hisuian: "hisui",
  paldean: "paldea",
};

const pixelIconAliases: Record<string, string> = {
  basculegion: "basculegion-male",
  "eternal-flower-floette": "floette",
  "heat-rotom": "rotom-heat",
  "mow-rotom": "rotom-mow",
  palafin: "palafin-zero-form",
  "wash-rotom": "rotom-wash",
};

export function resolveChampionsPixelIcon(slug: string, name = ""): string {
  for (const candidate of imageKeyCandidates(slug, name)) {
    const hit = pixelIconIndex.get(candidate);
    if (hit) return hit;
  }
  return "";
}

function imageKeyCandidates(slug: string, name: string): string[] {
  const direct = normalizeImageKey(slug);
  const fromName = normalizeImageKey(name);
  const initialCandidates = [
    direct,
    pixelIconAliases[direct],
    fromName,
    pixelIconAliases[fromName],
  ];
  const candidates = new Set(initialCandidates.filter((value): value is string => Boolean(value)));

  for (const key of [...candidates]) {
    const [prefix, ...rest] = key.split("-");
    const region = regionalPrefixes[prefix ?? ""];
    if (region && rest.length > 0) candidates.add(`${rest.join("-")}-${region}`);

    candidates.add(key.replace(/-(family-of-four|fancy-pattern|natural-form|zero-form|shield-forme)$/, ""));
    candidates.add(key.replace(/-(male|female)$/, ""));
  }

  return [...candidates].filter(Boolean);
}

function normalizeImageKey(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
