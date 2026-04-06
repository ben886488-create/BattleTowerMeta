import json, os, datetime, math, re, hashlib
from urllib.parse import quote

# ===================== 公共配置（和原代码一致） =====================
MIN_PLAYERS = int(os.environ.get("MIN_PLAYERS", "32"))
USAGE_THRESHOLD = float(os.environ.get("USAGE_THRESHOLD", "0.01"))
TOP_CUT_N = int(os.environ.get("TOP_CUT_N", "32"))
W1, W2, W3 = 0.4, 0.5, 0.1  # 加权系数

# ===================== 公共工具函数 =====================
def write_json(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)

INVALID_DECK_IDS = {"", "unknown", "undefined", "null", "none", "nan"}

def normalize_deck_id(value):
    s = str(value or "").strip()
    if s.lower() in INVALID_DECK_IDS:
        return "unknown"
    return s

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
    phases = (details or {}).get("phases")
    if not isinstance(phases, list) or not phases:
        return None
    return next((p for p in phases if p.get("phase") == 1), phases[0])

def has_banned_cards(details):
    banned_cards = (details or {}).get("bannedCards")
    return isinstance(banned_cards, list) and len(banned_cards) > 0

def validate_tournament(summary, details):
    summary = summary or {}
    details = details or {}

    game = str(details.get("game") or summary.get("game") or "").upper()
    if game != "POCKET":
        return False, f"game={game or 'EMPTY'}"

    # format 優先看 tournaments.json 那筆 summary，沒有再 fallback 到 details.json
    raw_format = summary.get("format")
    if raw_format in (None, ""):
        raw_format = details.get("format")

    fmt = normalize_details_format(raw_format)
    if fmt != "STANDARD":
        return False, f"format={fmt}"

    phase1 = get_phase1(details)
    phase1_type = str((phase1 or {}).get("type", "")).upper()
    if phase1_type != "SWISS":
        return False, f"phase1.type={phase1_type or 'EMPTY'}"

    if has_banned_cards(details):
        return False, f"bannedCards={len(details.get('bannedCards') or [])}"

    return True, "ok"

def get_deck_id_from_standing(standing):
    deck_info = standing.get("deck", {})
    return normalize_deck_id(deck_info.get("id"))

def safe_int(value, default=0):
    try:
        return int(value)
    except (TypeError, ValueError):
        return default

def normalize_icon_list(raw):
    if not isinstance(raw, list):
        return []
    return [str(item).strip() for item in raw if str(item).strip()]

def make_player_slug(player_name):
    text = str(player_name or "").strip()
    if not text:
        return ""
    base = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    if not base:
        base = "player"
    digest = hashlib.sha1(text.encode("utf-8")).hexdigest()[:8]
    return f"{base}-{digest}"

def build_limitless_matches_url(tournament_id, player_name):
    tid = str(tournament_id or "").strip()
    player = str(player_name or "").strip()
    if not tid or not player:
        return ""
    return (
        f"https://play.limitlesstcg.com/tournament/{quote(tid, safe='')}"
        f"/player/{quote(player, safe='')}"
    )

def build_player_entry(summary, details, standing):
    player_name = str((standing or {}).get("player") or "").strip()
    if not player_name:
        return None

    deck_info = (standing or {}).get("deck")
    deck_info = deck_info if isinstance(deck_info, dict) else {}
    record = (standing or {}).get("record")
    record = record if isinstance(record, dict) else {}

    placing_raw = (standing or {}).get("placing")
    placing = safe_int(placing_raw, None)
    points = points_by_placing(placing) if placing is not None else 0.0

    tournament_id = str((summary or {}).get("id") or (details or {}).get("id") or "").strip()
    tournament_date = (details or {}).get("date") or (summary or {}).get("date")
    tournament_players = safe_int(
        (details or {}).get("players") or (summary or {}).get("players"),
        0,
    ) or None

    return {
        "player": player_name,
        "playerSlug": make_player_slug(player_name),
        "country": (standing or {}).get("country") or "",
        "points": points,
        "placing": placing,
        "tournamentId": tournament_id,
        "tournamentName": (details or {}).get("name") or (summary or {}).get("name") or tournament_id,
        "tournamentDate": tournament_date,
        "tournamentPlayers": tournament_players,
        "matchesUrl": build_limitless_matches_url(tournament_id, player_name),
        "deckId": normalize_deck_id(deck_info.get("id")),
        "deckName": str(deck_info.get("name") or "").strip(),
        "deckIcons": normalize_icon_list(deck_info.get("icons")),
        "wins": safe_int(record.get("wins"), 0),
        "losses": safe_int(record.get("losses"), 0),
        "ties": safe_int(record.get("ties"), 0),
        "drop": (standing or {}).get("drop"),
    }

