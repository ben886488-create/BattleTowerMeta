<template>
  <div class="page">
    <h1 class="pageTitle">{{ ui.title }}</h1>

    <div class="filters">
      <div class="f">
        <label>{{ isZh ? "选手名" : "Player Name" }}</label>
        <input 
          type="text" 
          v-model="filters.player" 
          :placeholder="isZh ? '输入选手名' : 'Enter player name'"
        />
      </div>
      <div class="f">
        <label>{{ isZh ? "日期" : "Time" }}
          <span class="hint">{{ isZh ? "以 UTC 日期計算" : "Based on UTC date" }}</span>
        </label>
        <select v-model="filters.time">
          <option value="past7">{{ isZh ? "過去一週" : "Past 7 days" }}</option>
          <option value="past4w">{{ isZh ? "過去一月" : "Past 4 weeks" }}</option>
        </select>
        <!-- <div class="hint">{{ isZh ? "以 UTC 日期計算" : "Based on UTC date" }}</div> -->
      </div>
      <div class="f">
        <label>{{ isZh ? "版本" : "Set" }}</label>
        <select v-model="filters.set">
          <option value="">{{ isZh ? "全部" : "All" }}</option>
          <option v-for="s in setOptions" :key="s" :value="s">
            {{ versionLabel(s) }}
          </option>
        </select>
        <div class="hint">{{ isZh ? " " : " " }}</div>
      </div>
      <div class="f">
        <label>Top cut</label>
        <select v-model="filters.topcut">
          <option value="">{{ isZh ? "全部" : "All" }}</option>
          <option value="Winer">{{ isZh ? "第一名" : "Winer" }}</option>
          <option value="Top 2">{{ isZh ? "前兩名" : "Top 2" }}</option>
          <option value="Top 4">{{ isZh ? "前四名" : "Top 4" }}</option>
          <option value="Top 8">{{ isZh ? "前八名" : "Top 8" }}</option>
          <option value="Top 16">{{ isZh ? "前十六名" : "Top 16" }}</option>
          <option value="Top 32">{{ isZh ? "前三十二名" : "Top 32" }}</option>
        </select>
      </div>
    </div>

    <div class="meta">
      <div>{{ ui.rule }}</div>
    </div>

    <div class="tableWrap">
      <table class="tbl">
        <thead>
          <tr>
            <th>#</th>
            <th>{{ ui.player }}</th>
            <th>{{ ui.country }}</th>
            <th class="num">{{ ui.points }}</th>
            <th class="num">{{ ui.session }}</th>
          </tr>
        </thead>
        <tbody>
          <!-- <tr v-for="(r, i) in rows" :key="r.player">
            <td class="muted">{{ i + 1 }}</td>
            <td>{{ r.player }}</td>
            <td class="num mono">{{ r.points }}</td>
          </tr> -->
          <!-- 显示当前页的数据 -->
          <tr v-for="(r, i) in currentPageRows" :key="r.player">
            <td class="muted">{{ (currentPage - 1) * pageSize + i + 1 }}</td>
            <td>
              <span class="player-name">{{ r.player }}</span>
            </td>
            <!-- 🌟 国家列：旗帜 + 多语言全名 -->
            <td class="country-cell">
              <!-- 旗帜图标（flag-icons 类名要求小写国家代码） -->
              <span 
                v-if="r.country"
                class="flag-icon" 
                :class="`fi fi-${r.country.toLowerCase()}`"
                aria-hidden="true"
              ></span>
              <span v-else class="fi fi-xx"></span>
              <!-- 多语言国家全名 -->
              <span class="country-name">{{ getCountryName(r.country ?? '') }}</span>
            </td>
            <td class="num mono">{{ r.points }}</td>
            <td class="num mono">{{ r.games }}</td>
          </tr>
          <!-- 空数据提示 -->
          <tr v-if="!currentPageRows.length">
            <td colspan="5" style="text-align: center; padding: 20px;">
              {{ isZh ? '暂无数据' : 'No data' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页控件 -->
    <div class="pagination" v-if="totalPages > 1">
      <button 
        class="page-btn" 
        :disabled="currentPage === 1"
        @click="currentPage -= 1"
      >
        {{ isZh ? '上一页' : 'Previous' }}
      </button>
      
      <span class="page-info">
        {{ isZh ? `第 ${currentPage} 页 / 共 ${totalPages} 页` : `Page ${currentPage} / ${totalPages}` }}
      </span>
      
      <button 
        class="page-btn" 
        :disabled="currentPage === totalPages"
        @click="currentPage += 1"
      >
        {{ isZh ? '下一页' : 'Next' }}
      </button>

      <!-- 可选：快速跳页控件 -->
      <div class="page-jump" v-if="totalPages > 5">
        <input 
          type="number" 
          v-model.number="jumpPage" 
          :min="1" 
          :max="totalPages"
          class="page-input"
        >
        <button 
          class="page-btn jump-btn"
          @click="jumpToPage"
        >
          {{ isZh ? '跳转' : 'Go' }}
        </button>
      </div>
    </div>
  </div>  
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";
import { computed, reactive, ref, watch, onMounted } from "vue";
import "flag-icons/css/flag-icons.min.css";

// 1. 导入多语言国家名称库
import countries from 'i18n-iso-countries';
// 2. 导入中文/英文语言包（按需加载）
import enLang from 'i18n-iso-countries/langs/en.json';
import zhCnLang from 'i18n-iso-countries/langs/zh.json';

countries.registerLocale(enLang);
countries.registerLocale(zhCnLang);

// 统一：从 public/data/players.json 读取玩家积分数据
const BASE_URL = (import.meta as any).env?.BASE_URL ?? "/";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "force-cache" });
  if (!res.ok) throw new Error(`Fetch failed ${res.status} for ${url}`);
  return (await res.json()) as T;
}

