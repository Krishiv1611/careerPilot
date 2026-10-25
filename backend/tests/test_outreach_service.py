from pathlib import Path
import sys
from unittest import TestCase

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from services.outreach_service import generate_outreach_package


class OutreachServiceTests(TestCase):
    def test_linkedin_note_strictly_under_300_characters(self):
        result = generate_outreach_package(
            job_title="Software Engineer Intern",
            company_name="Google",
            candidate_name="Alex Chen",
            key_skills=["Python", "FastAPI", "PostgreSQL"],
            recruiter_name="Sarah",
        )
        linkedin_note = result["linkedin_note"]
        self.assertLessEqual(len(linkedin_note), 300)
        self.assertIn("Sarah", linkedin_note)
        self.assertIn("Google", linkedin_note)
        self.assertIn("Python", linkedin_note)

    def test_cold_email_has_subject_and_structured_body(self):
        result = generate_outreach_package(
            job_title="Junior Backend Developer",
            company_name="Stripe",
            candidate_name="Jane Doe",
            key_skills=["Go", "PostgreSQL"],
        )
        email = result["cold_email"]
        self.assertIn("subject", email)
        self.assertIn("body", email)
        self.assertIn("Stripe", email["subject"])
        self.assertIn("Jane Doe", email["body"])

    def test_follow_up_note_is_polite_and_targeted(self):
        result = generate_outreach_package(
            job_title="Frontend Developer",
            company_name="Vercel",
            candidate_name="Alex",
            key_skills=["React", "TypeScript"],
        )
        follow_up = result["follow_up_note"]
        self.assertIn("Vercel", follow_up)
        self.assertIn("Frontend Developer", follow_up)
