import os
from pathlib import Path
import subprocess
import sys
import tempfile
from unittest import TestCase

from sqlalchemy import create_engine, inspect


PROJECT_ROOT = Path(__file__).resolve().parents[2]
BACKEND_ROOT = PROJECT_ROOT / "backend"


class StartupContractTests(TestCase):
    def test_importing_the_api_does_not_create_database_tables(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            database_path = Path(temp_dir) / "careerpilot.db"
            database_url = f"sqlite:///{database_path.as_posix()}"
            environment = os.environ.copy()
            environment["DATABASE_URL"] = database_url
            environment["CAREERPILOT_ALLOW_SQLITE_FOR_TESTS"] = "true"
            environment["SECRET_KEY"] = "careerpilot-startup-test-secret-32-chars"

            result = subprocess.run(
                [
                    sys.executable,
                    "-c",
                    "import sys; sys.path.insert(0, '.'); import main",
                ],
                cwd=BACKEND_ROOT,
                env=environment,
                capture_output=True,
                text=True,
                check=False,
            )

            self.assertEqual(0, result.returncode, result.stderr)
            engine = create_engine(database_url)
            try:
                self.assertEqual([], inspect(engine).get_table_names())
            finally:
                engine.dispose()
