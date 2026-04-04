<template>
  <div class="page">
    <div class="header">
      <div>
        <div class="title">{{ ui.title }}</div>
        <!-- <div class="sub">
          {{ ui.standingsTitle }}
        </div> -->
      </div>
    </div>
    <div class="filters">
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
    </div>
    <div class="tableWrap">
      <div class="responsive-table">
        <table class="tbl">
          <thead>
            <tr>
              <th class="num" rowspan="2">
                {{ ui.rank }}
              </th>
              <th rowspan="2">
                {{ ui.country }}
              </th>
              <th class="num" rowspan="2">
                {{ ui.totalcountryplayers }}
              </th>
              <th class="num" rowspan="2">
                {{ ui.totalplayers }}
              </th>
              <th colspan="4" style="text-align: center;">{{ ui.bestplayer }}</th>
            </tr>
            <tr>
              <th class="num">
                {{ ui.first }}
              </th>
              <th class="num">
                {{ ui.second }}
              </th>
              <th class="num">
                {{ ui.third }}
              </th>
              <th class="num">
                {{ ui.actions }}
              </th>
            </tr>
          </thead>
          <tbody>
            <!-- 空数据提示 -->
            <tr v-if="countryRows.length === 0">
              <td colspan="8" style="text-align: center; color: rgba(226,232,240,0.7);">
                {{ ui.noData }}
              </td>
            </tr>
            <tr v-if="paginatedCountryRows.length === 0 && countryRows.length > 0">
              <td colspan="8" style="text-align: center; color: rgba(226,232,240,0.7);">
                {{ ui.noDataInPage }}
              </td>
            </tr>
            <!-- 动态渲染国家排行榜 -->
            <tr v-for="(item, index) in paginatedCountryRows" :key="item.countryCode">
              <!-- 排名序号：(当前页-1)*每页条数 + 索引 + 1 -->
              <td class="num">{{ (currentPage - 1) * pageSize + index + 1 }}</td>
              <!-- 国旗 + 中文全称 -->
              <td>
                <span class="flag">
                  <span 
                    v-if="item.countryCode !== 'Unknown' " 
                    :class="`fi fi-${item.countryCode.toLowerCase()}`"
                  ></span>
                  <span v-else class="fi fi-xx"></span>
                </span>
                <span class="country-name">
                  <span v-if="isZh">{{ item.countryFullName }}</span>
                  <span v-else>{{ item.countryEnName }}</span>
                </span>
              </td>
              <td class="num">{{ item.totalPoints }}</td>
              <td class="num">{{ item.totalPlayers }}</td>
              <td class="num player-cell">{{ item.bestPlayers.first?.player || "-" }}</td>
              <td class="num player-cell">{{ item.bestPlayers.second?.player || "-" }}</td>
              <td class="num player-cell">{{ item.bestPlayers.third?.player || "-" }}</td>
              <!-- 查看按钮：点击传当前国家代码 -->
              <td class="num">
                <button 
                  class="page-btn"
                  @click="openPlayerModal(item.countryCode)"
                >
                  {{ ui.view }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- 移动端卡片式布局 -->
      <div class="mobile-cards" v-if="paginatedCountryRows.length > 0">
        <div v-for="(item, index) in paginatedCountryRows" :key="item.countryCode" class="mobile-card">
          <div class="card-header">
            <span class="rank-badge">{{ (currentPage - 1) * pageSize + index + 1 }}</span>
            <div class="country-info">
              <span class="flag">
                <span 
                  v-if="item.countryCode !== 'Unknown' " 
                  :class="`fi fi-${item.countryCode.toLowerCase()}`"
                ></span>
                <span v-else class="fi fi-xx"></span>
              </span>
              <span class="country-name">
                <span v-if="isZh">{{ item.countryFullName }}</span>
                <span v-else>{{ item.countryEnName }}</span>
              </span>
            </div>
          </div>
          <div class="card-stats">
            <div class="stat-item">
              <span class="stat-label">{{ ui.totalcountryplayers }}</span>
              <span class="stat-value">{{ item.totalPoints }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">{{ ui.totalplayers }}</span>
              <span class="stat-value">{{ item.totalPlayers }}</span>
            </div>
          </div>
          <div class="card-best-players">
            <div class="best-player-title">{{ ui.bestplayer }}</div>
            <div class="best-player-item">
              <span class="player-rank">{{ ui.first }}</span>
              <span class="player-name">{{ item.bestPlayers.first?.player || "-" }}</span>
            </div>
            <div class="best-player-item">
              <span class="player-rank">{{ ui.second }}</span>
              <span class="player-name">{{ item.bestPlayers.second?.player || "-" }}</span>
            </div>
            <div class="best-player-item">
              <span class="player-rank">{{ ui.third }}</span>
              <span class="player-name">{{ item.bestPlayers.third?.player || "-" }}</span>
            </div>
          </div>
          <div class="card-actions">
            <button 
              class="page-btn"
              @click="openPlayerModal(item.countryCode)"
            >
              {{ ui.view }}
            </button>
          </div>
        </div>
      </div>
    </div>
     <!-- 分页控件 -->
    <div class="pagination" v-if="totalPages > 1">
      <!-- 首页 -->
      <button 
        class="page-btn" 
        :disabled="currentPage === 1"
        @click="currentPage = 1"
      >
        {{ ui.firstPage }}
      </button>
      <!-- 上一页 -->
      <button 
        class="page-btn" 
        :disabled="currentPage === 1"
        @click="currentPage -= 1"
      >
        {{ ui.prevPage }}
      </button>
      
      <!-- 页码列表（最多显示5个页码） -->
      <span 
        class="page-num" 
        v-for="page in visiblePages" 
        :key="page"
        :class="{ active: page === currentPage }"
        @click="currentPage = page"
      >
        {{ page }}
      </span>
      
      <!-- 下一页 -->
      <button 
        class="page-btn" 
        :disabled="currentPage === totalPages"
        @click="currentPage += 1"
      >
        {{ ui.nextPage }}
      </button>
      <!-- 尾页 -->
      <button 
        class="page-btn" 
        :disabled="currentPage === totalPages"
        @click="currentPage = totalPages"
      >
        {{ ui.lastPage }}
      </button>
      <!-- 页码信息 -->
      <span class="page-info">
        {{ ui.pageInfo }} {{ currentPage }} / {{ totalPages }} | {{ ui.total }} {{ totalCount }} {{ ui.items }}
      </span>
    </div>

    <!-- 带分页的选手列表弹窗 -->
    <div class="modal-mask" v-if="modalVisible" @click="closePlayerModal">
      <div class="modal-content" @click.stop>
        <!-- 弹窗头部 -->
        <div class="modal-header">
          <div class="header-left">
            <span class="flag modal-flag">
              <span 
                v-if="currentCountryCode !== 'Unknown'" 
                :class="`fi fi-${currentCountryCode.toLowerCase()}`"
              ></span>
              <span v-else class="fi fi-xx"></span>
            </span>
            <h3>{{ currentCountryName }} {{ ui.playerList }}</h3>
          </div>
          <button class="close-btn" @click="closePlayerModal">×</button>
        </div>
        
        <!-- 弹窗内容 -->
        <div class="modal-body">
          <!-- 空数据样式 -->
          <div class="empty-state" v-if="currentCountryPlayers.length === 0">
            <div class="empty-icon">📊</div>
            <div class="empty-text">{{ ui.noPlayerData }}</div>
          </div>
          
          <!-- 选手列表 + 分页 -->
          <div v-else>
            <!-- 选手列表 -->
            <div class="player-list">
              <!-- 列表头部 -->
              <div class="player-list-header">
                <div class="col rank-col">{{ ui.rank }}</div>
                <div class="col name-col">{{ ui.playerName }}</div>
                <div class="col points-col">{{ ui.points }}</div>
              </div>
              <!-- 列表项（当前页数据） -->
              <div 
                class="player-list-item" 
                v-for="(player, index) in modalPaginatedPlayers" 
                :key="player.player"
                :class="{ top3: (modalCurrentPage - 1) * modalPageSize + index < 3 }"
              >
                <!-- 排名（全局排名，非分页内排名） -->
                <div class="col rank-col">
                  <span class="rank-number" 
                    :class="{ 
                      top1: (modalCurrentPage - 1) * modalPageSize + index === 0, 
                      top2: (modalCurrentPage - 1) * modalPageSize + index === 1, 
                      top3: (modalCurrentPage - 1) * modalPageSize + index === 2 
                    }"
                  >
                    {{ (modalCurrentPage - 1) * modalPageSize + index + 1 }}
                  </span>
                </div>
                <div class="col name-col">
                  <span class="player-name">{{ player.player }}</span>
                </div>
                <div class="col points-col">
                  <span class="points-value">{{ player.points }}</span>
                </div>
              </div>
            </div>

            <!-- 弹窗分页控件 -->
            <div class="modal-pagination">
              <!-- 每页条数选择 -->
              <div class="page-size-selector">
                <label>{{ ui.pageSize }}:</label>
                <select v-model.number="modalPageSize" @change="resetModalPage">
                  <option value="5">5</option>
                  <option value="10" selected>10</option>
                  <option value="20">20</option>
                </select>
              </div>
              
              <!-- 分页按钮 -->
              <div class="page-controls">
                <button 
                  class="modal-page-btn" 
                  :disabled="modalCurrentPage === 1"
                  @click="modalCurrentPage -= 1"
                >
                  {{ ui.prevPage }}
                </button>
                
                <span 
                  class="modal-page-num" 
                  v-for="page in modalVisiblePages" 
                  :key="page"
                  :class="{ active: page === modalCurrentPage }"
                  @click="modalCurrentPage = page"
                >
                  {{ page }}
                </span>
                
                <button 
                  class="modal-page-btn" 
                  :disabled="modalCurrentPage === modalTotalPages"
                  @click="modalCurrentPage += 1"
                >
                  {{ ui.nextPage }}
                </button>
              </div>
              
              <!-- 分页信息 -->
              <div class="modal-page-info">
                {{ ui.pageInfo }} {{ modalCurrentPage }} / {{ modalTotalPages }} | {{ ui.total }} {{ currentCountryPlayers.length }} {{ ui.items }}
              </div>
            </div>
          </div>
        </div>
        
        <!-- 弹窗底部 -->
        <div class="modal-footer">
          <button class="confirm-btn" @click="closePlayerModal">
            <span class="btn-icon">✕</span> {{ ui.close }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";
import { computed, reactive, ref, onMounted } from "vue";
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

const players = ref<Player[]>([]);

onMounted(async () => {
  try {
    players.value = await fetchJson<Player[]>(`${BASE_URL}data/players.json`);
  } catch {
    players.value = [];
  }
});

const route = useRoute();

const lang = computed<"zh" | "en">(() => {
  const seg = String(route.path).split("/")[1];
  return seg === "en" ? "en" : "zh";
});

const playerRows = computed<Player[]>(() => players.value || []);

const isZh = computed(() => lang.value === "zh");

const ui = computed(() => {
  if (isZh.value) {
    return {
      title: "《宝可梦 TCG 口袋版》国家 / 地区玩家排行榜",
      standingsTitle: "赛事",
      rank: "排名",
      country: "国家/地区",
      totalcountryplayers: "国家/地区玩家总分数",
      totalplayers: "合计玩家总数",
      bestplayer: "最佳玩家",
      first: "第一",
      second: "第二",
      third: "第三",
      actions:"操作",
      view: "查看",
      noData: "暂无玩家数据",
      noDataInPage: "当前页无数据",
      firstPage: "首页",
      prevPage: "上一页",
      nextPage: "下一页",
      lastPage: "尾页",
      pageInfo: "第",
      total: "共",
      items: "条数据",
      playerList: "选手列表",
      playerName: "选手名",
      points: "分数",
      noPlayerData: "暂无该国家选手数据",
      close: "关闭",
      pageSize: "每页条数" 
    };
  }
  return {
    title: "Pokémon TCG Pocket Country Player Rankings",
    standingsTitle: "Season",
    rank: "Rank",
    country: "Country/Region",
    totalcountryplayers: "Total Points in Country/Region",
    totalplayers: "Total Players",
    bestplayer: "Best Player in Country/Region",
    first: "1st",
    second: "2nd",
    third: "3rd",
    actions: "Actions",
    view: "View",
    noData: "No player data available",
    noDataInPage: "No data on current page",
    firstPage: "First",
    prevPage: "Previous",
    nextPage: "Next",
    lastPage: "Last",
    pageInfo: "Page",
    total: "Total",
    items: "items",
    playerList: "Player List",
    playerName: "Player Name",
    points: "Points",
    noPlayerData: "No player data for this country",
    close: "Close",
    pageSize: "Page Size"

  };
});

// 类型定义
interface Player {
  player: string;
  points: number;
  country: string | null; // 国家代码（如 JP/US/CN）
}

interface CountryStat {
  totalPoints: number;
  totalPlayers: number;
  players: Player[];
}

// 分页状态管理（可自定义每页条数）
const pageSize = ref(10); // 每页显示10条
const currentPage = ref(1); // 当前页码

// 2. 按国家分组统计
const countryStats = computed<Record<string, CountryStat>>(() => {
  const stats: Record<string, CountryStat> = {};

  playerRows.value.forEach(player => {
    // 标准化国家代码（转大写，无则归为Unknown）
    const countryCode = player.country?.trim().toUpperCase() || "Unknown";
    if (!stats[countryCode]) {
      stats[countryCode] = {
        totalPoints: 0,
        totalPlayers: 0,
        players: [],
      };
    }
    stats[countryCode].totalPoints += player.points;
    stats[countryCode].totalPlayers += 1;
    stats[countryCode].players.push(player);
  });

  return stats;
});

// 3. 处理最终排行榜数据（自动生成多语言名称）
// 所有国家排行榜数据（未分页）
const countryRows = computed(() => {
  return Object.entries(countryStats.value)
    .map(([countryCode, stat]) => {
      let countryEnName = 'Unknown Region';
      let countryFullName = '未知地区';
      if (countryCode !== 'Unknown') {
        countryEnName = countries.getName(countryCode, 'en') || countryCode;
        countryFullName = countries.getName(countryCode, 'zh') || countryEnName;
      }
      const sortedPlayers = stat.players.sort((a, b) => b.points - a.points);
      return {
        countryCode,
        countryEnName,
        countryFullName,
        totalPoints: stat.totalPoints,
        totalPlayers: stat.totalPlayers,
        bestPlayers: {
          first: sortedPlayers[0] || null,
          second: sortedPlayers[1] || null,
          third: sortedPlayers[2] || null,
        }
      };
    })
    .sort((a, b) => b.totalPoints - a.totalPoints);
});

// 分页计算属性
const totalCount = computed(() => countryRows.value.length); // 总数据条数
const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value)); // 总页数
// 当前页显示的数据
const paginatedCountryRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return countryRows.value.slice(start, end);
});
// 可见页码（最多显示5个，避免页码过多）
const visiblePages = computed(() => {
  const pages = [];
  const total = totalPages.value;
  const current = currentPage.value;
  if (total <= 5) {
    // 总页数 <=5，显示全部
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    // 总页数 >5，显示当前页前后各2页
    if (current <= 3) {
      // 前3页：显示1-5
      pages.push(1, 2, 3, 4, 5);
    } else if (current >= total - 2) {
      // 后3页：显示最后5页
      pages.push(total - 4, total - 3, total - 2, total - 1, total);
    } else {
      // 中间页：显示当前页前后各2页
      pages.push(current - 2, current - 1, current, current + 1, current + 2);
    }
  }
  return pages;
});

