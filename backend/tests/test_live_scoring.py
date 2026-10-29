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


class LiveResumeStudioEndpointsTests(TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_score_live_endpoint_returns_ats_score(self):
        resume_text = """John Doe
john@example.com | 555-123-4567 | github.com/johndoe

EDUCATION
Bachelor of Science in Computer Science, ABC University, 2024

TECHNICAL SKILLS
Python, FastAPI, Docker, SQL, Git

EXPERIENCE
Software Engineer Intern, Tech Corp
- Engineered backend APIs using Python and FastAPI, reducing latency by 35%
- Deployed microservices using Docker
"""
        response = self.client.post(
            "/resume-studio/score-live",
            json={"resume_text": resume_text, "job_description": "Looking for Python FastAPI Docker developer"},
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("overall_score", data)
        self.assertIn("grade", data)
        self.assertIn("breakdown", data)
        self.assertGreater(data["overall_score"], 60)

    def test_enhance_bullet_endpoint(self):
        response = self.client.post(
            "/resume-studio/enhance-bullet",
            json={"bullet": "worked on backend apis using python and made it faster", "target_role": "Backend Engineer"},
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("enhanced_bullet", data)
        self.assertIn("action_verb", data)
        self.assertTrue(data["enhanced_bullet"].startswith("Engineered") or data["enhanced_bullet"].startswith("Architected"))
        self.assertIn("Python", data["enhanced_bullet"])

    def test_export_pdf_direct_endpoint_streams_pdf(self):
        resume_text = """Jane Smith
jane@example.com | 555-987-6543

EXPERIENCE
Developer
- Built web application
"""
        response = self.client.post(
            "/resume-studio/export-pdf-direct",
            json={"resume_text": resume_text, "candidate_name": "Jane Smith"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["content-type"], "application/pdf")
        self.assertIn("Jane_Smith_ATS_Resume.pdf", response.headers.get("content-disposition", ""))
        self.assertTrue(response.content.startswith(b"%PDF"))
