from pathlib import Path
import os
import subprocess
import sys
from unittest import TestCase


BACKEND_ROOT = Path(__file__).resolve().parents[1]


class DatabaseRuntimeContractTests(TestCase):
    def test_runtime_database_module_has_no_inactive_sqlite_path(self):
        source = (BACKEND_ROOT / "models/database.py").read_text(encoding="utf-8")

        self.assertNotIn("careerpilot.db", source)
        self.assertNotIn("os.makedirs", source)
        self.assertIn("requires PostgreSQL", source)

    def test_sqlite_is_rejected_without_the_explicit_test_override(self):
        environment = os.environ.copy()
        environment["DATABASE_URL"] = "sqlite:///:memory:"
        environment.pop("CAREERPILOT_ALLOW_SQLITE_FOR_TESTS", None)

        result = subprocess.run(
            [sys.executable, "-c", "import models.database"],
            cwd=BACKEND_ROOT,
            env=environment,
            capture_output=True,
            text=True,
            check=False,
        )

        self.assertNotEqual(0, result.returncode)
        self.assertIn("PostgreSQL", result.stderr)

    def test_sqlite_can_be_used_by_isolated_tests(self):
        environment = os.environ.copy()
        environment["DATABASE_URL"] = "sqlite:///:memory:"
        environment["CAREERPILOT_ALLOW_SQLITE_FOR_TESTS"] = "true"

        result = subprocess.run(
            [sys.executable, "-c", "import models.database"],
            cwd=BACKEND_ROOT,
            env=environment,
            capture_output=True,
            text=True,
            check=False,
        )

        self.assertEqual(0, result.returncode, result.stderr)
