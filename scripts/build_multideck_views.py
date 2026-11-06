"""Build a separate, game-level Pocket dual-deck dataset from Limitless sources.

Usage: python scripts/build_multideck_views.py [--fetch-id ID ...]
The optional fetch only replaces an event after all three requests succeed.
The daily collector discovers events using the API multideck flag, not names.
"""
import argparse
import json
import os
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

from pocket_multideck import is_multideck, merge_index, read_index, standing_decks

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "web/public/data"


def read_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def write_json(path, payload):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(".json.tmp")
    temporary.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    temporary.replace(path)


def integer(value, default=0):
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def deck_info(raw):
    raw = raw if isinstance(raw, dict) else {}
    key = str(raw.get("id") or "").strip()
    if key.lower() in ("", "unknown", "undefined", "null", "none"):
        return None
    return {"id": key, "name": str(raw.get("name") or key), "icons": raw.get("icons") if isinstance(raw.get("icons"), list) else []}


def outcome(winner, p1, p2):
    if winner == p1:
        return "wins", "losses"
    if winner == p2:
        return "losses", "wins"
    if winner in (0, "0"):
        return "draws", "draws"
    return None


def build_event(summary, details, standings, pairings):
    if not is_multideck(details, standings):
        raise ValueError("Not a multi-deck tournament")
    if not isinstance(standings, list) or not standings:
        raise ValueError("No published standings")
    if not isinstance(pairings, list):
        raise ValueError("Invalid pairings")
    if any(len(standing_decks(row)) > 2 for row in standings if isinstance(row, dict)):
        raise ValueError("More than two registered decks; excluded from the dual-deck environment")

    decks, lineups, matchups, player_decks, player_lineups = {}, {}, {}, {}, {}
    coverage = Counter()
    seen_players = set()
    for row in standings:
        if not isinstance(row, dict):
            continue
        player = str(row.get("player") or "").strip()
        if not player or player in seen_players:
            continue
        seen_players.add(player)
        slots = {}
        for slot, raw_deck, _ in standing_decks(row):
            deck = deck_info(raw_deck)
            if not deck:
                continue
            slots[slot] = deck["id"]
            stat = decks.setdefault(deck["id"], {**deck, "registrations": 0, "top32": 0, "wins": 0, "losses": 0, "draws": 0})
            stat["registrations"] += 1
            if 0 < integer(row.get("placing")) <= 32:
                stat["top32"] += 1
            coverage["registeredDecks"] += 1
        player_decks[player] = slots
        if len(slots) == 2:
            coverage["completeLineups"] += 1
            keys = sorted(slots.values())
            # JSON encoding prevents ambiguous keys and preserves identical archetypes in both slots.
            lineup_key = json.dumps(keys, separators=(",", ":"))
            stat = lineups.setdefault(lineup_key, {"id": lineup_key, "decks": keys, "registrations": 0, "top32": 0, "wins": 0, "losses": 0, "draws": 0})
            stat["registrations"] += 1
            if 0 < integer(row.get("placing")) <= 32:
                stat["top32"] += 1
            player_lineups[player] = lineup_key

    for match in pairings:
        if not isinstance(match, dict):
            continue
        p1, p2 = str(match.get("player1") or ""), str(match.get("player2") or "")
        if not p1 or not p2 or p1 == p2:
            continue  # Byes and automatic losses are not played matches.
        result = outcome(match.get("winner"), p1, p2)
        if result:
            coverage["completedMatches"] += 1
            for player, field in zip((p1, p2), result):
                if player in player_lineups:
                    lineups[player_lineups[player]][field] += 1

        games = match.get("games")
        games = list(games.values()) if isinstance(games, dict) else games if isinstance(games, list) else []
        if result and not games:
            coverage["matchesWithoutGames"] += 1
        for game in games:
            if not isinstance(game, dict):
                continue
            game_result = outcome(game.get("winner"), p1, p2)
            if not game_result:
                coverage["unresolvedGames"] += 1
                continue
            coverage["reportedGames"] += 1
            a = player_decks.get(p1, {}).get(str(game.get("p1deck", "")))
            b = player_decks.get(p2, {}).get(str(game.get("p2deck", "")))
            if not a or not b:
                coverage["unattributedGames"] += 1
                continue  # Never assign a whole match to both registered decks.
            coverage["attributedGames"] += 1
            for own, opponent, field in zip((a, b), (b, a), game_result):
                decks[own][field] += 1
                key = (own, opponent)
                item = matchups.setdefault(key, {"deck": own, "opponent": opponent, "wins": 0, "losses": 0, "draws": 0})
                item[field] += 1

    coverage["entrants"] = len(seen_players)
    coverage["expectedDecks"] = len(seen_players) * 2
    fields = ("entrants", "registeredDecks", "expectedDecks", "completeLineups", "completedMatches", "matchesWithoutGames", "reportedGames", "attributedGames", "unattributedGames", "unresolvedGames")
    return {
        "id": str(details.get("id") or summary["id"]),
        "name": details.get("name") or summary.get("name") or summary["id"],
        "date": details.get("date") or summary.get("date"),
        "players": integer(details.get("players") or summary.get("players"), len(seen_players)),
        "multideck": True,
        "coverage": {field: coverage[field] for field in fields},
        "decks": sorted(decks.values(), key=lambda row: (-row["registrations"], row["id"])),
        "lineups": sorted(lineups.values(), key=lambda row: (-row["registrations"], row["id"])),
        "matchups": sorted(matchups.values(), key=lambda row: (row["deck"], row["opponent"])),
    }


