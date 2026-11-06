import { getLocalizedPokemonName, normalizePokemonLookupKey } from "../../assets/pokemonNames";
import type { SiteLang } from "../siteI18n";

export type ChampionsNameKind = "pokemon" | "move" | "item" | "ability" | "type" | "nature" | "form";

export type ResolvedChampionsName = {
  id: string;
  primary: string;
  secondary: string;
  english: string;
  chinese: string | null;
  translationMissing: boolean;
};

const TYPE_ZH: Record<string, string> = {
  normal: "一般", fire: "火", water: "水", electric: "電", grass: "草", ice: "冰",
  fighting: "格鬥", poison: "毒", ground: "地面", flying: "飛行", psychic: "超能力",
  bug: "蟲", rock: "岩石", ghost: "幽靈", dragon: "龍", dark: "惡", steel: "鋼", fairy: "妖精",
};

const NATURE_ZH: Record<string, string> = {
  hardy: "勤奮", lonely: "怕寂寞", brave: "勇敢", adamant: "固執", naughty: "頑皮",
  bold: "大膽", docile: "坦率", relaxed: "悠閒", impish: "淘氣", lax: "樂天",
  timid: "膽小", hasty: "急躁", serious: "認真", jolly: "爽朗", naive: "天真",
  modest: "內斂", mild: "慢吞吞", quiet: "冷靜", bashful: "害羞", rash: "馬虎",
  calm: "溫和", gentle: "溫順", sassy: "自大", careful: "慎重", quirky: "浮躁",
};

// Curated official Traditional Chinese names. Unknown values deliberately remain English.
const MOVE_ZH: Record<string, string> = {
  protect: "守住", detect: "看穿", tailwind: "順風", "trick-room": "戲法空間",
  "dragon-claw": "龍爪", earthquake: "地震", "rock-slide": "岩崩", "swords-dance": "劍舞",
  "brave-bird": "勇鳥猛攻", "close-combat": "近身戰", "fake-out": "擊掌奇襲",
  "flare-blitz": "閃焰衝鋒", "parting-shot": "拋下狠話", "throat-chop": "地獄突刺",
  "iron-head": "鐵頭", "knock-off": "拍落", "sucker-punch": "突襲", "heat-wave": "熱風",
  "solar-beam": "日光束", "weather-ball": "氣象球", "hyper-voice": "巨聲",
  "hyper-beam": "破壞光線", "quick-attack": "電光一閃", "rage-powder": "憤怒粉",
  "matcha-gotcha": "刷刷茶炮", "wide-guard": "廣域防守", "light-screen": "光牆",
  reflect: "反射壁", "aurora-veil": "極光幕", encore: "再來一次", moonblast: "月亮之力",
  "shadow-ball": "暗影球", "make-it-rain": "淘金潮", "wave-crash": "波動衝",
  "last-respects": "掃墓", "aqua-jet": "水流噴射", "flip-turn": "快速折返",
  hurricane: "暴風", "sleep-powder": "催眠粉", "sludge-bomb": "污泥炸彈",
  "earth-power": "大地之力", "icy-wind": "冰凍之風", "freeze-dry": "冷凍乾燥",
};

const ITEM_ZH: Record<string, string> = {
  "sitrus-berry": "文柚果", "life-orb": "生命寶珠", "choice-scarf": "講究圍巾",
  "focus-sash": "氣勢披帶", leftovers: "吃剩的東西", "light-clay": "光之黏土",
  "wide-lens": "廣角鏡", "white-herb": "白色香草", "mental-herb": "心靈香草",
  "safety-goggles": "防塵護目鏡", "assault-vest": "突擊背心", "clear-amulet": "清淨墜飾",
  "covert-cloak": "密探斗篷", "booster-energy": "驅勁能量", "fairy-feather": "妖精之羽",
  "mystic-water": "神秘水滴", "black-glasses": "黑色眼鏡", "metal-coat": "金屬膜",
  "expert-belt": "達人帶", "soft-sand": "柔軟沙子", "iron-ball": "黑色鐵球",
  "lum-berry": "木子果", "roseli-berry": "洛玫果", "yache-berry": "番荔果",
  "haban-berry": "莓榴果", "passho-berry": "千香果", "chople-berry": "蓮蒲果",
};