def points_by_placing(placing):
    """根据排名计算得分（原代码中的逻辑，需和原代码保持一致）"""
    if placing == 1:
        return 10.0
    elif placing == 2:
        return 8.0
    elif 3 <= placing <= 4:
        return 6.0
    elif 5 <= placing <= 8:
        return 4.0
    elif 9 <= placing <= 16:
        return 2.0
    elif 17 <= placing <= 32:
        return 1.0
    else:
        return 0.0

def minmax_scale(data):
    """最小-最大标准化（缩放到0~1）"""
    if not data:
        return {}
    values = list(data.values())
    min_val = min(values)
    max_val = max(values)
    if max_val == min_val:
        return {k: 0.0 for k in data.keys()}
    return {k: (v - min_val) / (max_val - min_val) for k, v in data.items()}

def is_perfect_score(score, eps=1e-9):
    return abs(score - 1.0) < eps

def tier_label(score, top32_share_pct, has_another_deck_score_ge_09):
    """根据综合得分 + Top32占比返回Tier等级"""
    if top32_share_pct < 0.5:
        return "F"

    if is_perfect_score(score):
        return "SS" if has_another_deck_score_ge_09 else "SSS"

    if score >= 0.9:
        return "S"
    elif score >= 0.8:
        return "A"
    elif score >= 0.7:
        return "B"
    elif score >= 0.5:
        return "C"
    elif score >= 0.3:
        return "D"
    elif score >= 0.1:
        return "E"
    else:
        return "F"

