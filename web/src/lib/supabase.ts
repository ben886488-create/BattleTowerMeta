import { computed, readonly, shallowRef } from "vue";
import {
  createClient,
  type Session,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export interface UserProfile {
  id: string;
  handle: string;
  display_name: string;
  country_code: string | null;
  avatar_url: string | null;
  created_at?: string;
}

const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL ?? "").trim();
const supabaseAnonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY ?? "").trim();

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

const sessionState = shallowRef<Session | null>(null);
const profileState = shallowRef<UserProfile | null>(null);
const readyState = shallowRef(!hasSupabaseConfig);
const errorState = shallowRef<string>("");

let authStarted = false;
let authSubscription: { unsubscribe: () => void } | null = null;

export const authSession = readonly(sessionState);
export const authProfile = readonly(profileState);
export const authReady = readonly(readyState);
export const authError = readonly(errorState);
export const authUser = computed<User | null>(() => sessionState.value?.user ?? null);

function safeMetadataText(source: Record<string, JsonValue> | undefined, key: string) {
  const value = source?.[key];
  return typeof value === "string" ? value.trim() : "";
}

function fallbackProfile(user: User): UserProfile {
  const meta = user.user_metadata as Record<string, JsonValue> | undefined;
  const emailName = String(user.email ?? "")
    .split("@")[0]
    .trim();

  return {
    id: user.id,
    handle: safeMetadataText(meta, "handle") || emailName || `trainer-${user.id.slice(0, 8)}`,
    display_name:
      safeMetadataText(meta, "display_name") ||
      safeMetadataText(meta, "full_name") ||
      emailName ||
      "Trainer",
    country_code: safeMetadataText(meta, "country_code") || null,
    avatar_url: safeMetadataText(meta, "avatar_url") || null,
  };
}

async function ensureProfile(user: User) {
  if (!supabase) {
    profileState.value = fallbackProfile(user);
    return;
  }

  const fallback = fallbackProfile(user);

  const { data, error } = await supabase
    .from("profiles")
    .select("id, handle, display_name, country_code, avatar_url, created_at")
    .eq("id", user.id)
    .maybeSingle<UserProfile>();

  if (!error && data) {
    profileState.value = data;
    return;
  }

  const { data: upserted } = await supabase
    .from("profiles")
    .upsert(
      {
        id: fallback.id,
        handle: fallback.handle,
        display_name: fallback.display_name,
        country_code: fallback.country_code,
        avatar_url: fallback.avatar_url,
      },
      { onConflict: "id" },
    )
    .select("id, handle, display_name, country_code, avatar_url, created_at")
    .single<UserProfile>();

  profileState.value = upserted ?? fallback;
}

export async function initSupabaseAuth() {
  if (authStarted) return;
  authStarted = true;

  if (!supabase || typeof window === "undefined") {
    readyState.value = true;
    return;
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    errorState.value = error.message;
  }

  sessionState.value = data.session ?? null;
  if (data.session?.user) {
    await ensureProfile(data.session.user);
  } else {
    profileState.value = null;
  }

  readyState.value = true;

  const subscription = supabase.auth.onAuthStateChange(async (_event, session) => {
    sessionState.value = session ?? null;
    errorState.value = "";

    if (session?.user) {
      await ensureProfile(session.user);
    } else {
      profileState.value = null;
    }
  });

  authSubscription = subscription.data.subscription;
}

export async function signInWithPassword(email: string, password: string) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) throw error;
}

export async function signUpWithPassword(input: {
  email: string;
  password: string;
  handle: string;
  displayName: string;
}) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}${import.meta.env.BASE_URL || "/"}`
      : undefined;

  const { error } = await supabase.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: {
      emailRedirectTo: redirectTo,
      data: {
        handle: input.handle.trim(),
        display_name: input.displayName.trim(),
      },
    },
  });

  if (error) throw error;
}

export async function signOutUser() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export function stopSupabaseAuth() {
  authSubscription?.unsubscribe();
  authSubscription = null;
  authStarted = false;
}
