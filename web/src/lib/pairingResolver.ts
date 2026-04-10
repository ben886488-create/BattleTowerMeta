type AnyRecord = Record<string, any>;

export interface StandingLookupEntry<TDeck> {
  row: AnyRecord;
  player: string;
  place: number | null;
  deck: TDeck;
}

export interface PairingResult {
  p1: number;
  p2: number;
}

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function firstText(values: unknown[]) {
  for (const value of values) {
    const text = cleanText(value);
    if (text) return text;
  }
  return "";
}

function toNumber(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function normalizeEntityKey(value: unknown) {
  return cleanText(value)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[\s_/]+/g, "-")
    .replace(/[^\p{Letter}\p{Number}-]+/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function extractStandingPlayerName(row: AnyRecord) {
  return firstText([
    typeof row.player === "string" ? row.player : "",
    row.player?.name,
    row.player?.displayName,
    row.player?.username,
    row.name,
    row.playerName,
    row.player_name,
    row.displayName,
    row.user?.name,
    row.user?.displayName,
    row.user?.username,
    row.account?.username,
    row.username,
  ]);
}

function normalizePotentialPlayerSlug(value: unknown) {
  return cleanText(value)
    .toLowerCase()
    .replace(/^@+/, "")
    .replace(/\s+/g, "");
}

function extractStandingPlayerSlug(row: AnyRecord) {
  const explicit = firstText([
    row.playerSlug,
    row.player_slug,
    row.username,
    row.userName,
    row.player?.username,
    row.user?.username,
    row.account?.username,
    row.profile?.username,
    row.limitless?.username,
  ]);

  if (explicit) return explicit.toLowerCase();
  return normalizePotentialPlayerSlug(extractStandingPlayerName(row));
}

function extractPairingSideSource(row: AnyRecord, side: 1 | 2) {
  const index = side === 1 ? 0 : 1;

  return (
    row.players?.[index] ??
    row.pairing?.players?.[index] ??
    row[side === 1 ? "p1" : "p2"] ??
    row[side === 1 ? "player1" : "player2"] ??
    row[side === 1 ? "left" : "right"] ??
    row[side === 1 ? "home" : "away"] ??
    null
  );
}

function extractNameFromParticipant(value: any) {
  if (typeof value === "string") return cleanText(value);
  if (!value || typeof value !== "object") return "";

  return firstText([
    value.name,
    value.player,
    value.displayName,
    value.username,
    value.user?.name,
    value.user?.username,
  ]);
}

function extractSlugFromParticipant(value: any) {
  if (!value || typeof value !== "object") return "";
  return firstText([value.slug, value.username, value.user?.username, value.id]).toLowerCase();
}

function compareNumericResult(a: number, b: number): PairingResult {
  if (a === b) return { p1: 0.5, p2: 0.5 };
  return a > b ? { p1: 1, p2: 0 } : { p1: 0, p2: 1 };
}

function parseOutcomeToken(value: unknown) {
  const text = cleanText(value).toLowerCase();
  if (!text) return null;
  if (["w", "win", "won"].includes(text)) return 1;
  if (["l", "loss", "lose", "lost"].includes(text)) return 0;
  if (["d", "draw", "tie"].includes(text)) return 0.5;
  return null;
}

export function getLoosePlace(row: AnyRecord) {
  return (
    toNumber(row.placing) ??
    toNumber(row.place) ??
    toNumber(row.rank) ??
    toNumber(row.position) ??
    toNumber(row.standing) ??
    null
  );
}

export function buildStandingLookup<TDeck>(
  standings: AnyRecord[],
  getDeck: (row: AnyRecord) => TDeck | null,
) {
  const map = new Map<string, StandingLookupEntry<TDeck>>();

  for (const row of standings) {
    const deck = getDeck(row);
    if (!deck) continue;

    const player = extractStandingPlayerName(row);
    if (!player) continue;

    const entry: StandingLookupEntry<TDeck> = {
      row,
      player,
      place: getLoosePlace(row),
      deck,
    };

    const keys = [
      player,
      extractStandingPlayerSlug(row),
      row.id,
      row.playerId,
      row.player_id,
      row.user?.id,
      row.player?.id,
    ]
      .map((value) => normalizeEntityKey(value))
      .filter(Boolean);

    for (const key of keys) {
      map.set(key, entry);
    }
  }

  return map;
}

export function lookupStandingForPairingSide<TDeck>(
  map: Map<string, StandingLookupEntry<TDeck>>,
  row: AnyRecord,
  side: 1 | 2,
) {
  const source = extractPairingSideSource(row, side);

  const keys = [
    extractNameFromParticipant(source),
    extractSlugFromParticipant(source),
    source?.id,
    row[side === 1 ? "player1Id" : "player2Id"],
    row[side === 1 ? "player_1_id" : "player_2_id"],
    row[side === 1 ? "p1Id" : "p2Id"],
  ]
    .map((value) => normalizeEntityKey(value))
    .filter(Boolean);

  for (const key of keys) {
    const hit = map.get(key);
    if (hit) return hit;
  }

  return null;
}

export function parsePairingResult(row: AnyRecord, p1Name = "", p2Name = ""): PairingResult | null {
  const drawFlag = [
    row.draw,
    row.isDraw,
    row.tie,
    row.result?.draw,
    row.result?.tie,
  ].some((value) => value === true || cleanText(value).toLowerCase() === "draw");

  if (drawFlag) return { p1: 0.5, p2: 0.5 };

  const winnerRaw = row.winner;
  if (winnerRaw === -1 || winnerRaw === "-1") {
    return null;
  }
  if (winnerRaw === 0 || winnerRaw === "0") {
    return { p1: 0.5, p2: 0.5 };
  }

  const numericPairs: Array<[unknown, unknown]> = [
    [row.p1Points, row.p2Points],
    [row.player1Points, row.player2Points],
    [row.leftPoints, row.rightPoints],
    [row.homeScore, row.awayScore],
    [row.result?.p1, row.result?.p2],
    [row.result?.left, row.result?.right],
    [row.score?.p1, row.score?.p2],
    [row.score?.left, row.score?.right],
    [row.wins1, row.wins2],
    [row.player1Wins, row.player2Wins],
  ];

  for (const [aRaw, bRaw] of numericPairs) {
    const a = toNumber(aRaw);
    const b = toNumber(bRaw);
    if (a != null && b != null) {
      return compareNumericResult(a, b);
    }
  }

  const tokenPairs: Array<[unknown, unknown]> = [
    [row.p1Result, row.p2Result],
    [row.player1Result, row.player2Result],
    [row.leftResult, row.rightResult],
  ];

  for (const [aRaw, bRaw] of tokenPairs) {
    const a = parseOutcomeToken(aRaw);
    const b = parseOutcomeToken(bRaw);

    if (a != null && b != null) {
      return { p1: a, p2: b };
    }
  }

  const winnerCandidates = [
    row.winner,
    row.winnerName,
    row.result?.winner,
    row.result?.winnerName,
    row.winnerPlayer,
  ];

  for (const candidate of winnerCandidates) {
    const text = cleanText(candidate);
    if (!text) continue;

    if (/draw|tie/i.test(text)) return { p1: 0.5, p2: 0.5 };
    if (/^(1|p1|player1|left|home)$/i.test(text)) return { p1: 1, p2: 0 };
    if (/^(2|p2|player2|right|away)$/i.test(text)) return { p1: 0, p2: 1 };

    const key = normalizeEntityKey(text);
    if (p1Name && key === normalizeEntityKey(p1Name)) return { p1: 1, p2: 0 };
    if (p2Name && key === normalizeEntityKey(p2Name)) return { p1: 0, p2: 1 };
  }

  const textCandidates = [
    row.score,
    row.result,
    row.outcome,
    row.summary,
    row.label,
    row.status,
  ];

  for (const candidate of textCandidates) {
    const text = cleanText(candidate);
    if (!text) continue;

    if (/draw|tie/i.test(text)) return { p1: 0.5, p2: 0.5 };

    const outcome = parseOutcomeToken(text);
    if (outcome != null) {
      if (outcome === 1) return { p1: 1, p2: 0 };
      if (outcome === 0) return { p1: 0, p2: 1 };
      return { p1: 0.5, p2: 0.5 };
    }

    const match = text.match(/(\d+)\s*[-:]\s*(\d+)(?:\s*[-:]\s*(\d+))?/);
    if (match) {
      return compareNumericResult(Number(match[1]), Number(match[2]));
    }

    if (/player\s*1/i.test(text) && /win/i.test(text)) return { p1: 1, p2: 0 };
    if (/player\s*2/i.test(text) && /win/i.test(text)) return { p1: 0, p2: 1 };
  }

  return null;
}