const ABILITY_ZH: Record<string, string> = {
  intimidate: "威嚇", "rough-skin": "粗糙皮膚", "sand-veil": "沙隱", chlorophyll: "葉綠素",
  "swift-swim": "悠游自如", "sand-rush": "撥沙", "slush-rush": "撥雪", unburden: "輕裝",
  "surge-surfer": "衝浪之尾", prankster: "惡作劇之心", drizzle: "降雨", drought: "日照",
  "sand-stream": "揚沙", "snow-warning": "降雪", levitate: "飄浮", defiant: "不服輸",
  pixilate: "妖精皮膚", adaptability: "適應力", hospitality: "款待", blaze: "猛火",
  "solar-power": "太陽之力", multiscale: "多重鱗片", stamina: "持久力", technician: "技術高手",
  "lightning-rod": "避雷針", regenerator: "再生力", "good-as-gold": "黃金之軀",
};

const FORM_ZH: Record<string, string> = {
  "alolan-form": "阿羅拉的樣子", "galarian-form": "伽勒爾的樣子", "hisuian-form": "洗翠的樣子",
  "paldean-form": "帕底亞的樣子", female: "雌性", "dusk-form": "黃昏的樣子",
  "midnight-form": "黑夜的樣子", "wash-rotom": "清洗洛托姆", "heat-rotom": "加熱洛托姆",
  "mow-rotom": "切割洛托姆", "frost-rotom": "結冰洛托姆", "fan-rotom": "旋轉洛托姆",
  "family-of-four": "四隻家庭", "fancy-pattern": "花紋模樣", "jumbo-variety": "特大尺寸",
  "large-variety": "大尺寸", "small-variety": "小尺寸",
  "paldean-form-aqua-breed": "帕底亞的樣子（水瀾種）",
  "paldean-form-blaze-breed": "帕底亞的樣子（火熾種）",
  "paldean-form-combat-breed": "帕底亞的樣子（鬥戰種）",
};

const TABLES: Partial<Record<ChampionsNameKind, Record<string, string>>> = {
  move: MOVE_ZH,
  item: ITEM_ZH,
  ability: ABILITY_ZH,
  type: TYPE_ZH,
  nature: NATURE_ZH,
  form: FORM_ZH,
};

export function normalizeChampionsNameId(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/♀/g, "-female")
    .replace(/♂/g, "-male")
    .replace(/[’']/g, "")
    .replace(/\[([^\]]+)\]/g, "-$1")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function resolveChampionsName(
  kind: ChampionsNameKind,
  value: string | null | undefined,
  lang: SiteLang,
): ResolvedChampionsName {
  const english = value?.trim() || "—";
  const id = kind === "pokemon" ? normalizePokemonLookupKey(english) : normalizeChampionsNameId(english);
  const pokemonZh = kind === "pokemon" ? resolvePokemonChinese(english) : "";
  const chinese = kind === "pokemon"
    ? pokemonZh
    : TABLES[kind]?.[id] ?? null;
  const translationMissing = chinese == null;

  return {
    id,
    primary: lang === "zh" && chinese ? chinese : english,
    secondary: lang === "zh" && chinese ? english : chinese ?? "",
    english,
    chinese,
    translationMissing,
  };
}

function resolvePokemonChinese(english: string): string | null {
  const direct = getLocalizedPokemonName(english, "zh");
  if (/\p{Script=Han}/u.test(direct)) return direct;

  const formMatch = english.match(/^(.*?)\s*\[([^\]]+)]$/);
  if (!formMatch) return null;
  const baseEnglish = formMatch[1]?.trim() ?? "";
  const formId = normalizeChampionsNameId(formMatch[2] ?? "");
  const baseChinese = getLocalizedPokemonName(baseEnglish, "zh");
  const formChinese = FORM_ZH[formId];
  if (!/\p{Script=Han}/u.test(baseChinese) || !formChinese) return null;
  if (formId.endsWith("-rotom")) return formChinese;
  return `${baseChinese}（${formChinese}）`;
}

export function itemIconUrl(value: string): string {
  const slug = normalizeChampionsNameId(value);
  return slug
    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${encodeURIComponent(slug)}.png`
    : "";
}

export function natureSpeedModifier(value: string): "plus" | "minus" | "neutral" {
  const id = normalizeChampionsNameId(value);
  if (["timid", "hasty", "jolly", "naive"].includes(id)) return "plus";
  if (["brave", "relaxed", "quiet", "sassy"].includes(id)) return "minus";
  return "neutral";
}
