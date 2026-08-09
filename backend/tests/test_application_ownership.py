import os
from pathlib import Path
import sys
from unittest import TestCase
from uuid import uuid4


BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("CAREERPILOT_ALLOW_SQLITE_FOR_TESTS", "true")
os.environ.setdefault("SECRET_KEY", "test-secret-key-that-is-long-enough")

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import models
from main import app
from models.database import Base, get_db
from models.job_model import Job
from models.resume_model import Resume
from models.user_job_model import UserJob
from models.user_model import User
from utils.auth import get_current_user


class ApplicationOwnershipTests(TestCase):
    def setUp(self):
        self.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        self.Session = sessionmaker(bind=self.engine)
        Base.metadata.create_all(self.engine)
        self.db = self.Session()

        self.student = User(email="student@example.com", hashed_password="unused")
        other_student = User(email="other@example.com", hashed_password="unused")
        self.db.add_all([self.student, other_student])
        self.db.flush()

        self.job = Job(id=str(uuid4()), title="Graduate Engineer", company="Campus Labs")
        self.own_resume = Resume(
            id=str(uuid4()), user_id=self.student.id, raw_text="Python", file_type="pdf"
        )
        self.other_resume = Resume(
            id=str(uuid4()), user_id=other_student.id, raw_text="Java", file_type="pdf"
        )
        self.db.add_all([self.job, self.own_resume, self.other_resume])
        self.db.flush()
        self.db.add(UserJob(
            id=str(uuid4()), user_id=self.student.id, job_id=self.job.id, state="discovered"
        ))
        self.db.commit()

        def override_db():
            yield self.db

        app.dependency_overrides[get_db] = override_db
        app.dependency_overrides[get_current_user] = lambda: self.student
        self.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.clear()
        self.db.close()
        Base.metadata.drop_all(self.engine)
        self.engine.dispose()

    def test_application_rejects_another_students_resume(self):
        response = self.client.post("/applications", json={
            "job_id": self.job.id,
            "resume_id": self.other_resume.id,
            "confirmed": True,
        })

        self.assertEqual(404, response.status_code)
        self.assertEqual("Resume not found.", response.json()["detail"])

    def test_application_accepts_the_students_own_resume_and_job(self):
        response = self.client.post("/applications", json={
            "job_id": self.job.id,
            "resume_id": self.own_resume.id,
            "confirmed": True,
        })

        self.assertEqual(200, response.status_code, response.text)
        self.db.refresh(self.db.query(UserJob).filter(UserJob.job_id == self.job.id).first())
        self.assertEqual(
            "saved",
            self.db.query(UserJob).filter(UserJob.job_id == self.job.id).first().state,
        )

        dismiss_response = self.client.post(f"/jobs/{self.job.id}/dismiss")
        self.assertEqual(409, dismiss_response.status_code)
        self.assertIn("tracked application", dismiss_response.json()["detail"])
