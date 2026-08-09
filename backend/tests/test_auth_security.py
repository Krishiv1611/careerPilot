from datetime import datetime, timedelta, timezone
from pathlib import Path
import sys
from unittest import TestCase


BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from services.auth_security_service import LoginThrottle, validate_password, validate_secret_key


class AuthSecurityTests(TestCase):
    def test_password_requires_at_least_ten_characters(self):
        with self.assertRaisesRegex(ValueError, "10"):
            validate_password("short123")

        self.assertEqual("student-pass-2026", validate_password("student-pass-2026"))

    def test_session_secret_requires_at_least_thirty_two_characters(self):
        with self.assertRaisesRegex(ValueError, "32"):
            validate_secret_key("short-secret")
        with self.assertRaisesRegex(ValueError, "Replace"):
            validate_secret_key("replace-with-a-long-random-secret")

        secret = "careerpilot-test-secret-with-32-characters"
        self.assertEqual(secret, validate_secret_key(secret))

    def test_repeated_login_failures_are_temporarily_throttled(self):
        throttle = LoginThrottle(max_attempts=3, window_seconds=60)
        now = datetime(2026, 8, 9, tzinfo=timezone.utc)

        for _ in range(3):
            throttle.record_failure("127.0.0.1:student@example.com", now)

        self.assertFalse(throttle.is_allowed("127.0.0.1:student@example.com", now))
        self.assertTrue(
            throttle.is_allowed(
                "127.0.0.1:student@example.com",
                now + timedelta(seconds=61),
            )
        )
