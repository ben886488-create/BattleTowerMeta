"""Adapt Limitless single/multi-deck records for the shared Pocket data pipeline."""
import json
from pathlib import Path

TOURNAMENTS_INDEX = Path("web/public/data/tournaments.json")


def read_index(path):
    path = Path(path)
    if not path.exists():
        return []
    rows = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(rows, list):
        raise ValueError(f"Expected a tournament array: {path}")
    return rows


def load_tournament_index(path=TOURNAMENTS_INDEX):
    """Migrate the previous separate index into the one shared tournament list."""
    path = Path(path)
    rows = read_index(path.parent / "multideck/tournaments.json") + read_index(path)
    return list({str(row["id"]): row for row in rows if isinstance(row, dict) and row.get("id")}.values())


def is_multideck(details=None, standings=None):
    if (details or {}).get("multideck") is True:
        return True
    return isinstance(standings, list) and any(
        isinstance(row, dict) and (
            row.get("_deckSlot") is not None
            or any(isinstance(row.get(key), dict) and bool(row[key]) for key in ("decks", "decklists"))
        ) for row in standings
    )


def standing_decks(row):
    decks = row.get("decks") if isinstance(row.get("decks"), dict) else {}
    lists = row.get("decklists") if isinstance(row.get("decklists"), dict) else {}
    slots = sorted(set(decks) | set(lists), key=lambda key: (not str(key).isdigit(), str(key).zfill(6)))
    return [(str(slot), decks.get(slot) or {}, lists.get(slot)) for slot in slots]


def expand_standings(standings):
    """One row per registered deck, only for deck/card statistics (never player rankings)."""
    output = []
    for row in standings:
        if not isinstance(row, dict):
            continue
        slots = [] if row.get("_deckSlot") is not None else standing_decks(row)
        if not slots:
            output.append(row)
        else:
            output.extend({**row, "deck": deck, "decklist": decklist, "_deckSlot": slot} for slot, deck, decklist in slots)
    return output


PAIRING_IDENTITIES = (
    "player1", "player2", "p1", "p2", "players", "pairing", "phase", "round",
    "player1Id", "player2Id", "player_1_id", "player_2_id", "p1Id", "p2Id",
)


def deck_pairings(pairings, multideck=False):
    """Keep ordinary match results; attribute multi-deck results using the reported games."""
    for match in pairings:
        if not isinstance(match, dict):
            continue
        if not multideck:
            yield match
            continue
        games = match.get("games")
        games = games.values() if isinstance(games, dict) else games if isinstance(games, list) else []
        for game in games:
            if not isinstance(game, dict) or game.get("p1deck") is None or game.get("p2deck") is None:
                continue
            # Never inherit whole-match scores or a winner into a game's result.
            yield {
                **{key: match[key] for key in PAIRING_IDENTITIES if key in match},
                "winner": game.get("winner"),
                "p1deck": str(game["p1deck"]), "p2deck": str(game["p2deck"]),
                "_multideck": True,
            }
