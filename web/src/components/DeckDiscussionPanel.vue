<template>
  <section class="discussion-card">
    <div class="discussion-card__head">
      <div>
        <p class="discussion-card__kicker">DISCUSSION</p>
        <h2 class="discussion-card__title">Deck discussion</h2>
      </div>
      <span class="discussion-card__count">{{ posts.length }} posts</span>
    </div>

    <p class="discussion-card__intro">
      Share lines, tech choices, matchup tips, and side notes for this deck.
    </p>

    <div v-if="!hasSupabaseConfig" class="discussion-card__empty">
      Configure Supabase to enable deck discussions for the community.
    </div>

    <template v-else>
      <form v-if="profile" class="discussion-form" @submit.prevent="submitPost">
        <textarea
          v-model="draft"
          rows="4"
          maxlength="800"
          :placeholder="`Share how you pilot ${deckName || 'this deck'}...`"
          required
        ></textarea>

        <div class="discussion-form__actions">
          <span>{{ draft.length }}/800</span>
          <button type="submit" class="discussion-btn" :disabled="busy || !draft.trim()">
            Post
          </button>
        </div>
      </form>

      <div v-else class="discussion-card__empty">
        Sign in to join this deck discussion.
      </div>

      <p v-if="message" class="discussion-card__message">{{ message }}</p>
      <p v-if="errorMessage" class="discussion-card__error">{{ errorMessage }}</p>

      <div class="discussion-list">
        <article v-for="post in posts" :key="post.id" class="discussion-post">
          <div class="discussion-post__head">
            <strong>{{ post.profile?.display_name || post.profile?.handle || "Trainer" }}</strong>
            <span>{{ formatDateTime(post.created_at) }}</span>
          </div>
          <p>{{ post.body }}</p>
        </article>

        <div v-if="posts.length === 0" class="discussion-card__empty">
          No comments for this deck yet.
        </div>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { authProfile, hasSupabaseConfig, initSupabaseAuth } from "../lib/supabase";
import { createDeckDiscussion, fetchDeckDiscussion, type DeckDiscussionEntry } from "../lib/interactive";

const props = defineProps<{
  deckKey: string;
  deckName?: string;
}>();

const profile = authProfile;
const posts = ref<DeckDiscussionEntry[]>([]);
const draft = ref("");
const busy = ref(false);
const message = ref("");
const errorMessage = ref("");

function formatDateTime(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(
    date.getDate(),
  ).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
}

async function reload() {
  if (!hasSupabaseConfig || !props.deckKey) {
    posts.value = [];
    return;
  }

  busy.value = true;
  errorMessage.value = "";

  try {
    posts.value = await fetchDeckDiscussion(props.deckKey);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "Unable to load discussion.";
  } finally {
    busy.value = false;
  }
}

async function submitPost() {
  if (!draft.value.trim()) return;

  busy.value = true;
  message.value = "";
  errorMessage.value = "";

  try {
    await createDeckDiscussion(props.deckKey, draft.value);
    draft.value = "";
    message.value = "Discussion post published.";
    await reload();
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "Unable to post comment.";
  } finally {
    busy.value = false;
  }
}

watch(
  () => props.deckKey,
  () => {
    void reload();
  },
);

onMounted(async () => {
  await initSupabaseAuth();
  await reload();
});
</script>

<style scoped>
.discussion-card {
  padding: 22px;
  border-radius: 24px;
  border: 1px solid rgba(115, 192, 255, 0.18);
  background:
    linear-gradient(180deg, rgba(18, 43, 76, 0.16), rgba(7, 18, 31, 0.2)),
    rgba(8, 20, 35, 0.96);
  display: grid;
  gap: 16px;
}

.discussion-card__head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.discussion-card__kicker {
  margin: 0 0 6px;
  color: #8fd6ff;
  letter-spacing: 0.24em;
  font-size: 0.72rem;
}

.discussion-card__title {
  margin: 0;
  font-size: 1.6rem;
  color: #fff;
}

.discussion-card__count,
.discussion-card__intro,
.discussion-card__message,
.discussion-card__error {
  margin: 0;
}

.discussion-card__count {
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(11, 26, 44, 0.86);
  border: 1px solid rgba(115, 192, 255, 0.12);
  color: #d9edff;
}

.discussion-card__empty {
  padding: 16px;
  border-radius: 16px;
  background: rgba(11, 26, 44, 0.86);
  border: 1px dashed rgba(115, 192, 255, 0.16);
  color: #b7cee6;
}

.discussion-card__message {
  color: #8ce6b0;
}

.discussion-card__error {
  color: #ff9dad;
}

.discussion-form {
  display: grid;
  gap: 10px;
  padding: 16px;
  border-radius: 18px;
  background: rgba(11, 26, 44, 0.88);
  border: 1px solid rgba(115, 192, 255, 0.12);
}

.discussion-form textarea {
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px 14px;
  background: rgba(2, 10, 20, 0.86);
  color: #fff;
  resize: vertical;
}

.discussion-form__actions {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
  color: #91afcc;
}

.discussion-btn {
  appearance: none;
  border: 1px solid rgba(115, 192, 255, 0.22);
  border-radius: 12px;
  padding: 10px 14px;
  background: linear-gradient(135deg, rgba(44, 130, 201, 0.56), rgba(17, 60, 122, 0.86));
  color: #fff;
  font-weight: 800;
}

.discussion-list {
  display: grid;
  gap: 12px;
}

.discussion-post {
  padding: 16px;
  border-radius: 18px;
  background: rgba(11, 26, 44, 0.82);
  border: 1px solid rgba(115, 192, 255, 0.12);
}

.discussion-post__head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-bottom: 10px;
  color: #d7ebff;
}

.discussion-post__head span {
  color: #8caecc;
  font-size: 0.85rem;
}

.discussion-post p {
  margin: 0;
  color: #f5fbff;
  line-height: 1.7;
  white-space: pre-wrap;
}

@media (max-width: 720px) {
  .discussion-card__head,
  .discussion-post__head,
  .discussion-form__actions {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
