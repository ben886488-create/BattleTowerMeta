import json
import os

# ===================== 核心函数：兼容空值的排名得分计算 =====================
def points_by_placing(placing):
    """
    根据选手排名计算得分（增强版）
    兼容场景：placing为None/缺失/空字符串/非数值类型/非法数字
    """
    # 1. 处理空值/缺失场景
    if placing is None or placing == "":
        return 0.0
    
    # 2. 尝试转换为整数（兼容字符串型数字，如"1"、"32"）
    try:
        placing = int(placing)
    except (ValueError, TypeError):  # 非数字（如"N/A"、"无"）或类型错误
        return 0.0
    
    # 3. 原得分逻辑（仅合法整数进入此分支）
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

# ===================== 工具函数：JSON文件写入（自动创建目录） =====================
def write_json(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)

# ===================== 主函数：提取赛事+选手信息 =====================
def main():
    # 配置文件路径（和原process_data.py保持一致）
    tournaments_list_path = "web/public/data/tournaments.json"
    output_file_path = "web/public/data/tournament_players_final.json"
    
    # 初始化最终结果列表（仅保留你要求的字段结构）
    final_tournament_data = []
    # 记录缺失数据的赛事（便于排查）
    missing_data_tournaments = []

    # 1. 读取赛事总列表
    if not os.path.exists(tournaments_list_path):
        print(f"❌ 错误：未找到赛事列表文件 {tournaments_list_path}")
        return
    
    with open(tournaments_list_path, "r", encoding="utf-8") as f:
        all_tournaments = json.load(f)
    print(f"✅ 成功读取 {len(all_tournaments)} 场赛事总列表")

    # 2. 遍历每个赛事提取信息
    for index, tour in enumerate(all_tournaments):
        tour_id = tour["id"]
        print(f"\n处理第 {index+1}/{len(all_tournaments)} 场赛事 | ID: {tour_id}")

        # 2.1 读取赛事详情和选手排名数据（捕获文件缺失异常）
        try:
            # 读取赛事基础信息（名称、时间）
            details_path = f"web/public/data/raw/{tour_id}/details.json"
            with open(details_path, "r", encoding="utf-8") as f:
                tour_details = json.load(f)
            
            # 读取选手排名数据（核心：参赛人数、选手信息）
            standings_path = f"web/public/data/raw/{tour_id}/standings.json"
            with open(standings_path, "r", encoding="utf-8") as f:
                player_standings = json.load(f)
        
        except FileNotFoundError:
            print(f"⚠️  赛事 {tour_id} 缺失details/standings文件，跳过")
            missing_data_tournaments.append(tour_id)
            continue

        # 2.2 仅处理POCKET赛事（过滤非目标赛事）
        game_type = str(tour_details.get("game", "")).upper()
        if game_type != "POCKET":
            print(f"ℹ️  赛事 {tour_id} 非POCKET类型，跳过")
            continue

        # 2.3 构建你要求的核心结构
        tournament_info = {
            "tournament_id": tour_id,
            "tournament_name": tour_details.get("name", "未知赛事名称"),
            "tournament_date": tour_details.get("date", "未知时间"),
            "player_count": len(player_standings),  # 参赛人数=选手列表长度
            "players": []  # 初始化选手列表
        }

        # 2.4 填充选手信息（兼容placing异常）
        for player in player_standings:
            player_info = {
                "player_name": player.get("player", "未知选手"),
                "country": player.get("country", "未知国籍"),
                "points": points_by_placing(player.get("placing")),  # 调用兼容版函数
                "participation_count": 1  # 参赛场次默认1
            }
            tournament_info["players"].append(player_info)

        # 2.5 将当前赛事加入最终列表
        final_tournament_data.append(tournament_info)

    # 3. 保存最终结果（仅你要求的结构，无多余元信息）
    write_json(output_file_path, final_tournament_data)

    # 4. 输出运行总结
    print("\n" + "="*50)
    print(f"✅ 处理完成！最终生成 {len(final_tournament_data)} 场有效POCKET赛事数据")
    print(f"📄 结果文件已保存至：{output_file_path}")
    print(f"⚠️  缺失数据的赛事数量：{len(missing_data_tournaments)}")
    if missing_data_tournaments:
        print(f"   缺失数据的赛事ID示例：{missing_data_tournaments[:5]}")  # 仅显示前5个

if __name__ == "__main__":
    main()
