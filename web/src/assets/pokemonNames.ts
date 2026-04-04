export type PokemonLocale = "zh" | "en";

export interface PokemonNameEntry {
  en: string;
  zh: string;
  aliases?: string[];
}

function slugify(value: string) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizePokemonLookupKey(raw: string) {
  let text = String(raw ?? "").trim();
  if (!text) return "";

  text = text.split("?")[0]?.split("#")[0] ?? text;
  text = text.replace(/\\/g, "/");
  text = text.split("/").pop() ?? text;
  text = text.replace(/\.[a-z0-9]+$/i, "");
  text = text.replace(/_/g, "-");

  return slugify(text);
}

const POKEMON_NAME_ENTRIES: PokemonNameEntry[] = [
  { en: "Suicune", zh: "水君", aliases: ["suicune"] },
  { en: "Baxcalibur", zh: "戟脊龍", aliases: ["baxcalibur"] },
  { en: "Altaria", zh: "七夕青鳥", aliases: ["altaria"] },
  { en: "Mega Altaria", zh: "超級七夕青鳥", aliases: ["mega-altaria", "altaria-mega"] },
  { en: "Igglybuff", zh: "寶寶丁", aliases: ["igglybuff"] },
  { en: "Hydreigon", zh: "三首惡龍", aliases: ["hydreigon"] },
  { en: "Absol", zh: "阿勃梭魯", aliases: ["absol"] },
  { en: "Mega Absol", zh: "超級阿勃梭魯", aliases: ["mega-absol", "absol-mega"] },
  { en: "Charizard", zh: "噴火龍", aliases: ["charizard"] },
  { en: "Mega Charizard X", zh: "超級噴火龍X", aliases: ["mega-charizard-x"] },
  { en: "Mega Charizard Y", zh: "超級噴火龍Y", aliases: ["mega-charizard-y"] },
  { en: "Manectric", zh: "雷電獸", aliases: ["manectric"] },
  { en: "Mega Manectric", zh: "超級雷電獸", aliases: ["mega-manectric", "manectric-mega"] },
  { en: "Zeraora", zh: "捷拉奧拉", aliases: ["zeraora"] },
  { en: "Scizor", zh: "巨鉗螳螂", aliases: ["scizor"] },
  { en: "Mega Scizor", zh: "超級巨鉗螳螂", aliases: ["mega-scizor", "scizor-mega"] },
  { en: "Revavroom", zh: "普隆隆姆", aliases: ["revavroom"] },
  { en: "Magnezone", zh: "自爆磁怪", aliases: ["magnezone"] },

  { en: "Ogerpon", zh: "厄鬼椪", aliases: ["ogerpon"] },
  { en: "Teal Mask Ogerpon", zh: "碧草面具厄鬼椪", aliases: ["teal-mask-ogerpon", "ogerpon-teal-mask"] },
  { en: "Wellspring Mask Ogerpon", zh: "水井面具厄鬼椪", aliases: ["wellspring-mask-ogerpon", "ogerpon-wellspring-mask"] },
  { en: "Hearthflame Mask Ogerpon", zh: "火灶面具厄鬼椪", aliases: ["hearthflame-mask-ogerpon", "ogerpon-hearthflame-mask"] },
  { en: "Cornerstone Mask Ogerpon", zh: "礎石面具厄鬼椪", aliases: ["cornerstone-mask-ogerpon", "ogerpon-cornerstone-mask"] },

  { en: "Gourgeist", zh: "南瓜精", aliases: ["gourgeist"] },
  { en: "Greninja", zh: "甲賀忍蛙", aliases: ["greninja"] },
  { en: "Silvally", zh: "銀伴戰獸", aliases: ["silvally"] },
  { en: "Ceruledge", zh: "紅蓮鎧騎", aliases: ["ceruledge"] },
  { en: "Armarouge", zh: "蒼炎刃鬼", aliases: ["armarouge"] },
  { en: "Gardevoir", zh: "沙奈朵", aliases: ["gardevoir"] },
  { en: "Mimikyu", zh: "謎擬Q", aliases: ["mimikyu"] },
  { en: "Giratina", zh: "騎拉帝納", aliases: ["giratina"] },
  { en: "Meowscarada", zh: "魔幻假面喵", aliases: ["meowscarada"] },
  { en: "Gholdengo", zh: "賽富豪", aliases: ["gholdengo"] },
  { en: "Sylveon", zh: "仙子伊布", aliases: ["sylveon"] },
  { en: "Umbreon", zh: "月亮伊布", aliases: ["umbreon"] },
  { en: "Raichu", zh: "雷丘", aliases: ["raichu"] },
  { en: "Alolan Raichu", zh: "阿羅拉雷丘", aliases: ["alolan-raichu", "raichu-alolan"] },
  { en: "Exeggutor", zh: "椰蛋樹", aliases: ["exeggutor"] },
  { en: "Alolan Exeggutor", zh: "阿羅拉椰蛋樹", aliases: ["alolan-exeggutor", "exeggutor-alolan"] },
  { en: "Weavile", zh: "瑪狃拉", aliases: ["weavile"] },
  { en: "Glaceon", zh: "冰伊布", aliases: ["glaceon"] },
  { en: "Garchomp", zh: "烈咬陸鯊", aliases: ["garchomp"] },
  { en: "Gallade", zh: "艾路雷朵", aliases: ["gallade"] },
  { en: "Iron Valiant", zh: "鐵武者", aliases: ["iron-valiant"] },
  { en: "Togekiss", zh: "波克基斯", aliases: ["togekiss"] },
  { en: "Tinkaton", zh: "巨鍛匠", aliases: ["tinkaton"] },
  { en: "Porygon-Z", zh: "多邊獸Ｚ", aliases: ["porygon-z", "porygonz"] },
  { en: "Snorlax", zh: "卡比獸", aliases: ["snorlax"] },
  { en: "Gengar", zh: "耿鬼", aliases: ["gengar"] },
  { en: "Aegislash", zh: "堅盾劍怪", aliases: ["aegislash"] },
  { en: "Salamence", zh: "暴飛龍", aliases: ["salamence"] },
  { en: "Metagross", zh: "巨金怪", aliases: ["metagross"] },
  { en: "Mewtwo", zh: "超夢", aliases: ["mewtwo"] },
  { en: "Mew", zh: "夢幻", aliases: ["mew"] },
  { en: "Lucario", zh: "路卡利歐", aliases: ["lucario"] },
  { en: "Darkrai", zh: "達克萊伊", aliases: ["darkrai"] },
  { en: "Blaziken", zh: "火焰雞", aliases: ["blaziken"] },
  { en: "Rayquaza", zh: "烈空坐", aliases: ["rayquaza"] },
  { en: "Ekans", zh: "阿柏蛇", aliases: ["ekans"] },
  { en: "Arbok", zh: "阿柏怪", aliases: ["arbok"] },
  { en: "Magcargo", zh: "熔岩蝸牛", aliases: ["magcargo"] },
  { en: "Naganadel", zh: "四顎針龍", aliases: ["naganadel"] },
  { en: "Guzzlord", zh: "惡食大王", aliases: ["guzzlord"] },
  { en: "Golisopod", zh: "具甲武者", aliases: ["golisopod"] },
  { en: "Rotom", zh: "洛托姆", aliases: ["rotom"] },
  { en: "Palafin", zh: "海豚俠", aliases: ["palafin"] },
  { en: "Kilowattrel", zh: "大電海燕", aliases: ["kilowattrel"] },
  { en: "Annihilape", zh: "棄世猴", aliases: ["annihilape"] },
  { en: "Farigiraf", zh: "奇麒麟", aliases: ["farigiraf"] },
  { en: "Banette", zh: "詛咒娃娃", aliases: ["banette"] },
  { en: "Mega Banette", zh: "超級詛咒娃娃", aliases: ["mega-banette", "banette-mega"] },
  { en: "Aggron", zh: "波士可多拉", aliases: ["aggron"] },
  { en: "Mega Aggron", zh: "超級波士可多拉", aliases: ["mega-aggron", "aggron-mega"] },
  { en: "Gyarados", zh: "暴鯉龍", aliases: ["gyarados"] },
  { en: "Lapras", zh: "拉普拉斯", aliases: ["lapras"] },
  { en: "Dragonite", zh: "快龍", aliases: ["dragonite"] },
  { en: "Tyranitar", zh: "班基拉斯", aliases: ["tyranitar"] },
  { en: "Espeon", zh: "太陽伊布", aliases: ["espeon"] },
  { en: "Vaporeon", zh: "水伊布", aliases: ["vaporeon"] },
  { en: "Jolteon", zh: "雷伊布", aliases: ["jolteon"] },
  { en: "Flareon", zh: "火伊布", aliases: ["flareon"] },
  { en: "Leafeon", zh: "葉伊布", aliases: ["leafeon"] },
  { en: "Pikachu", zh: "皮卡丘", aliases: ["pikachu"] },
  { en: "Zapdos", zh: "閃電鳥", aliases: ["zapdos"] },
  { en: "Moltres", zh: "火焰鳥", aliases: ["moltres"] },
  { en: "Articuno", zh: "急凍鳥", aliases: ["articuno"] },
  { en: "Miraidon", zh: "密勒頓", aliases: ["miraidon"] },
  { en: "Koraidon", zh: "故勒頓", aliases: ["koraidon"] },
  { en: "Noivern", zh: "音波龍", aliases: ["noivern"] },
  { en: "Noibat", zh: "嗡蝠", aliases: ["noibat"] },
  { en: "Milotic", zh: "美納斯", aliases: ["milotic"] },
  { en: "Feebas", zh: "醜醜魚", aliases: ["feebas"] },
  { en: "Froslass", zh: "雪妖女", aliases: ["froslass"] },
  { en: "Chandelure", zh: "水晶燈火靈", aliases: ["chandelure"] },
  { en: "Bisharp", zh: "劈斬司令", aliases: ["bisharp"] },
  { en: "Kingambit", zh: "仆斬將軍", aliases: ["kingambit"] },
];

