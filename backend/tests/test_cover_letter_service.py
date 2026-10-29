import os
from pathlib import Path
import sys
from unittest import TestCase

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("CAREERPILOT_ALLOW_SQLITE_FOR_TESTS", "true")
os.environ.setdefault("SECRET_KEY", "test-secret-key-that-is-long-enough")

from fastapi.testclient import TestClient
from main import app
from services.cover_letter_service import generate_tailored_cover_letter


class CoverLetterServiceTests(TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_generates_three_distinct_outreach_channel_variants(self):
        pack = generate_tailored_cover_letter(
            "Taylor Swift",
            "Python, FastAPI, Docker",
            "Backend Engineer",
            "Spotify",
            "FastAPI and Docker",
        )
        self.assertIn("alumni_casual_note", pack)
        self.assertIn("cold_email_pitch", pack)
        self.assertIn("subject", pack["cold_email_pitch"])
        self.assertIn("body", pack["cold_email_pitch"])
        self.assertLess(len(pack["alumni_casual_note"]), 200)
        self.assertLess(len(pack["outreach_note_300"]), 300)

    def test_generates_truth_guarded_application_pack_with_strict_character_limit(self):
        resume = "Alex Rivera | Software Engineer. Built FastAPI microservices and PostgreSQL database with Docker."
        pack = generate_tailored_cover_letter(
            "Alex Rivera",
            resume,
            "Backend Engineer",
            "Stripe",
            "Seeking Backend Engineer with FastAPI and PostgreSQL.",
        )

        self.assertIn("Alex Rivera", pack["cover_letter_text"])
        self.assertIn("Stripe", pack["cover_letter_text"])
        self.assertIn("FastAPI", pack["cover_letter_text"])

        # Strict LinkedIn < 300 chars requirement
        outreach = pack["outreach_note_300"]
        self.assertLess(len(outreach), 300, f"Outreach note exceeded 300 chars: {len(outreach)}")
        self.assertIn("Stripe", outreach)
        self.assertEqual(pack["character_count"], len(outreach))

        # Screening answers
        self.assertGreaterEqual(len(pack["screening_answers"]), 2)
        for screening in pack["screening_answers"]:
            self.assertIn("question", screening)
            self.assertIn("answer", screening)

    def test_handles_empty_or_fallback_inputs_and_preserves_length_bounds(self):
        long_company = "Extremely Long Enterprise Financial Technologies and Global Cloud Services Incorporated"
        long_candidate = "Alexander Bartholomew Christopher Montgomery III"
        pack = generate_tailored_cover_letter(
            long_candidate,
            "Built apps using Python and React.",
            "Senior Distributed Systems Infrastructure Specialist",
            long_company,
            "Looking for infrastructure specialists.",
        )
        self.assertLess(len(pack["outreach_note_300"]), 300)
        self.assertLess(len(pack["alumni_casual_note"]), 200)
        self.assertIn("cold_email_pitch", pack)
        self.assertEqual(pack["character_count"], len(pack["outreach_note_300"]))
        self.assertIn("cover_letter_text", pack)
        self.assertGreaterEqual(len(pack["screening_answers"]), 2)

    def test_application_pack_api_endpoint(self):
        response = self.client.post(
            "/resume-studio/application-pack",
            json={
                "candidate_name": "Alex Rivera",
                "resume_text": "Experienced Python and Docker developer.",
                "job_title": "Backend Developer",
                "company": "Stripe",
                "job_description": "Seeking Python and Docker developer.",
            },
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("cover_letter_text", data)
        self.assertIn("outreach_note_300", data)
        self.assertIn("alumni_casual_note", data)
        self.assertIn("cold_email_pitch", data)
        self.assertIn("subject", data["cold_email_pitch"])
        self.assertIn("body", data["cold_email_pitch"])
        self.assertIn("character_count", data)
        self.assertIn("screening_answers", data)
        self.assertLess(len(data["outreach_note_300"]), 300)
        self.assertLess(len(data["alumni_casual_note"]), 200)

