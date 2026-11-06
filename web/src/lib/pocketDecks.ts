type Row = Record<string, any>;

function dictionary(value: unknown): Row {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Row : {};
}

export function hasMultipleDecks(rows: Row[]) {
  return rows.some(row => row._deckSlot != null || Object.keys(dictionary(row.decks)).length > 0 || Object.keys(dictionary(row.decklists)).length > 0);
}

/** Expand deck registrations for deck/card analytics while keeping player entries intact. */
export function expandStandingDecks<T extends Row>(rows: T[]): T[] {
  return rows.flatMap(row => {
    if (row._deckSlot != null) return [row];
    const decks = dictionary(row.decks), lists = dictionary(row.decklists);
    const slots = [...new Set([...Object.keys(decks), ...Object.keys(lists)])].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    return slots.length ? slots.map(slot => ({ ...row, deck: decks[slot] || {}, decklist: lists[slot], _deckSlot: slot })) : [row];
  });
}

export function standingDeckKey(key: string, slot: unknown) {
  return slot == null || slot === '' ? key : JSON.stringify([key, String(slot)]);
}

/** Multi-deck match scores must never be applied to both registered decks. */
export function deckResultPairings<T extends Row>(pairings: T[], standings: Row[]): T[] {
  if (!hasMultipleDecks(standings)) return pairings;
  const identityKeys = ['player1', 'player2', 'p1', 'p2', 'players', 'pairing', 'phase', 'round', 'player1Id', 'player2Id', 'player_1_id', 'player_2_id', 'p1Id', 'p2Id'];
  return pairings.flatMap(match => {
    const games = Array.isArray(match.games) ? match.games : Object.values(dictionary(match.games));
    return games.filter((game: Row) => game && game.p1deck != null && game.p2deck != null).map((game: Row) => ({
      ...Object.fromEntries(identityKeys.filter(key => key in match).map(key => [key, match[key]])),
      winner: game.winner, p1deck: String(game.p1deck), p2deck: String(game.p2deck), _multideck: true,
    }) as unknown as T);
  });
}
