#!/usr/bin/env python3
"""
Build per-tournament page payloads from raw Limitless data.

Inputs
- web/public/data/tournaments.json
- web/public/data/raw/<tid>/details.json
- web/public/data/raw/<tid>/standings.json
- web/public/data/raw/<tid>/pairings.json

Outputs
- web/public/data/tournament-pages/<tid>.json
- web/public/data/tournament-pages/manifest.json   (only when building all)

Usage
- python scripts/build_tournament_pages.py
- python scripts/build_tournament_pages.py --id 681a33fed7ac342ba9050148
"""

import argparse
import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path


def find_project_root() -> Path:
    starts = [Path.cwd(), Path(__file__).resolve().parent]
    checked = set()

    for start in starts:
        start = start.resolve()
        for candidate in (start, *start.parents):
            if candidate in checked:
                continue
            checked.add(candidate)
            if (candidate / "web" / "public").exists():
                return candidate

    raise RuntimeError("找不到專案根目錄（缺少 web/public 目錄）")


ROOT = find_project_root()
DATA_DIR = ROOT / "web" / "public" / "data"
RAW_DIR = DATA_DIR / "raw"
TOURNAMENTS_FILE = DATA_DIR / "tournaments.json"
OUT_DIR = DATA_DIR / "tournament-pages"
MANIFEST_FILE = OUT_DIR / "manifest.json"


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def clean_str(value):
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def pick(*values):
    for value in values:
        if value is None:
            continue
        if isinstance(value, str) and value.strip() == "":
            continue
        return value
    return None


def to_int(value, default=None):
    try:
        if value is None or value == "":
            return default
        return int(value)
    except (TypeError, ValueError):
        return default


def iso_to_ms(iso_str):
    text = clean_str(iso_str)
    if not text:
        return None
    try:
        if text.endswith("Z"):
            text = text[:-1] + "+00:00"
        return int(datetime.fromisoformat(text).timestamp() * 1000)
    except Exception:
        return None


def load_json(path: Path, default=None):
    if not path.exists():
        return default, f"missing: {path.name}"

    try:
        with path.open("r", encoding="utf-8") as f:
            return json.load(f), None
    except Exception as e:
        return default, f"invalid json: {path.name}: {e}"


