import assert from 'node:assert/strict';
import { test } from 'node:test';
import { aggregateMultiDeckEvents, filterMultiDeckEvents, gameCount, winRate, type MultiDeckTournament } from './pocketMultideck';

function event(id: string, date: string, reverse = false): MultiDeckTournament {
  const a = { wins: reverse ? 0 : 1, losses: reverse ? 1 : 0, draws: 0 };
  const b = { wins: a.losses, losses: a.wins, draws: 0 };
  return {
    id, date, name: id, players: 64, multideck: true,
    coverage: { entrants: 2, registeredDecks: 4, expectedDecks: 4, completeLineups: 2, completedMatches: 1, matchesWithoutGames: 0, reportedGames: 1, attributedGames: 1, unattributedGames: 0, unresolvedGames: 0 },
    decks: [{ id: 'a', name: 'A', icons: [], registrations: 2, top32: 2, ...a }, { id: 'b', name: 'B', icons: [], registrations: 2, top32: 2, ...b }],
    lineups: [{ id: '["a","b"]', decks: ['a', 'b'], registrations: 2, top32: 2, wins: 1, losses: 1, draws: 0 }],
    matchups: [{ deck: 'a', opponent: 'b', ...a }, { deck: 'b', opponent: 'a', ...b }],
  };
}

test('merging events preserves deck-slot denominators and game records without mutating source data', () => {
  const events = [event('one', '2026-11-04T00:00:00Z'), event('two', '2026-11-02T00:00:00Z', true)];
  const before = JSON.stringify(events);
  const summary = aggregateMultiDeckEvents(events);
  assert.equal(summary.coverage.entrants, 4);
  assert.equal(summary.coverage.registeredDecks, 8);
  assert.equal(summary.decks[0]!.registrations / summary.coverage.registeredDecks, 0.5);
  assert.equal(summary.decks.reduce((sum, row) => sum + gameCount(row), 0), summary.coverage.attributedGames * 2);
  assert.equal(winRate(summary.decks[0]!), 0.5);
  assert.equal(summary.lineups[0]!.registrations, 4);
  assert.deepEqual(summary.matchups.get('["a","b"]'), { deck: 'a', opponent: 'b', wins: 1, losses: 1, draws: 0 });
  assert.equal(JSON.stringify(events), before);
});

test('no sample stays null, while a draw contributes half a win', () => {
  assert.equal(winRate({ wins: 0, losses: 0, draws: 0 }), null);
  assert.equal(winRate({ wins: 1, losses: 0, draws: 1 }), 0.75);
  assert.equal(aggregateMultiDeckEvents([]).coverage.entrants, 0);
});

test('time windows include full UTC days and combine with minimum players and event selection', () => {
  const events = [event('latest', '2026-11-04T08:30:00Z'), event('boundary', '2026-10-29T00:00:00Z'), event('outside', '2026-10-28T23:59:59Z')];
  assert.deepEqual(filterMultiDeckEvents(events, 7, 64).map(row => row.id), ['latest', 'boundary']);
  assert.equal(filterMultiDeckEvents(events, 7, 128).length, 0);
  assert.deepEqual(filterMultiDeckEvents(events, 0, 64, 'outside').map(row => row.id), ['outside']);
  assert.equal(filterMultiDeckEvents([], 7, 64).length, 0);
});