# ===================== 核心逻辑：读取本地原始数据并统计 =====================
def main():
    # 1. 读取本地的赛事列表
    tournaments_path = "web/public/data/tournaments.json"
    with open(tournaments_path, "r", encoding="utf-8") as f:
        original_tournaments = json.load(f)
    print(f"读取到本地 {len(original_tournaments)} 场赛事数据")
    
    # 初始化缺失赛事ID列表（核心新增）
    missing_tournament_ids = []
    invalid_tournament_ids = []
    invalid_tournament_details = []
    
    # 2. 初始化统计字典
    deck_total_counts = {}  # 所有赛事牌组出场次数
    total_entries_all = 0
    deck_top32_counts = {}  # Top32牌组出场数
    deck_weighted_points = {}  # Top32牌组加权得分
    top32_total_slots = 0
    
    # 玩家相关统计（含新增的出场次数）
    player_points = {}
    player_country = {}
    player_games = {}  # 选手出场次数
    player_entries = []
    
    matchup = {}  # 胜率矩阵
    
    # 3. 遍历赛事，读取本地原始数据并统计
    for idx, t in enumerate(original_tournaments):
        tid = t["id"]
        print(f"正在统计第 {idx+1}/{len(original_tournaments)} 场赛事，ID: {tid}")
        
        # 读取本地raw文件夹中的数据
        try:
            with open(f"web/public/data/raw/{tid}/details.json", "r", encoding="utf-8") as f:
                details = json.load(f)
            with open(f"web/public/data/raw/{tid}/standings.json", "r", encoding="utf-8") as f:
                standings = json.load(f)
            with open(f"web/public/data/raw/{tid}/pairings.json", "r", encoding="utf-8") as f:
                pairings = json.load(f)
        except FileNotFoundError:
            print(f"警告：赛事 {tid} 的原始数据文件缺失，跳过")
            missing_tournament_ids.append(tid)  # 记录缺失的赛事ID
            continue
        
        ok, reason = validate_tournament(t, details)
        if not ok:
            print(f"跳過不符合收錄標準的賽事：{tid} | {reason}")
            invalid_tournament_ids.append(tid)
            invalid_tournament_details.append({"id": tid, "reason": reason})
            continue
        
        # 构建「玩家→牌组ID」映射
        p2deck = {}
        for s in standings:
            p2deck[s["player"]] = get_deck_id_from_standing(s)
        
        # 统计：全赛事牌组出场数 + 选手出场次数
        for s in standings:
            entry = build_player_entry(t, details, s)
            if entry:
                player_entries.append(entry)
                player_name = entry["player"]
                player_games[player_name] = player_games.get(player_name, 0) + 1
                if entry["country"] and not player_country.get(player_name):
                    player_country[player_name] = entry["country"]

            deck = get_deck_id_from_standing(s)
            if deck == "unknown":
                continue
            deck_total_counts[deck] = deck_total_counts.get(deck, 0) + 1
            total_entries_all += 1
        
        # 统计：Top32数据
        for s in standings:
            placing = s.get("placing")
            if not placing or placing > TOP_CUT_N:
                continue
            deck = get_deck_id_from_standing(s)
            if deck == "unknown":
                continue
            
            # Top32出场数
            deck_top32_counts[deck] = deck_top32_counts.get(deck, 0) + 1
            top32_total_slots += 1
            
            # 加权得分
            pts = points_by_placing(int(placing))
            deck_weighted_points[deck] = deck_weighted_points.get(deck, 0) + pts
            
            # 玩家得分/国家
            player = s["player"]
            player_points[player] = player_points.get(player, 0) + pts
            player_country[player] = s.get("country", "")
        
        # 统计：胜率矩阵
        for m in pairings:
            p1, p2 = m.get("player1"), m.get("player2")
            winner = m.get("winner")
            if not p1 or not p2 or winner in (0, -1, None):
                continue
            
            d1, d2 = p2deck.get(p1, "unknown"), p2deck.get(p2, "unknown")
            if d1 == "unknown" or d2 == "unknown":
                continue
            
            # 记录A vs B的胜负
            w, tot = matchup.get((d1, d2), (0, 0))
            tot += 1
            if winner == p1:
                w += 1
            matchup[(d1, d2)] = (w, tot)
            
            # 反向记录B vs A
            w, tot = matchup.get((d2, d1), (0, 0))
            tot += 1
            if winner == p2:
                w += 1
            matchup[(d2, d1)] = (w, tot)
    
    # ===================== 核心新增逻辑：处理缺失赛事ID =====================
    # 1. 打印缺失的赛事ID
    print("\n===== 缺失原始数据的赛事ID列表 =====")
    if missing_tournament_ids:
        for tid in missing_tournament_ids:
            print(f"- {tid}")
        print(f"总计缺失 {len(missing_tournament_ids)} 场赛事数据")
    else:
        print("无缺失赛事数据")
    
    # 2. 过滤tournaments列表，移除缺失ID的条目
    excluded_ids = set(missing_tournament_ids) | set(invalid_tournament_ids)

    filtered_tournaments = [
        t for t in original_tournaments
        if t["id"] not in excluded_ids
    ]
    
    # 3. 保存过滤后的tournaments.json（覆盖原文件）
    write_json(tournaments_path, filtered_tournaments)
    print(f"\n===== 已更新tournaments.json =====")
    print(f"原赛事数量：{len(original_tournaments)}")
    print(f"过滤后赛事数量：{len(filtered_tournaments)}")
    print(
        f"已移除 {len(excluded_ids)} 场赛事"
        f"（缺少原始数据：{len(missing_tournament_ids)}，不符合收录条件：{len(invalid_tournament_ids)}）"
    )
    
    # 4. 筛选有效牌组（使用率≥1%）
    if total_entries_all == 0:
        eligible_decks = []
    else:
        eligible_decks = [
            d for d, c in deck_total_counts.items()
            if (c / total_entries_all) >= USAGE_THRESHOLD
        ]
    print(f"\n筛选出 {len(eligible_decks)} 个有效牌组（使用率≥{USAGE_THRESHOLD*100}%）")
    
    # 5. 计算Tier核心指标（原始→对数→标准化）
    # 原始数据
    data1 = {d: float(deck_top32_counts.get(d, 0)) for d in eligible_decks}  # Top32出场数
    data2 = {d: float(deck_weighted_points.get(d, 0)) for d in eligible_decks}  # 加权得分
    data3 = {d: (data1[d] / top32_total_slots) * 100.0 if top32_total_slots > 0 else 0.0 for d in eligible_decks}  # Top32占比
    
    # 对数转换（平滑数据）
    log1 = {d: math.log1p(v) for d, v in data1.items()}
    log2 = {d: math.log1p(v) for d, v in data2.items()}
    log3 = {d: math.log1p(v) for d, v in data3.items()}
    
    # 标准化（0~1）
    std1 = minmax_scale(log1)
    std2 = minmax_scale(log2)
    std3 = minmax_scale(log3)
    
    # 6. 计算综合得分与Tier等级
    tier_rows = []
    for d in eligible_decks:
        score = W1 * std1.get(d, 0.0) + W2 * std2.get(d, 0.0) + W3 * std3.get(d, 0.0)
        usage = deck_total_counts.get(d, 0) / total_entries_all if total_entries_all else 0.0
        tier_rows.append({
            "deck": d,
            "usage": usage,
            "total_samples": deck_total_counts.get(d, 0),
            "data1_top32_appearances": data1.get(d, 0.0),
            "data2_weighted_points": data2.get(d, 0.0),
            "data3_top32_share_pct": data3.get(d, 0.0),
            "log_data1": log1.get(d, 0.0),
            "log_data2": log2.get(d, 0.0),
            "log_data3": log3.get(d, 0.0),
            "std_data1": std1.get(d, 0.0),
            "std_data2": std2.get(d, 0.0),
            "std_data3": std3.get(d, 0.0),
            "score": score,
            "tier": "",
        })
    for row in tier_rows:
        has_another_deck_score_ge_09 = any(
            other["deck"] != row["deck"] and other["score"] >= 0.9
            for other in tier_rows
        )
        row["tier"] = tier_label(
            row["score"],
            row["data3_top32_share_pct"],
            has_another_deck_score_ge_09,
        )
        
    # 7. 生成玩家排名（含出场次数）
    players = [
        {
            "player": p,
            "points": pts,
            "country": player_country.get(p, ""),
            "games": player_games.get(p, 0)  # 新增的出场次数字段
        }
        for p, pts in player_points.items()
    ]
    players.sort(key=lambda x: x["points"], reverse=True)
    
    # 8. 格式化胜率矩阵
    matchup_out = [
        {"deckA": a, "deckB": b, "winsA": w, "total": t, "winrateA": (w / t if t else None)}
        for (a, b), (w, t) in matchup.items()
    ]
    
    # 9. 生成元信息
    meta = {
        "generated_at": datetime.datetime.now(datetime.UTC).isoformat().replace("+00:00", "Z"),
        "days_back": int(os.environ.get("DAYS_BACK", "14")),
        "min_players": MIN_PLAYERS,
        "usage_threshold": USAGE_THRESHOLD,
        "top_cut_n": TOP_CUT_N,
        "tournaments_count": len(filtered_tournaments),  # 改为过滤后的赛事数量
        "total_entries_all": total_entries_all,
        "top32_total_slots": top32_total_slots,
        "weights": {"data1": W1, "data2": W2, "data3": W3},
        "tier_thresholds": {
            "SSS": "score=1.0 and no second deck score>=0.9",
            "SS": "score=1.0",
            "S": 0.9,
            "A": 0.8,
            "B": 0.7,
            "C": 0.5,
            "D": 0.3,
            "E": 0.1,
            "F": "<0.1 or top32_share_pct<0.5"
        },
        "min_top32_share_pct_for_tiering": 0.5,
        "missing_tournament_ids": missing_tournament_ids,
        "invalid_tournament_ids": invalid_tournament_ids,
        "invalid_tournament_details": invalid_tournament_details,
    }
    
    # 10. 保存所有结果文件
    write_json("web/public/data/tier.json", tier_rows)
    write_json("web/public/data/players.json", players)
    write_json("web/public/data/player_entries.json", player_entries)
    write_json("web/public/data/matchups.json", matchup_out)
    write_json("web/public/data/meta.json", meta)
    
    print("\n统计分析完成！已生成：")
    print("- tier.json（牌组Tier数据）")
    print("- players.json（玩家排名，含出场次数）")
    print("- player_entries.json（玩家逐场成绩明细）")
    print("- matchups.json（胜率矩阵）")
    print("- meta.json（统计元信息，含缺失赛事ID）")
    print(f"- 已更新 {tournaments_path}（移除缺失数据的赛事）")

if __name__ == "__main__":
    main()
