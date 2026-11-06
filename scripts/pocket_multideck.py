"""Limitless Pocket multi-deck detection and source-index helpers.

See https://docs.limitlesstcg.com/developer/tournaments.html.
Keep these events out of the single-deck match/tier pipeline.
"""
import json
from pathlib import Path

MULTIDECK_INDEX = Path("web/public/data/multideck/tournaments.json")


def is_multideck(details=None, standings=None):
    if (details or {}).get("multideck") is True:
        return True
    if not isinstance(standings, list):
        return False
    return any(
        isinstance(row, dict)
        and any(isinstance(row.get(key), dict) and bool(row[key]) for key in ("decks", "decklists"))
        for row in standings
    )


def read_index(path=MULTIDECK_INDEX):
    path = Path(path)
    if not path.exists():
        return []
    rows = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(rows, list):
        raise ValueError(f"Expected a tournament array: {path}")
    return rows


def merge_index(rows, path=MULTIDECK_INDEX):
    path = Path(path)
    by_id = {str(row["id"]): row for row in read_index(path) if row.get("id")}
    for row in rows:
        if row.get("id"):
            by_id[str(row["id"])] = {**row, "multideck": True}
    merged = sorted(by_id.values(), key=lambda row: (str(row.get("date") or ""), str(row["id"])), reverse=True)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(merged, ensure_ascii=False, indent=2), encoding="utf-8")
    return merged


def standing_decks(row):
    """Match the API's numbered decks/decklists by slot, never dictionary order."""
    decks = row.get("decks") if isinstance(row.get("decks"), dict) else {}
    lists = row.get("decklists") if isinstance(row.get("decklists"), dict) else {}
    slots = sorted(set(decks) | set(lists), key=lambda key: (not str(key).isdigit(), str(key).zfill(6)))
    return [(str(slot), decks.get(slot) or {}, lists.get(slot)) for slot in slots]
