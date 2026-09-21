import shutil
import json, os, datetime, time, random, sys, re
from html import unescape
from urllib.request import urlopen, Request
from urllib.error import HTTPError, URLError

# ===================== 公共配置 =====================
BASE = "https://play.limitlesstcg.com/api"
GAME_ID = os.environ.get("POCKET_GAME_ID") or "POCKET"
# 核心优化：新增不限天数开关（True=不限天数，False=按DAYS_BACK过滤）
UNLIMITED_DAYS = os.environ.get("UNLIMITED_DAYS", "False").lower() == "true"
# 兼容原有配置：仅当 UNLIMITED_DAYS=False 时生效
DAYS_BACK = int(os.environ.get("DAYS_BACK", "7"))
MIN_PLAYERS = int(os.environ.get("MIN_PLAYERS", "64"))
# 定期更新預設會重抓近期已收錄賽事，避免賽事尚未結束時保存的快照永久停留。
REFRESH_RECENT = os.environ.get("REFRESH_RECENT", "true").lower() == "true"
REQUEST_GAP_SEC = float(os.environ.get("REQUEST_GAP_SEC", 2.0))
BATCH_SIZE = 10
BATCH_SLEEP_SEC = 5.0
MAX_RETRIES = int(os.environ.get("MAX_RETRIES", 8))
REQUEST_TIMEOUT = 120.0
MANUAL_EXCLUDED_TOURNAMENTS = {
    "6a021c2313f957d6d4b45d8b": "special rules tournament listed as standard format",
}

# 全局变量
_last_request_ts = 0.0
failed_tournaments = []
# 赛事列表文件路径（抽离为常量，便于维护）
TOURNAMENTS_JSON_PATH = "web/public/data/tournaments.json"
UPCOMING_TOURNAMENTS_JSON_PATH = "web/public/data/upcoming_tournaments.json"

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(errors="replace")

# ===================== 工具函数 =====================
def get_json(url: str, api_type: str = "unknown", tid: str = "unknown"):
    global _last_request_ts
    for attempt in range(MAX_RETRIES + 1):
        now = time.time()
        wait = REQUEST_GAP_SEC - (now - _last_request_ts)
        if wait > 0:
            jitter = random.uniform(-0.5, 0.5)
            wait = max(0.1, wait + jitter)
            time.sleep(wait)
        
        req = Request(url, headers={"User-Agent": "ptcgp-tier-site/1.0"})
        try:
            print(f"[请求] 尝试{attempt+1}/{MAX_RETRIES+1} | 赛事{tid} | 接口{api_type} | URL: {url}")
            with urlopen(req, timeout=REQUEST_TIMEOUT) as r:
                _last_request_ts = time.time()
                resp_data = json.loads(r.read().decode("utf-8"))
                print(f"[成功] 赛事{tid} | 接口{api_type} | 返回数据长度: {len(resp_data) if isinstance(resp_data, list) else '非列表'}")
                return resp_data
        except HTTPError as e:
            if e.code == 429:
                retry_after = e.headers.get("Retry-After")
                sleep_s = float(retry_after) if retry_after else min(60.0, 2.0 ** attempt)
                print(f"[429限流] 赛事{tid} | 接口{api_type} | 等待{sleep_s:.1f}秒后重试")
                time.sleep(sleep_s)
                continue
            err_msg = f"[HTTP错误] 赛事{tid} | 接口{api_type} | 状态码{e.code}"
            print(err_msg)
            failed_tournaments.append({"tid": tid, "api": api_type, "error": err_msg})
            raise
        except TimeoutError:
            sleep_s = min(60.0, 2.0 ** attempt)
            print(f"[超时错误] 赛事{tid} | 接口{api_type} | 等待{sleep_s:.1f}秒后重试")
            time.sleep(sleep_s)
            continue
        except URLError as e:
            sleep_s = min(30.0, 2.0 ** attempt)
            print(f"[网络错误] 赛事{tid} | 接口{api_type} | 原因:{e.reason} | 等待{sleep_s:.1f}秒后重试")
            time.sleep(sleep_s)
            continue
    
    err_msg = f"[请求失败] 赛事{tid} | 接口{api_type} | 累计{MAX_RETRIES+1}次尝试超时"
    print(err_msg)
    failed_tournaments.append({"tid": tid, "api": api_type, "error": err_msg})
    raise RuntimeError(err_msg)