// 弹窗状态管理
const modalVisible = ref(false); // 弹窗是否显示
const currentCountryCode = ref(''); // 当前弹窗的国家代码
const currentCountryName = ref(''); // 当前弹窗的国家名称
const currentCountryPlayers = ref<Player[]>([]); // 当前国家的所有选手
// 弹窗分页状态（独立于主表）
const modalPageSize = ref(10); // 弹窗默认每页5条
const modalCurrentPage = ref(1); // 弹窗当前页

// -------------------------- 弹窗分页核心计算 --------------------------
// 弹窗总页数
const modalTotalPages = computed(() => {
  return Math.ceil(currentCountryPlayers.value.length / modalPageSize.value);
});

// 弹窗当前页数据
const modalPaginatedPlayers = computed(() => {
  const start = (modalCurrentPage.value - 1) * modalPageSize.value;
  const end = start + modalPageSize.value;
  return currentCountryPlayers.value.slice(start, end);
});

// 弹窗可见页码（最多显示5个）
const modalVisiblePages = computed(() => {
  const pages = [];
  const total = modalTotalPages.value;
  const current = modalCurrentPage.value;
  if (total <= 5) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    if (current <= 3) {
      pages.push(1, 2, 3, 4, 5);
    } else if (current >= total - 2) {
      pages.push(total - 4, total - 3, total - 2, total - 1, total);
    } else {
      pages.push(current - 2, current - 1, current, current + 1, current + 2);
    }
  }
  return pages;
});

