import contextlib
import copy
import io
import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import fetch_raw_data
import process_data
import build_precomputed_views as views
from build_tournament_pages import normalize_entry, deck_entries, compute_card_usage
from pocket_decks import deck_pairings, expand_standings, is_multideck, load_tournament_index


def deck(key):
    return {"id": key, "name": key.upper(), "icons": [key]}


def decklist(name):
    return {"pokemon": [{"set": "C1", "number": "25", "name": name, "count": 2}]}


def fixture():
    details = {"id": "dual", "name": "Dual", "game": "POCKET", "format": None, "players": 64, "multideck": True, "date": "2026-11-04T08:30:00Z", "phases": [{"phase": 1, "type": "SWISS", "mode": "BO3"}]}
    standings = [
        {"player": "alice", "placing": 1, "country": "HK", "record": {"wins": 1, "losses": 0, "ties": 0}, "decks": {"2": deck("b"), "1": deck("a")}, "decklists": {"1": decklist("A"), "2": decklist("B")}},
        {"player": "bob", "placing": 2, "country": "US", "record": {"wins": 0, "losses": 1, "ties": 0}, "decks": {"1": deck("c"), "2": deck("d")}, "decklists": {"1": decklist("C"), "2": decklist("D")}},
    ]
    pairings = [{"player1": "alice", "player2": "bob", "winner": "alice", "p1Points": 2, "p2Points": 1, "games": {
        "1": {"p1deck": "1", "p2deck": "2", "winner": "alice"},
        "2": {"p1deck": 2, "p2deck": 1, "winner": "bob"},
        "3": {"p1deck": "1", "p2deck": "2", "winner": 0},
        "4": {"p2deck": "2", "winner": "alice"},
        "5": {"p1deck": "1", "p2deck": "2", "winner": -1},
    }}]
    return details, standings, pairings


