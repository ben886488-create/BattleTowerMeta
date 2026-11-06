import assert from 'node:assert/strict';
import test from 'node:test';
import { deckResultPairings, expandStandingDecks } from './pocketDecks';
import { buildStandingLookup, lookupStandingForPairingSide, parsePairingResult } from './pairingResolver';
import { registeredPlayerDecks, uniquePlayerDecks } from './playerEntries';

const standings = [
  { player: 'alice', placing: 1, decks: { '2': { id: 'b' }, '1': { id: 'a' } }, decklists: { '1': { cards: ['a'] }, '2': { cards: ['b'] } } },
  { player: 'bob', placing: 2, decks: { '1': { id: 'c' }, '2': { id: 'd' } }, decklists: {} },
];

test('both registered decks feed the existing card/deck loops without duplicating original players', () => {
  const expanded = expandStandingDecks(standings);
  assert.equal(standings.length, 2);
  assert.equal(expanded.length, 4);
  assert.deepEqual(expanded.map(row => (row as any).deck.id), ['a', 'b', 'c', 'd']);
  assert.deepEqual(expandStandingDecks(expanded), expanded);
});

test('fallback win-rate lookup uses the played deck and never inherits a whole-match score', () => {
  const matches = [{ player1: 'alice', player2: 'bob', winner: 'alice', p1Points: 2, p2Points: 1, games: { '1': { p1deck: 2, p2deck: 1, winner: 'bob' } } }];
  const games = deckResultPairings(matches, standings);
  const lookup = buildStandingLookup(standings, row => row.deck);
  const left = lookupStandingForPairingSide(lookup, games[0]!, 1)!;
  const right = lookupStandingForPairingSide(lookup, games[0]!, 2)!;
  assert.equal((left.deck as any).id, 'b');
  assert.equal((right.deck as any).id, 'c');
  assert.deepEqual(parsePairingResult(games[0]!, left.player, right.player), { p1: 0, p2: 1 });
});

test('missing game selections stay out of deck results; single-deck matches retain the old behavior', () => {
  const matches = [{ player1: 'alice', player2: 'bob', winner: 'alice' }];
  assert.deepEqual(deckResultPairings(matches, standings), []);
  assert.equal(deckResultPairings(matches, [{ player: 'alice', deck: { id: 'a' } }]), matches);
});

test('player deck preferences can use both registrations while the player entry stays singular', () => {
  const entry = { player: 'alice', points: 10, placing: 1, tournamentId: 't', tournamentName: 'T', decks: [{ deckId: 'a' }, { deckId: 'b' }] };
  assert.equal(registeredPlayerDecks(entry).length, 2);
  assert.equal(entry.points, 10);
  const duplicate = { ...entry, decks: [{ deckId: 'a' }, { deckId: 'a' }] };
  assert.equal(registeredPlayerDecks(duplicate).length, 2);
  assert.equal(uniquePlayerDecks(duplicate).length, 1);
});
