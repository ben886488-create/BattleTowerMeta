import datetime as dt
import json
import math
import os
import re
from pathlib import Path
from urllib.parse import quote


DATA_DIR = Path("web/public/data")
RAW_DIR = DATA_DIR / "raw"
OUT_DIR = DATA_DIR / "precomputed"
DECK_PROFILE_DIR = OUT_DIR / "deck_profiles"
CARD_CATALOG_PATH = Path("web/src/assets/limitless_dump/limitless_cards.json")

DAY_MS = 24 * 60 * 60 * 1000
TOP_CUTS = ["all", "64", "32", "16", "8", "4", "2", "1"]
PROFILE_DECK_LIMIT = int(os.environ.get("PROFILE_DECK_LIMIT", "40"))
MIN_SLOT_RATE_PCT = 10
EXPORT_MATCHUP_TIERS = {"SSS", "SS", "S", "A", "B", "C"}
MATRIX_DISPLAY_DECK_LIMIT = 10
TIER_SCORE_WEIGHTS = {
    "top32": 0.34,
    "weightedPoints": 0.425,
    "top32Share": 0.085,
    "emaTrend": 0.15,
}
EMA_HALF_LIFE_DAYS = float(os.environ.get("TIER_EMA_HALF_LIFE_DAYS", "7"))

CARD_CATALOG_BY_CODE = {}
CARD_CATALOG_BY_NAME = {}

VERSION_MARKERS = [
    ("A1", "Genetic Apex", (2024, 10, 30)),
    ("A1a", "Mythical Island", (2024, 12, 17)),
    ("A2", "Space-Time Smackdown", (2025, 1, 29)),
    ("A2a", "Triumphant Light", (2025, 2, 28)),
    ("A2b", "Shining Revelry", (2025, 3, 27)),
    ("A3", "Celestial Guardians", (2025, 4, 30)),
    ("A3a", "Extradimensional Crisis", (2025, 5, 29)),
    ("A3b", "Eevee Grove", (2025, 6, 26)),
    ("A4", "Wisdom of Sea and Sky", (2025, 7, 30)),
    ("A4a", "Secluded Springs", (2025, 8, 28)),
    ("A4b", "Deluxe Pack: ex", (2025, 9, 30)),
    ("B1", "Mega Rising", (2025, 10, 30)),
    ("B1a", "Crimson Blaze", (2025, 12, 17)),
    ("B2", "Fantastical Parade", (2026, 1, 29)),
    ("B2a", "Paldean Wonders", (2026, 2, 26)),
    ("B2b", "Mega Shine", (2026, 3, 25)),
    ("B3", "Pulsing Aura", (2026, 4, 28)),
    ("B3a", "Paradox Drive", (2026, 5, 28)),
    ("B3b", "Everyday Wonders", (2026, 6, 30)),
]


def utc_ms(year, month, day):
    value = dt.datetime(year, month, day, tzinfo=dt.timezone.utc)
    return int(value.timestamp() * 1000)


VERSION_WINDOWS = []
for index, (code, name, date_parts) in enumerate(VERSION_MARKERS):
    start_ms = utc_ms(*date_parts)
    next_parts = VERSION_MARKERS[index + 1][2] if index + 1 < len(VERSION_MARKERS) else None
    end_ms = utc_ms(*next_parts) if next_parts else math.inf
    VERSION_WINDOWS.append(
        {
            "code": code,
            "name": name,
            "startMs": start_ms,
            "endMs": end_ms,
            "label": f"{code} - {name}",
        }
    )


GENERATED_AT = dt.datetime.now(dt.timezone.utc)
GENERATED_AT_MS = int(GENERATED_AT.timestamp() * 1000)


def read_json(path):
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def write_json(path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False, separators=(",", ":"))


def parse_ms(value):
    if isinstance(value, (int, float)) and math.isfinite(value):
        return int(value if value > 1_000_000_000_000 else value * 1000)
    text = str(value or "").strip()
    if not text:
        return 0
    if text.isdigit():
        raw = int(text)
        return raw if raw > 1_000_000_000_000 else raw * 1000
    try:
        parsed = dt.datetime.fromisoformat(text.replace("Z", "+00:00"))
    except ValueError:
        return 0
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=dt.timezone.utc)
    return int(parsed.timestamp() * 1000)


def infer_version(ms):
    hit = None
    for version in VERSION_WINDOWS:
        if ms >= version["startMs"]:
            hit = version
        else:
            break
    return hit


def clean_text(value):
    return re.sub(r"\s+", " ", str(value or "").replace("\u00a0", " ")).strip()


def slugify(value):
    text = clean_text(value).lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")


def normalize_entity_key(value):
    text = clean_text(value).lower().replace("_", "-").replace("/", "-")
    text = re.sub(r"['’`]", "", text)
    text = re.sub(r"[^a-z0-9\-\s]+", "", text)
    text = re.sub(r"[\s-]+", "-", text)
    return text.strip("-")


def to_number(value):
    if isinstance(value, (int, float)) and math.isfinite(value):
        return value
    text = clean_text(value).replace(",", "")
    if not text:
        return None
    try:
        num = float(text)
    except ValueError:
        return None
    return num if math.isfinite(num) else None


def get_place(row):
    for key in ("placing", "place", "rank", "position", "standing"):
        num = to_number(row.get(key))
        if num is not None and num > 0:
            return int(num)
    return None


def points_for_place(place):
    if place is None:
        return 0
    if place == 1:
        return 10
    if place == 2:
        return 8
    if 3 <= place <= 4:
        return 6
    if 5 <= place <= 8:
        return 4
    if 9 <= place <= 16:
        return 2
    if 17 <= place <= 32:
        return 1
    return 0


def qualifies_by_top_cut(place, top_cut):
    if top_cut == "all":
        return True
    if place is None:
        return False
    return place <= int(top_cut)


def normalize_string_list(value):
    if value is None:
        items = []
    elif isinstance(value, list):
        items = value
    else:
        items = [value]

    out = []
    seen = set()
    for item in items:
        if isinstance(item, dict):
            text = clean_text(item.get("src") or item.get("url") or item.get("path") or item.get("name"))
        else:
            text = clean_text(item)
        if text and text not in seen:
            seen.add(text)
            out.append(text)
    return out


def invalid_deck_token(value):
    text = clean_text(value).lower()
    return not text or text in {"unknown", "undefined", "null", "none", "nan"}


def humanize_deck_id(deck_id):
    words = []
    for part in str(deck_id or "").split("-"):
        if not part:
            continue
        lower = part.lower()
        if re.match(r"^[ab]\d+[a-z]?$", lower):
            words.append(part.upper())
        elif lower == "ex":
            words.append("ex")
        elif lower in {"gx", "vmax", "vstar"}:
            words.append(lower.upper())
        elif lower == "mega":
            words.append("Mega")
        else:
            words.append(part[:1].upper() + part[1:])
    return " ".join(words)


def parse_two_from_deck_id(deck_id):
    tokens = [token for token in str(deck_id or "").lower().split("-") if token]
    mons = []
    current = []
    for token in tokens:
        if re.match(r"^[ab]\d+[a-z]?$", token):
            if current:
                mons.append("-".join(current))
            current = []
        else:
            current.append(token)
    if current:
        mons.append("-".join(current))
    return mons[:2]


