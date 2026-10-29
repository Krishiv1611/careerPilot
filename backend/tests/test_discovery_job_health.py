import os
from pathlib import Path
import sys
from unittest import TestCase
from unittest.mock import MagicMock

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("CAREERPILOT_ALLOW_SQLITE_FOR_TESTS", "true")
os.environ.setdefault("SECRET_KEY", "test-secret-key-that-is-long-enough")

from routers.discovery_router import _job_response


class DiscoveryJobHealthTests(TestCase):
    def test_discovery_search_job_response_embeds_role_health_data(self):
        record = MagicMock()
        record.id = "disc-job-123"
        record.title = "Junior Backend Engineer"
        record.company = "Stripe"
        record.location = "Bengaluru"
        record.employment_type = "full-time"
        record.experience_level = "entry"
        record.skills = ["Python", "FastAPI"]
        record.description = (
            "We are seeking a junior backend engineer to join our core payments infrastructure team. "
            "You will be mentored by senior engineers and work on modern Python, FastAPI, and PostgreSQL stack. "
            "Benefits include flexible working hours and comprehensive health insurance."
        )
        record.salary_range = "12-18 LPA"
        record.url = "https://stripe.com/jobs/123"
        record.source = "lever"
        record.verification_status = "verified"
        record.fetched_at = None

        discovery_data = {"sources": ["lever"]}
        user_state = "discovered"

        res = _job_response(record, discovery_data, user_state)
        self.assertIn("job_health", res)
        self.assertIsInstance(res["job_health"], dict)
        self.assertGreaterEqual(res["job_health"]["role_health_score"], 80)
        self.assertEqual("High Quality", res["job_health"]["health_verdict"])
