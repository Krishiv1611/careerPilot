from datetime import datetime, timedelta, timezone
from threading import Lock


MIN_PASSWORD_LENGTH = 10
MAX_PASSWORD_LENGTH = 128
MIN_SECRET_KEY_LENGTH = 32


def validate_password(password):
    if len(password) < MIN_PASSWORD_LENGTH:
        raise ValueError(f"Password must contain at least {MIN_PASSWORD_LENGTH} characters.")
    if len(password) > MAX_PASSWORD_LENGTH:
        raise ValueError(f"Password must contain no more than {MAX_PASSWORD_LENGTH} characters.")
    return password


def validate_secret_key(secret_key):
    if secret_key.lower().startswith(("replace-", "change-me")):
        raise ValueError("Replace the example SECRET_KEY before starting CareerPilot.")
    if len(secret_key) < MIN_SECRET_KEY_LENGTH:
        raise ValueError(
            f"SECRET_KEY must contain at least {MIN_SECRET_KEY_LENGTH} characters."
        )
    return secret_key


class LoginThrottle:
    def __init__(self, max_attempts=5, window_seconds=300):
        self.max_attempts = max_attempts
        self.window = timedelta(seconds=window_seconds)
        self._failures = {}
        self._lock = Lock()

    def is_allowed(self, identifier, now=None):
        now = now or datetime.now(timezone.utc)
        with self._lock:
            failures = self._current_failures(identifier, now)
            return len(failures) < self.max_attempts

    def record_failure(self, identifier, now=None):
        now = now or datetime.now(timezone.utc)
        with self._lock:
            failures = self._current_failures(identifier, now)
            self._failures[identifier] = [*failures, now]

    def reset(self, identifier):
        with self._lock:
            self._failures.pop(identifier, None)

    def _current_failures(self, identifier, now):
        cutoff = now - self.window
        failures = [
            failure for failure in self._failures.get(identifier, [])
            if failure > cutoff
        ]
        if failures:
            self._failures[identifier] = failures
        else:
            self._failures.pop(identifier, None)
        return failures