def parse_two_from_deck_name(deck_name):
    text = clean_text(deck_name)
    if not text:
        return []
    hits = [match.end() for match in re.finditer(r"\bex\b", text, re.I)]
    if len(hits) < 2:
        return [text]
    return [text[: hits[0]].strip(), text[hits[0] : hits[1]].strip()]


def extract_deck_icon_keys(row):
    deck = row.get("deck") if isinstance(row.get("deck"), dict) else {}
    direct = normalize_string_list(
        deck.get("icons")
        or deck.get("icon")
        or deck.get("pokemon")
        or deck.get("pokemons")
        or deck.get("iconKeys")
        or row.get("deckIconKeys")
    )
    if direct:
        return direct[:2]

    paired = normalize_string_list(
        [
            deck.get("primaryIconKey")
            or deck.get("mainIconKey")
            or row.get("deckIconKeyMain")
            or row.get("primaryIconKey")
            or row.get("mainIconKey")
            or deck.get("mainPokemon")
            or deck.get("main"),
            deck.get("secondaryIconKey")
            or deck.get("subIconKey")
            or row.get("deckIconKeySub")
            or row.get("secondaryIconKey")
            or row.get("subIconKey")
            or deck.get("subPokemon")
            or deck.get("sub"),
        ]
    )
    if paired:
        return paired[:2]

    from_id = parse_two_from_deck_id(deck.get("id"))
    if from_id:
        return from_id[:2]
    return parse_two_from_deck_name(deck.get("name") or deck.get("archetype") or row.get("archetype"))[:2]


def build_deck_identity(row):
    deck = row.get("deck") if isinstance(row.get("deck"), dict) else {}
    raw_name = clean_text(deck.get("name") or deck.get("archetype") or row.get("archetype"))
    raw_id = clean_text(deck.get("id"))
    icon_keys = extract_deck_icon_keys(row)
    key = raw_id or slugify(raw_name) or slugify("-".join(icon_keys))
    if invalid_deck_token(key):
        return None
    return {
        "key": key,
        "normKey": normalize_entity_key(key),
        "rawName": raw_name or humanize_deck_id(key),
        "iconKeys": icon_keys,
    }


def extract_player_name(row):
    player = row.get("player")
    if isinstance(player, str):
        return clean_text(player)
    if isinstance(player, dict):
        for key in ("name", "displayName", "username"):
            hit = clean_text(player.get(key))
            if hit:
                return hit
    for key in ("name", "playerName", "player_name", "displayName", "username"):
        hit = clean_text(row.get(key))
        if hit:
            return hit
    return ""


def extract_player_slug(row):
    for key in ("playerSlug", "player_slug", "username", "userName"):
        hit = clean_text(row.get(key))
        if hit:
            return hit.lower()
    player = extract_player_name(row)
    return player.lower().lstrip("@").replace(" ", "")


def build_standing_lookup(standings):
    lookup = {}
    for row in standings:
        identity = build_deck_identity(row)
        player = extract_player_name(row)
        if not identity or not player:
            continue
        entry = {"row": row, "player": player, "place": get_place(row), "deck": identity}
        keys = [
            player,
            extract_player_slug(row),
            row.get("id"),
            row.get("playerId"),
            row.get("player_id"),
        ]
        for key in keys:
            norm = normalize_entity_key(key)
            if norm:
                lookup[norm] = entry
    return lookup


def pairing_side_source(row, side):
    index = 0 if side == 1 else 1
    if isinstance(row.get("players"), list) and len(row["players"]) > index:
        return row["players"][index]
    if isinstance(row.get("pairing"), dict):
        players = row["pairing"].get("players")
        if isinstance(players, list) and len(players) > index:
            return players[index]
    return row.get("p1" if side == 1 else "p2") or row.get("player1" if side == 1 else "player2")


def participant_name(value):
    if isinstance(value, str):
        return clean_text(value)
    if isinstance(value, dict):
        for key in ("name", "player", "displayName", "username"):
            hit = clean_text(value.get(key))
            if hit:
                return hit
    return ""


def participant_slug(value):
    if isinstance(value, dict):
        for key in ("slug", "username", "id"):
            hit = clean_text(value.get(key))
            if hit:
                return hit.lower()
    return ""


def lookup_pairing_side(lookup, row, side):
    source = pairing_side_source(row, side)
    keys = [
        participant_name(source),
        participant_slug(source),
        source.get("id") if isinstance(source, dict) else None,
        row.get("player1Id" if side == 1 else "player2Id"),
        row.get("player_1_id" if side == 1 else "player_2_id"),
        row.get("p1Id" if side == 1 else "p2Id"),
    ]
    for key in keys:
        hit = lookup.get(normalize_entity_key(key))
        if hit:
            return hit
    return None


def compare_numeric_result(a, b):
    if a == b:
        return 0.5, 0.5
    return (1, 0) if a > b else (0, 1)


def parse_pairing_result(row, p1_name="", p2_name=""):
    winner = row.get("winner")
    if winner == -1 or winner == "-1":
        return None
    if winner == 0 or winner == "0":
        return 0.5, 0.5

    for left_key, right_key in (
        ("p1Points", "p2Points"),
        ("player1Points", "player2Points"),
        ("leftPoints", "rightPoints"),
        ("homeScore", "awayScore"),
        ("wins1", "wins2"),
        ("player1Wins", "player2Wins"),
    ):
        left = to_number(row.get(left_key))
        right = to_number(row.get(right_key))
        if left is not None and right is not None:
            return compare_numeric_result(left, right)

    text_candidates = [
        row.get("winner"),
        row.get("winnerName"),
        (row.get("result") or {}).get("winner") if isinstance(row.get("result"), dict) else None,
        (row.get("result") or {}).get("winnerName") if isinstance(row.get("result"), dict) else None,
    ]

    for candidate in text_candidates:
        text = clean_text(candidate)
        if not text:
            continue
        if re.search(r"draw|tie", text, re.I):
            return 0.5, 0.5
        if re.match(r"^(1|p1|player1|left|home)$", text, re.I):
            return 1, 0
        if re.match(r"^(2|p2|player2|right|away)$", text, re.I):
            return 0, 1
        key = normalize_entity_key(text)
        if p1_name and key == normalize_entity_key(p1_name):
            return 1, 0
        if p2_name and key == normalize_entity_key(p2_name):
            return 0, 1
    return None


def map_number_record(data, fn):
    return {key: fn(value) for key, value in data.items()}


def minmax_scale(data):
    if not data:
        return {}
    values = list(data.values())
    min_value = min(values)
    max_value = max(values)
    if max_value == min_value:
        fill = 1 if len(values) == 1 else 0
        return {key: fill for key in data}
    return {key: (value - min_value) / (max_value - min_value) for key, value in data.items()}