// 弹窗每页条数改变时重置页码为1
const resetModalPage = () => {
  modalCurrentPage.value = 1;
};

// -------------------------- 弹窗方法 --------------------------
const openPlayerModal = (countryCode: string) => {
  currentCountryCode.value = countryCode;
  currentCountryName.value = countryCode === 'Unknown' 
    ? (isZh.value ? '未知地区' : 'Unknown Region')
    : (isZh.value ? (countries.getName(countryCode, 'zh-CN') || countryCode) : (countries.getName(countryCode, 'en') || countryCode));
  // 筛选并排序当前国家选手
  currentCountryPlayers.value = playerRows.value
    .filter(player => (player.country?.trim().toUpperCase() || 'Unknown') === countryCode)
    .sort((a, b) => b.points - a.points);
  // 打开弹窗时重置弹窗分页状态
  modalCurrentPage.value = 1;
  modalPageSize.value = 10;
  modalVisible.value = true;
  document.body.style.overflow = 'hidden';
};

const closePlayerModal = () => {
  modalVisible.value = false;
  document.body.style.overflow = 'auto';
};

const filters = reactive({
  time: "past7" as string, 
  set: "" as string,
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

</script>

<style scoped>
.page {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  box-sizing: border-box;
  padding: 0 10px;
}

.header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-end;
  margin-bottom: 12px;
}

.title {
  font-size: 18px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.92);
}

