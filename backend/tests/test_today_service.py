from datetime import datetime, timedelta, timezone
from pathlib import Path
import sys
from unittest import TestCase


BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from services.today_service import choose_today_action


class TodayServiceTests(TestCase):
    def test_due_follow_up_beats_a_resume_draft(self):
        now = datetime(2026, 8, 9, 9, 0, tzinfo=timezone.utc)
        action = choose_today_action(
            resume_count=1,
            job_count=4,
            draft_version_count=1,
            applications=[{
                "id": "application-1",
                "status": "Applied",
                "follow_up_at": now - timedelta(hours=1),
                "deadline": None,
                "next_action": "Email the recruiter",
            }],
            now=now,
        )

        self.assertEqual("follow_up_due", action["kind"])
        self.assertEqual("/applications", action["path"])
        self.assertIn("Email the recruiter", action["description"])

    def test_resume_draft_is_next_when_nothing_is_due(self):
        action = choose_today_action(
            resume_count=1,
            job_count=4,
            draft_version_count=2,
            applications=[],
            now=datetime(2026, 8, 9, tzinfo=timezone.utc),
        )

        self.assertEqual("resume_review", action["kind"])
        self.assertEqual("/profile/tailor", action["path"])

    def test_empty_workspace_starts_with_a_resume(self):
        action = choose_today_action(
            resume_count=0,
            job_count=0,
            draft_version_count=0,
            applications=[],
            now=datetime(2026, 8, 9, tzinfo=timezone.utc),
        )

        self.assertEqual("add_resume", action["kind"])
