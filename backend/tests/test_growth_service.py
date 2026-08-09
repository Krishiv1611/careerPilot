from pathlib import Path
import sys
from unittest import TestCase


BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from services.growth_service import build_growth_plan, complete_growth_priority


class GrowthServiceTests(TestCase):
    def test_plan_uses_recurring_real_job_gaps_and_stops_at_three(self):
        versions = [
            {"missing_skills": ["docker", "kubernetes", "aws"]},
            {"missing_skills": ["docker", "kubernetes", "sql"]},
            {"missing_skills": ["docker", "react"]},
        ]

        plan = build_growth_plan(versions)

        self.assertEqual(["docker", "kubernetes", "aws"], [item["skill"] for item in plan])
        self.assertEqual(3, plan[0]["job_count"])
        self.assertEqual(3, len(plan))
        self.assertIn("evidence", plan[0]["next_action"].lower())

    def test_no_versions_means_no_generic_learning_plan(self):
        self.assertEqual([], build_growth_plan([]))

    def test_completion_requires_an_evidence_link_or_explicit_external_confirmation(self):
        with self.assertRaisesRegex(ValueError, "evidence"):
            complete_growth_priority(evidence_url="", external_confirmation=False)

        linked = complete_growth_priority(
            evidence_url="https://github.com/student/project",
            external_confirmation=False,
        )
        self.assertEqual("evidence_link", linked["completion_source"])

        external = complete_growth_priority(
            evidence_url="",
            external_confirmation=True,
        )
        self.assertEqual("external_confirmation", external["completion_source"])
