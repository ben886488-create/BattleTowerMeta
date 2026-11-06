import { loadPublicJson } from './publicData';

export type GameRecord = { wins: number; losses: number; draws: number };
export type MultiDeckIdentity = { id: string; name: string; icons: string[] };
export type MultiDeckStats = MultiDeckIdentity & GameRecord & { registrations: number; top32: number };
export type LineupStats = GameRecord & { id: string; decks: string[]; registrations: number; top32: number };
export type MultiDeckMatchup = GameRecord & { deck: string; opponent: string };
export type MultiDeckCoverage = {
  entrants: number; registeredDecks: number; expectedDecks: number; completeLineups: number;
  completedMatches: number; matchesWithoutGames: number; reportedGames: number;
  attributedGames: number; unattributedGames: number; unresolvedGames: number;
};
export type MultiDeckTournament = {
  id: string; name: string; date: string; players: number; multideck: true;
  coverage: MultiDeckCoverage; decks: MultiDeckStats[]; lineups: LineupStats[]; matchups: MultiDeckMatchup[];
};
export type MultiDeckData = {
  version: number; generatedAt: string; minPlayers: number;
  errors: { id: string; message: string }[]; tournaments: MultiDeckTournament[];
};

const coverageKeys = ['entrants', 'registeredDecks', 'expectedDecks', 'completeLineups', 'completedMatches', 'matchesWithoutGames', 'reportedGames', 'attributedGames', 'unattributedGames', 'unresolvedGames'] as const;
const countKeys = ['wins', 'losses', 'draws', 'registrations', 'top32'] as const;

export async function loadMultiDeckData(): Promise<MultiDeckData> {
  const data = await loadPublicJson<MultiDeckData>('data/multideck/meta.json');
  if (data.version !== 1 || !Array.isArray(data.tournaments)) throw new Error('Unsupported dual-deck data');
  return data;
}

export function gameCount(record: GameRecord): number {
  return record.wins + record.losses + record.draws;
}

export function winRate(record: GameRecord): number | null {
  const games = gameCount(record);
  return games ? (record.wins + record.draws * 0.5) / games : null;
}

export function filterMultiDeckEvents(events: MultiDeckTournament[], days: number, minPlayers: number, tournamentId = '') {
  const timestamps = events.map(event => Date.parse(event.date)).filter(Number.isFinite);
  const latest = timestamps.length ? Math.max(...timestamps) : 0;
  const latestDay = Math.floor(latest / 86400000) * 86400000;
  const start = days ? latestDay - (days - 1) * 86400000 : -Infinity;
  return events.filter(event => event.players >= minPlayers && (!tournamentId || event.id === tournamentId) && Date.parse(event.date) >= start);
}

export function aggregateMultiDeckEvents(events: MultiDeckTournament[]) {
  const coverage = Object.fromEntries(coverageKeys.map(key => [key, 0])) as MultiDeckCoverage;
  const decks = new Map<string, MultiDeckStats>();
  const lineups = new Map<string, LineupStats>();
  const matchups = new Map<string, MultiDeckMatchup>();
  for (const event of events) {
    for (const key of coverageKeys) coverage[key] += event.coverage[key] || 0;
    for (const row of event.decks) {
      const previous = decks.get(row.id);
      if (!previous) decks.set(row.id, { ...row });
      else for (const key of countKeys) previous[key] += row[key];
    }
    for (const row of event.lineups) {
      const previous = lineups.get(row.id);
      if (!previous) lineups.set(row.id, { ...row, decks: [...row.decks] });
      else for (const key of countKeys) previous[key] += row[key];
    }
    for (const row of event.matchups) {
      const key = JSON.stringify([row.deck, row.opponent]);
      const previous = matchups.get(key);
      if (!previous) matchups.set(key, { ...row });
      else for (const field of ['wins', 'losses', 'draws'] as const) previous[field] += row[field];
    }
  }
  return {
    coverage,
    decks: [...decks.values()].sort((a, b) => b.registrations - a.registrations || a.id.localeCompare(b.id)),
    lineups: [...lineups.values()].sort((a, b) => b.registrations - a.registrations || a.id.localeCompare(b.id)),
    matchups,
  };
}