def calculate_tier_score(top32_score, weighted_score, share_score, ema_score):
    return (
        TIER_SCORE_WEIGHTS["top32"] * top32_score
        + TIER_SCORE_WEIGHTS["weightedPoints"] * weighted_score
        + TIER_SCORE_WEIGHTS["top32Share"] * share_score
        + TIER_SCORE_WEIGHTS["emaTrend"] * ema_score
    )


def build_daily_ema_signal(top32_count, weighted_points, top32_share_pct):
    return (
        0.4 * math.log1p(max(0.0, float(top32_count or 0)))
        + 0.5 * math.log1p(max(0.0, float(weighted_points or 0)))
        + 0.1 * math.log1p(max(0.0, float(top32_share_pct or 0)))
    )


def build_ema_scores(daily_top32_counts, daily_weighted_points, daily_top32_slots, deck_keys):
    keys = [key for key in deck_keys if key]
    ema = {key: 0.0 for key in keys}
    days = sorted(set(daily_top32_counts.keys()) | set(daily_weighted_points.keys()))
    if not keys or not days:
        return ema

    half_life_days = EMA_HALF_LIFE_DAYS if math.isfinite(EMA_HALF_LIFE_DAYS) and EMA_HALF_LIFE_DAYS > 0 else 7.0
    previous_day = None

    for day in days:
        if previous_day is None:
            alpha = 1.0
        else:
            delta_days = max(1, (day - previous_day) / DAY_MS)
            alpha = 1 - math.pow(0.5, delta_days / half_life_days)

        count_map = daily_top32_counts.get(day, {})
        points_map = daily_weighted_points.get(day, {})
        total_slots = daily_top32_slots.get(day, 0.0)

        for deck in keys:
            top32_count = count_map.get(deck, 0.0)
            weighted_points = points_map.get(deck, 0.0)
            share_pct = (top32_count / total_slots) * 100 if total_slots > 0 else 0.0
            signal = build_daily_ema_signal(top32_count, weighted_points, share_pct)
            ema[deck] = signal if previous_day is None else alpha * signal + (1 - alpha) * ema[deck]

        previous_day = day

    return ema


def tournament_day_ms(tournament):
    start_ms = tournament.get("startMs")
    if not start_ms:
        return None
    return start_of_utc_day_ms(start_ms)


def resolve_deck_tier(score, next_score_gap, is_leader=False):
    safe_score = score if math.isfinite(score) else 0
    safe_gap = next_score_gap if math.isfinite(next_score_gap) else 0
    if safe_score <= 0.1:
        return "F"
    if safe_score <= 0.3:
        return "E"
    if safe_score <= 0.5:
        return "D"
    if safe_score <= 0.7:
        return "C"
    if safe_score <= 0.8:
        return "B"
    if safe_score <= 0.9:
        return "A"
    if not is_leader:
        return "S"
    if safe_gap > 0.1:
        return "SSS"
    if safe_gap > 0.05:
        return "SS"
    return "S"


def in_time_range(tournament, time_value):
    start_ms = tournament["startMs"]
    if time_value == "all":
        return True
    if time_value == "past7":
        return start_ms >= GENERATED_AT_MS - 7 * DAY_MS
    if time_value == "prev7":
        return GENERATED_AT_MS - 14 * DAY_MS <= start_ms < GENERATED_AT_MS - 7 * DAY_MS
    if time_value == "past4w":
        return start_ms >= GENERATED_AT_MS - 28 * DAY_MS
    if str(time_value).startswith("month:"):
        ym = str(time_value)[len("month:") :]
        try:
            year, month = [int(part) for part in ym.split("-")]
        except ValueError:
            return True
        start = utc_ms(year, month, 1)
        end_month = month + 1
        end_year = year
        if end_month == 13:
            end_month = 1
            end_year += 1
        end = utc_ms(end_year, end_month, 1)
        return start <= start_ms < end
    return True


def start_of_utc_day_ms(ms):
    value = dt.datetime.fromtimestamp(ms / 1000, tz=dt.timezone.utc)
    start = dt.datetime(value.year, value.month, value.day, tzinfo=dt.timezone.utc)
    return int(start.timestamp() * 1000)


def matches_set_scope(tournament, set_value):
    if not set_value:
        return True
    current = infer_version(GENERATED_AT_MS)
    if set_value in {"__current_7__", "__current_14__"} and current:
        days = 7 if set_value == "__current_7__" else 14
        today_start = start_of_utc_day_ms(GENERATED_AT_MS)
        rolling_start = today_start - (days - 1) * DAY_MS
        effective_start = max(rolling_start, current["startMs"])
        return (
            tournament["versionCode"] == current["code"]
            and tournament["startMs"] >= effective_start
            and tournament["startMs"] < current["endMs"]
        )
    return tournament["versionCode"] == set_value


def scope_key(time_value, set_value, top_cut, min_players=None):
    min_text = "" if min_players is None else str(min_players)
    return f"time={time_value}|set={set_value or ''}|topCut={top_cut}|minPlayers={min_text}"


def profile_scope_key(set_value, time_value, top_cut, min_players=None):
    min_text = "" if min_players is None else str(min_players)
    return f"set={set_value or ''}|time={time_value}|topCut={top_cut}|minPlayers={min_text}"


def filter_tournaments(tournaments, time_value, set_value="", min_players=None):
    output = []
    for tournament in tournaments:
        if min_players is not None and (tournament.get("players") or 0) < min_players:
            continue
        if not in_time_range(tournament, time_value):
            continue
        if not matches_set_scope(tournament, set_value):
            continue
        output.append(tournament)
    return output


