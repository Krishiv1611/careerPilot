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

    def test_mentorship_and_company_age_do_not_block_eligibility(self):
        result = match_resume_to_job(
            "Graduate developer with Python projects.",
            "Acme was founded 10 years ago. 10 years in business. You will be mentored by senior engineers. Python required.",
        )
        self.assertEqual("eligible", result["eligibility_status"])
        self.assertNotIn("senior-level experience", " ".join(result["eligibility_reasons"]))

    def test_0_to_3_years_experience_range_is_eligible(self):
        result = match_resume_to_job(
            "Python developer with SQL experience.",
            "Junior Developer with 0-3 years experience. Python and SQL required.",
        )
        self.assertEqual("eligible", result["eligibility_status"])

    def test_senior_title_blocks_matching_eligibility(self):
        result = match_resume_to_job(
            "Python developer with SQL experience.",
            "Python and SQL required.",
            job_title="Senior Python Developer",
        )
        self.assertEqual("not_eligible", result["eligibility_status"])
        self.assertIn("senior-level experience", " ".join(result["eligibility_reasons"]))

    def test_multiline_bullet_point_requirements_are_parsed_as_must_haves(self):
        job_description = """
        We are seeking a junior backend engineer.
        Requirements:
        - Python
        - FastAPI
        - PostgreSQL
        - Docker
        
        Nice to have:
        - Kubernetes
        - AWS
        """
        resume_text = "Proficient in Python and FastAPI with project experience."
        result = match_resume_to_job(resume_text, job_description)

        self.assertIn("postgresql", result["must_have_skills"])
        self.assertIn("docker", result["must_have_skills"])
        self.assertIn("postgresql", result["missing_must_haves"])
        self.assertIn("docker", result["missing_must_haves"])
        self.assertIn("hard_blockers", result)
        self.assertIn("postgresql", result["hard_blockers"])
        self.assertIn("preferred_gaps", result)
        self.assertIn("kubernetes", result["preferred_gaps"])