def write_json(path: Path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def round_sort_key(value):
    text = str(value)
    digits = "".join(ch for ch in text if ch.isdigit())
    if digits:
        return (0, int(digits), text.lower())
    return (1, 10**9, text.lower())


def normalize_record(record):
    record = record if isinstance(record, dict) else {}
    wins = to_int(record.get("wins"), 0)
    losses = to_int(record.get("losses"), 0)
    ties = to_int(record.get("ties"), 0)
    return {
        "wins": wins,
        "losses": losses,
        "ties": ties,
    }


def normalize_deck(deck):
    deck = deck if isinstance(deck, dict) else {}
    icons = deck.get("icons") if isinstance(deck.get("icons"), list) else []
    return {
        "id": clean_str(deck.get("id")),
        "name": clean_str(deck.get("name")),
        "icons": [str(x).strip() for x in icons if str(x).strip()],
    }


def normalize_card(section: str, row: dict):
    row = row if isinstance(row, dict) else {}
    set_code = clean_str(row.get("set"))
    number = clean_str(row.get("number"))
    name = clean_str(row.get("name"))
    count = to_int(row.get("count"), 0)

    number_padded = number.zfill(3) if number and number.isdigit() else number
    card_id = f"{set_code}-{number_padded}" if set_code and number_padded else None

    return {
        "section": section,
        "count": count,
        "set": set_code,
        "number": number,
        "numberPadded": number_padded,
        "cardId": card_id,
        "name": name,
    }


def normalize_decklist(decklist):
    if not isinstance(decklist, dict):
        return None

    pokemon = [
        normalize_card("pokemon", row)
        for row in (decklist.get("pokemon") or [])
        if isinstance(row, dict)
    ]
    trainer = [
        normalize_card("trainer", row)
        for row in (decklist.get("trainer") or [])
        if isinstance(row, dict)
    ]
    energy = [
        str(x).strip()
        for x in (decklist.get("energy") or [])
        if str(x).strip()
    ]

    cards = pokemon + trainer
    pokemon_count = sum(card["count"] for card in pokemon)
    trainer_count = sum(card["count"] for card in trainer)

    return {
        "pokemon": pokemon,
        "trainer": trainer,
        "energy": energy,
        "cards": cards,
        "pokemonCount": pokemon_count,
        "trainerCount": trainer_count,
        "totalCards": pokemon_count + trainer_count,
        "uniqueCards": len(cards),
    }


def normalize_entry(row, source_index: int):
    row = row if isinstance(row, dict) else {}

    placing = pick(
        to_int(row.get("placing"), None),
        to_int(row.get("place"), None),
        to_int(row.get("rank"), None),
    )
    country = clean_str(row.get("country"))
    country = country.upper() if country else None

    deck = normalize_deck(row.get("deck"))
    decklist = normalize_decklist(row.get("decklist"))
    record = normalize_record(row.get("record"))

    entry = {
        "placing": placing,
        "name": clean_str(row.get("name")) or clean_str(row.get("player")),
        "player": clean_str(row.get("player")),
        "country": country,
        "record": record,
        "recordText": f"{record['wins']}-{record['losses']}-{record['ties']}",
        "drop": to_int(row.get("drop"), None),
        "deck": deck,
        "decklistAvailable": decklist is not None,
        "decklist": decklist,
        "_sourceIndex": source_index,
    }
    return entry


def sort_entries(entries):
    sorted_entries = sorted(
        entries,
        key=lambda item: (
            item["placing"] is None,
            item["placing"] if item["placing"] is not None else 10**9,
            -(item["record"]["wins"] or 0),
            item["record"]["losses"] or 0,
            item["name"] or "",
            item["_sourceIndex"],
        ),
    )

    for item in sorted_entries:
        item.pop("_sourceIndex", None)

    return sorted_entries


def compute_countries(entries):
    total = len(entries)
    counter = Counter()

    for entry in entries:
        key = entry["country"] or "UNKNOWN"
        counter[key] += 1

    items = []
    for code, count in counter.items():
        items.append({
            "country": None if code == "UNKNOWN" else code,
            "label": "Unknown" if code == "UNKNOWN" else code,
            "count": count,
            "share": round(count / total, 6) if total else 0,
            "sharePct": round(count * 100 / total, 2) if total else 0,
        })

    items.sort(key=lambda item: (-item["count"], item["label"]))
    return items


def compute_archetypes(entries):
    total = len(entries)
    groups = {}

    for entry in entries:
        deck = entry.get("deck") or {}
        deck_id = clean_str(deck.get("id"))
        deck_name = clean_str(deck.get("name"))
        key = deck_id or deck_name or "__unknown__"

        if key not in groups:
            groups[key] = {
                "id": deck_id,
                "name": deck_name or deck_id or "Unknown",
                "icons": deck.get("icons") or [],
                "count": 0,
                "bestPlacing": None,
                "top8": 0,
                "top16": 0,
                "top32": 0,
                "decklists": 0,
                "featuredPlayers": [],
            }

        group = groups[key]
        group["count"] += 1

        if entry.get("decklistAvailable"):
            group["decklists"] += 1

        placing = entry.get("placing")
        if placing is not None:
            if group["bestPlacing"] is None or placing < group["bestPlacing"]:
                group["bestPlacing"] = placing
            if placing <= 8:
                group["top8"] += 1
            if placing <= 16:
                group["top16"] += 1
            if placing <= 32:
                group["top32"] += 1

        group["featuredPlayers"].append({
            "name": entry.get("name"),
            "player": entry.get("player"),
            "country": entry.get("country"),
            "placing": placing,
        })

    items = []
    for group in groups.values():
        group["share"] = round(group["count"] / total, 6) if total else 0
        group["sharePct"] = round(group["count"] * 100 / total, 2) if total else 0
        group["featuredPlayers"] = sorted(
            group["featuredPlayers"],
            key=lambda item: (
                item["placing"] is None,
                item["placing"] if item["placing"] is not None else 10**9,
                item["name"] or "",
            ),
        )[:5]
        items.append(group)

    items.sort(
        key=lambda item: (
            -item["count"],
            item["bestPlacing"] if item["bestPlacing"] is not None else 10**9,
            item["name"] or "",
        )
    )

    for idx, item in enumerate(items, start=1):
        item["rank"] = idx

    return items


def compute_card_usage(entries):
    total_decklists = sum(1 for entry in entries if entry.get("decklistAvailable"))
    cards = {}

    for entry in entries:
        decklist = entry.get("decklist")
        if not decklist:
            continue

        seen_in_deck = set()
        for card in decklist.get("cards", []):
            card_key = card.get("cardId") or f"{card.get('section')}::{card.get('set')}::{card.get('number')}::{card.get('name')}"
            if card_key not in cards:
                cards[card_key] = {
                    "cardId": card.get("cardId"),
                    "set": card.get("set"),
                    "number": card.get("number"),
                    "numberPadded": card.get("numberPadded"),
                    "name": card.get("name"),
                    "section": card.get("section"),
                    "copies": 0,
                    "decks": 0,
                }

            cards[card_key]["copies"] += card.get("count") or 0

            if card_key not in seen_in_deck:
                cards[card_key]["decks"] += 1
                seen_in_deck.add(card_key)

    items = list(cards.values())
    for item in items:
        item["share"] = round(item["decks"] / total_decklists, 6) if total_decklists else 0
        item["sharePct"] = round(item["decks"] * 100 / total_decklists, 2) if total_decklists else 0

    items.sort(
        key=lambda item: (
            -item["decks"],
            -item["copies"],
            item["name"] or "",
            item["cardId"] or "",
        )
    )
    return items


def compute_energy_usage(entries):
    counter = Counter()
    total_decklists = 0

    for entry in entries:
        decklist = entry.get("decklist")
        if not decklist:
            continue

        energies = sorted({str(x).strip() for x in (decklist.get("energy") or []) if str(x).strip()})
        if not energies:
            continue

        total_decklists += 1
        for energy in energies:
            counter[energy] += 1

    items = []
    for energy, count in counter.items():
        items.append({
            "energy": energy,
            "decks": count,
            "share": round(count / total_decklists, 6) if total_decklists else 0,
            "sharePct": round(count * 100 / total_decklists, 2) if total_decklists else 0,
        })

    items.sort(key=lambda item: (-item["decks"], item["energy"]))
    return items


def summarize_pairings(pairings):
    summary = {
        "available": pairings is not None,
        "kind": type(pairings).__name__ if pairings is not None else None,
        "rounds": 0,
        "matches": 0,
        "roundBreakdown": [],
    }

    if pairings is None:
        return summary

    if isinstance(pairings, dict):
        if isinstance(pairings.get("rounds"), list):
            breakdown = []
            total_matches = 0

            for idx, round_item in enumerate(pairings["rounds"], start=1):
                label = idx
                matches_count = 0

                if isinstance(round_item, dict):
                    label = pick(
                        round_item.get("name"),
                        round_item.get("round"),
                        round_item.get("roundNumber"),
                        idx,
                    )
                    matches = pick(
                        round_item.get("pairings"),
                        round_item.get("matches"),
                        round_item.get("results"),
                        round_item.get("tables"),
                    )
                    if isinstance(matches, list):
                        matches_count = len(matches)
                elif isinstance(round_item, list):
                    matches_count = len(round_item)

                breakdown.append({
                    "round": label,
                    "matches": matches_count,
                })
                total_matches += matches_count

            summary["rounds"] = len(breakdown)
            summary["matches"] = total_matches
            summary["roundBreakdown"] = breakdown
            return summary

        if isinstance(pairings.get("pairings"), list):
            pairings = pairings["pairings"]
        else:
            return summary

    if isinstance(pairings, list):
        summary["matches"] = len(pairings)
        round_counter = Counter()

        for item in pairings:
            if not isinstance(item, dict):
                continue

            label = pick(
                item.get("roundName"),
                item.get("round"),
                item.get("roundNumber"),
                item.get("stage"),
            )
            if label is not None:
                round_counter[str(label)] += 1

        if round_counter:
            summary["rounds"] = len(round_counter)
            summary["roundBreakdown"] = [
                {"round": label, "matches": count}
                for label, count in sorted(round_counter.items(), key=lambda kv: round_sort_key(kv[0]))
            ]

        return summary

    return summary


def cleanup_orphan_pages(active_ids):
    if not OUT_DIR.exists():
        return 0

    removed = 0
    active_ids = set(active_ids)

    for path in OUT_DIR.glob("*.json"):
        if path.name == MANIFEST_FILE.name:
            continue
        if path.stem not in active_ids:
            path.unlink(missing_ok=True)
            removed += 1

    return removed


def build_page(index_row):
    index_row = index_row if isinstance(index_row, dict) else {}
    tid = clean_str(index_row.get("id"))
    if not tid:
        raise ValueError("tournament id is required")

    errors = []

    details_path = RAW_DIR / tid / "details.json"
    standings_path = RAW_DIR / tid / "standings.json"
    pairings_path = RAW_DIR / tid / "pairings.json"

    details_raw, details_err = load_json(details_path, default={})
    standings_raw, standings_err = load_json(standings_path, default=[])
    pairings_raw, pairings_err = load_json(pairings_path, default=None)

    if details_err:
        errors.append(details_err)
    if standings_err:
        errors.append(standings_err)
    if pairings_err:
        errors.append(pairings_err)

    if not isinstance(details_raw, dict):
        errors.append("details.json is not an object")
        details_raw = {}

    if not isinstance(standings_raw, list):
        errors.append("standings.json is not an array")
        standings_raw = []

    normalized_entries = [
        normalize_entry(row, idx)
        for idx, row in enumerate(standings_raw)
        if isinstance(row, dict)
    ]
    standings = sort_entries(normalized_entries)

    pairings_summary = summarize_pairings(pairings_raw)

    entrants = len(standings)
    players_with_country = sum(1 for entry in standings if entry.get("country"))
    players_with_deck = sum(
        1
        for entry in standings
        if (entry.get("deck") or {}).get("id") or (entry.get("deck") or {}).get("name")
    )
    players_with_decklist = sum(1 for entry in standings if entry.get("decklistAvailable"))
    players_dropped = sum(1 for entry in standings if entry.get("drop") is not None)

    date_value = pick(details_raw.get("date"), index_row.get("date"))
    players_value = to_int(pick(details_raw.get("players"), index_row.get("players")), None)
    if players_value is None and entrants:
        players_value = entrants

    tournament = {
        "id": tid,
        "name": pick(details_raw.get("name"), index_row.get("name"), tid),
        "date": date_value,
        "dateMs": iso_to_ms(date_value),
        "players": players_value,
        "game": pick(details_raw.get("game"), index_row.get("game")),
        "format": pick(details_raw.get("format"), index_row.get("format")),
        "status": pick(details_raw.get("status"), index_row.get("status")),
        "swiss": pick(details_raw.get("swiss"), index_row.get("swiss")),
        "topCut": pick(details_raw.get("topCut"), index_row.get("topCut")),
        "set": pick(index_row.get("set"), details_raw.get("set")),
        "setNameZh": pick(index_row.get("setNameZh"), details_raw.get("setNameZh")),
        "setNameEn": pick(index_row.get("setNameEn"), details_raw.get("setNameEn")),
        "formatUi": pick(index_row.get("formatUi"), details_raw.get("formatUi")),
        "decklists": pick(details_raw.get("decklists"), index_row.get("decklists")),
        "pagePath": f"/data/tournament-pages/{tid}.json",
        "rawPaths": {
            "details": f"/data/raw/{tid}/details.json",
            "standings": f"/data/raw/{tid}/standings.json",
            "pairings": f"/data/raw/{tid}/pairings.json",
        },
        "url": f"https://play.limitlesstcg.com/tournament/{tid}",
        "standingsUrl": f"https://play.limitlesstcg.com/tournament/{tid}/standings",
    }

    summary = {
        "entrants": entrants,
        "playersWithCountry": players_with_country,
        "playersWithDeck": players_with_deck,
        "playersWithDecklist": players_with_decklist,
        "playersDropped": players_dropped,
        "uniqueCountries": len({entry.get("country") or "UNKNOWN" for entry in standings}),
        "uniqueArchetypes": len({
            (entry.get("deck") or {}).get("id") or (entry.get("deck") or {}).get("name") or "__unknown__"
            for entry in standings
        }),
        "pairingsRounds": pairings_summary["rounds"],
        "pairingsMatches": pairings_summary["matches"],
        "top8Decklists": sum(1 for entry in standings[:8] if entry.get("decklistAvailable")),
        "top32Decklists": sum(1 for entry in standings[:32] if entry.get("decklistAvailable")),
    }

    page = {
        "meta": {
            "generatedAt": now_iso(),
            "script": "build_tournament_pages.py",
            "version": 1,
            "errors": errors,
        },
        "tournament": tournament,
        "summary": summary,
        "featured": {
            "winner": standings[0] if standings else None,
            "top8": standings[:8],
            "top16": standings[:16],
            "top32": standings[:32],
        },
        "archetypes": compute_archetypes(standings),
        "top32Archetypes": compute_archetypes(standings[:32]),
        "countries": compute_countries(standings),
        "cardUsage": compute_card_usage(standings),
        "energyUsage": compute_energy_usage(standings),
        "pairingsSummary": pairings_summary,
        "standings": standings,
        "source": {
            "index": index_row,
            "details": details_raw,
        },
    }

    return page


def load_tournament_rows(selected_ids=None):
    tournaments_raw, tournaments_err = load_json(TOURNAMENTS_FILE, default=[])
    if tournaments_err and not selected_ids:
        raise RuntimeError(f"讀取 tournaments.json 失敗: {tournaments_err}")

    tournaments_raw = tournaments_raw if isinstance(tournaments_raw, list) else []
    rows = [
        row for row in tournaments_raw
        if isinstance(row, dict) and clean_str(row.get("id"))
    ]

    if not selected_ids:
        return rows

    by_id = {clean_str(row.get("id")): row for row in rows}
    selected_rows = []
    seen = set()

    for raw_tid in selected_ids:
        tid = clean_str(raw_tid)
        if not tid or tid in seen:
            continue
        seen.add(tid)
        selected_rows.append(by_id.get(tid, {"id": tid}))

    return selected_rows


def build_all(selected_ids=None, clean=True):
    rows = load_tournament_rows(selected_ids=selected_ids)
    if not rows:
        print("沒有可建置的賽事")
        return

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    manifest_items = []
    active_ids = []
    built = 0

    for row in rows:
        tid = clean_str(row.get("id"))
        if not tid:
            continue

        page = build_page(row)
        out_path = OUT_DIR / f"{tid}.json"
        write_json(out_path, page)

        active_ids.append(tid)
        built += 1

        manifest_items.append({
            "id": page["tournament"]["id"],
            "name": page["tournament"]["name"],
            "date": page["tournament"]["date"],
            "players": page["tournament"]["players"],
            "pagePath": page["tournament"]["pagePath"],
            "hasErrors": bool(page["meta"]["errors"]),
            "errorCount": len(page["meta"]["errors"]),
        })

        print(f"✅ built: {tid}")

    removed = 0
    if clean and not selected_ids:
        removed = cleanup_orphan_pages(active_ids)

    if not selected_ids:
        write_json(
            MANIFEST_FILE,
            {
                "generatedAt": now_iso(),
                "count": len(manifest_items),
                "removedOrphans": removed,
                "items": manifest_items,
            },
        )

    print(f"done: built={built}, removed_orphans={removed}")


def parse_args():
    parser = argparse.ArgumentParser(description="Build tournament page JSON from raw tournament data")
    parser.add_argument(
        "--id",
        dest="ids",
        action="append",
        default=[],
        help="只建置指定 tournament id，可重複使用多次",
    )
    parser.add_argument(
        "--no-clean",
        action="store_true",
        help="建全部時不要清理多餘的 page json",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    build_all(selected_ids=args.ids or None, clean=not args.no_clean)


if __name__ == "__main__":
    main()