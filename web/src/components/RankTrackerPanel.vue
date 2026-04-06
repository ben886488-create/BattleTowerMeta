<template>
  <section class="hub-card">
    <div class="hub-card__head">
      <div>
        <p class="hub-card__kicker">TRACKER</p>
        <h2 class="hub-card__title">Rank recorder</h2>
      </div>
      <span class="hub-card__note">Inspired by your OBS overlay workflow</span>
    </div>

    <p class="hub-card__intro">
      Log the decks you face on ladder and turn them into your own matchup notes.
    </p>

    <div v-if="!profile" class="hub-card__empty">
      Sign in to save your personal ranked logs.
    </div>

    <template v-else>
      <form class="tracker-form" @submit.prevent="submitLog">
        <label>
          Opponent deck
          <input v-model="form.opponentDeck" type="text" maxlength="80" required />
        </label>

        <label>
          Result
          <select v-model="form.result">
            <option value="win">Win</option>
            <option value="loss">Loss</option>
            <option value="draw">Draw</option>
          </select>
        </label>

        <label>
          Queue
          <select v-model="form.queueType">
            <option value="Ranked">Ranked</option>
            <option value="Friendly">Friendly</option>
            <option value="Testing">Testing</option>
          </select>
        </label>

        <label>
          Play order
          <select v-model="playOrder">
            <option value="unknown">Unknown</option>
            <option value="first">Went first</option>
            <option value="second">Went second</option>
          </select>
        </label>

        <label>
          Rank tier
          <input v-model="form.rankTier" type="text" maxlength="32" placeholder="Master Ball" />
        </label>

        <label class="tracker-form__notes">
          Notes
          <textarea v-model="form.notes" rows="3" maxlength="240"></textarea>
        </label>

        <button type="submit" class="hub-btn" :disabled="busy">Save log</button>
      </form>

      <p v-if="message" class="hub-card__message">{{ message }}</p>
      <p v-if="errorMessage" class="hub-card__error">{{ errorMessage }}</p>

      <div class="summary-grid">
        <article class="summary-box">
          <span>Total logs</span>
          <strong>{{ logs.length }}</strong>
        </article>
        <article class="summary-box">
          <span>Record</span>
          <strong>{{ summaryRecord }}</strong>
        </article>
        <article class="summary-box">
          <span>Best known matchup</span>
          <strong>{{ bestMatchupName }}</strong>
        </article>
      </div>

      <div class="tracker-table">
        <div class="tracker-table__head">
          <strong>Recent ladder notes</strong>
          <button type="button" class="ghost-link" @click="reload">Refresh</button>
        </div>

        <div v-if="logs.length === 0" class="hub-card__empty">
          No ranked logs yet.
        </div>

        <div v-else class="tracker-list">
          <article v-for="item in logs" :key="item.id" class="tracker-row">
            <div>
              <strong>{{ item.opponent_deck }}</strong>
              <p>{{ item.queue_type }} · {{ formatDateTime(item.created_at) }}</p>
            </div>
            <div class="tracker-row__meta">
              <span :class="['result-pill', `result-pill--${item.result}`]">{{ item.result }}</span>
              <span class="record">{{ item.rank_tier || "No tier" }}</span>
            </div>
          </article>
        </div>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { authProfile, initSupabaseAuth } from "../lib/supabase";
import { createRankLog, fetchRankLogs, type RankLogEntry } from "../lib/interactive";

const profile = authProfile;
const logs = ref<RankLogEntry[]>([]);
const busy = ref(false);
const message = ref("");
const errorMessage = ref("");
const playOrder = ref<"unknown" | "first" | "second">("unknown");

const form = reactive({
  opponentDeck: "",
  result: "win" as "win" | "loss" | "draw",
  queueType: "Ranked",
  rankTier: "",
  notes: "",
});

const summaryRecord = computed(() => {
  const wins = logs.value.filter((item) => item.result === "win").length;
  const losses = logs.value.filter((item) => item.result === "loss").length;
  const draws = logs.value.filter((item) => item.result === "draw").length;
  return `${wins}-${losses}-${draws}`;
});

const bestMatchupName = computed(() => {
  const groups = new Map<string, { wins: number; losses: number; draws: number }>();

  for (const item of logs.value) {
    const hit = groups.get(item.opponent_deck) ?? { wins: 0, losses: 0, draws: 0 };
    if (item.result === "win") hit.wins += 1;
    if (item.result === "loss") hit.losses += 1;
    if (item.result === "draw") hit.draws += 1;
    groups.set(item.opponent_deck, hit);
  }

  const ranked = [...groups.entries()].sort((a, b) => {
    const aRate = (a[1].wins + a[1].draws * 0.5) / Math.max(1, a[1].wins + a[1].losses + a[1].draws);
    const bRate = (b[1].wins + b[1].draws * 0.5) / Math.max(1, b[1].wins + b[1].losses + b[1].draws);
    return bRate - aRate || a[0].localeCompare(b[0]);
  });

  return ranked[0]?.[0] ?? "No data";
});

