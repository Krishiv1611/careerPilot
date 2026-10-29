from pathlib import Path
import sys
from unittest import TestCase

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from services.matching_service import match_resume_to_job


class CustomJobIngestionTests(TestCase):
    def test_custom_job_text_matches_and_generates_ats_diagnostic(self):
        resume = """John Doe
john@example.com | 555-123-4567 | github.com/johndoe

TECHNICAL SKILLS
Languages: Python, SQL
Frameworks: FastAPI

EXPERIENCE
- Engineered REST APIs using Python and FastAPI with 30% latency reduction.
"""
        jd = "Requirements: Python, FastAPI, Docker, Kubernetes. 0-2 years experience."
        result = match_resume_to_job(resume, jd, job_title="Backend Developer")

        self.assertIn("ats_diagnostic", result)
        self.assertGreaterEqual(result["ats_score"], 40)
        self.assertIn("docker", result["missing_must_haves"])
        self.assertIn("kubernetes", result["missing_must_haves"])
        self.assertEqual("not_eligible", result["eligibility_status"])

    def test_custom_job_empty_description_handled(self):
        result = match_resume_to_job("Python developer", "")
        self.assertEqual("needs_review", result["eligibility_status"])
