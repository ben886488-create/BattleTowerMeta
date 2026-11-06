import type { RouteLocationNormalizedLoaded } from "vue-router";
import type { SiteLang } from "./siteI18n";

export const SITE_ORIGIN = "https://www.battletowermeta.com";

export const INDEXABLE_STATIC_ROUTES = [
  "/",
  "/pocket",
  "/pocket/tournaments",
  "/pocket/top-decks",
  "/pocket/top-cards",
  "/pocket/players",
  "/pocket/countries",
  "/champions",
  "/champions/pokemon",
  "/champions/teams",
  "/champions/speed",
] as const;

export const NOINDEX_STATIC_ROUTES = [
  "/pocket/records",
  "/champions/damage-calculator",
  "/champions/simulator",
] as const;

export const SSG_STATIC_ROUTES = [
  ...INDEXABLE_STATIC_ROUTES,
  ...NOINDEX_STATIC_ROUTES,
] as const;

type LocalizedCopy = Record<SiteLang, string>;

export type SiteContextCopy = {
  eyebrow: string;
  title: string;
  valueTitle: string;
  value: string;
  methodTitle: string;
  method: string;
  limitsTitle: string;
  limits: string;
};

type SeoEntry = {
  title: LocalizedCopy;
  description: LocalizedCopy;
  indexable: boolean;
  context?: Record<SiteLang, SiteContextCopy>;
};

const commonLabels = {
  zh: {
    eyebrow: "BTM // DATA NOTES",
    valueTitle: "本頁提供的額外價值",
    methodTitle: "資料來源與方法",
    limitsTitle: "解讀限制",
  },
  en: {
    eyebrow: "BTM // DATA NOTES",
    valueTitle: "What this page adds",
    methodTitle: "Source and method",
    limitsTitle: "Interpretation limits",
  },
} as const;

function context(
  title: LocalizedCopy,
  value: LocalizedCopy,
  method: LocalizedCopy,
  limits: LocalizedCopy,
): Record<SiteLang, SiteContextCopy> {
  return {
    zh: { ...commonLabels.zh, title: title.zh, value: value.zh, method: method.zh, limits: limits.zh },
    en: { ...commonLabels.en, title: title.en, value: value.en, method: method.en, limits: limits.en },
  };
}

