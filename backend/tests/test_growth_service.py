from pathlib import Path
import sys
from unittest import TestCase
from unittest.mock import patch


BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from services.growth_service import (
    build_growth_plan,
    complete_growth_priority,
    get_skill_blueprint,
    verify_github_growth_submission,
)


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

    def test_skill_blueprint_provides_actionable_spec(self):
        blueprint = get_skill_blueprint("docker")
        self.assertIsNotNone(blueprint)
        self.assertIn("Dockerfile", blueprint["required_files"])
        self.assertTrue(len(blueprint["steps"]) > 0)
        self.assertIn("suggested_bullet", blueprint)

    @patch("services.growth_service._fetch_repo_contents")
    @patch("services.growth_service._fetch_repo_meta")
    def test_verify_submission_approves_valid_repo_contents(self, mock_meta, mock_contents):
        mock_meta.return_value = {"name": "docker-demo", "language": "Python", "fork": False, "size": 120}
        mock_contents.return_value = ["Dockerfile", "docker-compose.yml", "main.py", "requirements.txt"]

        result = verify_github_growth_submission("https://github.com/student/docker-demo", "docker")
        self.assertTrue(result["verified"])
        self.assertIn("Dockerfile", result["detected_files"])
        self.assertIsNotNone(result["generated_bullet"])
        self.assertIn("Docker", result["generated_bullet"])

    @patch("services.growth_service._fetch_repo_contents")
    @patch("services.growth_service._fetch_repo_meta")
    def test_verify_submission_rejects_empty_or_irrelevant_repo(self, mock_meta, mock_contents):
        mock_meta.return_value = {"name": "empty-repo", "language": "HTML", "fork": False, "size": 5}
        mock_contents.return_value = ["README.md"]

        result = verify_github_growth_submission("https://github.com/student/empty-repo", "docker")
        self.assertFalse(result["verified"])
        self.assertTrue(any("missing" in r.lower() for r in result["reasons"]))