def build_top_decks_scope(tournaments, top_cut, extra_matchup_keys=None):
    deck_map = {}
    pair_map = {}
    daily_top32_counts = {}
    daily_weighted_points = {}
    daily_top32_slots = {}
    total_all_samples = 0
    total_baseline_top32_samples = 0
    total_selected_samples = 0

    def add_pair(deck_a, deck_b, points):
        if not deck_a or not deck_b or deck_a == deck_b:
            return
        key = (deck_a, deck_b)
        rec = pair_map.get(key)
        if not rec:
            rec = {"wins": 0, "losses": 0, "ties": 0}
            pair_map[key] = rec
        if points == 1:
            rec["wins"] += 1
        elif points == 0:
            rec["losses"] += 1
        else:
            rec["ties"] += 1

    for tournament in tournaments:
        standings = tournament["standings"]
        pairings = tournament["pairings"]
        day_ms = tournament_day_ms(tournament)

        for row in standings:
            place = get_place(row)
            if not qualifies_by_top_cut(place, top_cut):
                continue

            deck = build_deck_identity(row)
            if not deck:
                continue

            hit = deck_map.get(deck["key"])
            if not hit:
                hit = {
                    "key": deck["key"],
                    "rawName": deck["rawName"],
                    "iconKeys": deck["iconKeys"],
                    "allSamples": 0,
                    "baselineTop32Samples": 0,
                    "weightedPoints": 0,
                    "selectedSamples": 0,
                    "selectedMatchPoints": 0,
                    "selectedGames": 0,
                }
                deck_map[deck["key"]] = hit
            else:
                if deck["rawName"] and (
                    hit["rawName"] == humanize_deck_id(hit["key"])
                    or len(deck["rawName"]) > len(hit["rawName"])
                ):
                    hit["rawName"] = deck["rawName"]
                if len([key for key in deck["iconKeys"] if key]) > len(
                    [key for key in hit["iconKeys"] if key]
                ):
                    hit["iconKeys"] = deck["iconKeys"]

            hit["allSamples"] += 1
            total_all_samples += 1

            if place is not None and place <= 32:
                hit["baselineTop32Samples"] += 1
                total_baseline_top32_samples += 1
                points = points_for_place(place)
                hit["weightedPoints"] += points
                if day_ms is not None:
                    day_counts = daily_top32_counts.setdefault(day_ms, {})
                    day_points = daily_weighted_points.setdefault(day_ms, {})
                    day_counts[deck["key"]] = day_counts.get(deck["key"], 0.0) + 1.0
                    day_points[deck["key"]] = day_points.get(deck["key"], 0.0) + points
                    daily_top32_slots[day_ms] = daily_top32_slots.get(day_ms, 0.0) + 1.0

            hit["selectedSamples"] += 1
            total_selected_samples += 1

        lookup = build_standing_lookup(standings)
        for match in pairings:
            side1 = lookup_pairing_side(lookup, match, 1)
            side2 = lookup_pairing_side(lookup, match, 2)
            if not side1 or not side2:
                continue
            result = parse_pairing_result(match, side1["player"], side2["player"])
            if not result:
                continue

            if qualifies_by_top_cut(side1["place"], top_cut):
                hit = deck_map.get(side1["deck"]["key"])
                if hit:
                    hit["selectedGames"] += 1
                    hit["selectedMatchPoints"] += result[0]
                add_pair(side1["deck"]["key"], side2["deck"]["key"], result[0])

            if qualifies_by_top_cut(side2["place"], top_cut):
                hit = deck_map.get(side2["deck"]["key"])
                if hit:
                    hit["selectedGames"] += 1
                    hit["selectedMatchPoints"] += result[1]
                add_pair(side2["deck"]["key"], side1["deck"]["key"], result[1])

    data1 = {key: item["baselineTop32Samples"] for key, item in deck_map.items()}
    data2 = {key: item["weightedPoints"] for key, item in deck_map.items()}
    data3 = {
        key: (item["baselineTop32Samples"] / total_baseline_top32_samples) * 100
        if total_baseline_top32_samples > 0
        else 0
        for key, item in deck_map.items()
    }
    data4 = build_ema_scores(
        daily_top32_counts,
        daily_weighted_points,
        daily_top32_slots,
        deck_map.keys(),
    )

    std1 = minmax_scale(map_number_record(data1, math.log1p))
    std2 = minmax_scale(map_number_record(data2, math.log1p))
    std3 = minmax_scale(map_number_record(data3, math.log1p))
    std4 = minmax_scale(data4)

    rows = []
    for item in deck_map.values():
        field_share = item["allSamples"] / total_all_samples if total_all_samples > 0 else 0
        top_cut_share = (
            field_share
            if top_cut == "all"
            else item["selectedSamples"] / total_selected_samples
            if total_selected_samples > 0
            else 0
        )
        win_rate = (
            item["selectedMatchPoints"] / item["selectedGames"]
            if item["selectedGames"] > 0
            else None
        )
        score = calculate_tier_score(
            std1.get(item["key"], 0),
            std2.get(item["key"], 0),
            std3.get(item["key"], 0),
            std4.get(item["key"], 0),
        )
        rows.append(
            {
                "key": item["key"],
                "rawName": item["rawName"],
                "iconKeys": item["iconKeys"],
                "sortName": (item["rawName"] or item["key"]).lower(),
                "allSamples": item["allSamples"],
                "baselineTop32Samples": item["baselineTop32Samples"],
                "weightedPoints": item["weightedPoints"],
                "selectedSamples": item["selectedSamples"],
                "topCutShare": top_cut_share,
                "winRate": win_rate,
                "baselineTop32SharePct": data3.get(item["key"], 0),
                "emaScore": data4.get(item["key"], 0),
                "score": score,
                "tier": "F",
                "baseRank": 999999,
            }
        )

    rows.sort(
        key=lambda row: (
            -row["score"],
            -row["weightedPoints"],
            -row["baselineTop32Samples"],
            -row["allSamples"],
            row["sortName"],
        )
    )

    for index, row in enumerate(rows):
        next_score = rows[index + 1]["score"] if index + 1 < len(rows) else row["score"]
        row["baseRank"] = index + 1
        row["tier"] = resolve_deck_tier(row["score"], row["score"] - next_score, index == 0)

    top_matrix_keys = {
        row["key"]
        for row in rows
        if str(row.get("tier", "")).upper() in EXPORT_MATCHUP_TIERS
    }
    if extra_matchup_keys:
        top_matrix_keys.update(key for key in extra_matchup_keys if key)
    matchups = []
    for (deck_a, deck_b), rec in pair_map.items():
        if deck_a not in top_matrix_keys or deck_b not in top_matrix_keys:
            continue
        total = rec["wins"] + rec["losses"] + rec["ties"]
        matchups.append(
            {
                "deckA": deck_a,
                "deckB": deck_b,
                "winsA": rec["wins"],
                "lossesA": rec["losses"],
                "ties": rec["ties"],
                "total": total,
                "winrateA": (rec["wins"] + rec["ties"] * 0.5) / total if total else 0,
            }
        )

    return {
        "tournamentCount": len(tournaments),
        "totalAllSamples": total_all_samples,
        "totalSelectedSamples": total_selected_samples,
        "rows": rows,
        "matchups": matchups,
    }


def date_label(ms):
    if not ms:
        return "??"
    value = dt.datetime.fromtimestamp(ms / 1000, tz=dt.timezone.utc)
    return f"{value.year:04d}/{value.month:02d}/{value.day:02d}"


def normalize_card_category(value):
    text = normalize_catalog_text(value).lower()
    if re.search(r"\bsupporter\b", text):
        return "Supporter"
    if re.search(r"\btrainer\b|\bitem\b|\bstadium\b|\btool\b", text):
        return "Trainer"
    if re.search(r"\bpokemon\b", text):
        return "Pokemon"
    if re.search(r"\benergy\b", text):
        return "Energy"
    return "Other"


def normalize_catalog_text(value):
    return (
        clean_text(value)
        .replace("Pokémon", "Pokemon")
        .replace("pokémon", "pokemon")
        .replace("é", "e")
        .replace("’", "'")
    )


def normalize_set_code(value):
    raw = clean_text(value).replace("_", "-")
    if not raw:
        return ""
    promo = re.match(r"^P-([A-Z])$", raw, re.I)
    if promo:
        return f"P-{promo.group(1).upper()}"
    main = re.match(r"^([A-Z])(\d+)([A-Z]?)$", raw, re.I)
    if main:
        return f"{main.group(1).upper()}{main.group(2)}{main.group(3).lower()}"
    return raw


def normalize_card_number_key(value):
    raw = clean_text(value).upper()
    if not raw:
        return ""
    return re.sub(r"^0+(?=\d)", "", raw).lower()


