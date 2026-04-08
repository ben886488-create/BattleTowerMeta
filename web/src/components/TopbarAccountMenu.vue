<template>
  <div ref="rootRef" class="account-menu">
    <button type="button" class="account-menu__trigger" @click="toggleOpen">
      <span class="account-menu__status" :class="{ 'account-menu__status--online': !!profile }"></span>
      <span>{{ triggerLabel }}</span>
    </button>

    <div v-if="open" class="account-menu__panel">
      <template v-if="!hasSupabaseConfig">
        <p class="account-menu__notice">
          Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to enable synced accounts.
        </p>
      </template>

      <template v-else-if="profile">
        <div class="account-menu__identity">
          <p class="account-menu__name">{{ profile.display_name || profile.handle }}</p>
          <p class="account-menu__meta">@{{ profile.handle }}</p>
          <p v-if="user?.email" class="account-menu__meta">{{ user.email }}</p>
        </div>

        <button type="button" class="account-menu__action account-menu__action--ghost" @click="handleSignOut">
          Sign out
        </button>
      </template>

      <template v-else>
        <div class="account-menu__tabs" role="tablist" aria-label="Account panel">
          <button
            type="button"
            class="account-menu__tab"
            :class="{ 'account-menu__tab--active': mode === 'signin' }"
            @click="mode = 'signin'"
          >
            Sign in
          </button>
          <button
            type="button"
            class="account-menu__tab"
            :class="{ 'account-menu__tab--active': mode === 'signup' }"
            @click="mode = 'signup'"
          >
            Create
          </button>
        </div>

        <form v-if="mode === 'signin'" class="account-menu__form" @submit.prevent="handleSignIn">
          <label>
            Email
            <input v-model="signIn.email" type="email" autocomplete="email" required />
          </label>
          <label>
            Password
            <input
              v-model="signIn.password"
              type="password"
              autocomplete="current-password"
              required
            />
          </label>
          <button type="submit" class="account-menu__action" :disabled="busy">Sign in</button>
        </form>

        <form v-else class="account-menu__form" @submit.prevent="handleSignUp">
          <label>
            Display name
            <input v-model="signUp.displayName" type="text" maxlength="40" required />
          </label>
          <label>
            Handle
            <input v-model="signUp.handle" type="text" maxlength="24" required />
          </label>
          <label>
            Email
            <input v-model="signUp.email" type="email" autocomplete="email" required />
          </label>
          <label>
            Password
            <input
              v-model="signUp.password"
              type="password"
              autocomplete="new-password"
              minlength="6"
              required
            />
          </label>
          <button type="submit" class="account-menu__action" :disabled="busy">Create account</button>
        </form>
      </template>

      <p v-if="message" class="account-menu__message">{{ message }}</p>
      <p v-if="errorMessage" class="account-menu__error">{{ errorMessage }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import {
  authProfile,
  authReady,
  authUser,
  hasSupabaseConfig,
  signInWithPassword,
  signOutUser,
  signUpWithPassword,
} from "../lib/supabase";

const rootRef = ref<HTMLElement | null>(null);
const open = ref(false);
const busy = ref(false);
const message = ref("");
const errorMessage = ref("");
const mode = ref<"signin" | "signup">("signin");

const profile = authProfile;
const user = authUser;
const ready = authReady;

const signIn = reactive({
  email: "",
  password: "",
});

const signUp = reactive({
  displayName: "",
  handle: "",
  email: "",
  password: "",
});

const triggerLabel = computed(() => {
  if (!hasSupabaseConfig) return "Account";
  if (!ready.value) return "Loading";
  return profile.value?.display_name || profile.value?.handle || "Login";
});

function toggleOpen() {
  open.value = !open.value;
  message.value = "";
  errorMessage.value = "";
}

function closeOnOutside(event: MouseEvent) {
  const target = event.target;
  if (!(target instanceof Node)) return;
  if (rootRef.value?.contains(target)) return;
  open.value = false;
}

function closeOnEscape(event: KeyboardEvent) {
  if (event.key === "Escape") {
    open.value = false;
  }
}

async function handleSignIn() {
  busy.value = true;
  message.value = "";
  errorMessage.value = "";

  try {
    await signInWithPassword(signIn.email, signIn.password);
    signIn.password = "";
    message.value = "Signed in successfully.";
    open.value = false;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "Unable to sign in.";
  } finally {
    busy.value = false;
  }
}

async function handleSignUp() {
  busy.value = true;
  message.value = "";
  errorMessage.value = "";

  try {
    await signUpWithPassword({
      email: signUp.email,
      password: signUp.password,
      handle: signUp.handle,
      displayName: signUp.displayName,
    });
    signUp.password = "";
    message.value = "Account created. Check your email if confirmation is enabled.";
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "Unable to create account.";
  } finally {
    busy.value = false;
  }
}

async function handleSignOut() {
  busy.value = true;
  message.value = "";
  errorMessage.value = "";

  try {
    await signOutUser();
    open.value = false;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "Unable to sign out.";
  } finally {
    busy.value = false;
  }
}

onMounted(() => {
  document.addEventListener("click", closeOnOutside);
  document.addEventListener("keydown", closeOnEscape);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", closeOnOutside);
  document.removeEventListener("keydown", closeOnEscape);
});
</script>

<style scoped>
.account-menu {
  position: relative;
}

.account-menu__trigger {
  appearance: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid rgba(115, 192, 255, 0.18);
  background: rgba(12, 28, 48, 0.88);
  color: #eef7ff;
  font-size: 12px;
  font-weight: 700;
}

.account-menu__status {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.22);
}