type PlayerRow = {
  player: string;
  points: number;
  games: number;
  country?: string | null;
};

const players = ref<PlayerRow[]>([]);

onMounted(async () => {
  try {
    players.value = await fetchJson<PlayerRow[]>(`${BASE_URL}data/players.json`);
  } catch {
    players.value = [];
  }
});

const route = useRoute();

const lang = computed<"zh" | "en">(() => {
  const seg = String(route.path).split("/")[1];
  return seg === "en" ? "en" : "zh";
});

const isZh = computed(() => lang.value === "zh");

const ui = computed(() => {
  if (isZh.value) {
    return {
      title: "玩家排行榜",
      rule: "积分规则 = 你在每场比赛中的排名权重（第1名 10分，第2名 8分，第3-4名 6分，第5-8名 4分，第9-16名 2分，第17-32名 1分）",
      player: "玩家",
      country: "国家/地区",
      points: "积分",
      session: "场次",
      unknown: "未知",
    };
  }
  return {
    title: "Player Ranking",
    rule: "Points rule = your placing weights (1st 10, 2nd 8, 3-4 6, 5-8 4, 9-16 2, 17-32 1)",
    player: "Player",
    country: "Region",
    points: "Points",
    session: "Sessions",
    unknown: "Unknown Region",
  };
});

const filters = reactive({
  player: "" as string,
  time: "past7" as string, 
  set: "" as string,
  topcut: "" as string
});

function versionLabel(code?: string) {
  if (!code) return "—";
  const v = VERSION_BY_CODE[code];
  if (!v) return code;
  return isZh.value ? `${v.code} - ${v.nameZh}` : `${v.code} - ${v.nameEn}`;
}

