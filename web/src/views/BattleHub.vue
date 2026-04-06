<template>
  <section class="battle-hub">
    <header class="battle-hub__hero">
      <div>
        <p class="battle-hub__kicker">BATTLE HUB</p>
        <h1>Interactive player tools</h1>
        <p>
          Accounts, ladder tracking, card trading, and community discussion live here.
        </p>
      </div>
    </header>

    <BattleHubAuthPanel />

    <div class="battle-hub__tabs">
      <button
        type="button"
        class="battle-hub__tab"
        :class="{ 'battle-hub__tab--active': activeTab === 'tracker' }"
        @click="activeTab = 'tracker'"
      >
        Rank Recorder
      </button>
      <button
        type="button"
        class="battle-hub__tab"
        :class="{ 'battle-hub__tab--active': activeTab === 'trade' }"
        @click="activeTab = 'trade'"
      >
        Trade Board
      </button>
    </div>

    <RankTrackerPanel v-if="activeTab === 'tracker'" />
    <TradeHubPanel v-else />
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import BattleHubAuthPanel from "../components/BattleHubAuthPanel.vue";
import RankTrackerPanel from "../components/RankTrackerPanel.vue";
import TradeHubPanel from "../components/TradeHubPanel.vue";

const activeTab = ref<"tracker" | "trade">("tracker");
</script>

<style scoped>
.battle-hub {
  display: grid;
  gap: 18px;
  padding-top: 18px;
}

.battle-hub__hero {
  padding: 24px 28px;
  border-radius: 28px;
  border: 1px solid rgba(115, 192, 255, 0.16);
  background:
    radial-gradient(circle at top left, rgba(40, 121, 197, 0.24), transparent 42%),
    linear-gradient(135deg, rgba(10, 26, 44, 0.98), rgba(4, 12, 22, 0.98));
}

.battle-hub__hero h1,
.battle-hub__hero p {
  margin: 0;
}

.battle-hub__hero h1 {
  font-size: clamp(2rem, 4vw, 3rem);
  color: #fff;
  margin-bottom: 8px;
}

.battle-hub__hero p {
  color: #b7cee6;
  max-width: 760px;
  line-height: 1.7;
}

.battle-hub__kicker {
  margin: 0 0 10px;
  color: #8fd6ff;
  font-size: 0.78rem;
  letter-spacing: 0.26em;
}

.battle-hub__tabs {
  display: inline-flex;
  gap: 10px;
  flex-wrap: wrap;
}

.battle-hub__tab {
  appearance: none;
  border: 1px solid rgba(115, 192, 255, 0.18);
  border-radius: 999px;
  padding: 10px 16px;
  background: rgba(12, 28, 48, 0.88);
  color: #d7ebff;
  font-weight: 800;
}

.battle-hub__tab--active {
  background: linear-gradient(135deg, rgba(44, 130, 201, 0.56), rgba(17, 60, 122, 0.86));
  color: #fff;
}
</style>