const entries: Record<string, SeoEntry> = {
  "/": {
    title: { zh: "BattleTowerMeta｜競技情報終端", en: "BattleTowerMeta | Competitive Intelligence" },
    description: {
      zh: "BattleTowerMeta 整理 PTCG Pocket 與 Pokémon Champions 的賽事、牌組、寶可夢及工具資料。",
      en: "BattleTowerMeta organizes tournament, deck, Pokémon, and tool data for PTCG Pocket and Pokémon Champions.",
    },
    indexable: true,
  },
  "/pocket": {
    title: { zh: "PTCG Pocket 牌組環境與 Tier｜BattleTowerMeta", en: "PTCG Pocket Meta and Tier List | BattleTowerMeta" },
    description: {
      zh: "比較 PTCG Pocket 牌組使用率、Top 32 表現、加權名次、EMA 趨勢與有樣本標示的勝率矩陣。",
      en: "Compare PTCG Pocket deck usage, Top 32 results, weighted finishes, EMA trends, and a sample-aware matchup matrix.",
    },
    indexable: true,
    context: context(
      { zh: "如何閱讀牌組環境", en: "How to read the Pocket meta" },
      {
        zh: "BattleTowerMeta 不把原始賽事列直接重貼成排行榜；本頁把使用率、Top 32 次數、加權名次與近期 EMA 放在同一個可比較範圍內，並保留每個訊號的樣本背景。",
        en: "BattleTowerMeta does not republish a raw event list as a ranking. This view places usage, Top 32 frequency, weighted finishes, and recent EMA signals in one comparable scope while retaining sample context.",
      },
      {
        zh: "Pocket 資料來自 Limitless Tournament Platform 的公開賽事紀錄，再由本站 pipeline 正規化。Tier 分數以 Top 32 次數、加權名次、Top 32 占比與七日半衰期 EMA 組成；勝率不直接計入 Tier。",
        en: "Pocket data begins with public Limitless Tournament Platform records and is normalized by the site pipeline. Tier combines Top 32 frequency, weighted finishes, Top 32 share, and a seven-day half-life EMA; win rate is not a Tier input.",
      },
      {
        zh: "Tier 是目前篩選範圍內的相對位置，不是永恆牌組強度。低樣本對局會降低矩陣顏色強度；沒有樣本顯示為破折號，而不是 0%。",
        en: "Tier is relative to the active filter scope, not a permanent power rating. Low-sample matchups are visually attenuated; missing samples are shown as a dash, never as 0%.",
      },
    ),
  },
  "/pocket/tournaments": {
    title: { zh: "PTCG Pocket 賽事資料庫｜BattleTowerMeta", en: "PTCG Pocket Tournament Database | BattleTowerMeta" },
    description: {
      zh: "按日期、版本、玩家數與 Top Cut 篩選 PTCG Pocket 公開賽事，並進入單場報告查看名次與牌組。",
      en: "Filter public PTCG Pocket events by date, version, field size, and Top Cut, then open event reports for finishes and decks.",
    },
    indexable: true,
    context: context(
      { zh: "賽事清單的策展方式", en: "How the tournament ledger is curated" },
      {
        zh: "本頁把分散的賽事整理為可按時間、版本與規模比較的時間線，並把單場報告、玩家與牌組資料連回同一套導覽。",
        en: "This page turns scattered events into a timeline that can be compared by date, game version, and field size, with event reports, players, and deck data linked into the same navigation.",
      },
      {
        zh: "賽事與 standings 取自 Limitless Tournament Platform 的公開紀錄；本站排除已知不符合一般統計規則的特殊賽事，並以 pipeline 統一時間、版本與 Top Cut 欄位。",
        en: "Events and standings come from public Limitless Tournament Platform records. The pipeline excludes a known special-rules event from general statistics and normalizes time, version, and Top Cut fields.",
      },
      {
        zh: "清單只反映已被來源收錄且成功同步的賽事。來源延遲、缺失牌組或不完整 standings 都可能令單場樣本少於實際參賽人數。",
        en: "The ledger reflects only events present at the source and successfully synchronized. Source delays, missing deck labels, or incomplete standings can make a report smaller than the real field.",
      },
    ),
  },
  "/pocket/top-decks": {
    title: { zh: "PTCG Pocket 熱門牌組排名｜BattleTowerMeta", en: "PTCG Pocket Top Decks | BattleTowerMeta" },
    description: {
      zh: "以相同篩選範圍比較 PTCG Pocket 牌組樣本、使用率、成績訊號與趨勢，並連結牌組詳情。",
      en: "Compare PTCG Pocket deck samples, usage, result signals, and trends within one filter scope, with links to deck profiles.",
    },
    indexable: true,
    context: context(
      { zh: "排名不是單一勝率表", en: "Why this is not a win-rate table" },
      {
        zh: "排行榜同時顯示牌組出現量、選定 Top Cut 樣本及本站 Tier 訊號，讓高勝率但極低樣本與穩定出現的主流牌組不會被混為一談。",
        en: "The ranking presents deck volume, selected Top Cut samples, and the site Tier signal together so a tiny high-win-rate sample is not confused with a consistently represented deck.",
      },
      {
        zh: "所有牌組分組沿用 Pocket pipeline 的正規化 deck key；時間、版本、玩家數和 Top Cut 篩選會共同決定分母與比較範圍。",
        en: "Deck grouping follows normalized deck keys from the Pocket pipeline. Time, version, field size, and Top Cut filters jointly define the denominator and comparison scope.",
      },
      {
        zh: "不同篩選範圍的百分比不能直接比較。沒有對局或成績樣本時保留為未知，不會補成 0%；牌組詳情頁仍需逐頁完成原創編輯審核後才適合索引。",
        en: "Percentages from different filter scopes are not directly comparable. Missing match or finish samples remain unknown rather than 0%; deck profiles still require page-by-page editorial review before indexing.",
      },
    ),
  },
  "/pocket/top-cards": {
    title: { zh: "PTCG Pocket 卡片投入率與卡片圖鑑｜BattleTowerMeta", en: "PTCG Pocket Card Inclusion and Catalog | BattleTowerMeta" },
    description: {
      zh: "查看 PTCG Pocket 卡片圖鑑，或按賽事範圍比較卡片投入率、平均張數與 1 張／2 張配置。",
      en: "Browse the PTCG Pocket card catalog or compare tournament-scoped inclusion, average copies, and one-copy versus two-copy builds.",
    },
    indexable: true,
    context: context(
      { zh: "圖鑑與投入率是兩種資料", en: "Catalog and inclusion are different views" },
      {
        zh: "圖鑑模式回答某版本有哪些卡；投入率模式則回答在符合篩選的牌表中，有多少牌組採用該卡，以及通常放入幾張。兩者不共用同一個分母。",
        en: "Catalog mode answers which cards exist in a release. Inclusion mode asks how many filtered decklists use a card and how many copies they usually include. The two views do not share a denominator.",
      },
      {
        zh: "卡片資料來自本機卡表 catalog；投入率由已同步賽事牌表聚合。1 張與 2 張比例只在有可辨識張數的牌表中計算。",
        en: "Card identity comes from the local catalog; inclusion is aggregated from synchronized tournament decklists. One-copy and two-copy shares use only lists with recognizable counts.",
      },
      {
        zh: "高投入率只代表在目前樣本中常見，不代表卡片必然更強。缺牌表的賽事不會進入投入率分母，版本與時間篩選也會明顯改變結果。",
        en: "High inclusion means common in the current sample, not necessarily stronger. Events without decklists are absent from the denominator, and version or time filters can materially change the result.",
      },
    ),
  },
  "/pocket/players": {
    title: { zh: "PTCG Pocket 玩家排名｜BattleTowerMeta", en: "PTCG Pocket Player Ranking | BattleTowerMeta" },
    description: {
      zh: "依公開賽事成績比較 PTCG Pocket 玩家積分、參賽次數、最佳名次與常用牌組。",
      en: "Compare PTCG Pocket player points, event counts, best finishes, and commonly used decks from public tournament results.",
    },
    indexable: true,
    context: context(
      { zh: "玩家表現的可追溯摘要", en: "A traceable player-results summary" },
      {
        zh: "排名把同一玩家在篩選範圍內的公開賽事成績彙總，並連回其賽事履歷與常用牌組，方便核對分數從何而來。",
        en: "The ranking aggregates a player's public finishes within the selected scope and links back to event history and commonly used decks so the score can be traced.",
      },
      {
        zh: "玩家名稱與地區沿用賽事來源提供的識別，再由本站依名次權重彙總；版本、時間與 Top Cut 篩選會改變可計分的紀錄。",
        en: "Player names and regions follow source identifiers and are aggregated with the site's finish weights. Version, time, and Top Cut filters change which records qualify.",
      },
      {
        zh: "這不是官方全球排名。相同或變更過的玩家名稱可能無法合併，未被 Limitless 收錄的賽事也不在比較範圍內。",
        en: "This is not an official world ranking. Identical or changed player names may not merge correctly, and events absent from Limitless are outside the comparison.",
      },
    ),
  },
  "/pocket/countries": {
    title: { zh: "PTCG Pocket 地區排名｜BattleTowerMeta", en: "PTCG Pocket Region Ranking | BattleTowerMeta" },
    description: {
      zh: "按公開賽事紀錄彙總 PTCG Pocket 地區積分、玩家數與代表玩家，並保留未知地區。",
      en: "Aggregate PTCG Pocket region points, player counts, and leading players from public events while retaining unknown regions.",
    },
    indexable: true,
    context: context(
      { zh: "從玩家紀錄整理地區訊號", en: "Region signals derived from player records" },
      {
        zh: "地區頁把玩家排名再按來源提供的國家／地區代碼彙總，讓讀者同時看到總積分、參與玩家數與主要貢獻者。",
        en: "The region view groups player-ranking records by source-provided country or region code, showing total points, participating players, and leading contributors together.",
      },
      {
        zh: "分數沿用玩家排名的名次權重與相同篩選範圍；無法可靠辨識的地區保留為 UNKNOWN，而不是推測玩家所在地。",
        en: "Scores reuse the player ranking's finish weights and filter scope. Unreliable locations remain UNKNOWN rather than being guessed from a player's identity.",
      },
      {
        zh: "地區總分會受參賽人數與資料覆蓋影響，不能直接解讀為平均玩家實力或完整的國家代表性。",
        en: "Region totals are affected by participation volume and source coverage; they are not an average skill rating or a complete measure of national representation.",
      },
    ),
  },
  "/champions": {
    title: { zh: "Pokémon Champions 對戰環境｜BattleTowerMeta", en: "Pokémon Champions Battle Meta | BattleTowerMeta" },
    description: {
      zh: "整合 ChampionsBattleData 與 Limitless 隊伍 cache，比較寶可夢排名、招式、道具與配隊訊號。",
      en: "Compare Pokémon ranks, moves, items, and team signals from synchronized ChampionsBattleData and Limitless team caches.",
    },
    indexable: true,
    context: context(
      { zh: "兩個來源，各自保留語意", en: "Two sources with separate meanings" },
      {
        zh: "環境總覽把寶可夢層級訊號與公開賽事隊伍放在同一頁比較，但不把不同來源的 rank、usage 或 sample 欄位強行互換。",
        en: "The overview compares Pokémon-level signals with public tournament teams on one page without substituting rank, usage, or sample fields across sources.",
      },
      {
        zh: "寶可夢資料來自同步後的 ChampionsBattleData cache；隊伍參考來自 Limitless VGC 公開 standings。瀏覽器只讀本機靜態 JSON，不在頁面載入時呼叫外部 API。",
        en: "Pokémon data comes from the synchronized ChampionsBattleData cache; team references come from public Limitless VGC standings. The browser reads local static JSON and does not call external APIs at page load.",
      },
      {
        zh: "Season 與 regulation 可能分屬不同來源，不能視為同一篩選軸。只有在有可比較歷史和足夠樣本時才應顯示趨勢。",
        en: "Season and regulation may belong to different sources and are not interchangeable filters. Trends should appear only with comparable history and an adequate sample baseline.",
      },
    ),
  },
  "/champions/pokemon": {
    title: { zh: "Pokémon Champions 寶可夢排名｜BattleTowerMeta", en: "Pokémon Champions Pokémon Ranking | BattleTowerMeta" },
    description: {
      zh: "按賽季、賽制、屬性與能力值瀏覽 Pokémon Champions 寶可夢排名，並查看招式、道具及隊友詳情。",
      en: "Browse Pokémon Champions rankings by season, format, type, and stats, then inspect move, item, and teammate details.",
    },
    indexable: true,
    context: context(
      { zh: "排名與使用率不互相代替", en: "Rank and usage are not substitutes" },
      {
        zh: "排名頁保留來源提供的原始 rank，並把能力值、賽制與賽季做成可比較欄位。若來源沒有 usage，本頁維持未知，不以 rank 換算百分比。",
        en: "The ranking retains source-provided rank and makes stats, format, and season comparable. If usage is absent, it stays unknown and is never converted from rank.",
      },
      {
        zh: "列表與詳情讀取 ChampionsBattleData 的同步 cache；主圖優先使用 official artwork URL，失敗時回退至本機像素圖與文字縮寫。",
        en: "Lists and profiles read the synchronized ChampionsBattleData cache. Primary art prefers official-artwork URLs, then falls back to local pixel sprites and text initials.",
      },
      {
        zh: "同一寶可夢可能因賽季、賽制或形態出現多列。能力值與排名可排序，但不能由此推導完整對戰勝率或對局優勢。",
        en: "A Pokémon may have multiple rows across seasons, formats, or forms. Stats and rank can be sorted, but they do not establish full win rate or matchup advantage.",
      },
    ),
  },
  "/champions/teams": {
    title: { zh: "Pokémon Champions 隊伍參考｜BattleTowerMeta", en: "Pokémon Champions Team References | BattleTowerMeta" },
    description: {
      zh: "按賽季、賽制、寶可夢與成績查找同步自 Limitless VGC 的公開高排名隊伍參考。",
      en: "Find public high-placing team references synchronized from Limitless VGC by season, format, Pokémon, and result.",
    },
    indexable: true,
    context: context(
      { zh: "把隊伍當作可核對的參考", en: "Teams as traceable references" },
      {
        zh: "每張隊伍卡保留六隻寶可夢、來源、賽制、成績與可用樣本欄位，方便從單隻寶可夢回看實際出現過的隊伍核心。",
        en: "Each team card retains its six Pokémon, source, format, result, and available sample fields so a single Pokémon can be traced back to observed team cores.",
      },
      {
        zh: "隊伍主要來自 Limitless VGC 公開 standings，再經同步流程正規化寶可夢名稱與形態；像素圖只負責辨識，不補充缺失資料。",
        en: "Teams primarily come from public Limitless VGC standings, with Pokémon names and forms normalized during synchronization. Pixel sprites aid identification and do not fill missing data.",
      },
      {
        zh: "隊伍參考不等於本站推薦、完整租借隊或可複製招式表。出現次數與賽事名次也不能單獨證明隊伍在所有環境中的勝率。",
        en: "A team reference is not an editorial recommendation, a complete rental team, or a full moveset export. Frequency and finish alone do not establish win rate in every environment.",
      },
    ),
  },
  "/champions/speed": {
    title: { zh: "Pokémon Champions 速度線工具｜BattleTowerMeta", en: "Pokémon Champions Speed Tiers | BattleTowerMeta" },
    description: {
      zh: "比較 Pokémon Champions 寶可夢速度，調整 Level、性格、EV、IV、能力階級、順風與戲法空間。",
      en: "Compare Pokémon Champions Speed with level, nature, EV, IV, stage, Tailwind, and Trick Room controls.",
    },
    indexable: true,
    context: context(
      { zh: "速度順序的透明工作表", en: "A transparent Speed-order worksheet" },
      {
        zh: "速度場會把目前支援的輸入即時換算成有效速度並重新排序，讓讀者看見單一調整如何改變相對先後，而不是只得到一個孤立數字。",
        en: "The field converts supported inputs into effective Speed and reorders entries immediately, showing how one adjustment changes relative order rather than returning an isolated number.",
      },
      {
        zh: "候選池由同步資料還原的 Base Speed 建立；目前本機計算涵蓋頁面列出的 Level、性格、EV、IV、能力階級、道具、天氣、順風與戲法空間控制。",
        en: "The candidate pool is built from recovered Base Speed in synchronized data. Local calculation covers the Level, nature, EV, IV, stage, item, weather, Tailwind, and Trick Room controls listed on the page.",
      },
      {
        zh: "這不是完整回合規則引擎。未列出的特性、招式、場地互動與遊戲版本差異不會自動套用；使用前應核對目前標示的規則準確度。",
        en: "This is not a complete turn-rules engine. Unlisted abilities, moves, field interactions, and version differences are not applied automatically; check the stated rules coverage before use.",
      },
    ),
  },
  "/pocket/records": {
    title: { zh: "PTCG Pocket 個人排位記錄｜BattleTowerMeta", en: "PTCG Pocket Personal Records | BattleTowerMeta" },
    description: {
      zh: "登入後記錄個人排位對局、連勝與牌組表現；此互動頁不屬於公開賽事統計索引。",
      en: "Sign in to record personal ranked matches, streaks, and deck performance; this interactive page is outside the public statistics index.",
    },
    indexable: false,
  },
  "/champions/damage-calculator": {
    title: { zh: "Pokémon Champions 傷害計算器預覽｜BattleTowerMeta", en: "Pokémon Champions Damage Calculator Preview | BattleTowerMeta" },
    description: {
      zh: "傷害計算器目前只有輸入介面預覽，尚未接入完整 Pokémon 傷害規則，因此不輸出計算結果。",
      en: "The damage calculator is currently an input-interface preview without a complete Pokémon damage rules engine or calculated result.",
    },
    indexable: false,
    context: context(
      { zh: "功能範圍：介面預覽", en: "Scope: interface preview" },
      { zh: "目前頁面用來確認攻守方、招式與場地輸入契約，讓日後接入經驗證的規則引擎時不必重做整套操作流程。", en: "The current page validates attacker, defender, move, and field input contracts so a verified rules engine can be connected later without rebuilding the workflow." },
      { zh: "輸入選項來自同步 cache 與 typed contract；目前 `calculateDamage()` 不會產生傷害數字。", en: "Input options come from synchronized cache data and a typed contract; `calculateDamage()` does not currently produce damage numbers." },
      { zh: "本頁不是完整傷害引擎，不能用於判斷擊殺線、亂數範圍或正式比賽決策，因此暫不開放搜尋索引。", en: "This is not a complete damage engine and must not be used for knockout thresholds, roll ranges, or tournament decisions, so it remains outside the search index." },
    ),
  },
  "/champions/simulator": {
    title: { zh: "Pokémon Champions 手動對戰記錄工具｜BattleTowerMeta", en: "Pokémon Champions Manual Battle Log | BattleTowerMeta" },
    description: {
      zh: "以六隻隊伍欄位與逐回合文字記錄整理對戰；這是手動 battle log，不是 AI 或規則模擬器。",
      en: "Organize a battle with six-Pokémon team slots and turn-by-turn notes; this is a manual log, not an AI or rules simulator.",
    },
    indexable: false,
    context: context(
      { zh: "功能範圍：手動 battle log", en: "Scope: manual battle log" },
      { zh: "這個工具把雙方隊伍與逐回合筆記整理成可複製文字，適合回顧或分享人手輸入的對戰過程。", en: "This tool structures both teams and turn-by-turn notes into copyable text for reviewing or sharing a manually entered battle." },
      { zh: "寶可夢欄位使用同步 cache；回合內容完全由使用者輸入，系統不推演速度、招式、傷害或勝負。", en: "Pokémon fields use synchronized cache data; turns are entirely user-entered and the system does not resolve Speed, moves, damage, or outcomes." },
      { zh: "它不是 AI 對戰或規則模擬器，也不驗證輸入是否合法。為避免搜尋結果誤解功能完成度，本頁暫不開放索引。", en: "It is not an AI battle or rules simulator and does not validate legality. The page stays outside the search index to avoid overstating its completion." },
    ),
  },
};