def write_json(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)

def normalize_hoopa_ex_icons(standings):
    """Fix legacy Limitless rows that label Hoopa ex with the confined-form icon."""
    if not isinstance(standings, list):
        return 0

    changed_rows = 0
    for row in standings:
        if not isinstance(row, dict):
            continue

        deck = row.get("deck")
        if not isinstance(deck, dict):
            continue

        deck_id = str(deck.get("id") or "").strip().lower()
        deck_name = str(deck.get("name") or "").strip().lower()
        pokemon = ((row.get("decklist") or {}).get("pokemon") or [])
        has_hoopa_ex_card = any(
            isinstance(card, dict)
            and str(card.get("name") or "").strip().lower() == "hoopa ex"
            for card in pokemon
        )
        is_hoopa_ex = (
            "hoopa-ex" in deck_id
            or "hoopa ex" in deck_name
            or has_hoopa_ex_card
        )
        icons = deck.get("icons")
        if not is_hoopa_ex or not isinstance(icons, list):
            continue

        normalized = [
            "hoopa-unbound" if str(icon).strip().lower() == "hoopa" else icon
            for icon in icons
        ]
        if normalized != icons:
            deck["icons"] = normalized
            changed_rows += 1

    return changed_rows

def migrate_existing_hoopa_ex_icons(tournament_ids):
    """Normalize archived standings so every site surface uses the correct icon."""
    changed_files = 0
    changed_rows = 0

    for tid in sorted(tournament_ids):
        path = f"web/public/data/raw/{tid}/standings.json"
        if not os.path.exists(path):
            continue
        try:
            with open(path, "r", encoding="utf-8") as f:
                standings = json.load(f)
            row_count = normalize_hoopa_ex_icons(standings)
            if row_count:
                write_json(path, standings)
                changed_files += 1
                changed_rows += row_count
        except Exception as e:
            print(f"⚠️ 賽事{tid}舊 standings 圖示正規化失敗：{e}")

    return changed_files, changed_rows

def fetch_text(url: str, api_type: str = "html", tid: str = "unknown"):
    global _last_request_ts
    for attempt in range(MAX_RETRIES + 1):
        now = time.time()
        wait = REQUEST_GAP_SEC - (now - _last_request_ts)
        if wait > 0:
            time.sleep(max(0.1, wait + random.uniform(-0.3, 0.3)))

        req = Request(url, headers={"User-Agent": "ptcgp-tier-site/1.0"})
        try:
            print(f"[请求] 尝试{attempt+1}/{MAX_RETRIES+1} | 赛事{tid} | 接口{api_type} | URL: {url}")
            with urlopen(req, timeout=REQUEST_TIMEOUT) as r:
                _last_request_ts = time.time()
                return r.read().decode("utf-8", errors="replace")
        except HTTPError as e:
            if e.code == 429:
                retry_after = e.headers.get("Retry-After")
                sleep_s = float(retry_after) if retry_after else min(60.0, 2.0 ** attempt)
                print(f"[429限流] 赛事{tid} | 接口{api_type} | 等待{sleep_s:.1f}秒后重试")
                time.sleep(sleep_s)
                continue
            raise
        except (TimeoutError, URLError):
            sleep_s = min(30.0, 2.0 ** attempt)
            time.sleep(sleep_s)
            continue

    raise RuntimeError(f"[请求失败] 赛事{tid} | 接口{api_type} | 累计{MAX_RETRIES+1}次尝试超时")

def strip_html(value):
    return unescape(re.sub(r"<[^>]+>", " ", value or "")).strip()