function formatDateTime(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(
    date.getDate(),
  ).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
}

async function reload() {
  if (!profile.value) {
    logs.value = [];
    return;
  }

  busy.value = true;
  errorMessage.value = "";

  try {
    logs.value = await fetchRankLogs();
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "Unable to load logs.";
  } finally {
    busy.value = false;
  }
}

async function submitLog() {
  busy.value = true;
  message.value = "";
  errorMessage.value = "";

  try {
    await createRankLog({
      opponentDeck: form.opponentDeck,
      result: form.result,
      queueType: form.queueType,
      firstPlayer: playOrder.value === "unknown" ? null : playOrder.value === "first",
      notes: form.notes,
      rankTier: form.rankTier,
    });

    form.opponentDeck = "";
    form.notes = "";
    message.value = "Rank log saved.";
    await reload();
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "Unable to save this log.";
  } finally {
    busy.value = false;
  }
}

onMounted(async () => {
  await initSupabaseAuth();
  await reload();
});
</script>

<style scoped>
.hub-card {
  padding: 20px;
  border-radius: 24px;
  border: 1px solid rgba(115, 192, 255, 0.18);
  background:
    linear-gradient(180deg, rgba(18, 43, 76, 0.16), rgba(7, 18, 31, 0.2)),
    rgba(8, 20, 35, 0.96);
  display: grid;
  gap: 16px;
}

.hub-card__head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.hub-card__kicker {
  margin: 0 0 6px;
  color: #8fd6ff;
  letter-spacing: 0.24em;
  font-size: 0.72rem;
}

.hub-card__title {
  margin: 0;
  font-size: 1.7rem;
}

.hub-card__note,
.hub-card__intro,
.hub-card__message,
.hub-card__error {
  margin: 0;
}

.hub-card__note {
  color: #99b8d7;
  font-size: 0.85rem;
}

.hub-card__empty {
  padding: 16px;
  border-radius: 16px;
  background: rgba(11, 26, 44, 0.86);
  border: 1px dashed rgba(115, 192, 255, 0.16);
  color: #b7cee6;
}

.hub-card__message {
  color: #8ce6b0;
}

.hub-card__error {
  color: #ff9dad;
}

.tracker-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  padding: 16px;
  border-radius: 18px;
  background: rgba(11, 26, 44, 0.88);
  border: 1px solid rgba(115, 192, 255, 0.12);
}

.tracker-form label {
  display: grid;
  gap: 6px;
}

.tracker-form input,
.tracker-form select,
.tracker-form textarea {
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 10px 12px;
  background: rgba(2, 10, 20, 0.86);
  color: #fff;
}

.tracker-form__notes {
  grid-column: 1 / -1;
}

.hub-btn,
.ghost-link {
  appearance: none;
  border: 1px solid rgba(115, 192, 255, 0.22);
  border-radius: 12px;
  padding: 10px 14px;
  background: linear-gradient(135deg, rgba(44, 130, 201, 0.56), rgba(17, 60, 122, 0.86));
  color: #fff;
  font-weight: 800;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.summary-box {
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(11, 26, 44, 0.82);
  border: 1px solid rgba(115, 192, 255, 0.12);
}

.summary-box span {
  display: block;
  color: #8caecc;
  margin-bottom: 6px;
}

.summary-box strong {
  font-size: 1.15rem;
}

.tracker-table {
  display: grid;
  gap: 12px;
}

.tracker-table__head {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
}

.ghost-link {
  background: rgba(255, 255, 255, 0.04);
}

.tracker-list {
  display: grid;
  gap: 10px;
}

.tracker-row {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(11, 26, 44, 0.82);
  border: 1px solid rgba(115, 192, 255, 0.12);
}

.tracker-row p {
  margin: 4px 0 0;
  color: #8caecc;
  font-size: 0.86rem;
}

.tracker-row__meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.result-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 60px;
  padding: 6px 10px;
  border-radius: 999px;
  font-weight: 800;
  text-transform: uppercase;
}

.result-pill--win {
  background: rgba(72, 215, 155, 0.16);
  color: #8ce6b0;
}

.result-pill--loss {
  background: rgba(255, 123, 143, 0.16);
  color: #ff9dad;
}

.result-pill--draw {
  background: rgba(255, 211, 77, 0.16);
  color: #ffe7a0;
}

.record {
  color: #d4e9ff;
}

@media (max-width: 900px) {
  .tracker-form,
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .tracker-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