const noindexDynamicPatterns = [
  /^\/pocket\/decks\/[^/]+$/,
  /^\/pocket\/tournaments\/[^/]+$/,
  /^\/pocket\/players\/[^/]+$/,
  /^\/champions\/pokemon\/[^/]+$/,
];

function normalizedPath(path: string) {
  if (!path || path === "/") return "/";
  return `/${path.split("/").filter(Boolean).join("/")}`;
}

export function siteSeoEntry(path: string): SeoEntry {
  const normalized = normalizedPath(path);
  const exact = entries[normalized];
  if (exact) return exact;

  if (noindexDynamicPatterns.some((pattern) => pattern.test(normalized))) {
    return {
      title: { zh: "資料詳情｜BattleTowerMeta", en: "Data Detail | BattleTowerMeta" },
      description: {
        zh: "BattleTowerMeta 資料詳情頁；完成樣本與原創內容審核前不進入搜尋索引。",
        en: "A BattleTowerMeta data-detail page kept outside search until its sample and original-content review is complete.",
      },
      indexable: false,
    };
  }

  return {
    title: { zh: "找不到頁面｜BattleTowerMeta", en: "Page Not Found | BattleTowerMeta" },
    description: { zh: "找不到要求的 BattleTowerMeta 頁面。", en: "The requested BattleTowerMeta page could not be found." },
    indexable: false,
  };
}

