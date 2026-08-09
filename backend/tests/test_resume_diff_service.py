from pathlib import Path
import sys
from unittest import TestCase


BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))


class ResumeDiffServiceTests(TestCase):
    def test_accepting_every_change_reconstructs_the_proposed_content(self):
        from services.resume_diff_service import apply_change_decisions, build_line_changes

        original = "Summary\nBuilt a Python API\nEducation"
        proposed = "Built a Python API\nSummary\nEducation"
        changes = build_line_changes(original, proposed)
        decisions = {change["id"]: "accepted" for change in changes}

        reviewed = apply_change_decisions(original, changes, decisions)

        self.assertEqual(proposed, reviewed["content"])
        self.assertTrue(reviewed["all_resolved"])
        self.assertTrue(all(change["status"] == "accepted" for change in reviewed["changes"]))

    def test_rejecting_a_change_keeps_the_original_lines(self):
        from services.resume_diff_service import apply_change_decisions, build_line_changes

        original = "Summary\nWorked on a Python API"
        proposed = "Summary\nBuilt a Python API"
        changes = build_line_changes(original, proposed)
        decisions = {changes[0]["id"]: "rejected"}

        reviewed = apply_change_decisions(original, changes, decisions)

        self.assertEqual(original, reviewed["content"])
        self.assertEqual("rejected", reviewed["changes"][0]["status"])

    def test_every_change_requires_an_explicit_decision(self):
        from services.resume_diff_service import apply_change_decisions, build_line_changes

        changes = build_line_changes("A\nB", "A\nC\nD")

        with self.assertRaisesRegex(ValueError, "Review every proposed change"):
            apply_change_decisions("A\nB", changes, {})