.sub {
  margin-top: 4px;
  font-size: 12px;
  color: rgba(226, 232, 240, 0.75);
}

.tableWrap {
  width: 100%;
  box-sizing: border-box;
  margin: 0 auto;
}

.responsive-table {
  overflow-x: auto;
  overflow-y: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.35);
  width: 100%;
  box-sizing: border-box;
  margin: 0 auto;
}

.tbl {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
}

/* 移动端卡片式布局 */
.mobile-cards {
  display: none;
  width: 100%;
}

.mobile-card {
  background: rgba(15, 23, 42, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-sizing: border-box;
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.rank-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(59, 130, 246, 0.7);
  color: white;
  font-weight: bold;
  font-size: 14px;
  margin-right: 12px;
}

.country-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.card-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.stat-label {
  font-size: 12px;
  color: rgba(226, 232, 240, 0.7);
  margin-bottom: 4px;
}

.stat-value {
  font-size: 16px;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.9);
}

.card-best-players {
  margin-bottom: 12px;
}

.best-player-title {
  font-size: 14px;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 8px;
}

.best-player-item {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
  font-size: 13px;
}

.player-rank {
  width: 40px;
  color: rgba(226, 232, 240, 0.7);
  font-size: 12px;
}

.player-name {
  color: rgba(255, 255, 255, 0.9);
  flex: 1;
}