def fetch_events(ids, data_dir=DATA):
    # Reuse validation/retries and the existing source collector's request pacing.
    from fetch_raw_data import BASE, get_json, validate_tournament
    for tid in dict.fromkeys(ids):
        details = get_json(f"{BASE}/tournaments/{tid}/details", "details", tid)
        valid, reason = validate_tournament(details, details)
        if not valid or details.get("multideck") is not True:
            raise ValueError(f"Unsupported dual-deck tournament {tid}: {reason}")
        standings = get_json(f"{BASE}/tournaments/{tid}/standings", "standings", tid)
        pairings = get_json(f"{BASE}/tournaments/{tid}/pairings", "pairings", tid)
        build_event(details, details, standings, pairings)  # Validate before replacing known-good sources.
        for name, payload in (("details", details), ("standings", standings), ("pairings", pairings)):
            write_json(data_dir / "raw" / tid / f"{name}.json", payload)
        phases = details.get("phases") or []
        first_phase = next((row for row in phases if row.get("phase") == 1), {})
        summary = {key: details.get(key) for key in ("id", "name", "date", "game", "format", "players")}
        summary.update(multideck=True, swiss=first_phase.get("mode"))
        merge_index([summary], data_dir / "multideck/tournaments.json")


def build_all(data_dir=DATA, min_players=64):
    index = read_index(data_dir / "multideck/tournaments.json")
    events, errors = [], []
    for summary in index:
        tid = str(summary.get("id") or "")
        if not tid or integer(summary.get("players")) < min_players:
            continue
        try:
            raw = data_dir / "raw" / tid
            event = build_event(summary, read_json(raw / "details.json"), read_json(raw / "standings.json"), read_json(raw / "pairings.json"))
            events.append(event)
        except (OSError, ValueError, TypeError) as error:
            errors.append({"id": tid, "message": str(error)})
    output = data_dir / "multideck/meta.json"
    if not events and errors and output.exists():
        raise RuntimeError("All multi-deck sources failed; preserved the previous dataset")
    # Preserve an event's previous derived statistics if only that source is temporarily unreadable.
    if errors and output.exists():
        prior = {row["id"]: row for row in read_json(output).get("tournaments", [])}
        events.extend(prior[row["id"]] for row in errors if row["id"] in prior and integer(prior[row["id"]].get("players")) >= min_players)
    events.sort(key=lambda row: (str(row.get("date") or ""), row["id"]), reverse=True)
    payload = {"version": 1, "generatedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"), "minPlayers": min_players, "source": "https://docs.limitlesstcg.com/developer/tournaments.html", "errors": errors, "tournaments": events}
    write_json(output, payload)
    print(f"Dual-deck data built: tournaments={len(events)}, source_errors={len(errors)}")
    return payload


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--fetch-id", action="append", default=[])
    parser.add_argument("--data-dir", type=Path, default=DATA)
    parser.add_argument("--min-players", type=int, default=integer(os.environ.get("MIN_PLAYERS"), 64))
    args = parser.parse_args()
    if args.fetch_id:
        fetch_events(args.fetch_id, args.data_dir)
    build_all(args.data_dir, args.min_players)


if __name__ == "__main__":
    main()
