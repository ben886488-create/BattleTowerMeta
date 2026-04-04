<template>
  <div class="app">
    <header class="topbar">
      <div class="topbar__left">
        <button class="menu-toggle" @click="toggleMenu" aria-label="Toggle menu">
          <span></span>
          <span></span>
          <span></span>
        </button>
        <RouterLink :to="`/${lang}`" class="brand">
          <div class="dot" aria-hidden="true"></div>
          <div>
            <div class="logo">BATTLE TOWER META</div>
            <div class="sub">Daily-updated stats</div>
          </div>
        </RouterLink>
      </div>

      <nav class="topbar__nav">
        <RouterLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          class="navlink"
          active-class="is-active"
        >
          {{ label(item.key) }}
        </RouterLink>
      </nav>

      <div class="topbar__right">
        <RouterLink :to="switchLangTo('zh')" class="lang" active-class="is-active">中文</RouterLink>
        <RouterLink :to="switchLangTo('en')" class="lang" active-class="is-active">EN</RouterLink>
      </div>
    </header>

    <!-- 左侧抽拉菜单 -->
    <div class="sidebar" :class="{ 'sidebar--open': menuOpen }">
      <div class="sidebar__content">
        <div class="sidebar__header">
          <RouterLink :to="`/${lang}`" class="sidebar__brand">
            <div class="dot" aria-hidden="true"></div>
            <div class="logo">BATTLE TOWER META</div>
          </RouterLink>
          <button class="sidebar__close" @click="toggleMenu" aria-label="Close menu">
            &times;
          </button>
        </div>
        <nav class="sidebar__nav">
          <RouterLink
            v-for="item in nav"
            :key="item.to"
            :to="item.to"
            class="sidebar__link"
            active-class="is-active"
            @click="toggleMenu"
          >
            {{ label(item.key) }}
          </RouterLink>
        </nav>
        <div class="sidebar__footer">
          <div class="sidebar__lang">
            <RouterLink :to="switchLangTo('zh')" class="lang" active-class="is-active" @click="toggleMenu">中文</RouterLink>
            <RouterLink :to="switchLangTo('en')" class="lang" active-class="is-active" @click="toggleMenu">EN</RouterLink>
          </div>
        </div>
      </div>
    </div>

    <!-- 遮罩层 -->
    <div class="overlay" v-if="menuOpen" @click="toggleMenu"></div>

    <main class="container">
      <RouterView />
    </main>

    <footer class="footer">
      <span>Data: Limitless Tournament Platform API</span>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const menuOpen = ref(false)

const lang = computed<'zh' | 'en'>(() => (String(route.path).split('/')[1] === 'en' ? 'en' : 'zh'))

const nav = computed(() => {
  const base = `/${lang.value}`
  return [
    { key: 'tierList', to: `${base}/tier-list` },
    { key: 'tournaments', to: `${base}/tournaments` },
    { key: 'topDecks', to: `${base}/top-decks` },
    { key: 'topCards', to: `${base}/top-cards` },
    { key: 'playerRanking', to: `${base}/player-ranking` },
    { key: 'countryRanking', to: `${base}/country-ranking` },
  ] as const
})