.card-actions {
  display: flex;
  justify-content: center;
}

/* 响应式断点 */
@media (max-width: 760px) {
  .responsive-table {
    display: none;
  }
  
  .mobile-cards {
    display: block;
  }
  
  .pagination {
    margin-top: 16px;
  }
}

th,
td {
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  text-align: left;
  vertical-align: middle;
}

th {
  color: rgba(226, 232, 240, 0.78);
  font-size: 12px;
  font-weight: 900;
}

td {
  color: rgba(255, 255, 255, 0.90);
  font-size: 13px;
}

.muted {
  color: rgba(226, 232, 240, 0.70);
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.num {
  text-align: right;
}

.date {
  width: 118px;
}

.top4 {
  width: 260px;
}

.link {
  width: 64px;
  text-align: center;
}

a {
  color: rgba(147, 197, 253, 0.95);
  text-decoration: none;
  font-weight: 800;
}

a:hover {
  text-decoration: underline;
}

.nameCell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nameMain {
  font-weight: 900;
}

.nameMeta {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

/* 国旗样式（flag-icons库） */
.flag {
  display: inline-block;
  margin-right: 8px;
  /* width: 24px;
  height: 24px; */
  vertical-align: middle;
}

/* 国家名称样式 */
.country-name {
  vertical-align: middle;
}
.en-name {
  font-size: 11px;
  color: rgba(226, 232, 240, 0.7);
  margin-left: 4px;
}

/* 新增分页样式 */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 20px;
  color: rgba(255, 255, 255, 0.9);
}
.page-btn {
  padding: 6px 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  background: rgba(15, 23, 42, 0.5);
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  transition: all 0.2s;
}
.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.page-btn:hover:not(:disabled) {
  background: rgba(15, 23, 42, 0.8);
  border-color: rgba(255, 255, 255, 0.2);
}
.page-num {
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
}
.page-num.active {
  background: rgba(59, 130, 246, 0.7);
  font-weight: bold;
}
.page-info {
  margin-left: 12px;
  font-size: 12px;
  color: rgba(226, 232, 240, 0.7);
}

.view-btn {
  padding: 4px 8px;
  border: 1px solid rgba(59, 130, 246, 0.5);
  border-radius: 4px;
  background: rgba(59, 130, 246, 0.1);
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 12px;
}
.view-btn:hover {
  background: rgba(59, 130, 246, 0.3);
  border-color: rgba(59, 130, 246, 0.8);
}

/* -------------------------- 弹窗样式（核心美化） -------------------------- */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px); /* 背景模糊，提升层次感 */
}
.modal-content {
  width: 550px;
  max-width: 90vw;
  background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%); /* 渐变背景 */
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4); /* 立体阴影 */
  overflow: hidden;
  animation: modalFadeIn 0.3s ease-out; /* 淡入动画 */
}

