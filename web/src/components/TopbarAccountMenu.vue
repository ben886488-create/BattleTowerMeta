<template>
  <div ref="rootRef" class="account-menu">
    <button type="button" class="account-menu__trigger" :aria-expanded="open" aria-controls="account-panel" @click="toggleOpen">
      <span class="account-menu__status" :class="{ 'account-menu__status--online': !!profile }"></span>
      <span>{{ triggerLabel }}</span>
    </button>

    <div v-if="open" id="account-panel" class="account-menu__panel">
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
  min-height: var(--control-height);
  padding: 0 var(--space-3);
  border-radius: var(--radius-control);
  border: 1px solid var(--border);
  background: var(--bg-control);
  color: var(--text);
  font-family: var(--font-label);
  font-size: 11px;
  letter-spacing: 0.08em;
  font-weight: 700;
}

.account-menu__status {
  width: 6px;
  height: 6px;
  flex: 0 0 6px;
  border-radius: 50%;
  background: var(--muted);
}

.account-menu__status--online {
  background: var(--positive);
  box-shadow: 0 0 8px var(--positive);
}

.account-menu__panel {
  position: absolute;
  top: calc(100% + var(--space-2));
  right: 0;
  width: min(360px, calc(100vw - 24px));
  padding: var(--space-4);
  border-radius: var(--radius-panel);
  border: 1px solid var(--border);
  background: var(--panel-background);
  box-shadow: var(--shadow-floating);
  display: grid;
  gap: var(--space-3);
  z-index: 1200;
}

.account-menu__tabs {
  display: inline-grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-control);
  background: var(--bg-control);
}

.account-menu__tab,
.account-menu__action {
  appearance: none;
  min-height: var(--control-height);
  border: 1px solid var(--border);
  border-radius: var(--radius-control);
  padding: var(--space-2) var(--space-3);
  background: var(--bg-control);
  color: var(--text);
  font-family: var(--font-label);
  font-size: 11px;
  letter-spacing: 0.1em;
  font-weight: 800;
}

.account-menu__tab--active,
.account-menu__action {
  background: var(--accent);
  color: var(--bg-deep);
}

.account-menu__action--ghost {
  background: var(--bg-control);
  color: var(--text);
}

.account-menu__trigger:hover,
.account-menu__tab:hover,
.account-menu__action:hover:not(:disabled) {
  border-color: var(--accent);
  background: var(--bg-selected);
  color: var(--text);
}

.account-menu__form {
  display: grid;
  gap: var(--space-3);
}

.account-menu__form label {
  display: grid;
  gap: var(--space-2);
  font-family: var(--font-label);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.14em;
  color: var(--text-soft);
}

.account-menu__form input {
  width: 100%;
  min-height: var(--control-height);
  border: 1px solid var(--border);
  border-radius: var(--radius-control);
  padding: var(--space-2) var(--space-3);
  background: var(--bg-control);
  color: var(--text);
  font-family: var(--font-body);
  font-size: 13px;
  letter-spacing: 0;
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
  color: var(--text);
}

.account-menu__meta {
  font-size: 0.82rem;
  color: var(--text-soft);
}

.account-menu__notice {
  padding: var(--space-3);
  border-radius: var(--radius-panel);
  background: var(--surface);
  border: 1px solid var(--warning);
  color: var(--warning);
  line-height: 1.5;
}

.account-menu__message {
  color: var(--positive);
  font-size: 0.82rem;
}

.account-menu__error {
  color: var(--negative);
  font-size: 0.82rem;
}

@media (max-width: 760px) {
  .account-menu__panel {
    right: -6px;
  }
}
</style>