class PocketDeckCompatibilityTests(unittest.TestCase):
    def setUp(self):
        self.details, self.standings, self.pairings = fixture()

    def tournament(self):
        return {**self.details, "startMs": views.parse_ms(self.details["date"]), "standings": self.standings, "pairings": self.pairings}

    def test_registrations_expand_by_numbered_slot_without_changing_players(self):
        rows = expand_standings(self.standings)
        self.assertEqual(len(self.standings), 2)
        self.assertEqual([row["deck"]["id"] for row in rows], ["a", "b", "c", "d"])
        self.assertEqual(rows[1]["decklist"]["pokemon"][0]["name"], "B")
        self.assertEqual(expand_standings(rows), rows)

    def test_identical_archetypes_still_count_as_two_registered_decks(self):
        self.standings[0]["decks"]["2"] = deck("a")
        self.assertEqual([row["deck"]["id"] for row in expand_standings(self.standings)].count("a"), 2)

    def test_single_deck_shapes_and_results_are_unchanged(self):
        rows = [{"player": "solo", "deck": deck("a"), "decklist": decklist("A")}]
        self.assertEqual(expand_standings(rows), rows)
        self.assertEqual(list(deck_pairings(self.pairings)), self.pairings)
        self.assertFalse(is_multideck({"name": "Dual Fusion"}, rows))

    def test_game_results_never_inherit_whole_match_points(self):
        games = list(deck_pairings(self.pairings, True))
        self.assertEqual(len(games), 4)
        self.assertNotIn("p1Points", games[1])
        self.assertEqual(views.parse_pairing_result(games[1], "alice", "bob"), (0, 1))
        self.assertIsNone(views.parse_pairing_result(games[-1], "alice", "bob"))

    def test_shared_top_decks_include_both_decks_and_only_attributed_results(self):
        scope = views.build_top_decks_scope([self.tournament()], "all")
        rows = {row["key"]: row for row in scope["rows"]}
        self.assertEqual(scope["totalAllSamples"], 4)
        self.assertEqual(set(rows), {"a", "b", "c", "d"})
        self.assertEqual(rows["a"]["winRate"], .75)
        self.assertEqual(rows["b"]["winRate"], 0)
        self.assertEqual(rows["c"]["winRate"], 1)

    def test_missing_game_data_does_not_apply_match_win_to_both_decks(self):
        self.pairings[0].pop("games")
        scope = views.build_top_decks_scope([self.tournament()], "all")
        self.assertTrue(all(row["winRate"] is None for row in scope["rows"]))
        self.assertEqual(scope["totalAllSamples"], 4)

    def test_existing_profile_includes_second_deck_cards_and_actual_game_result(self):
        scope = views.build_profile_scope("b", [self.tournament()], "all")["analytics"]
        self.assertEqual(scope["targetStandingRows"], 1)
        self.assertEqual(scope["totalStandingRows"], 4)
        self.assertEqual(scope["losses"], 1)
        self.assertEqual(scope["wins"], 0)
        self.assertEqual(scope["cardsFlat"][0]["name"], "B")

    def test_player_entry_remains_one_record_with_both_decks(self):
        entry = process_data.build_player_entry(self.details, self.details, self.standings[0])
        self.assertEqual(len(entry["decks"]), 2)
        self.assertEqual(entry["points"], 10)
        self.assertEqual(entry["wins"], 1)

    def test_report_keeps_two_lists_and_card_denominator_counts_both(self):
        normalized = [normalize_entry(row, i) for i, row in enumerate(self.standings)]
        expanded = deck_entries(normalized)
        self.assertEqual(len(normalized), 2)
        self.assertEqual(len(expanded), 4)
        usage = compute_card_usage(expanded)
        self.assertTrue(usage)

    def test_legacy_index_migrates_into_shared_index_and_deduplicates(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'multideck').mkdir()
            (root / 'multideck/tournaments.json').write_text(json.dumps([self.details]), encoding='utf-8')
            (root / 'tournaments.json').write_text(json.dumps([{**self.details, 'name': 'current'}]), encoding='utf-8')
            rows = load_tournament_index(root / 'tournaments.json')
            self.assertEqual(len(rows), 1)
            self.assertEqual(rows[0]['name'], 'current')

    def test_mixed_events_share_tier_data_but_do_not_duplicate_player_points(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory) / 'web/public/data'
            single = {**self.details, 'id': 'single', 'multideck': False}
            single_rows = [{**row, 'deck': deck('a'), 'decks': {}, 'decklists': {}} for row in self.standings]
            for details, standings, pairings in [(self.details, self.standings, self.pairings), (single, single_rows, [])]:
                folder = root / 'raw' / details['id'];folder.mkdir(parents=True)
                for name, data in [('details', details), ('standings', standings), ('pairings', pairings)]:
                    (folder / f'{name}.json').write_text(json.dumps(data), encoding='utf-8')
            (root / 'tournaments.json').write_text(json.dumps([self.details, single]), encoding='utf-8')
            previous = Path.cwd()
            try:
                os.chdir(directory)
                with contextlib.redirect_stdout(io.StringIO()): process_data.main()
            finally:
                os.chdir(previous)
            entries = json.loads((root / 'player_entries.json').read_text())
            players = json.loads((root / 'players.json').read_text())
            meta = json.loads((root / 'meta.json').read_text())
            self.assertEqual(len(entries), 4)
            self.assertEqual(next(row for row in players if row['player'] == 'alice')['points'], 20)
            self.assertEqual(meta['total_entries_all'], 6)
            self.assertEqual(meta['total_player_entries'], 4)
            self.assertEqual(meta['tournaments_count'], 2)

    def test_collector_persists_dual_event_in_the_normal_index(self):
        with tempfile.TemporaryDirectory() as directory:
            previous = Path.cwd()
            try:
                os.chdir(directory)
                payloads = {'details': self.details, 'standings': self.standings, 'pairings': self.pairings}
                with patch.object(fetch_raw_data, 'fetch_upcoming_tournaments'), patch.object(fetch_raw_data, 'migrate_existing_hoopa_ex_icons', return_value=(0, 0)), patch.object(fetch_raw_data, 'fetch_recent_tournaments', return_value=[self.details]), patch.object(fetch_raw_data, 'get_json', side_effect=lambda url, **kwargs: payloads[url.rsplit('/', 1)[-1]]), patch.object(fetch_raw_data.time, 'sleep'), contextlib.redirect_stdout(io.StringIO()):
                    fetch_raw_data.main()
                root = Path('web/public/data')
                self.assertEqual(json.loads((root / 'tournaments.json').read_text())[0]['id'], 'dual')
                self.assertFalse((root / 'multideck/tournaments.json').exists())
            finally:
                os.chdir(previous)


if __name__ == '__main__':
    unittest.main()