/* 弹窗淡入动画 */
@keyframes modalFadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 弹窗头部美化 */
.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.modal-flag {
  width: 28px;
  height: 28px;
  border-radius: 6px; /* 圆角国旗 */
  overflow: hidden;
}
.modal-header h3 {
  margin: 0;
  color: rgba(255, 255, 255, 0.95);
  font-size: 18px;
  font-weight: 600;
}
.close-btn {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  font-size: 22px;
  cursor: pointer;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}
.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.95);
}

/* 弹窗内容区 */
.modal-body {
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;
  /* 滚动条美化 */
}
.modal-body::-webkit-scrollbar {
  width: 6px;
}
.modal-body::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}
.modal-body::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}
.modal-body::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 空数据样式美化 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: rgba(226, 232, 240, 0.7);
}
.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.7;
}
.empty-text {
  font-size: 14px;
}

/* 选手列表（替换原表格为弹性布局，更易美化） */
.player-list {
  border-radius: 10px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.03);
}
/* 列表头部 */
.player-list-header {
  display: flex;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
/* 列表列宽分配 */
.col {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  color: rgba(226, 232, 240, 0.85);
}
.rank-col { flex: 0 0 60px; text-align: center; }
.name-col { flex: 2; text-align: left; padding-left: 10px; }
.points-col { flex: 0 0 80px; text-align: right; }

/* 列表项 */
.player-list-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  transition: background 0.2s;
}
/* 最后一项去掉边框 */
.player-list-item:last-child {
  border-bottom: none;
}
/* hover 高亮 */
.player-list-item:hover {
  background: rgba(255, 255, 255, 0.05);
}
/* 前3名背景区分 */
.player-list-item.top3 {
  background: rgba(59, 130, 246, 0.08);
}
.player-list-item.top3:hover {
  background: rgba(59, 130, 246, 0.12);
}

/* 排名数字美化（前3名特殊颜色） */
.rank-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
}
.rank-number.top1 {
  background: #fbbf24; /* 金牌色 */
  color: #0f172a;
}
.rank-number.top2 {
  background: #94a3b8; /* 银牌色 */
  color: #0f172a;
}
.rank-number.top3 {
  background: #f59e0b; /* 铜牌色 */
  color: #0f172a;
}

/* 选手名样式 */
.player-name {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.95);
}

/* 分数样式（强调） */
.points-value {
  font-size: 14px;
  font-weight: 700;
  color: #38bdf8; /* 高亮蓝色 */
}

/* 弹窗底部美化 */
.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  justify-content: flex-end;
}
.confirm-btn {
  padding: 8px 20px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%); /* 渐变按钮 */
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.confirm-btn:hover {
  background: linear-gradient(90deg, #2563eb 0%, #1d4ed8 100%);
  transform: translateY(-1px); /* 轻微上浮 */
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}
.btn-icon {
  font-size: 12px;
}
/* -------------------------- 弹窗分页样式 -------------------------- */
.modal-pagination {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 0;
  color: rgba(226, 232, 240, 0.8);
  font-size: 12px;
}

/* 每页条数选择 */
.page-size-selector {
  display: flex;
  align-items: center;
  gap: 6px;
}
.page-size-selector select {
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(15, 23, 42, 0.8);
  color: rgba(255, 255, 255, 0.9);
  font-size: 12px;
  cursor: pointer;
}
.page-size-selector select:focus {
  outline: none;
  border-color: rgba(59, 130, 246, 0.5);
}

/* 分页按钮 */
.page-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}
.modal-page-btn {
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(15, 23, 42, 0.8);
  color: rgba(255, 255, 255, 0.9);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}
