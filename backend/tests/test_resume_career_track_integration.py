import os
from pathlib import Path
import sys
import tempfile
from types import SimpleNamespace
from unittest import IsolatedAsyncioTestCase
from unittest.mock import patch


BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))
os.environ.setdefault("DATABASE_URL", "sqlite://")
os.environ.setdefault("CAREERPILOT_ALLOW_SQLITE_FOR_TESTS", "true")
os.environ.setdefault("SECRET_KEY", "careerpilot-test-secret-with-32-characters")

from routers import resume_router


class FakeUploadFile:
    filename = "student-resume.docx"

    async def read(self, _size):
        return b"PK test document"


class FakeDatabase:
    def __init__(self):
        self.saved = None

    def add(self, record):
        self.saved = record

    def commit(self):
        return None

    def refresh(self, _record):
        return None


class ResumeCareerTrackIntegrationTests(IsolatedAsyncioTestCase):
    async def test_upload_saves_ordered_career_track_suggestions(self):
        database = FakeDatabase()
        suggestions = [{
            "category": "Python Developer",
            "confidence": 0.72,
            "rank": 1,
            "model_version": "test-model",
        }]

        with tempfile.TemporaryDirectory() as temp_dir, patch.object(
            resume_router,
            "RESUME_DIR",
            Path(temp_dir),
        ), patch.object(
            resume_router,
            "extract_docx_text",
            return_value="Built a Python API with FastAPI.",
        ), patch.object(
            resume_router,
            "run_career_workflow",
            return_value={
                "career_track_result": {
                    "available": True,
                    "suggestions": suggestions,
                    "warning": None,
                    "model_version": "test-model",
                }
            },
            create=True,
        ):
            await resume_router.upload_resume(
                file=FakeUploadFile(),
                db=database,
                current_user=SimpleNamespace(id=7, full_name="Student"),
            )

        self.assertEqual("Python Developer", database.saved.resume_category)
        self.assertEqual(suggestions, database.saved.career_track_suggestions)

    async def test_classifier_failure_does_not_block_resume_upload(self):
        database = FakeDatabase()

        with tempfile.TemporaryDirectory() as temp_dir, patch.object(
            resume_router,
            "RESUME_DIR",
            Path(temp_dir),
        ), patch.object(
            resume_router,
            "extract_docx_text",
            return_value="Built a Python API with FastAPI.",
        ), patch.object(
            resume_router,
            "run_career_workflow",
            side_effect=RuntimeError("model unavailable"),
            create=True,
        ):
            await resume_router.upload_resume(
                file=FakeUploadFile(),
                db=database,
                current_user=SimpleNamespace(id=7, full_name="Student"),
            )

        self.assertIsNone(database.saved.resume_category)
        self.assertEqual([], getattr(database.saved, "career_track_suggestions", None))
