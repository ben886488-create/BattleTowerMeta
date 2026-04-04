import json
from pathlib import Path
from datetime import datetime

# 以這支 py 檔所在資料夾當基準
BASE_DIR = Path(__file__).resolve().parent
TOURNAMENTS_FILE = BASE_DIR / "tournaments.json"
RAW_DIR = BASE_DIR / "raw"


def load_json(path: Path, default=None):
    if not path.exists():
        return default
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def iso_to_ms(iso_str):
    if not iso_str:
        return None
    s = str(iso_str).strip()
    if not s:
        return None
    if s.endswith("Z"):
        s = s[:-1] + "+00:00"
    return int(datetime.fromisoformat(s).timestamp() * 1000)


GAME_VERSIONS = [
    {"code": "A1",  "nameZh": "最強的基因",       "nameEn": "Genetic Apex",              "releaseUtcIso": "2024-10-30T01:00:00Z"},
    {"code": "A1a", "nameZh": "幻遊島",           "nameEn": "Mythical Island",           "releaseUtcIso": "2024-12-17T06:00:00Z"},
    {"code": "A2",  "nameZh": "時空激鬥",         "nameEn": "Space-Time Smackdown",      "releaseUtcIso": "2025-01-30T06:00:00Z"},
    {"code": "A2a", "nameZh": "超克之光",         "nameEn": "Triumphant Light",          "releaseUtcIso": "2025-02-28T06:00:00Z"},
    {"code": "A2b", "nameZh": "嗨放異彩",         "nameEn": "Shining Revelry",           "releaseUtcIso": "2025-03-27T06:00:00Z"},
    {"code": "A3",  "nameZh": "雙天之守護者",     "nameEn": "Celestial Guardians",       "releaseUtcIso": "2025-04-30T06:00:00Z"},
    {"code": "A3a", "nameZh": "異次元危機",       "nameEn": "Extradimensional Crisis",   "releaseUtcIso": "2025-05-29T06:00:00Z"},
    {"code": "A3b", "nameZh": "伊布花園",         "nameEn": "Eevee Grove",               "releaseUtcIso": "2025-06-26T06:00:00Z"},
    {"code": "A4",  "nameZh": "天與海的指引",     "nameEn": "Wisdom of Sea and Sky",     "releaseUtcIso": "2025-07-30T06:00:00Z"},
    {"code": "A4a", "nameZh": "未知水域",         "nameEn": "Secluded Springs",          "releaseUtcIso": "2025-08-28T06:00:00Z"},
    {"code": "A4b", "nameZh": "高級擴充包ex",     "nameEn": "Deluxe Pack: ex",           "releaseUtcIso": "2025-09-30T06:00:00Z"},
    {"code": "B1",  "nameZh": "超級崛起",         "nameEn": "Mega Rising",               "releaseUtcIso": "2025-10-30T06:00:00Z"},
    {"code": "B1a", "nameZh": "紅蓮烈焰",         "nameEn": "Crimson Blaze",             "releaseUtcIso": "2025-12-17T06:00:00Z"},
    {"code": "B2",  "nameZh": "幻夢遊行",         "nameEn": "Fantastical Parade",        "releaseUtcIso": "2026-01-29T01:00:00Z"},
    {"code": "B2a", "nameZh": "帕底亞驚奇",       "nameEn": "Paldean Wonders",           "releaseUtcIso": "2026-02-26T01:00:00Z"},
]

for v in GAME_VERSIONS:
    v["releaseMs"] = iso_to_ms(v["releaseUtcIso"])

GAME_VERSIONS.sort(key=lambda v: v["releaseMs"])
VERSION_BY_CODE = {v["code"]: v for v in GAME_VERSIONS}


def infer_version_code(date_iso):
    ms = iso_to_ms(date_iso)
    if ms is None:
        return None

    matched = None
    for v in GAME_VERSIONS:
        if ms >= v["releaseMs"]:
            matched = v
        else:
            break

    return matched["code"] if matched else None


def normalize_format(row_format, details_format, name=""):
    raw = details_format if details_format is not None else row_format
    s = str(raw or "").strip().upper()

    if s in {"NOEX", "NO_EX", "NO-EX"}:
        return "NOEX"
    if s in {"CUSTOM", "SPECIAL"}:
        return "CUSTOM"
    if s == "STANDARD":
        return "STANDARD"

    # 若原始 format 為 null，預設當 STANDARD
    n = (name or "").upper()
    if any(x in n for x in ["NOEX", "NO EX", "NO-EX", "NO_EX"]):
        return "NOEX"

    return "STANDARD"


def find_phase_mode(details: dict, phase_type: str):
    phases = details.get("phases") or []
    for phase in phases:
        if str(phase.get("type", "")).upper() == phase_type.upper():
            mode = phase.get("mode")
            if mode:
                return str(mode).upper()
    return None


def enrich_tournaments():
    print("BASE_DIR =", BASE_DIR)
    print("TOURNAMENTS_FILE =", TOURNAMENTS_FILE)
    print("RAW_DIR =", RAW_DIR)

    tournaments = load_json(TOURNAMENTS_FILE, default=[])
    if not isinstance(tournaments, list):
        raise ValueError("tournaments.json 不是陣列")

    out = []

    for row in tournaments:
        tid = str(row.get("id", "")).strip()
        if not tid:
            out.append(row)
            continue

        details_path = RAW_DIR / tid / "details.json"
        details = load_json(details_path, default={}) or {}

        name = details.get("name") or row.get("name") or ""
        date_iso = details.get("date") or row.get("date")

        swiss = find_phase_mode(details, "SWISS")
        top_cut = find_phase_mode(details, "SINGLE_ELIMINATION")
        fmt = normalize_format(
            row.get("format"),
            details.get("format"),
            name=name,
        )
        set_code = infer_version_code(date_iso)

        new_row = dict(row)
        new_row["format"] = fmt
        new_row["swiss"] = swiss
        new_row["topCut"] = top_cut
        new_row["set"] = set_code

        # 如果你之後想前端直接顯示中文名，也可以保留這兩個
        if set_code and set_code in VERSION_BY_CODE:
            new_row["setNameZh"] = VERSION_BY_CODE[set_code]["nameZh"]
            new_row["setNameEn"] = VERSION_BY_CODE[set_code]["nameEn"]
        else:
            new_row["setNameZh"] = None
            new_row["setNameEn"] = None

        out.append(new_row)

    # 備份原本 tournaments.json
    backup_file = BASE_DIR / "tournaments.backup.json"
    if TOURNAMENTS_FILE.exists():
        backup_file.write_text(
            TOURNAMENTS_FILE.read_text(encoding="utf-8"),
            encoding="utf-8"
        )
        print(f"backup created: {backup_file}")

    with TOURNAMENTS_FILE.open("w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

    print(f"done: updated {len(out)} tournaments -> {TOURNAMENTS_FILE}")


if __name__ == "__main__":
    enrich_tournaments()