.modal-page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.modal-page-btn:hover:not(:disabled) {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.5);
}
.modal-page-num {
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}
.modal-page-num.active {
  background: rgba(59, 130, 246, 0.7);
  font-weight: bold;
}

/* 分页信息 */
.modal-page-info {
  font-size: 12px;
  color: rgba(226, 232, 240, 0.7);
}

/* 响应式适配：小屏幕下分页控件换行 */
@media (max-width: 480px) {
  .modal-pagination {
    flex-direction: column;
    align-items: center;
  }
}

.filters {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 10px 0 12px;
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
  
  /* 国旗样式调整 */
  .flag {
    margin-right: 6px;
  }
  
  /* 分页调整 */
  .pagination {
    gap: 6px;
    font-size: 12px;
  }
  
  .page-btn {
    padding: 4px 8px;
    font-size: 11px;
  }
  
  .page-num {
    padding: 4px 8px;
    font-size: 11px;
  }
  
  .page-info {
    font-size: 11px;
    margin-left: 8px;
  }
  
  /* 弹窗调整 */
  .modal-content {
    max-width: 98vw;
    max-height: 95vh;
  }
  
  .modal-header {
    padding: 12px 16px;
  }
  
  .modal-header h3 {
    font-size: 16px;
  }
  
  .modal-body {
    padding: 16px;
    max-height: 70vh;
  }
  
  .player-list-header,
  .player-list-item {
    padding: 10px 12px;
  }
  
  .rank-col { flex: 0 0 50px; }
  .points-col { flex: 0 0 70px; }
  
  .modal-footer {
    padding: 12px 16px;
  }
  
  .confirm-btn {
    padding: 6px 16px;
    font-size: 13px;
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
  
  .page-info {
    margin-left: 8px;
    text-align: right;
  }
  
  .header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .title {
    font-size: 16px;
  }
  
  /* 表格调整 */
  .tableWrap {
    overflow-x: auto;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    background: rgba(15,23,42,0.35);
    width: 100%;
    box-sizing: border-box;
    margin: 0 auto;
  }
  
  .tableWrap::-webkit-scrollbar {
    height: 6px;
  }
  
  .tableWrap::-webkit-scrollbar-track {
    background: rgba(255,255,255,0.05);
    border-radius: 3px;
  }
  
  .tableWrap::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.2);
    border-radius: 3px;
  }
  
  .tableWrap::-webkit-scrollbar-thumb:hover {
    background: rgba(255,255,255,0.3);
  }
  
  .tbl {
    width: 100%;
    border-collapse: collapse;
    min-width: 600px;
  }
  
  th, td {
    padding: 8px 10px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    text-align: left;
    font-size: 12px;
  }
  
  /* 调整列宽 */
  .num {
    text-align: right;
    min-width: 70px;
  }
  
  /* 国旗样式调整 */
  .flag {
    display: inline-block;
    margin-right: 6px;
    vertical-align: middle;
  }
  
  /* 国家名称样式调整 */
  .country-name {
    vertical-align: middle;
    font-size: 12px;
  }
  
  /* 按钮样式调整 */
  .page-btn {
    padding: 4px 8px;
    font-size: 11px;
  }
  
  /* 表头调整 */
  th {
    font-size: 12px;
    color: rgba(226,232,240,.75);
    font-weight: 700;
  }
  
  /* 确保表格容器不会超出屏幕 */
  .page {
    width: 100%;
    max-width: 100vw;
    box-sizing: border-box;
    padding: 0 10px;
    margin: 0 auto;
  }
  
  /* 表格容器居中 */
  /* .tableWrap {
    margin: 0 auto;
    width: 100%;
    max-width: 100%;
  } */
  
  /* 表格行样式 */
  tr {
    background: transparent;
  }
  
  tr:hover {
    background: rgba(255,255,255,0.03);
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
<!-- 引入flag-icons样式 -->
<style src="flag-icons/css/flag-icons.min.css"></style>