def normalize_card_code_key(value):
    raw = clean_text(value).replace("_", "-").replace(" ", "")
    if not raw:
        return ""
    match = re.match(r"^((?:[A-Z]\d+[a-z]?|P-[A-Z]))-(\d+[a-z]?)$", raw, re.I)
    if not match:
        return ""
    return f"{normalize_set_code(match.group(1))}-{normalize_card_number_key(match.group(2))}"


def classify_trainer_subtype(source):
    text = normalize_catalog_text(source).lower()
    if re.search(r"\bsupporter\b", text):
        return "Supporter"
    if re.search(r"\btrainer\b|\bitem\b|\bstadium\b|\bpokemon\s+tool\b|\btool\b", text):
        return "Trainer"
    return ""


def infer_catalog_card_category(card):
    page_line = normalize_catalog_text(card.get("page_line")).lower()
    extra_text = normalize_catalog_text(card.get("extra_text")).lower()
    subtypes = card.get("subtypes") if isinstance(card.get("subtypes"), list) else []
    structured_text = normalize_catalog_text(
        " ".join(str(item or "") for item in [card.get("supertype"), card.get("display_type"), *subtypes])
    ).lower()

    trainer_prefix = re.match(r"^\s*trainer\s*-\s*([a-z ]+)", page_line)
    if trainer_prefix:
        return classify_trainer_subtype(f"trainer {trainer_prefix.group(1)}") or "Trainer"

    shorthand_trainer_prefix = re.match(
        r"^\s*-\s*(supporter|item|stadium|pokemon\s+tool|tool)\b", page_line
    )
    if shorthand_trainer_prefix:
        return classify_trainer_subtype(f"trainer {shorthand_trainer_prefix.group(1)}") or "Trainer"

    extra_trainer_prefix = re.match(r"^\s*trainer\s*-\s*([a-z ]+)", extra_text)
    if extra_trainer_prefix:
        return classify_trainer_subtype(f"trainer {extra_trainer_prefix.group(1)}") or "Trainer"

    extra_trainer_descriptor = re.search(r"\btrainer\s*-\s*([a-z ]+)", extra_text)
    if extra_trainer_descriptor:
        return classify_trainer_subtype(f"trainer {extra_trainer_descriptor.group(1)}") or "Trainer"

    extra_trainer_index = extra_text.find("trainer")
    if 0 <= extra_trainer_index < 80:
        return classify_trainer_subtype(extra_text[extra_trainer_index : extra_trainer_index + 80]) or "Trainer"

    if re.search(r"\b\d+\s*hp\s+pokemon\b", extra_text) or re.search(
        r"\b\d+\s*hp\s+pokemon\b", page_line
    ):
        return "Pokemon"

    if re.search(r"\bpokemon\s*-\s*(basic|stage|mega|restored|fossil)\b", extra_text):
        return "Pokemon"

    if re.match(r"^\s*(basic|special)?\s*energy\b", page_line) or re.match(
        r"^\s*energy\s*-\s*", page_line
    ):
        return "Energy"

    structured_category = normalize_card_category(structured_text)
    if structured_category != "Other":
        return structured_category

    early_text = f"{page_line[:120]} {extra_text[:120]}"
    if re.search(r"\b\d+\s*hp\s+pokemon\b", early_text):
        return "Pokemon"
    if re.match(r"^\s*trainer\s*-", early_text):
        return classify_trainer_subtype(early_text) or "Trainer"
    if re.search(r"\benergy\b", early_text) and not re.search(
        r"\benergy\s+from\b|\benergy\s+attached\b", early_text
    ):
        return "Energy"

    return "Other"


def load_card_catalog():
    global CARD_CATALOG_BY_CODE, CARD_CATALOG_BY_NAME
    CARD_CATALOG_BY_CODE = {}
    CARD_CATALOG_BY_NAME = {}

    if not CARD_CATALOG_PATH.exists():
        return

    payload = read_json(CARD_CATALOG_PATH)
    if not isinstance(payload, list):
        return

    for raw in payload:
        if not isinstance(raw, dict):
            continue

        set_code = normalize_set_code(raw.get("set_code"))
        number = normalize_card_number_key(raw.get("number"))
        code = normalize_card_code_key(f"{set_code}-{number}" if set_code and number else raw.get("id"))
        name = clean_text(raw.get("name"))
        if not code and not name:
            continue

        card = {
            "code": code,
            "name": name,
            "category": infer_catalog_card_category(raw),
        }

        if code and code not in CARD_CATALOG_BY_CODE:
            CARD_CATALOG_BY_CODE[code] = card

        name_key = slugify(normalize_catalog_text(name))
        if name_key:
            CARD_CATALOG_BY_NAME.setdefault(name_key, []).append(card)


def lookup_catalog_card(code="", set_value="", number="", name=""):
    direct_code = normalize_card_code_key(code)
    if direct_code and direct_code in CARD_CATALOG_BY_CODE:
        return CARD_CATALOG_BY_CODE[direct_code]

    set_code = normalize_set_code(set_value)
    number_key = normalize_card_number_key(number)
    set_number_code = normalize_card_code_key(f"{set_code}-{number_key}" if set_code and number_key else "")
    if set_number_code and set_number_code in CARD_CATALOG_BY_CODE:
        return CARD_CATALOG_BY_CODE[set_number_code]

    name_key = slugify(normalize_catalog_text(name))
    by_name = CARD_CATALOG_BY_NAME.get(name_key) if name_key else None
    if not by_name:
        return None

    for item in by_name:
        if item.get("category") == "Supporter":
            return item
    return by_name[0]


def infer_deck_card_category(category="", section="", supertype="", type_value="", code="", set_value="", number="", name=""):
    catalog_card = lookup_catalog_card(code, set_value, number, name)
    if catalog_card and catalog_card.get("category"):
        return catalog_card["category"]

    source_text = normalize_catalog_text(
        " ".join(str(item or "") for item in [category, section, supertype, type_value, name])
    ).lower()

    if re.search(r"\bsupporter\b", source_text):
        return "Supporter"
    if re.search(r"\btrainer\b|\bitem\b|\bstadium\b|\btool\b", source_text):
        return "Trainer"
    if re.search(r"\bpokemon\b", source_text):
        return "Pokemon"
    if re.search(r"\benergy\b", source_text):
        return "Energy"

    return normalize_card_category(category or section or supertype or type_value)


def split_card_code_parts(code):
    text = clean_text(code)
    if not text:
        return "", ""
    match = re.match(r"^([A-Za-z0-9-]+)-(\d+[A-Za-z]?)$", text)
    if not match:
        return "", ""
    return match.group(1), match.group(2)


