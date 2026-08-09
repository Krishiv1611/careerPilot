from pathlib import Path
import sys
from unittest import TestCase


BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from services.matching_service import match_resume_to_job


class MatchingServiceTests(TestCase):
    def test_missing_must_have_skill_blocks_eligibility(self):
        result = match_resume_to_job(
            "Built APIs with Python and FastAPI.",
            "Must have Python and SQL. Docker is nice to have.",
        )

        self.assertEqual("not_eligible", result["eligibility_status"])
        self.assertEqual(["sql"], result["missing_must_haves"])
        self.assertIn("Built APIs with Python", result["evidence_map"]["python"][0])

    def test_coverage_is_derived_from_detected_requirements(self):
        result = match_resume_to_job(
            "Python, FastAPI, and SQL project.",
            "Python FastAPI SQL Docker",
        )

        self.assertEqual(75, result["coverage_percent"])
        self.assertEqual(["docker"], result["missing_skills"])

    def test_senior_experience_requirement_is_not_hidden(self):
        result = match_resume_to_job(
            "Graduate developer with Python projects.",
            "Senior Python developer. Requires 5+ years of experience.",
        )

        self.assertEqual("not_eligible", result["eligibility_status"])
        self.assertIn("experience", result["eligibility_reasons"][0].lower())
