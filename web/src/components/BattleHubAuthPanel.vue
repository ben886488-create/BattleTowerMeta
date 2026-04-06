<template>
  <section class="auth-card">
    <div class="auth-card__head">
      <div>
        <p class="auth-card__kicker">ACCOUNT</p>
        <h2 class="auth-card__title">Battle Hub Access</h2>
      </div>

      <span v-if="profile" class="auth-card__status">
        {{ profile.display_name || profile.handle }}
      </span>
    </div>

    <p class="auth-card__intro">
      Sign in to save rank logs, post trades, and join deck discussions.
    </p>

    <div v-if="!hasSupabaseConfig" class="auth-card__notice">
      Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to enable login and shared community data.
    </div>

    <div v-else-if="profile" class="auth-card__signed">
      <div class="identity-row">
        <div class="identity-pill">
          <span class="identity-label">Handle</span>
          <strong>{{ profile.handle }}</strong>
        </div>

        <div class="identity-pill">
          <span class="identity-label">Display</span>
          <strong>{{ profile.display_name }}</strong>
        </div>

        <div v-if="user?.email" class="identity-pill">
          <span class="identity-label">Email</span>
          <strong>{{ user.email }}</strong>
        </div>
      </div>

      <button type="button" class="auth-btn auth-btn--ghost" @click="handleSignOut">
        Sign out
      </button>
    </div>

    <div v-else class="auth-grid">
      <form class="auth-form" @submit.prevent="handleSignIn">
        <h3>Sign in</h3>
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
        <button type="submit" class="auth-btn" :disabled="busy">Sign in</button>
      </form>

      <form class="auth-form" @submit.prevent="handleSignUp">
        <h3>Create account</h3>
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
        <button type="submit" class="auth-btn" :disabled="busy">Create account</button>
      </form>
    </div>

    <p v-if="message" class="auth-card__message">{{ message }}</p>
    <p v-if="errorMessage" class="auth-card__error">{{ errorMessage }}</p>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import {
  authProfile,
  authUser,
  hasSupabaseConfig,
  signInWithPassword,
  signOutUser,
  signUpWithPassword,
} from "../lib/supabase";

const profile = authProfile;
const user = authUser;

const busy = ref(false);
const message = ref("");
const errorMessage = ref("");

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

async function handleSignIn() {
  busy.value = true;
  message.value = "";
  errorMessage.value = "";

  try {
    await signInWithPassword(signIn.email, signIn.password);
    signIn.password = "";
    message.value = "Signed in successfully.";
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
  errorMessage.value = "";

  try {
    await signOutUser();
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "Unable to sign out.";
  } finally {
    busy.value = false;
  }
}
</script>

<style scoped>
.auth-card {
  padding: 20px;
  border-radius: 24px;
  border: 1px solid rgba(115, 192, 255, 0.18);
  background:
    linear-gradient(180deg, rgba(18, 43, 76, 0.16), rgba(7, 18, 31, 0.2)),
    rgba(8, 20, 35, 0.96);
  display: grid;
  gap: 16px;
}

.auth-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.auth-card__kicker {
  margin: 0 0 6px;
  font-size: 0.72rem;
  letter-spacing: 0.24em;
  color: #8fd6ff;
}

.auth-card__title {
  margin: 0;
  font-size: 1.8rem;
  color: #fff;
}

.auth-card__status {
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid rgba(115, 192, 255, 0.18);
  background: rgba(12, 28, 48, 0.88);
  color: #eaf7ff;
  font-weight: 700;
}

.auth-card__intro,
.auth-card__message,
.auth-card__error,
.auth-card__notice {
  margin: 0;
  line-height: 1.6;
}

.auth-card__notice {
  padding: 14px 16px;
  border-radius: 16px;
  background: rgba(255, 183, 77, 0.1);
  border: 1px solid rgba(255, 183, 77, 0.24);
  color: #ffe8b2;
}

.auth-card__message {
  color: #8ce6b0;
}

.auth-card__error {
  color: #ff9dad;
}

.auth-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.auth-form,
.auth-card__signed {
  display: grid;
  gap: 12px;
  padding: 16px;
  border-radius: 18px;
  background: rgba(11, 26, 44, 0.88);
  border: 1px solid rgba(115, 192, 255, 0.12);
}

.auth-form h3 {
  margin: 0;
}

.auth-form label {
  display: grid;
  gap: 6px;
  font-size: 0.9rem;
  color: #d7ebff;
}

.auth-form input {
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 10px 12px;
  background: rgba(2, 10, 20, 0.86);
  color: #fff;
}

.auth-btn {
  appearance: none;
  border: 1px solid rgba(115, 192, 255, 0.26);
  border-radius: 12px;
  padding: 10px 14px;
  background: linear-gradient(135deg, rgba(44, 130, 201, 0.56), rgba(17, 60, 122, 0.86));
  color: #fff;
  font-weight: 800;
}

.auth-btn--ghost {
  justify-self: start;
  background: rgba(255, 255, 255, 0.05);
}

.identity-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.identity-pill {
  min-width: 140px;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(4, 15, 28, 0.82);
  border: 1px solid rgba(115, 192, 255, 0.12);
}

.identity-label {
  display: block;
  font-size: 0.75rem;
  color: #91afcc;
  margin-bottom: 4px;
}

@media (max-width: 820px) {
  .auth-grid {
    grid-template-columns: 1fr;
  }
}
</style>