function switchLangTo(next: 'zh' | 'en') {
  const parts = String(route.path).split('/')
  parts[1] = next
  const nextPath = parts.join('/') || `/${next}`
  return nextPath === '/' ? `/${next}` : nextPath
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

const dict = {
  zh: {
    tierList: '牌組排名',
    tournaments: '線上比賽',
    topDecks: '最強牌組',
    topCards: '泛用卡片',
    playerRanking: '玩家排名',
    countryRanking: '地区排名',
  },
  en: {
    tierList: 'Tier List',
    tournaments: 'Tournaments',
    topDecks: 'Top Decks',
    topCards: 'Cards Usage',
    playerRanking: 'Player Ranking',
    countryRanking: 'Country Ranking',
  },
} as const

function label(key: keyof typeof dict.zh) {
  return dict[lang.value][key]
}
</script>

<style scoped>
/* 原本 App.vue 的版型保留，並融合 Layout.vue 的 topbar/nav 樣式 */
.app { min-height: 100vh; display: flex; flex-direction: column; }
.container { 
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 16px 24px;
  flex: 1;
  box-sizing: border-box;
  display: block;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 1000; 
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 24px;
  background: rgba(2, 6, 23, 0.75);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

.topbar__left { min-width: 220px; display: flex; align-items: center; gap: 12px; }
.topbar__nav  { flex: 1; min-width: 0; }
.brand { display:flex; gap:12px; align-items:center; text-decoration: none; color: inherit; }

/* 菜单按钮样式 */
.menu-toggle {
  display: none;
  flex-direction: column;
  justify-content: space-between;
  width: 24px;
  height: 20px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  z-index: 1001;
}

.menu-toggle span {
  display: block;
  width: 100%;
  height: 2px;
  background-color: #fff;
  border-radius: 2px;
  transition: all 0.3s ease;
}

.menu-toggle.active span:nth-child(1) {
  transform: rotate(45deg) translate(5px, 5px);
}

.menu-toggle.active span:nth-child(2) {
  opacity: 0;
}

.menu-toggle.active span:nth-child(3) {
  transform: rotate(-45deg) translate(5px, -5px);
}

.dot{ width:12px; height:12px; border-radius: 999px; background: var(--accent); box-shadow: 0 0 18px rgba(0,175,239,.55); }
.logo{ font-family: var(--font-en); letter-spacing:.04em; color: #fff; font-weight: 700; }
.sub{ color: rgba(226,232,240,.75); font-size: 12px; margin-top: 2px; }

.topbar__nav {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 18px;
}

.navlink {
  color: rgba(226,232,240,.75);
  font-size: 18px;
  text-decoration: none;
  white-space: nowrap;
}
.navlink:hover { color: #fff; }
.navlink.is-active { color: #fff; font-weight: 700; }

.topbar__right { display:flex; gap: 8px; align-items: center; }
.lang {
  padding: 4px 8px; border-radius: 8px;
  color: rgba(226,232,240,.75);
  text-decoration: none; font-size: 12px;
}
.lang.is-active { background: rgba(255,255,255,0.10); color: #fff; }

/* 侧边栏样式 */
.sidebar {
  position: fixed;
  top: 0;
  left: -300px;
  width: 280px;
  height: 100vh;
  background: rgba(2, 6, 23, 0.95);
  backdrop-filter: blur(12px);
  border-right: 1px solid rgba(255,255,255,0.08);
  z-index: 1001;
  transition: left 0.3s ease;
  overflow-y: auto;
}

.sidebar--open {
  left: 0;
}

.sidebar__content {
  padding: 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.sidebar__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.sidebar__brand {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: inherit;
}

.sidebar__close {
  background: none;
  border: none;
  color: #fff;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar__nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sidebar__link {
  color: rgba(226,232,240,.75);
  font-size: 18px;
  text-decoration: none;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  transition: color 0.3s ease;
}

.sidebar__link:hover {
  color: #fff;
}

.sidebar__link.is-active {
  color: #fff;
  font-weight: 700;
}

.sidebar__footer {
  margin-top: auto;
  padding-top: 24px;
  border-top: 1px solid rgba(255,255,255,0.05);
}

.sidebar__lang {
  display: flex;
  gap: 8px;
}

/* 遮罩层样式 */
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 1000;
  transition: opacity 0.3s ease;
}

.footer{ color: rgba(226,232,240,.65); font-size: 12px; padding: 18px 20px; border-top: 1px solid rgba(255,255,255,0.08); }

/* 中螢幕：字再小一點 + gap 再小一點 */
@media (max-width: 1100px) {
  .topbar { padding: 10px 16px; }
  .topbar__left { min-width: 180px; }
  .topbar__nav { gap: 12px; }
  .navlink { font-size: 16px; }
}

/* 小螢幕：使用抽拉式菜单 */
@media (max-width: 760px) {
  .menu-toggle {
    display: flex;
  }
  
  .topbar__nav {
    display: none;
  }
  
  .topbar {
    flex-wrap: nowrap;
    align-items: center;
  }
  
  .topbar__left {
    min-width: auto;
    flex: 1;
  }
  
  .topbar__right {
    margin-left: 0;
  }
}

</style>