import { loadPublicJson, loadTournamentList } from "./publicData";

type UnknownRecord = Record<string, unknown>;

export type UpcomingTournamentStatus = "open" | "check-in" | "unknown";

export type UpcomingTournamentItem = {
  id: string;
  name: string;
  startTimeMs: number;
  status: UpcomingTournamentStatus;
  statusLabel: "Open" | "Check-in" | "Unknown";
  url: string;
  players?: number;
  organizer?: string;
};

type UpcomingTournamentOptions = {
  withinHours?: number;
  limit?: number;
  nowMs?: number;
};

const LIMITLESS_TOURNAMENTS_API =
  "https://play.limitlesstcg.com/api/tournaments?game=POCKET&limit=50&page=1";

function parseStartMs(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const parsed = Date.parse(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function isPocketTournament(row: UnknownRecord) {
  const game = stringValue(row.game || row.gameId || row.game_id).toUpperCase();
  if (!game) return true;
  return game === "POCKET" || game.includes("TCG POCKET") || game.includes("POKEMON TCG POCKET");
}

function normalizeStatus(row: UnknownRecord): UpcomingTournamentStatus {
  const checkInOpen = row.checkInOpen ?? row.check_in_open ?? row.checkinOpen;
  const registrationOpen = row.registrationOpen ?? row.registration_open ?? row.isRegistrationOpen;

  if (checkInOpen === true) return "check-in";
  if (registrationOpen === true) return "open";

  const text = [
    row.status,
    row.state,
    row.registrationStatus,
    row.registration_status,
    row.registrationState,
    row.checkInStatus,
    row.check_in_status,
    row.checkinStatus,
  ]
    .map((value) => String(value ?? "").toLowerCase())
    .join(" ");

  if (/\bcheck[-\s]?in\b/.test(text)) return "check-in";
  if (/\b(open|register|registration)\b/.test(text)) return "open";
  return "unknown";
}

function statusLabel(status: UpcomingTournamentStatus): UpcomingTournamentItem["statusLabel"] {
  if (status === "open") return "Open";
  if (status === "check-in") return "Check-in";
  return "Unknown";
}

function normalizeUrl(row: UnknownRecord, id: string) {
  const explicit = stringValue(row.url || row.link || row.detailsUrl || row.details_url);
  if (/^https?:\/\//i.test(explicit)) return explicit;
  if (explicit.startsWith("/")) return `https://play.limitlesstcg.com${explicit}`;
  return `https://play.limitlesstcg.com/tournament/${encodeURIComponent(id)}/details`;
}

function normalizeTournament(row: UnknownRecord): UpcomingTournamentItem | null {
  if (!row || typeof row !== "object") return null;
  if (!isPocketTournament(row)) return null;

  const id = stringValue(row.id || row.tournamentId || row.tournament_id);
  const name = stringValue(row.name || row.title);
  const startTimeMs = parseStartMs(
    row.date || row.startTime || row.start_time || row.startsAt || row.starts_at || row.scheduledAt,
  );

  if (!id || !name || !startTimeMs) return null;

  const status = normalizeStatus(row);
  const organizer =
    stringValue(row.organizer) ||
    (row.organizer && typeof row.organizer === "object"
      ? stringValue((row.organizer as UnknownRecord).name)
      : "");

  return {
    id,
    name,
    startTimeMs,
    status,
    statusLabel: statusLabel(status),
    url: normalizeUrl(row, id),
    players: numberValue(row.players || row.registrations || row.registrationCount),
    organizer: organizer || undefined,
  };
}

async function fetchLimitlessTournamentList() {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(LIMITLESS_TOURNAMENTS_API, {
      cache: "no-cache",
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Limitless API ${response.status}`);
    return (await response.json()) as UnknownRecord[];
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

function filterUpcoming(
  rows: UnknownRecord[],
  { withinHours = 24, limit = 10, nowMs = Date.now() }: UpcomingTournamentOptions,
) {
  const endMs = nowMs + withinHours * 60 * 60 * 1000;
  const seen = new Set<string>();

  return rows
    .map(normalizeTournament)
    .filter((item): item is UpcomingTournamentItem => Boolean(item))
    .filter((item) => item.startTimeMs >= nowMs && item.startTimeMs <= endMs)
    .sort((a, b) => a.startTimeMs - b.startTimeMs)
    .filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    })
    .slice(0, limit);
}

export async function getUpcomingPocketTournaments(options: UpcomingTournamentOptions = {}) {
  const [upcomingResult, liveResult, localResult] = await Promise.allSettled([
    loadPublicJson<UnknownRecord[]>("data/upcoming_tournaments.json"),
    fetchLimitlessTournamentList(),
    loadTournamentList<UnknownRecord[]>(),
  ]);

  const rows: UnknownRecord[] = [];

  if (upcomingResult.status === "fulfilled" && Array.isArray(upcomingResult.value)) {
    rows.push(...upcomingResult.value);
  }

  if (liveResult.status === "fulfilled" && Array.isArray(liveResult.value)) {
    rows.push(...liveResult.value);
  }

  if (localResult.status === "fulfilled" && Array.isArray(localResult.value)) {
    rows.push(...localResult.value);
  }

  if (!rows.length && liveResult.status === "rejected") {
    throw liveResult.reason;
  }

  return filterUpcoming(rows, options);
}
