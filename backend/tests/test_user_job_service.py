from datetime import datetime, timedelta, timezone
from pathlib import Path
import sys
from unittest import TestCase


BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))


class UserJobServiceTests(TestCase):
    def test_rediscovery_does_not_overwrite_a_student_decision(self):
        from services.user_job_service import next_user_job_state

        self.assertEqual("saved", next_user_job_state("saved", "discovered"))
        self.assertEqual("dismissed", next_user_job_state("dismissed", "discovered"))
        self.assertEqual("saved", next_user_job_state("dismissed", "saved"))

    def test_feed_hides_dismissed_and_stale_jobs(self):
        from services.user_job_service import should_show_user_job

        now = datetime(2026, 8, 9, tzinfo=timezone.utc)

        self.assertFalse(should_show_user_job("dismissed", now, now=now))
        self.assertFalse(should_show_user_job("discovered", now - timedelta(days=31), now=now))
        self.assertTrue(should_show_user_job("saved", now - timedelta(days=31), now=now))
        self.assertTrue(should_show_user_job("discovered", now - timedelta(days=2), now=now))