def normalize_deck_cards_source(source, category_hint="Other"):
    if not source:
        return []
    if isinstance(source, list):
        cards = []
        for item in source:
            cards.extend(normalize_deck_cards_source(item, category_hint))
        return cards
    if not isinstance(source, dict):
        return []

    name = clean_text(
        source.get("name") or source.get("cardName") or source.get("title") or source.get("label")
    )
    count = to_number(
        source.get("count")
        if source.get("count") is not None
        else source.get("qty")
        if source.get("qty") is not None
        else source.get("quantity")
        if source.get("quantity") is not None
        else source.get("copies")
        if source.get("copies") is not None
        else 1
    )
    if name and count and count > 0:
        set_value = clean_text(source.get("set") or source.get("setCode") or source.get("set_code"))
        number = clean_text(
            source.get("number") or source.get("no") or source.get("cardNumber") or source.get("card_number")
        )
        code = clean_text(source.get("code") or source.get("cardCode") or source.get("card_code"))
        if not code and set_value and number:
            code = f"{set_value}-{number}"
        if not set_value or not number:
            code_set, code_number = split_card_code_parts(code)
            set_value = set_value or code_set
            number = number or code_number
        key = code or (f"{set_value}-{number}" if set_value and number else slugify(name))
        images = source.get("images") if isinstance(source.get("images"), dict) else {}

        return [
            {
                "key": key,
                "code": code,
                "set": set_value,
                "number": number,
                "name": name,
                "count": int(count),
                "image": clean_text(
                    source.get("image")
                    or source.get("imageUrl")
                    or source.get("img")
                    or source.get("cardImage")
                    or images.get("small")
                    or images.get("large")
                ),
                "category": infer_deck_card_category(
                    category=source.get("category") or category_hint,
                    section=source.get("section"),
                    supertype=source.get("supertype"),
                    type_value=source.get("type"),
                    code=code,
                    set_value=set_value,
                    number=number,
                    name=name,
                ),
            }
        ]

    cards = []
    for key, value in source.items():
        if key in {
            "pokemon",
            "pokemons",
            "trainer",
            "trainers",
            "energy",
            "energies",
            "supporters",
            "items",
            "stadiums",
            "cards",
            "decklist",
            "deckList",
            "list",
        }:
            cards.extend(normalize_deck_cards_source(value, key))
    return cards


def extract_deck_cards(row):
    deck = row.get("deck") if isinstance(row.get("deck"), dict) else {}
    candidates = [
        row.get("decklist"),
        row.get("deckList"),
        row.get("list"),
        row.get("cardList"),
        row.get("cards"),
        deck.get("decklist"),
        deck.get("deckList"),
        deck.get("list"),
        deck.get("cards"),
        deck.get("cardList"),
    ]
    for source in candidates:
        parsed = normalize_deck_cards_source(source)
        if parsed:
            return parsed
    grouped = {
        "pokemon": row.get("pokemon") or deck.get("pokemon"),
        "trainer": row.get("trainer") or row.get("trainers") or deck.get("trainer") or deck.get("trainers"),
        "energy": row.get("energy") or row.get("energies") or deck.get("energy") or deck.get("energies"),
    }
    return normalize_deck_cards_source(grouped)


def build_limitless_decklist_url(tournament_id, row):
    deck = row.get("deck") if isinstance(row.get("deck"), dict) else {}
    explicit = clean_text(deck.get("url") or deck.get("listUrl") or row.get("listUrl") or row.get("decklistUrl"))
    if explicit.startswith("http"):
        return explicit
    if explicit.startswith("/"):
        return f"https://play.limitlesstcg.com{explicit}"
    player_slug = extract_player_slug(row)
    if not tournament_id or not player_slug:
        return ""
    return (
        f"https://play.limitlesstcg.com/tournament/{quote(tournament_id, safe='')}"
        f"/player/{quote(player_slug, safe='')}/decklist"
    )


def is_target_identity(identity, target_key):
    if not identity:
        return False
    target_norm = normalize_entity_key(target_key)
    candidates = {
        identity["key"],
        identity["normKey"],
        normalize_entity_key(identity["rawName"]),
        slugify(identity["rawName"]),
        slugify("-".join(identity["iconKeys"])),
    }
    return target_key in candidates or target_norm in candidates


