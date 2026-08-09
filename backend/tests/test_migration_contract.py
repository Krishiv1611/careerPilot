import os
from pathlib import Path
import tempfile
from unittest import TestCase

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect


PROJECT_ROOT = Path(__file__).resolve().parents[2]


class MigrationContractTests(TestCase):
    def test_empty_database_upgrades_to_the_complete_product_schema(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            database_path = Path(temp_dir) / "careerpilot.db"
            database_url = f"sqlite:///{database_path.as_posix()}"
            previous_url = os.environ.get("DATABASE_URL")
            previous_sqlite_override = os.environ.get("CAREERPILOT_ALLOW_SQLITE_FOR_TESTS")
            os.environ["DATABASE_URL"] = database_url
            os.environ["CAREERPILOT_ALLOW_SQLITE_FOR_TESTS"] = "true"

            try:
                config = Config(str(PROJECT_ROOT / "alembic.ini"))
                command.upgrade(config, "head")
            finally:
                if previous_url is None:
                    os.environ.pop("DATABASE_URL", None)
                else:
                    os.environ["DATABASE_URL"] = previous_url
                if previous_sqlite_override is None:
                    os.environ.pop("CAREERPILOT_ALLOW_SQLITE_FOR_TESTS", None)
                else:
                    os.environ["CAREERPILOT_ALLOW_SQLITE_FOR_TESTS"] = previous_sqlite_override

            engine = create_engine(database_url)
            try:
                inspector = inspect(engine)
                tables = set(inspector.get_table_names())
                self.assertTrue({
                    "users",
                    "resumes",
                    "jobs",
                    "applications",
                    "candidate_profiles",
                    "resume_versions",
                    "github_connections",
                    "github_evidence",
                    "match_results",
                    "user_jobs",
                    "growth_priorities",
                }.issubset(tables))

                self.assertIn(
                    "verification_status",
                    {column["name"] for column in inspector.get_columns("jobs")},
                )
                self.assertIn(
                    "file_type",
                    {column["name"] for column in inspector.get_columns("resumes")},
                )
                self.assertIn(
                    "career_track_suggestions",
                    {column["name"] for column in inspector.get_columns("resumes")},
                )
                self.assertIn(
                    "status_source",
                    {column["name"] for column in inspector.get_columns("applications")},
                )
                resume_version_columns = {
                    column["name"] for column in inspector.get_columns("resume_versions")
                }
                self.assertTrue({
                    "base_content",
                    "changes",
                    "approval_status",
                    "source_version_id",
                    "approved_at",
                }.issubset(resume_version_columns))
                github_evidence_columns = {
                    column["name"] for column in inspector.get_columns("github_evidence")
                }
                self.assertTrue({
                    "approval_status",
                    "student_contribution",
                    "approved_wording",
                    "approved_skills",
                    "outcome",
                    "proposal_version_id",
                    "approved_at",
                }.issubset(github_evidence_columns))
                self.assertTrue({
                    "ix_user_jobs_user_id",
                    "ix_user_jobs_job_id",
                }.issubset({
                    index["name"] for index in inspector.get_indexes("user_jobs")
                }))
                self.assertTrue({
                    "ix_resume_versions_user_id",
                    "ix_resume_versions_resume_id",
                    "ix_resume_versions_job_id",
                }.issubset({
                    index["name"] for index in inspector.get_indexes("resume_versions")
                }))
            finally:
                engine.dispose()
