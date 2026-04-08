import { supabase, authProfile, authUser, hasSupabaseConfig, type UserProfile } from "./supabase";

export interface RankLogEntry {
  id: string;
  user_id: string;
  player_deck: string | null;
  opponent_deck: string;
  result: "win" | "loss" | "draw";
  queue_type: string;
  first_player: boolean | null;
  notes: string | null;
  rank_tier: string | null;
  version_code: string | null;
  created_at: string;
}

export interface TradePostEntry {
  id: string;
  user_id: string;
  title: string;
  offer_cards: string[];
  want_cards: string[];
  notes: string | null;
  status: "open" | "matched" | "closed";
  created_at: string;
  profile?: Pick<UserProfile, "handle" | "display_name" | "country_code"> | null;
}

export interface DeckDiscussionEntry {
  id: string;
  user_id: string;
  deck_key: string;
  body: string;
  created_at: string;
  profile?: Pick<UserProfile, "handle" | "display_name" | "country_code"> | null;
}

function ensureSupabase() {
  if (!supabase || !hasSupabaseConfig) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
}

function ensureAuthUserId() {
  const userId = authUser.value?.id;
  if (!userId) {
    throw new Error("Please sign in first.");
  }
  return userId;
}

function normalizeCardList(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseTradeCardInput(value: string) {
  return normalizeCardList(value);
}

export async function fetchRankLogs(limit = 100) {
  const client = ensureSupabase();
  const userId = ensureAuthUserId();

  const { data, error } = await client
    .from("rank_logs")
    .select("id, user_id, player_deck, opponent_deck, result, queue_type, first_player, notes, rank_tier, version_code, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<RankLogEntry[]>();

  if (error) throw error;
  return data ?? [];
}

export async function createRankLog(input: {
  playerDeck: string;
  opponentDeck: string;
  result: "win" | "loss" | "draw";
  queueType: string;
  firstPlayer: boolean | null;
  notes: string;
  rankTier: string;
  versionCode: string;
}) {
  const client = ensureSupabase();
  const userId = ensureAuthUserId();

  const { data, error } = await client
    .from("rank_logs")
    .insert({
      user_id: userId,
      player_deck: input.playerDeck.trim() || null,
      opponent_deck: input.opponentDeck.trim(),
      result: input.result,
      queue_type: input.queueType.trim() || "Ranked",
      first_player: input.firstPlayer,
      notes: input.notes.trim() || null,
      rank_tier: input.rankTier.trim() || null,
      version_code: input.versionCode.trim() || null,
    })
    .select("id, user_id, player_deck, opponent_deck, result, queue_type, first_player, notes, rank_tier, version_code, created_at")
    .single<RankLogEntry>();

  if (error) throw error;
  return data;
}

export async function deleteRankLog(id: string) {
  const client = ensureSupabase();
  const userId = ensureAuthUserId();

  const { error } = await client
    .from("rank_logs")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function deleteRankLogs(ids: string[]) {
  const client = ensureSupabase();
  const userId = ensureAuthUserId();
  const filteredIds = ids.map((id) => String(id).trim()).filter(Boolean);
  if (!filteredIds.length) return;

  const { error } = await client
    .from("rank_logs")
    .delete()
    .eq("user_id", userId)
    .in("id", filteredIds);

  if (error) throw error;
}

export async function fetchTradePosts(search = "") {
  const client = ensureSupabase();

  const { data, error } = await client
    .from("trade_posts")
    .select(
      "id, user_id, title, offer_cards, want_cards, notes, status, created_at, profile:profiles!trade_posts_user_id_fkey(handle, display_name, country_code)",
    )
    .order("created_at", { ascending: false })
    .limit(100)
    .returns<TradePostEntry[]>();
  if (error) throw error;

  const rows = data ?? [];
  const keyword = search.trim().toLowerCase();
  if (!keyword) return rows;

  return rows.filter((item) => {
    const haystack = [
      item.title,
      item.notes ?? "",
      ...(item.offer_cards ?? []),
      ...(item.want_cards ?? []),
      item.profile?.display_name ?? "",
      item.profile?.handle ?? "",
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(keyword);
  });
}

export async function createTradePost(input: {
  title: string;
  offerCards: string;
  wantCards: string;
  notes: string;
}) {
  const client = ensureSupabase();
  const userId = ensureAuthUserId();

  const { error } = await client.from("trade_posts").insert({
    user_id: userId,
    title: input.title.trim(),
    offer_cards: normalizeCardList(input.offerCards),
    want_cards: normalizeCardList(input.wantCards),
    notes: input.notes.trim() || null,
    status: "open",
  });

  if (error) throw error;
}

export async function fetchDeckDiscussion(deckKey: string) {
  const client = ensureSupabase();

  const { data, error } = await client
    .from("deck_discussions")
    .select(
      "id, user_id, deck_key, body, created_at, profile:profiles!deck_discussions_user_id_fkey(handle, display_name, country_code)",
    )
    .eq("deck_key", deckKey)
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<DeckDiscussionEntry[]>();

  if (error) throw error;
  return data ?? [];
}

export async function createDeckDiscussion(deckKey: string, body: string) {
  const client = ensureSupabase();
  const userId = ensureAuthUserId();

  const { error } = await client.from("deck_discussions").insert({
    user_id: userId,
    deck_key: deckKey,
    body: body.trim(),
  });

  if (error) throw error;
}

export function currentProfile() {
  return authProfile.value;
}