def build_profile_scope(target_key, tournaments, top_cut):
    card_map = {}
    matchup_map = {}
    finish_map = {}
    sample_deck = None
    target_icon_keys = []
    target_name = ""

    total_standing_rows = 0
    target_standing_rows = 0
    total_seen_deck_rows = 0
    wins = losses = draws = 0
    target_games = 0
    target_points = 0
    top4_counts = {"1": 0, "2": 0, "3": 0, "4": 0}

    def sample_sort_key(sample):
        return (
            sample["place"],
            -(sample["players"] or 0),
            -sample["dateMs"],
            sample["player"].lower(),
        )

    for tournament in tournaments:
        standings = tournament["standings"]
        pairings = tournament["pairings"]
        tournament_has_target = False
        lookup = build_standing_lookup(standings)

        for row in standings:
            place = get_place(row)
            identity = build_deck_identity(row)
            if not identity:
                continue
            if not qualifies_by_top_cut(place, top_cut):
                continue

            total_standing_rows += 1

            if not is_target_identity(identity, target_key):
                continue

            tournament_has_target = True
            target_standing_rows += 1
            if not target_name:
                target_name = identity["rawName"]
            if not target_icon_keys and identity["iconKeys"]:
                target_icon_keys = identity["iconKeys"]

            if place in (1, 2, 3, 4):
                top4_counts[str(place)] += 1

            player = extract_player_name(row)
            if player and place is not None:
                finish = {
                    "key": f"{tournament['id']}::{player}",
                    "player": player,
                    "tournamentName": clean_text(tournament.get("name")) or tournament["id"],
                    "dateMs": tournament["startMs"],
                    "dateLabel": date_label(tournament["startMs"]),
                    "place": place,
                    "players": tournament.get("players"),
                    "placeLabel": f"{place} / {tournament.get('players')}" if tournament.get("players") else str(place),
                    "listUrl": build_limitless_decklist_url(tournament["id"], row),
                }
                previous = finish_map.get(finish["key"])
                if not previous or not previous.get("listUrl"):
                    finish_map[finish["key"]] = finish

            cards = extract_deck_cards(row)
            if cards:
                total_seen_deck_rows += 1
                if player and place is not None:
                    sample = {
                        "tournamentId": tournament["id"],
                        "tournamentName": clean_text(tournament.get("name")) or tournament["id"],
                        "player": player,
                        "dateMs": tournament["startMs"],
                        "dateLabel": date_label(tournament["startMs"]),
                        "place": place,
                        "players": tournament.get("players"),
                        "placeLabel": f"{place} / {tournament.get('players')}" if tournament.get("players") else str(place),
                        "listUrl": build_limitless_decklist_url(tournament["id"], row),
                        "cards": cards,
                    }
                    if sample_deck is None or sample_sort_key(sample) < sample_sort_key(sample_deck):
                        sample_deck = sample

                deck_cards = {}
                for card in cards:
                    key = card.get("key") or card.get("code") or slugify(card.get("name"))
                    count = int(card.get("count") or 0)
                    if not key or count <= 0:
                        continue
                    if key not in deck_cards:
                        deck_cards[key] = dict(card, key=key, count=0)
                    deck_cards[key]["count"] += count

                for card in deck_cards.values():
                    key = card["key"]
                    existing = card_map.get(key)
                    if not existing:
                        existing = {
                            "key": key,
                            "code": card.get("code") or "",
                            "set": card.get("set") or "",
                            "number": card.get("number") or "",
                            "name": card.get("name") or "",
                            "image": card.get("image") or "",
                            "category": card.get("category") or "Other",
                            "totalCopies": 0,
                            "deckCount": 0,
                            "oneCopyDeckCount": 0,
                            "twoCopyDeckCount": 0,
                            "slotRatePct": 0,
                            "inclusionPct": 0,
                            "avgCopies": 0,
                            "oneCopyPct": 0,
                            "twoCopyPct": 0,
                        }
                        card_map[key] = existing
                    existing["totalCopies"] += card["count"]
                    existing["deckCount"] += 1
                    if not existing["set"] and card.get("set"):
                        existing["set"] = card["set"]
                    if not existing["number"] and card.get("number"):
                        existing["number"] = card["number"]
                    if not existing["code"] and card.get("code"):
                        existing["code"] = card["code"]
                    if not existing["name"] and card.get("name"):
                        existing["name"] = card["name"]
                    if not existing["image"] and card.get("image"):
                        existing["image"] = card["image"]
                    if card["count"] >= 2:
                        existing["twoCopyDeckCount"] += 1
                    else:
                        existing["oneCopyDeckCount"] += 1

        if not tournament_has_target or not pairings:
            continue

        for row in pairings:
            side1 = lookup_pairing_side(lookup, row, 1)
            side2 = lookup_pairing_side(lookup, row, 2)
            if not side1 or not side2:
                continue
            result = parse_pairing_result(row, side1["player"], side2["player"])
            if not result:
                continue
            side1_target = is_target_identity(side1["deck"], target_key)
            side2_target = is_target_identity(side2["deck"], target_key)

            for side, points, opponent in (
                (side1, result[0], side2["deck"]),
                (side2, result[1], side1["deck"]),
            ):
                if not is_target_identity(side["deck"], target_key):
                    continue
                if not qualifies_by_top_cut(side["place"], top_cut):
                    continue
                target_games += 1
                target_points += points
                if points == 1:
                    wins += 1
                elif points == 0.5:
                    draws += 1
                else:
                    losses += 1
                if is_target_identity(opponent, target_key):
                    continue
                opp_key = opponent["key"]
                matchup = matchup_map.get(opp_key)
                if not matchup:
                    matchup = {
                        "key": opp_key,
                        "displayName": opponent["rawName"] or opp_key,
                        "spriteUrls": [],
                        "iconKeys": opponent["iconKeys"],
                        "wins": 0,
                        "losses": 0,
                        "draws": 0,
                        "games": 0,
                        "winRate": 0,
                    }
                    matchup_map[opp_key] = matchup
                matchup["games"] += 1
                if points == 1:
                    matchup["wins"] += 1
                elif points == 0.5:
                    matchup["draws"] += 1
                else:
                    matchup["losses"] += 1

    cards_flat = []
    for item in card_map.values():
        item = dict(item)
        item["slotRatePct"] = (
            (item["totalCopies"] / total_seen_deck_rows) * 100 if total_seen_deck_rows else 0
        )
        item["inclusionPct"] = (
            (item["deckCount"] / total_seen_deck_rows) * 100 if total_seen_deck_rows else 0
        )
        item["avgCopies"] = item["totalCopies"] / item["deckCount"] if item["deckCount"] else 0
        item["oneCopyPct"] = (
            (item["oneCopyDeckCount"] / total_seen_deck_rows) * 100 if total_seen_deck_rows else 0
        )
        item["twoCopyPct"] = (
            (item["twoCopyDeckCount"] / total_seen_deck_rows) * 100 if total_seen_deck_rows else 0
        )
        if item["slotRatePct"] >= MIN_SLOT_RATE_PCT:
            cards_flat.append(item)

    cards_flat.sort(key=lambda item: (-item["inclusionPct"], -item["slotRatePct"], item["name"].lower()))

    card_groups = []
    for key, label in (
        ("pokemon", "POKEMON"),
        ("supporter", "SUPPORTER"),
        ("trainer", "TRAINER"),
    ):
        if key == "trainer":
            cards = [
                card
                for card in cards_flat
                if card.get("category") not in {"Pokemon", "Supporter"}
            ]
        else:
            cards = [card for card in cards_flat if card.get("category") == label.title()]
        if cards:
            card_groups.append({"key": key, "label": label, "cards": cards})

    matchup_rows = []
    for matchup in matchup_map.values():
        item = dict(matchup)
        item["winRate"] = (
            (item["wins"] + item["draws"] * 0.5) / item["games"] if item["games"] else 0
        )
        matchup_rows.append(item)
    matchup_rows.sort(key=lambda item: (-item["games"], item["displayName"].lower()))
    top15 = matchup_rows[:15]
    featured_good = sorted(top15, key=lambda item: (-item["winRate"], -item["games"]))[:3]
    featured_bad = sorted(top15, key=lambda item: (item["winRate"], -item["games"]))[:3]

    best_finishes = list(finish_map.values())
    best_finishes.sort(
        key=lambda item: (
            item["place"],
            -(item["players"] or 0),
            -item["dateMs"],
            item["player"].lower(),
        )
    )

    tier_row = None
    total_all_samples = total_standing_rows
    if target_standing_rows:
        tier_row = {
            "deck": target_key,
            "tier": "",
            "score": 0,
            "usage": target_standing_rows / total_all_samples if total_all_samples else 0,
            "total_samples": target_standing_rows,
        }

    return {
        "tournamentCount": len(tournaments),
        "analytics": {
            "totalStandingRows": total_standing_rows,
            "targetStandingRows": target_standing_rows,
            "totalSeenDeckRows": total_seen_deck_rows,
            "top4Counts": top4_counts,
            "metaShare": target_standing_rows / total_standing_rows if total_standing_rows else 0,
            "winRate": target_points / target_games if target_games else None,
            "wins": wins,
            "losses": losses,
            "draws": draws,
            "matchCount": wins + losses + draws,
            "cardsFlat": cards_flat,
            "cardGroups": card_groups,
            "featuredGoodMatchups": featured_good,
            "featuredBadMatchups": featured_bad,
            "bestFinishes": best_finishes[:50],
            "sampleDeck": sample_deck,
            "targetSpriteUrls": [],
            "targetIconKeys": target_icon_keys,
            "resolvedDeckDisplayName": target_name or humanize_deck_id(target_key),
            "resolvedDeckDisplayNameEn": target_name or humanize_deck_id(target_key),
        },
        "tierRow": tier_row,
    }


