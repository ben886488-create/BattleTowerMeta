import copy
import json
import tempfile
import unittest
import contextlib
import io
import os
from pathlib import Path
from unittest.mock import patch

from build_multideck_views import build_all, build_event
from pocket_multideck import is_multideck, merge_index, standing_decks
from build_tournament_pages import normalize_entry, deck_entries, compute_archetypes
import fetch_raw_data


def deck(key):
    return {"id": key, "name": key.upper(), "icons": [key]}


class DualDeckStatisticsTests(unittest.TestCase):
    def setUp(self):
        self.details = {"id": "test", "name": "Dual", "game": "POCKET", "players": 64, "multideck": True, "date": "2026-11-04T08:30:00Z"}
        self.standings = [
            {"player": "alice", "placing": 1, "decks": {"2": deck("b"), "1": deck("a")}},
            {"player": "bob", "placing": 2, "decks": {"1": deck("c"), "2": deck("d")}},
        ]
        self.matches = [
            {"player1": "alice", "player2": "bob", "winner": "alice", "games": {
                "1": {"p1deck": "1", "p2deck": "2", "winner": "alice"},
                "2": {"p1deck": 2, "p2deck": 1, "winner": "bob"},
                "3": {"p1deck": "1", "p2deck": "2", "winner": 0},
                "4": {"p2deck": "2", "winner": "alice"},
            }},
            {"player1": "bob", "player2": "alice", "winner": "bob", "games": {}},
            {"player1": "alice", "winner": "alice", "games": {}},
        ]

    def build(self, standings=None, matches=None):
        return build_event(self.details, self.details, self.standings if standings is None else standings, self.matches if matches is None else matches)

    def test_match_results_are_not_assigned_to_both_decks(self):
        result = self.build()
        rows = {row["id"]: row for row in result["decks"]}
        self.assertEqual((rows["a"]["wins"], rows["a"]["losses"], rows["a"]["draws"]), (1, 0, 1))
        self.assertEqual((rows["b"]["wins"], rows["b"]["losses"], rows["b"]["draws"]), (0, 1, 0))
        self.assertEqual(result["coverage"]["attributedGames"], 3)
        self.assertEqual(result["coverage"]["unattributedGames"], 1)
        self.assertEqual(result["coverage"]["matchesWithoutGames"], 1)
        self.assertEqual(result["coverage"]["completedMatches"], 2)
        self.assertEqual(sum(row["wins"] + row["losses"] + row["draws"] for row in rows.values()), 6)

    def test_missing_games_do_not_invent_deck_win_rates(self):
        result = self.build(matches=[{"player1": "alice", "player2": "bob", "winner": "alice"}])
        self.assertTrue(all(row["wins"] == row["losses"] == row["draws"] == 0 for row in result["decks"]))
        self.assertEqual(sum(row["wins"] for row in result["lineups"]), 1)

    def test_slot_order_duplicate_players_and_byes(self):
        rows = self.standings + [copy.deepcopy(self.standings[0])]
        result = self.build(standings=rows)
        self.assertEqual(result["coverage"]["entrants"], 2)
        self.assertEqual(result["coverage"]["registeredDecks"], 4)
        self.assertEqual(result["lineups"][0]["decks"], ["a", "b"])
        self.assertEqual([slot for slot, _, _ in standing_decks(rows[0])], ["1", "2"])

    def test_identical_archetypes_preserve_two_registration_slots(self):
        rows = copy.deepcopy(self.standings)
        rows[0]["decks"]["2"] = deck("a")
        result = self.build(standings=rows, matches=[])
        self.assertEqual(next(row for row in result["decks"] if row["id"] == "a")["registrations"], 2)
        self.assertIn(["a", "a"], [row["decks"] for row in result["lineups"]])

    def test_unresolved_games_and_double_losses_are_not_wins(self):
        matches = [{"player1": "alice", "player2": "bob", "winner": -1, "games": {"1": {"p1deck": 1, "p2deck": 1, "winner": -1}}}]
        result = self.build(matches=matches)
        self.assertEqual(result["coverage"]["completedMatches"], 0)
        self.assertEqual(result["coverage"]["unresolvedGames"], 1)
        self.assertEqual(result["coverage"]["attributedGames"], 0)

    def test_third_deck_does_not_enter_dual_deck_environment(self):
        rows = copy.deepcopy(self.standings)
        rows[0]["decks"]["3"] = deck("e")
        with self.assertRaises(ValueError):
            self.build(standings=rows)

    def test_index_merge_and_failed_rebuild_preserve_previous_data(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            path = root / "multideck/tournaments.json"
            merge_index([self.details], path)
            merge_index([self.details], path)
            self.assertEqual(len(json.loads(path.read_text(encoding="utf-8"))), 1)
            output = root / "multideck/meta.json"
            output.write_text('{"tournaments":[{"id":"prior"}]}', encoding="utf-8")
            with self.assertRaises(RuntimeError):
                build_all(root)
            self.assertEqual(json.loads(output.read_text())["tournaments"][0]["id"], "prior")

    def test_detection_uses_api_metadata_or_numbered_decks_not_event_name(self):
        self.assertTrue(is_multideck({"multideck": True}))
        self.assertTrue(is_multideck({}, self.standings))
        self.assertFalse(is_multideck({"name": "Dual Fusion standard event"}, [{"deck": deck("a")}]))

    def test_tournament_page_keeps_one_player_and_both_numbered_decklists(self):
        raw = {**self.standings[0], "decklists": {
            "1": {"pokemon": [{"set": "C1", "number": "25", "name": "Fuecoco ex", "count": 2}]},
            "2": {"pokemon": [{"set": "B1", "number": "151", "name": "Mega Absol ex", "count": 2}]},
        }}
        player = normalize_entry(raw, 0)
        self.assertEqual(player["player"], "alice")
        self.assertEqual(set(player["decklists"]), {"1", "2"})
        expanded = deck_entries([player])
        self.assertEqual(len(expanded), 2)
        self.assertEqual(expanded[0]["decklist"]["cards"][0]["name"], "Fuecoco ex")
        self.assertEqual(sum(row["count"] for row in compute_archetypes(expanded)), 2)

    def run_collector(self, directory, fail_pairings=False):
        details = {**self.details, "phases": [{"phase": 1, "type": "SWISS", "mode": "BO1"}]}
        def response(url, *args, **kwargs):
            kind = url.rsplit('/', 1)[-1]
            if kind == 'pairings' and fail_pairings:
                raise OSError('temporary source failure')
            return {'details': details, 'standings': self.standings, 'pairings': self.matches}[kind]
        previous = Path.cwd()
        try:
            os.chdir(directory)
            with patch.object(fetch_raw_data, 'fetch_upcoming_tournaments'), patch.object(fetch_raw_data, 'migrate_existing_hoopa_ex_icons', return_value=(0, 0)), patch.object(fetch_raw_data, 'fetch_recent_tournaments', return_value=[self.details]), patch.object(fetch_raw_data, 'get_json', side_effect=response), patch.object(fetch_raw_data.time, 'sleep'), contextlib.redirect_stdout(io.StringIO()):
                fetch_raw_data.main()
        finally:
            os.chdir(previous)

    def test_daily_collector_keeps_multi_deck_events_out_of_single_deck_index(self):
        with tempfile.TemporaryDirectory() as directory:
            self.run_collector(directory)
            root = Path(directory) / 'web/public/data'
            self.assertEqual(json.loads((root / 'tournaments.json').read_text(encoding='utf-8')), [])
            self.assertEqual(json.loads((root / 'multideck/tournaments.json').read_text(encoding='utf-8'))[0]['id'], 'test')
            self.assertTrue((root / 'raw/test/standings.json').exists())

    def test_failed_refresh_does_not_replace_known_good_source_files_or_index(self):
        with tempfile.TemporaryDirectory() as directory:
            self.run_collector(directory)
            root = Path(directory) / 'web/public/data'
            prior = (root / 'raw/test/details.json').read_bytes()
            self.run_collector(directory, fail_pairings=True)
            self.assertEqual((root / 'raw/test/details.json').read_bytes(), prior)
            self.assertEqual(len(json.loads((root / 'multideck/tournaments.json').read_text(encoding='utf-8'))), 1)


if __name__ == "__main__":
    unittest.main()