const POKEMON_NAME_LOOKUP = new Map<string, PokemonNameEntry>();

for (const entry of POKEMON_NAME_ENTRIES) {
  const keys = new Set<string>([
    normalizePokemonLookupKey(entry.en),
    normalizePokemonLookupKey(entry.zh),
    ...(entry.aliases ?? []).map((alias) => normalizePokemonLookupKey(alias)),
  ]);

  for (const key of keys) {
    if (!key) continue;
    POKEMON_NAME_LOOKUP.set(key, entry);
  }
}

const CARD_SUFFIX_ORDER = ["vstar", "vmax", "gx", "ex", "v"] as const;
type CardSuffix = (typeof CARD_SUFFIX_ORDER)[number];

const CARD_SUFFIX_LABEL: Record<CardSuffix, { en: string; zh: string }> = {
  vstar: { en: "VSTAR", zh: "VSTAR" },
  vmax: { en: "VMAX", zh: "VMAX" },
  gx: { en: "GX", zh: "GX" },
  ex: { en: "ex", zh: "ex" },
  v: { en: "V", zh: "V" },
};

function splitCardSuffix(key: string): { baseKey: string; suffix: CardSuffix | "" } {
  for (const suffix of CARD_SUFFIX_ORDER) {
    if (key.endsWith(`-${suffix}`)) {
      return {
        baseKey: key.slice(0, -(suffix.length + 1)),
        suffix,
      };
    }
  }

  return {
    baseKey: key,
    suffix: "",
  };
}