.account-menu__status--online {
  background: #56e08f;
  box-shadow: 0 0 10px rgba(86, 224, 143, 0.6);
}

.account-menu__panel {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: min(360px, calc(100vw - 24px));
  padding: 14px;
  border-radius: 18px;
  border: 1px solid rgba(115, 192, 255, 0.18);
  background:
    linear-gradient(180deg, rgba(18, 43, 76, 0.16), rgba(7, 18, 31, 0.2)),
    rgba(8, 20, 35, 0.98);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.42);
  display: grid;
  gap: 12px;
  z-index: 1200;
}

.account-menu__tabs {
  display: inline-grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  padding: 6px;
  border-radius: 12px;
  background: rgba(12, 28, 48, 0.82);
}

.account-menu__tab,
.account-menu__action {
  appearance: none;
  border: 1px solid rgba(115, 192, 255, 0.2);
  border-radius: 10px;
  padding: 10px 12px;
  background: rgba(12, 28, 48, 0.88);
  color: #eef7ff;
  font-weight: 800;
}

.account-menu__tab--active,
.account-menu__action {
  background: linear-gradient(135deg, rgba(44, 130, 201, 0.56), rgba(17, 60, 122, 0.86));
}

.account-menu__action--ghost {
  background: rgba(255, 255, 255, 0.05);
}

.account-menu__form {
  display: grid;
  gap: 10px;
}

.account-menu__form label {
  display: grid;
  gap: 6px;
  font-size: 0.85rem;
  color: #d7ebff;
}

.account-menu__form input {
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 10px 12px;
  background: rgba(2, 10, 20, 0.86);
  color: #fff;
}

.account-menu__identity {
  display: grid;
  gap: 4px;
}

.account-menu__name,
.account-menu__meta,
.account-menu__message,
.account-menu__error,
.account-menu__notice {
  margin: 0;
}

.account-menu__name {
  font-size: 1rem;
  font-weight: 900;
  color: #fff;
}

.account-menu__meta {
  font-size: 0.82rem;
  color: #9fb9d5;
}

.account-menu__notice {
  padding: 12px;
  border-radius: 14px;
  background: rgba(255, 183, 77, 0.1);
  border: 1px solid rgba(255, 183, 77, 0.24);
  color: #ffe8b2;
  line-height: 1.5;
}

.account-menu__message {
  color: #8ce6b0;
  font-size: 0.82rem;
}

.account-menu__error {
  color: #ff9dad;
  font-size: 0.82rem;
}

@media (max-width: 760px) {
  .account-menu__panel {
    right: -6px;
  }
}
</style>