def normalize_registration_status(row_html):
    class_match = re.search(r'<a class="register\s+([^"]+)"', row_html, re.I)
    text_match = re.search(r'<a class="register[^"]*"[^>]*>(.*?)</a>', row_html, re.I | re.S)
    raw = f"{class_match.group(1) if class_match else ''} {strip_html(text_match.group(1)) if text_match else ''}".lower()

    if "check" in raw:
        return "check-in"
    if "open" in raw or "register" in raw:
        return "open"
    return "unknown"

def fetch_upcoming_tournaments():
    """抓取 Limitless upcoming 頁面，生成給前端 ticker 使用的輕量 JSON。"""
    url = f"https://play.limitlesstcg.com/tournaments/upcoming?game={GAME_ID}"
    try:
        html = fetch_text(url, api_type="upcoming_tournaments", tid="upcoming")
    except Exception as e:
        print(f"⚠️ upcoming 賽事抓取失敗：{e}")
        return []

    rows = []
    row_re = re.compile(
        r'<tr\s+data-date="(?P<date>[^"]+)"\s+data-name="(?P<name>[^"]+)"'
        r'\s+data-organizer="(?P<organizer>[^"]*)"\s+data-format="(?P<format>[^"]*)"'
        r'\s+data-players="(?P<players>[^"]*)"\s+data-registration="(?P<registration>[^"]*)"'
        r'(?P<attrs>[^>]*)>(?P<body>.*?)</tr>',
        re.I | re.S,
    )

    def int_or_none(raw):
        try:
            return int(str(raw).strip())
        except Exception:
            return None

    for match in row_re.finditer(html):
        body = match.group("body")
        href_match = re.search(r'href="/tournament/([^"/]+)/details"', body)
        if not href_match:
            continue

        tid = href_match.group(1)
        rows.append({
            "game": "POCKET",
            "id": tid,
            "name": unescape(match.group("name")).strip(),
            "date": match.group("date"),
            "format": match.group("format") or None,
            "players": int_or_none(match.group("players")),
            "registrations": int_or_none(match.group("registration")),
            "registrationStatus": normalize_registration_status(body),
            "organizer": unescape(match.group("organizer")).strip() or None,
            "url": f"https://play.limitlesstcg.com/tournament/{tid}/details",
        })

    rows.sort(key=lambda item: item.get("date") or "")
    write_json(UPCOMING_TOURNAMENTS_JSON_PATH, rows)
    print(f"✅ upcoming 賽事列表已保存 | 數量：{len(rows)}")
    return rows

def iso_to_date(iso_str):
    if not iso_str:
        return None
    return datetime.datetime.fromisoformat(iso_str.replace("Z", "+00:00")).date()

def manual_exclusion_reason(summary=None, details=None):
    tid = str(
        ((summary or {}).get("id"))
        or ((details or {}).get("id"))
        or ""
    ).strip()
    if not tid:
        return None
    return MANUAL_EXCLUDED_TOURNAMENTS.get(tid)

def fetch_recent_tournaments():
    """抓取赛事列表（支持不限天数/指定天数两种模式）"""
    out = []
    page = 1
    cutoff = None
    
    if not UNLIMITED_DAYS:
        cutoff = datetime.date.today() - datetime.timedelta(days=DAYS_BACK)
        print(f"📌 有限天数模式 | 抓取最近{DAYS_BACK}天的赛事 | 截止日期: {cutoff}")
    else:
        print(f"📌 不限天数模式 | 抓取所有可获取的赛事（直到API返回空数据）")
    
    while True:
        url = f"{BASE}/tournaments?game={GAME_ID}&limit=50&page={page}"
        print(f"\n----- 分页请求 | 第{page}页 -----")
        arr = get_json(url, api_type="tournament_list", tid=f"page_{page}")
        
        if not arr:
            print(f"第{page}页无数据，终止分页请求")
            break
        
        for t in arr:
            t_id = t.get("id", "未知ID")
            t_players = t.get("players", 0)
            t_date = iso_to_date(t["date"])

            manual_reason = manual_exclusion_reason(t)
            if manual_reason:
                print(f"  ❌ 赛事{t_id} | 手動排除：{manual_reason}")
                continue
            
            if t_players < MIN_PLAYERS:
                print(f"  ❌ 赛事{t_id} | 参与人数{t_players} < {MIN_PLAYERS}，跳过")
                continue
            
            if not UNLIMITED_DAYS and t_date and t_date < cutoff:
                print(f"  ❌ 赛事{t_id} | 日期{t_date} < 截止日期{cutoff}，跳过")
                print(f"\n第{page}页出现过期赛事，终止分页请求")
                return out
            
            out.append(t)
            print(f"  ✅ 赛事{t_id} | 符合条件，加入列表")
        
        page += 1
    
    print(f"\n✅ 新抓取的赛事列表完成 | 总计符合条件的赛事数：{len(out)}")
    return out