def load_tournaments():
    rows = read_json(DATA_DIR / "tournaments.json")
    tournaments = []
    missing = []
    for raw in rows:
        tid = clean_text(raw.get("id"))
        if not tid:
            continue
        start_ms = parse_ms(raw.get("date") or raw.get("startAt") or raw.get("createdAt"))
        if not start_ms:
            continue
        version = infer_version(start_ms)
        try:
            standings = read_json(RAW_DIR / tid / "standings.json")
            pairings = read_json(RAW_DIR / tid / "pairings.json")
        except FileNotFoundError:
            missing.append(tid)
            continue
        tournaments.append(
            {
                **raw,
                "id": tid,
                "name": raw.get("name") or tid,
                "startMs": start_ms,
                "players": int(raw.get("players") or 0) or None,
                "versionCode": version["code"] if version else "",
                "versionName": version["name"] if version else "",
                "versionLabel": version["label"] if version else "",
                "standings": standings if isinstance(standings, list) else [],
                "pairings": pairings if isinstance(pairings, list) else [],
            }
        )
    tournaments.sort(key=lambda item: item["startMs"], reverse=True)
    return tournaments, missing


def collect_month_filters(tournaments):
    seen = set()
    months = []
    for tournament in tournaments:
        value = dt.datetime.fromtimestamp(tournament["startMs"] / 1000, tz=dt.timezone.utc)
        key = f"{value.year:04d}-{value.month:02d}"
        if key in seen:
            continue
        seen.add(key)
        months.append(f"month:{key}")
    months.sort(reverse=True)
    return months


def build_top_decks_payload(tournaments):
    current = infer_version(GENERATED_AT_MS)
    current_code = current["code"] if current else ""
    scope_filters = [
        ("all", current_code),
        ("past7", current_code),
        ("past7", ""),
        ("prev7", current_code),
        ("prev7", ""),
    ]

    scopes = {}
    for time_value, set_value in scope_filters:
        filtered = filter_tournaments(tournaments, time_value, set_value)
        for top_cut in TOP_CUTS:
            key = scope_key(time_value, set_value, top_cut)
            scopes[key] = build_top_decks_scope(filtered, top_cut)

    if current_code:
        current_all = filter_tournaments(tournaments, "all", current_code)
        for top_cut in TOP_CUTS:
            past7_key = scope_key("past7", current_code, top_cut)
            current_all_key = scope_key("all", current_code, top_cut)
            past7_scope = scopes.get(past7_key) or {}
            extra_keys = [
                row.get("key")
                for row in (past7_scope.get("rows") or [])[:MATRIX_DISPLAY_DECK_LIMIT]
                if row.get("key")
            ]
            scopes[current_all_key] = build_top_decks_scope(
                current_all,
                top_cut,
                extra_matchup_keys=extra_keys,
            )

    return {
        "schemaVersion": 1,
        "generatedAt": GENERATED_AT.isoformat(),
        "generatedAtMs": GENERATED_AT_MS,
        "currentVersionCode": current_code,
        "versionCodes": [version["code"] for version in VERSION_WINDOWS],
        "scopes": scopes,
    }


def profile_file_name(deck_key):
    return f"{quote(deck_key, safe='')}.json"


def collect_profile_deck_keys(tier_rows, top_decks_payload):
    keys = []
    seen = set()

    def add(key):
        key = clean_text(key)
        if key and key not in seen:
            seen.add(key)
            keys.append(key)

    current = top_decks_payload.get("currentVersionCode") or ""
    default_key = scope_key("past7", current, "all")
    default_scope = top_decks_payload["scopes"].get(default_key)
    if default_scope:
        for row in default_scope["rows"][:PROFILE_DECK_LIMIT]:
            add(row.get("key"))

    for row in tier_rows:
        add(row.get("deck"))

    return keys[:PROFILE_DECK_LIMIT]


def find_top_deck_row(top_decks_payload, deck_key, set_value, time_value, top_cut):
    top_set = top_decks_payload.get("currentVersionCode", "") if set_value == "__current_7__" else set_value
    key = scope_key(time_value, top_set, top_cut)
    scope = top_decks_payload.get("scopes", {}).get(key)
    if not scope:
        return None

    target = normalize_entity_key(deck_key)
    for row in scope.get("rows", []):
        if row.get("key") == deck_key or normalize_entity_key(row.get("key")) == target:
            return row
    return None


def build_tier_row_from_top_deck_row(deck_key, row):
    if not row:
        return None
    return {
        "deck": deck_key,
        "tier": row.get("tier") or "F",
        "score": row.get("score") or 0,
        "usage": row.get("topCutShare") or 0,
        "total_samples": row.get("selectedSamples") or 0,
        "rank": row.get("baseRank"),
        "baseRank": row.get("baseRank"),
        "allSamples": row.get("allSamples"),
        "baselineTop32Samples": row.get("baselineTop32Samples"),
        "weightedPoints": row.get("weightedPoints"),
        "top32SharePct": row.get("baselineTop32SharePct"),
        "emaScore": row.get("emaScore"),
        "winRate": row.get("winRate"),
    }


def build_deck_profile_payload(deck_key, tournaments, tier_by_deck, top_decks_payload):
    current = infer_version(GENERATED_AT_MS)
    scope_filters = [
        ("__current_7__", "past7"),
    ]

    scopes = {}
    for set_value, time_value in scope_filters:
        filtered = filter_tournaments(tournaments, time_value, set_value)
        for top_cut in TOP_CUTS:
            scope = build_profile_scope(
                deck_key,
                filtered,
                top_cut,
            )
            top_deck_row = find_top_deck_row(top_decks_payload, deck_key, set_value, time_value, top_cut)
            scope["topDeckRow"] = top_deck_row
            scope["tierRow"] = (
                build_tier_row_from_top_deck_row(deck_key, top_deck_row)
                or tier_by_deck.get(deck_key)
                or scope.get("tierRow")
            )
            scopes[profile_scope_key(set_value, time_value, top_cut)] = scope

    return {
        "schemaVersion": 1,
        "generatedAt": GENERATED_AT.isoformat(),
        "generatedAtMs": GENERATED_AT_MS,
        "deckKey": deck_key,
        "scopes": scopes,
    }


def main():
    load_card_catalog()
    tournaments, missing = load_tournaments()
    tier_rows = read_json(DATA_DIR / "tier.json") if (DATA_DIR / "tier.json").exists() else []
    tier_by_deck = {clean_text(row.get("deck")): row for row in tier_rows if clean_text(row.get("deck"))}

    print(f"Loaded {len(tournaments)} tournaments for precomputed views")
    if missing:
        print(f"Skipped {len(missing)} tournaments with missing raw data")

    top_decks_payload = build_top_decks_payload(tournaments)
    write_json(OUT_DIR / "top_decks.json", top_decks_payload)
    print(f"Wrote {OUT_DIR / 'top_decks.json'}")

    deck_keys = collect_profile_deck_keys(tier_rows, top_decks_payload)
    for index, deck_key in enumerate(deck_keys, start=1):
        payload = build_deck_profile_payload(deck_key, tournaments, tier_by_deck, top_decks_payload)
        write_json(DECK_PROFILE_DIR / profile_file_name(deck_key), payload)
        print(f"Wrote profile {index}/{len(deck_keys)}: {deck_key}")

    write_json(
        DECK_PROFILE_DIR / "index.json",
        {
            "schemaVersion": 1,
            "generatedAt": GENERATED_AT.isoformat(),
            "generatedAtMs": GENERATED_AT_MS,
            "deckKeys": deck_keys,
        },
    )

    print("Precomputed view build complete")


if __name__ == "__main__":
    main()