function candidateLookupKeys(key: string) {
  const set = new Set<string>();
  if (!key) return [];

  set.add(key);

  if (key.startsWith("mega-")) {
    set.add(`${key.slice(5)}-mega`);
  }

  if (key.endsWith("-mega")) {
    set.add(`mega-${key.slice(0, -5)}`);
  }

  return [...set].filter(Boolean);
}

function findPokemonEntry(key: string): PokemonNameEntry | null {
  for (const candidate of candidateLookupKeys(key)) {
    const hit = POKEMON_NAME_LOOKUP.get(candidate);
    if (hit) return hit;
  }
  return null;
}

function humanizeToken(token: string) {
  const lower = token.toLowerCase();

  if (lower === "mega") return "Mega";
  if (lower === "ex") return "ex";
  if (lower === "gx") return "GX";
  if (lower === "v") return "V";
  if (lower === "vmax") return "VMAX";
  if (lower === "vstar") return "VSTAR";
  if (lower === "x" || lower === "y" || lower === "z") return lower.toUpperCase();

  return token.charAt(0).toUpperCase() + token.slice(1);
}

function humanizePokemonKey(key: string) {
  return key
    .split("-")
    .filter(Boolean)
    .map(humanizeToken)
    .join(" ");
}

export function getLocalizedPokemonName(raw: string | undefined, locale: PokemonLocale) {
  const normalized = normalizePokemonLookupKey(raw ?? "");
  if (!normalized) return "";

  const exact = findPokemonEntry(normalized);
  if (exact) {
    return locale === "zh" ? exact.zh : exact.en;
  }

  const { baseKey, suffix } = splitCardSuffix(normalized);
  const baseEntry = findPokemonEntry(baseKey);
  const suffixLabel = suffix ? CARD_SUFFIX_LABEL[suffix][locale] : "";

  if (baseEntry) {
    const baseName = locale === "zh" ? baseEntry.zh : baseEntry.en;
    return suffixLabel ? `${baseName} ${suffixLabel}` : baseName;
  }

  const fallbackBase = humanizePokemonKey(baseKey || normalized);
  return suffixLabel ? `${fallbackBase} ${suffixLabel}` : fallbackBase;
}

export function getLocalizedDeckNameFromIconKeys(
  iconKeys: string[],
  locale: PokemonLocale,
) {
  const names = iconKeys
    .slice(0, 2)
    .map((key) => getLocalizedPokemonName(key, locale))
    .filter(Boolean);

  const deduped = names.filter((name, index) => name !== names[index - 1]);

  if (deduped.length === 0) return "";
  return locale === "zh" ? deduped.join(" / ") : deduped.join(" ");
}