def normalize_details_format(raw):
    if raw is None:
        return "STANDARD"
    s = str(raw).strip().upper()
    if s in ("", "STANDARD"):
        return "STANDARD"
    if s in ("NOEX", "NO-EX", "NO_EX"):
        return "NOEX"
    if s in ("CUSTOM", "SPECIAL"):
        return "SPECIAL"
    return s

def get_phase1(details):
    phases = details.get("phases")
    if not isinstance(phases, list) or not phases:
        return None
    return next((p for p in phases if p.get("phase") == 1), phases[0])

def has_banned_cards(details):
    banned_cards = (details or {}).get("bannedCards")
    return isinstance(banned_cards, list) and len(banned_cards) > 0

def validate_tournament(summary, details):
    manual_reason = manual_exclusion_reason(summary, details)
    if manual_reason:
        return False, f"manualExclude={manual_reason}"

    game = str(
        (details or {}).get("game")
        or (summary or {}).get("game", "")
    ).upper()
    if game != "POCKET":
        return False, f"game={game or 'EMPTY'}"

    raw_format = (summary or {}).get("format")
    if raw_format in (None, ""):
        raw_format = (details or {}).get("format")

    fmt = normalize_details_format(raw_format)
    if fmt != "STANDARD":
        return False, f"format={fmt}"

    phase1 = get_phase1(details or {})
    phase1_type = str((phase1 or {}).get("type", "")).upper()
    if phase1_type != "SWISS":
        return False, f"phase1.type={phase1_type or 'EMPTY'}"

    if has_banned_cards(details):
        return False, f"bannedCards={len((details or {}).get('bannedCards') or [])}"

    return True, "ok"


def load_existing_tournaments():
    """加载已有的赛事列表（若文件不存在则返回空列表）"""
    if not os.path.exists(TOURNAMENTS_JSON_PATH):
        print(f"⚠️ 未找到旧的赛事列表文件 {TOURNAMENTS_JSON_PATH}，首次运行")
        return []
    try:
        with open(TOURNAMENTS_JSON_PATH, "r", encoding="utf-8") as f:
            existing = json.load(f)
        print(f"✅ 加载旧赛事列表完成 | 已有 {len(existing)} 场赛事")
        return existing
    except Exception as e:
        print(f"❌ 读取旧赛事列表失败：{str(e)} | 忽略旧数据，按新数据处理")
        return []