const GAME_VERSIONS = [
  { code: "A1", nameZh: "最強的基因", nameEn: "Genetic Apex", releaseUtcIso: "2024-10-30T01:00:00Z", releaseMs: Date.parse("2024-10-30T01:00:00Z") },
  { code: "A1a", nameZh: "幻遊島", nameEn: "Mythical Island", releaseUtcIso: "2024-12-17T06:00:00Z", releaseMs: Date.parse("2024-12-17T06:00:00Z") },
  { code: "A2", nameZh: "時空激鬥", nameEn: "Space-Time Smackdown", releaseUtcIso: "2025-01-30T06:00:00Z", releaseMs: Date.parse("2025-01-30T06:00:00Z") },
  { code: "A2a", nameZh: "超克之光", nameEn: "Triumphant Light", releaseUtcIso: "2025-02-28T06:00:00Z", releaseMs: Date.parse("2025-02-28T06:00:00Z") },
  { code: "A2b", nameZh: "嗨放異彩", nameEn: "Shining Revelry", releaseUtcIso: "2025-03-27T06:00:00Z", releaseMs: Date.parse("2025-03-27T06:00:00Z") },
  { code: "A3", nameZh: "雙天之守護者", nameEn: "Celestial Guardians", releaseUtcIso: "2025-04-30T06:00:00Z", releaseMs: Date.parse("2025-04-30T06:00:00Z") },
  { code: "A3a", nameZh: "異次元危機", nameEn: "Extradimensional Crisis", releaseUtcIso: "2025-05-29T06:00:00Z", releaseMs: Date.parse("2025-05-29T06:00:00Z") },
  { code: "A3b", nameZh: "伊布花園", nameEn: "Eevee Grove", releaseUtcIso: "2025-06-26T06:00:00Z", releaseMs: Date.parse("2025-06-26T06:00:00Z") },
  { code: "A4", nameZh: "天與海的指引", nameEn: "Wisdom of Sea and Sky", releaseUtcIso: "2025-07-30T06:00:00Z", releaseMs: Date.parse("2025-07-30T06:00:00Z") },
  { code: "A4a", nameZh: "未知水域", nameEn: "Secluded Springs", releaseUtcIso: "2025-08-28T06:00:00Z", releaseMs: Date.parse("2025-08-28T06:00:00Z") },
  { code: "A4b", nameZh: "高級擴充包ex", nameEn: "Deluxe Pack: ex", releaseUtcIso: "2025-09-30T06:00:00Z", releaseMs: Date.parse("2025-09-30T06:00:00Z") },
  { code: "B1", nameZh: "超級崛起", nameEn: "Mega Rising", releaseUtcIso: "2025-10-30T06:00:00Z", releaseMs: Date.parse("2025-10-30T06:00:00Z") },
  { code: "B1a", nameZh: "紅蓮烈焰", nameEn: "Crimson Blaze", releaseUtcIso: "2025-12-17T06:00:00Z", releaseMs: Date.parse("2025-12-17T06:00:00Z") },
  { code: "B2", nameZh: "幻夢遊行", nameEn: "Fantastical Parade", releaseUtcIso: "2026-01-29T01:00:00Z", releaseMs: Date.parse("2026-01-29T01:00:00Z") },
  { code: "B2a", nameZh: "帕底亞驚奇", nameEn: "Paldean Wonders", releaseUtcIso: "2026-02-26T01:00:00Z", releaseMs: Date.parse("2026-02-26T01:00:00Z") },
].sort((a, b) => a.releaseMs - b.releaseMs) as GameVersion[];

const VERSION_BY_CODE: Record<string, GameVersion> = Object.fromEntries(
  GAME_VERSIONS.map((v) => [v.code, v])
);

type GameVersionCode =
  | "A1" | "A1a" | "A2" | "A2a" | "A2b"
  | "A3" | "A3a" | "A3b" | "A4" | "A4a" | "A4b"
  | "B1" | "B1a" | "B2" | "B2a";

type GameVersion = {
  code: GameVersionCode;
  nameZh: string;
  nameEn: string;
  releaseUtcIso: string; // ISO string in UTC
  releaseMs: number;     // Date.parse(releaseUtcIso)
};

const setOptions = computed(() => GAME_VERSIONS.map(v => v.code).reverse());

// 分页配置
const pageSize = ref(15); // 每页显示10条
const currentPage = ref(1); // 当前页码
const jumpPage = ref(1); // 跳转页码

// 所有玩家数据
const allPlayers = computed(() => players.value || []);

// 总页数
// const totalPages = computed(() => {
//   return Math.ceil(allPlayers.value.length / pageSize.value);
// });

// // 当前页显示的数据
// const currentPageRows = computed(() => {
//   const start = (currentPage.value - 1) * pageSize.value;
//   const end = start + pageSize.value;
//   return allPlayers.value.slice(start, end);
// });

// 总页数（基于过滤后的数据）
const totalPages = computed(() => {
  return Math.ceil(filteredPlayers.value.length / pageSize.value);
});

// 当前页显示的数据（基于过滤后的数据）
const currentPageRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredPlayers.value.slice(start, end);
});

// 跳转页面方法
const jumpToPage = () => {
  if (jumpPage.value < 1) {
    jumpPage.value = 1;
  } else if (jumpPage.value > totalPages.value) {
    jumpPage.value = totalPages.value;
  }
  currentPage.value = jumpPage.value;
};

// 🌟 新增：根据国家代码和当前语言获取多语言国家全名
const getCountryName = (code: string) => {
  if (!code) return isZh.value ? '未知' : 'Unknown Region'; // 空值兜底
  try {
    // 获取官方全称（支持中文/英文）
    return countries.getName(code, lang.value, { select: 'official' }) || code;
  } catch (e) {
    // 异常兜底（比如无效的国家代码）
    return code;
  }
};

// 过滤后的玩家列表（按选手名）
const filteredPlayers = computed(() => {
  if (!filters.player.trim()) {
    // 无筛选条件时返回全部
    return allPlayers.value;
  }
  // 模糊匹配，不区分大小写
  const keyword = filters.player.trim().toLowerCase();
  return allPlayers.value.filter(player => 
    player.player.toLowerCase().includes(keyword)
  );
});

// 监听选手名筛选变化，重置页码到第1页
watch(
  () => filters.player,
  () => {
    currentPage.value = 1;
  }
);