export function siteContext(path: string, lang: SiteLang) {
  const copy = siteSeoEntry(path).context?.[lang] ?? null;
  if (copy && (path === '/pocket' || path === '/pocket/top-decks' || path.startsWith('/pocket/decks/'))) {
    const method = lang === 'zh'
      ? '單、雙牌組賽事合併統計，每副登錄牌組各計一份。一般賽事沿用對局結果；雙牌組的牌組戰績按有牌組編號的小局計算，缺漏記錄不推算。'
      : 'Single- and dual-deck events share the same statistics, counting each registered deck once. Standard events retain match results; dual-deck results use games with explicit deck selections. Missing records are excluded.';
    return { ...copy, method: `${copy.method} ${method}` };
  }
  return copy;
}

export function canonicalUrl(path: string, lang: SiteLang) {
  const normalized = normalizedPath(path);
  return `${SITE_ORIGIN}${normalized === "/" ? "/" : normalized}${lang === "en" ? "?lang=en" : ""}`;
}

export function siteHead(route: Pick<RouteLocationNormalizedLoaded, "path"> & Partial<Pick<RouteLocationNormalizedLoaded, 'query'>>, lang: SiteLang) {
  const entry = siteSeoEntry(route.path);
  const title = entry.title[lang];
  const description = entry.description[lang];
  const canonical = canonicalUrl(route.path, lang);
  const zhUrl = canonicalUrl(route.path, "zh");
  const enUrl = canonicalUrl(route.path, "en");

  return {
    title,
    htmlAttrs: { lang, "data-lang": lang },
    meta: [
      { name: "description", content: description },
      { name: "robots", content: entry.indexable ? "index,follow,max-image-preview:large" : "noindex,follow" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "BattleTowerMeta" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: canonical },
      { property: "og:locale", content: lang === "en" ? "en_US" : "zh_HK" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
    link: [
      { rel: "canonical", href: canonical },
      { rel: "alternate", hreflang: "zh-Hant", href: zhUrl },
      { rel: "alternate", hreflang: "en", href: enUrl },
      { rel: "alternate", hreflang: "x-default", href: zhUrl },
    ],
  };
}