# ===================== 核心逻辑（新增 + 近期刷新） =====================
def main():
    global failed_tournaments
    failed_tournaments = []
    fetch_upcoming_tournaments()

    existing_tournaments = load_existing_tournaments()
    existing_tids = {t["id"] for t in existing_tournaments if "id" in t}

    migrated_files, migrated_rows = migrate_existing_hoopa_ex_icons(existing_tids)
    print(
        f"✅ Hoopa ex 圖示正規化完成 | "
        f"更新檔案：{migrated_files} | 更新列：{migrated_rows}"
    )

    recent_tournaments = fetch_recent_tournaments()
    added_tournaments = [t for t in recent_tournaments if t["id"] not in existing_tids]
    added_tids = {t["id"] for t in added_tournaments}
    refresh_tournaments = recent_tournaments if REFRESH_RECENT else added_tournaments
    refresh_tids = {t["id"] for t in refresh_tournaments}

    print(f"\n📊 更新統計：")
    print(f"  - 舊賽事ID數量：{len(existing_tids)}")
    print(f"  - 近期符合門檻賽事ID數量：{len({t['id'] for t in recent_tournaments})}")
    print(f"  - 新增賽事ID數量：{len(added_tids)}")
    print(f"  - 重新抓取既有賽事ID數量：{len(refresh_tids & existing_tids)}")

    total_candidates = len(refresh_tournaments)
    if total_candidates == 0:
        print("\n⚠️ 無符合條件的賽事需要更新，結束流程")
        return

    valid_refreshed_tournaments = []
    excluded_tournaments = []

    mode_label = "近期完整刷新" if REFRESH_RECENT else "僅新增賽事"
    print(f"\n===== 開始{mode_label}：共 {total_candidates} 場候選賽事 =====")

    for idx, t in enumerate(refresh_tournaments, start=1):
        tid = t["id"]
        print(f"\n===== 處理第 {idx}/{total_candidates} 場賽事 | ID: {tid} =====")

        if idx % BATCH_SIZE == 0 and idx != total_candidates:
            print(f"📌 已處理{idx}場賽事，休息{BATCH_SLEEP_SEC}秒...")
            time.sleep(BATCH_SLEEP_SEC)

        try:
            details = get_json(f"{BASE}/tournaments/{tid}/details", api_type="details", tid=tid)

            ok, reason = validate_tournament(t, details)
            if not ok:
                print(f"⏭️ 跳過不符合收錄標準的賽事 {tid} | {reason}")
                excluded_tournaments.append({"id": tid, "reason": reason})
                continue

            time.sleep(0.5)
            standings = get_json(f"{BASE}/tournaments/{tid}/standings", api_type="standings", tid=tid)
            normalized_rows = normalize_hoopa_ex_icons(standings)
            if normalized_rows:
                print(f"✅ 賽事{tid}已正規化 {normalized_rows} 筆 Hoopa ex 圖示")

            time.sleep(0.5)
            pairings = get_json(f"{BASE}/tournaments/{tid}/pairings", api_type="pairings", tid=tid)

            write_json(f"web/public/data/raw/{tid}/details.json", details)
            write_json(f"web/public/data/raw/{tid}/standings.json", standings)
            write_json(f"web/public/data/raw/{tid}/pairings.json", pairings)

            valid_refreshed_tournaments.append(t)
            action_label = "新增" if tid in added_tids else "刷新"
            print(f"✅ 賽事{tid}資料{action_label}完成")

        except Exception as e:
            print(f"❌ 賽事{tid}抓取失敗：{str(e)} | 保留既有資料並跳過")
            continue

    # 既有賽事以最新摘要取代；新賽事則追加，抓取失敗的既有賽事保持原狀。
    refreshed_by_id = {t["id"]: t for t in valid_refreshed_tournaments}
    all_tournaments = [
        refreshed_by_id.get(t.get("id"), t)
        for t in existing_tournaments
    ]
    all_tournaments.extend(
        t for t in valid_refreshed_tournaments
        if t["id"] not in existing_tids
    )

    unique_tournaments = []
    unique_tids = set()
    for t in all_tournaments:
        if t["id"] not in unique_tids:
            unique_tids.add(t["id"])
            unique_tournaments.append(t)

    write_json(TOURNAMENTS_JSON_PATH, unique_tournaments)
    print(f"✅ 合格賽事列表已保存 | 總唯一賽事數：{len(unique_tournaments)}")

    if excluded_tournaments:
        write_json("web/public/data/excluded_tournaments.json", excluded_tournaments)
        print(f"⚠️ 已排除 {len(excluded_tournaments)} 場不符合收錄標準的賽事")

    print("\n===== 資料抓取與刷新流程結束 =====")
    print(f"📊 統計：")
    print(f"  - 候選賽事總數：{total_candidates}")
    print(f"  - 通過收錄標準並完成更新：{len(valid_refreshed_tournaments)}")
    print(f"  - 排除賽事數：{len(excluded_tournaments)}")
    print(f"  - 抓取失敗數：{len(failed_tournaments)}")

    if failed_tournaments:
        write_json("web/public/data/failed_tournaments.json", failed_tournaments)


if __name__ == "__main__":
    main()