// 监听总页数变化，防止页码超出范围
watch(totalPages, () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value || 1;
  }
});
</script>

<style scoped>
.page{ width: 100%; max-width: 1100px; }
.pageTitle { margin: 0 0 12px; color: rgba(255,255,255,0.92); font-size: 18px; font-weight: 800; }
.meta { margin-bottom: 12px; color: rgba(226,232,240,.75); font-size: 12px; line-height: 1.5; }
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }

.tableWrap { overflow: auto; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; background: rgba(15,23,42,0.35); }
.tbl { width: 100%; border-collapse: collapse; min-width: 320px; }
th, td { padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.06); text-align: left; }
/* 确保所有表格行背景色一致 */
tr { background: transparent; }
tr:hover { background: rgba(255,255,255,0.03); }
th { font-size: 12px; color: rgba(226,232,240,.75); font-weight: 700; }
td { font-size: 13px; color: rgba(255,255,255,0.9); }
.num { text-align: right; }
.muted { color: rgba(226,232,240,.55); }

/* 🌟 新增：国家列样式（旗帜 + 文字） */
.country-cell {
  display: flex;
  align-items: center;
  gap: 8px; /* 旗帜和文字的间距 */
}
.flag-icon {
  width: 20px;
  height: 14px; /* 保持旗帜3:2的黄金比例 */
  display: inline-block;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}
.player-name {
  display: inline-block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.country-name {
  display: inline-block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 分页样式 */
.pagination {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  color: rgba(255,255,255,0.9);
  font-size: 13px;
  flex-wrap: wrap;
}

.page-btn {
  padding: 6px 12px;
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 6px;
  background: rgba(15,23,42,0.5);
  color: rgba(255,255,255,0.9);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-btn:not(:disabled):hover {
  background: rgba(15,23,42,0.8);
  border-color: rgba(255,255,255,0.25);
}

.page-info {
  color: rgba(226,232,240,.75);
  font-size: 12px;
}

.page-jump {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  flex-wrap: wrap;
}

.page-input {
  width: 60px;
  padding: 6px 8px;
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 6px;
  background: rgba(15,23,42,0.5);
  color: rgba(255,255,255,0.9);
  font-size: 12px;
  outline: none;
}

.page-input:focus {
  border-color: rgba(255,255,255,0.25);
}

.jump-btn {
  padding: 6px 10px;
}

.filters {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin: 10px 0 12px;
}

/* 中屏幕：2列布局 */
@media (max-width: 980px) {
  .filters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* 小屏幕：2列布局，调整间距 */
@media (max-width: 760px) {
  .filters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }
  
  .f {
    padding: 8px;
  }
  
  .f label {
    font-size: 11px;
    margin-bottom: 4px;
  }
  
  .f input,
  .f select {
    padding: 6px 8px;
    font-size: 12px;
  }
  
  .hint {
    font-size: 10px;
    margin-top: 4px;
  }
  
  /* 表格调整 */
  .tbl {
    min-width: 320px;
  }
  
  th, td {
    padding: 8px 10px;
    font-size: 12px;
  }
  
  /* 国家列调整 */
  .country-cell {
    gap: 6px;
  }
  
  .flag-icon {
    width: 16px;
    height: 12px;
  }
  
  .player-name {
    max-width: 70px;
    font-size: 12px;
  }
  
  .country-name {
    max-width: 60px;
    font-size: 12px;
  }
  
  /* 分页调整 */
  .pagination {
    gap: 8px;
    font-size: 12px;
  }
  
  .page-btn {
    padding: 4px 8px;
    font-size: 11px;
  }
  
  .page-info {
    font-size: 11px;
  }
  
  .page-input {
    width: 50px;
    padding: 4px 6px;
    font-size: 11px;
  }
  
  .jump-btn {
    padding: 4px 8px;
  }
}

/* 超小屏幕：保持2列布局 */
@media (max-width: 480px) {
  .filters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  
  .pagination {
    flex-direction: row;
    align-items: center;
    flex-wrap: wrap;
  }
  
  .page-jump {
    margin-left: auto;
    justify-content: flex-end;
  }
}

.f {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.35);
  padding: 10px;
}

.f label {
  display: block;
  font-size: 12px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 6px;
}

.f input,
.f select {
  width: 100%;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(2, 6, 23, 0.35);
  color: rgba(255, 255, 255, 0.92);
  padding: 8px 10px;
  outline: none;
}

.hint {
  margin-top: 6px;
  font-size: 11px;
  color: rgba(226, 232, 240, 0.65);
}
</style>