<template>
  <section class="hub-card">
    <div class="hub-card__head">
      <div>
        <p class="hub-card__kicker">TRADE</p>
        <h2 class="hub-card__title">Pocket trade board</h2>
      </div>
      <span class="hub-card__note">Wants / offers / notes in one place</span>
    </div>

    <p class="hub-card__intro">
      Post the cards you can trade away and the cards you still need, then browse what other players are offering.
    </p>

    <div class="trade-toolbar">
      <input v-model="search" type="search" placeholder="Search cards, users, or notes" />
      <button type="button" class="ghost-link" @click="reload">Refresh</button>
    </div>

    <div v-if="!profile" class="hub-card__empty">
      Sign in to create trade posts. You can still browse once Supabase is configured.
    </div>

    <form v-else class="trade-form" @submit.prevent="submitPost">
      <label>
        Title
        <input v-model="form.title" type="text" maxlength="80" placeholder="Shiny ex swap" required />
      </label>

      <label>
        Offering
        <textarea
          v-model="form.offerCards"
          rows="3"
          placeholder="One card per line or comma-separated"
          required
        ></textarea>
      </label>

      <label>
        Looking for
        <textarea
          v-model="form.wantCards"
          rows="3"
          placeholder="One card per line or comma-separated"
          required
        ></textarea>
      </label>

      <label>
        Notes
        <textarea v-model="form.notes" rows="3" maxlength="240"></textarea>
      </label>

      <button type="submit" class="hub-btn" :disabled="busy">Publish trade post</button>
    </form>

    <p v-if="message" class="hub-card__message">{{ message }}</p>
    <p v-if="errorMessage" class="hub-card__error">{{ errorMessage }}</p>

    <div class="trade-list">
      <article v-for="item in posts" :key="item.id" class="trade-card">
        <div class="trade-card__head">
          <div>
            <h3>{{ item.title }}</h3>
            <p>
              {{ item.profile?.display_name || item.profile?.handle || "Trainer" }}
              · {{ formatDate(item.created_at) }}
            </p>
          </div>

          <span class="trade-status" :class="`trade-status--${item.status}`">
            {{ item.status }}
          </span>
        </div>

        <div class="trade-card__grid">
          <div>
            <strong>Offering</strong>
            <div class="token-list">
              <span v-for="card in item.offer_cards" :key="`${item.id}-offer-${card}`" class="token">
                {{ card }}
              </span>
            </div>
          </div>

          <div>
            <strong>Looking for</strong>
            <div class="token-list">
              <span v-for="card in item.want_cards" :key="`${item.id}-want-${card}`" class="token token--want">
                {{ card }}
              </span>
            </div>
          </div>
        </div>

        <p v-if="item.notes" class="trade-card__notes">{{ item.notes }}</p>
      </article>

      <div v-if="posts.length === 0" class="hub-card__empty">
        No trade posts yet.
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from "vue";
import { authProfile, initSupabaseAuth } from "../lib/supabase";
import { createTradePost, fetchTradePosts, type TradePostEntry } from "../lib/interactive";

const profile = authProfile;
const posts = ref<TradePostEntry[]>([]);
const search = ref("");
const busy = ref(false);
const message = ref("");
const errorMessage = ref("");

const form = reactive({
  title: "",
  offerCards: "",
  wantCards: "",
  notes: "",
});

function formatDate(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

async function reload() {
  busy.value = true;
  errorMessage.value = "";

  try {
    posts.value = await fetchTradePosts(search.value);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "Unable to load trade posts.";
  } finally {
    busy.value = false;
  }
}

async function submitPost() {
  busy.value = true;
  message.value = "";
  errorMessage.value = "";

  try {
    await createTradePost({
      title: form.title,
      offerCards: form.offerCards,
      wantCards: form.wantCards,
      notes: form.notes,
    });

    form.title = "";
    form.offerCards = "";
    form.wantCards = "";
    form.notes = "";
    message.value = "Trade post published.";
    await reload();
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "Unable to publish trade post.";
  } finally {
    busy.value = false;
  }
}

watch(search, () => {
  void reload();
});

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

.trade-toolbar {
  display: flex;
  gap: 10px;
}

.trade-toolbar input,
.trade-form input,
.trade-form textarea {
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 10px 12px;
  background: rgba(2, 10, 20, 0.86);
  color: #fff;
}

.trade-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  padding: 16px;
  border-radius: 18px;
  background: rgba(11, 26, 44, 0.88);
  border: 1px solid rgba(115, 192, 255, 0.12);
}

.trade-form label {
  display: grid;
  gap: 6px;
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

.trade-list {
  display: grid;
  gap: 12px;
}

.trade-card {
  padding: 16px;
  border-radius: 18px;
  background: rgba(11, 26, 44, 0.82);
  border: 1px solid rgba(115, 192, 255, 0.12);
  display: grid;
  gap: 12px;
}

.trade-card__head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.trade-card__head h3,
.trade-card__head p,
.trade-card__notes {
  margin: 0;
}

.trade-card__head p {
  margin-top: 4px;
  color: #8caecc;
  font-size: 0.86rem;
}

.trade-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 84px;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
}

.trade-status--open {
  background: rgba(72, 215, 155, 0.16);
  color: #8ce6b0;
}

.trade-status--matched {
  background: rgba(115, 192, 255, 0.16);
  color: #9cd8ff;
}

.trade-status--closed {
  background: rgba(255, 123, 143, 0.16);
  color: #ff9dad;
}

.trade-card__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.token-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.token {
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(72, 215, 155, 0.1);
  border: 1px solid rgba(72, 215, 155, 0.2);
  color: #cbffe4;
  font-size: 0.82rem;
}

.token--want {
  background: rgba(255, 183, 77, 0.1);
  border-color: rgba(255, 183, 77, 0.22);
  color: #ffe8b2;
}

.trade-card__notes {
  color: #d4e9ff;
  line-height: 1.6;
}

@media (max-width: 900px) {
  .trade-toolbar,
  .trade-form,
  .trade-card__grid,
  .trade-card__head {
    grid-template-columns: 1fr;
    flex-direction: column;
  }
}
</style>
