import os
from pathlib import Path
import sys
from unittest import TestCase
from unittest.mock import patch
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
from models.github_evidence_model import GitHubEvidence
from models.job_model import Job
from models.resume_model import Resume
from models.resume_version_model import ResumeVersion
from models.user_model import User
from utils.auth import get_current_user


class ProductWorkflowIntegrationTests(TestCase):
    def setUp(self):
        self.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        self.Session = sessionmaker(bind=self.engine)
        Base.metadata.create_all(self.engine)
        self.db = self.Session()
        self.student = User(email="workflow@example.com", hashed_password="unused")
        self.db.add(self.student)
        self.db.flush()
        self.resume = Resume(
            id=str(uuid4()),
            user_id=self.student.id,
            raw_text="PROJECTS\nCampus API built with Python",
            file_type="pdf",
        )
        self.db.add(self.resume)
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

    def test_resume_analysis_creates_a_persisted_reviewable_version(self):
        response = self.client.post("/resume-studio/analyze", json={
            "resume_id": self.resume.id,
            "job_description": "Requirements: Python, FastAPI, and SQL",
        })

        self.assertEqual(200, response.status_code, response.text)
        payload = response.json()
        self.assertEqual("draft", payload["approval_status"])
        self.assertEqual(self.resume.id, payload["resume_id"])
        self.assertTrue(payload["requirements"])
        self.assertEqual(1, self.db.query(ResumeVersion).count())

        review_response = self.client.post(
            f"/resume-studio/versions/{payload['id']}/review",
            json={
                "decisions": [
                    {"change_id": change["id"], "status": "accepted"}
                    for change in payload["changes"]
                ]
            },
        )
        self.assertEqual(200, review_response.status_code, review_response.text)
        approved = review_response.json()
        self.assertEqual("approved", approved["approval_status"])

        download_response = self.client.get(
            f"/resume-studio/versions/{approved['id']}/download"
        )
        self.assertEqual(200, download_response.status_code, download_response.text)
        self.assertEqual("application/pdf", download_response.headers["content-type"])

    def test_confirmed_github_evidence_creates_a_new_resume_draft(self):
        source_version = self._add_version(missing_skills=["FastAPI"])
        evidence = GitHubEvidence(
            id=str(uuid4()),
            user_id=self.student.id,
            resume_version_id=source_version.id,
            repository="student/campus-api",
            evidence={"matching_skills": ["FastAPI"]},
            approval_status="pending",
            approved_skills=[],
        )
        self.db.add(evidence)
        self.db.commit()

        response = self.client.post(f"/github/evidence/{evidence.id}/approve", json={
            "selected_skills": ["FastAPI"],
            "contribution": "I designed and implemented the API routes.",
            "wording": "Designed and implemented FastAPI routes for the campus service.",
            "outcome": "Presented during our final demo.",
            "confirmed": True,
        })

        self.assertEqual(200, response.status_code, response.text)
        payload = response.json()
        self.assertEqual("approved", payload["approval_status"])
        self.assertEqual("draft", payload["version"]["approval_status"])
        self.assertIn("student/campus-api", payload["version"]["content"])
        self.assertTrue(payload["version"]["changes"])

    def test_growth_priority_persists_and_completes_with_evidence(self):
        self._add_version(missing_skills=["Docker", "SQL"])
        self._add_version(missing_skills=["Docker"])

        plan_response = self.client.get("/growth/plan")
        self.assertEqual(200, plan_response.status_code, plan_response.text)
        priority = plan_response.json()["priorities"][0]
        self.assertEqual("Docker", priority["skill"])
        self.assertEqual("active", priority["status"])

        completion_response = self.client.post(
            f"/growth/priorities/{priority['id']}/complete",
            json={"evidence_url": "https://github.com/student/docker-project"},
        )
        self.assertEqual(200, completion_response.status_code, completion_response.text)
        self.assertEqual("completed", completion_response.json()["status"])
        self.assertEqual("evidence_link", completion_response.json()["completion_source"])

    def test_today_endpoint_uses_persisted_workspace_counts(self):
        response = self.client.get("/today")

        self.assertEqual(200, response.status_code, response.text)
        self.assertEqual("find_jobs", response.json()["action"]["kind"])
        self.assertEqual(1, response.json()["counts"]["resumes"])

    def test_match_and_resume_studio_reject_a_job_outside_the_students_workspace(self):
        hidden_job = Job(
            id=str(uuid4()),
            title="Hidden Role",
            company="Other Workspace",
            description="Requirements: Python",
        )
        self.db.add(hidden_job)
        self.db.commit()

        match_response = self.client.post("/matches/analyze", json={
            "job_id": hidden_job.id,
            "resume_id": self.resume.id,
        })
        studio_response = self.client.post("/resume-studio/analyze", json={
            "resume_id": self.resume.id,
            "job_id": hidden_job.id,
        })

        self.assertEqual(404, match_response.status_code)
        self.assertEqual(404, studio_response.status_code)

    def test_deleting_a_resume_also_removes_its_derived_versions_and_evidence(self):
        version = self._add_version(missing_skills=["FastAPI"])
        evidence = GitHubEvidence(
            id=str(uuid4()),
            user_id=self.student.id,
            resume_version_id=version.id,
            repository="student/campus-api",
            evidence={"matching_skills": ["FastAPI"]},
            approval_status="pending",
            approved_skills=[],
        )
        self.db.add(evidence)
        self.db.commit()

        response = self.client.delete(f"/resume/{self.resume.id}")

        self.assertEqual(200, response.status_code, response.text)
        self.assertEqual(0, self.db.query(Resume).count())
        self.assertEqual(0, self.db.query(ResumeVersion).count())
        self.assertEqual(0, self.db.query(GitHubEvidence).count())

    def test_discovery_to_match_application_and_today_is_one_connected_workflow(self):
        discovered_job = {
            "title": "Graduate Python Engineer",
            "company": "Campus Labs",
            "location": "Bengaluru",
            "employment_type": "Full-time",
            "experience_level": "Entry level",
            "skills": ["Python"],
            "description": "Requirements: Python",
            "salary_range": None,
            "url": "https://jobs.lever.co/campus-labs/graduate-python-engineer",
            "source": "Tavily",
            "sources": ["Tavily"],
            "verification_status": "candidate",
        }
        with patch(
            "routers.discovery_router.run_career_workflow",
            return_value={
                "job_search_result": {
                    "query": "python graduate",
                    "jobs": [discovered_job],
                    "warnings": [],
                }
            },
        ):
            discovery_response = self.client.post("/discovery/search", json={
                "query": "python graduate",
                "location": "Bengaluru",
                "employment_type": "Full-time",
            })

        self.assertEqual(200, discovery_response.status_code, discovery_response.text)
        job = discovery_response.json()["jobs"][0]
        self.assertEqual("discovered", job["user_state"])

        save_response = self.client.post(f"/jobs/{job['id']}/save")
        match_response = self.client.post("/matches/analyze", json={
            "job_id": job["id"],
            "resume_id": self.resume.id,
        })
        application_response = self.client.post("/applications", json={
            "job_id": job["id"],
            "resume_id": self.resume.id,
            "confirmed": True,
        })

        self.assertEqual("saved", save_response.json()["user_state"])
        self.assertEqual(200, match_response.status_code, match_response.text)
        self.assertEqual("Saved", application_response.json()["status"])

        application_id = application_response.json()["id"]
        update_response = self.client.patch(
            f"/applications/{application_id}/status",
            json={"status": "Preparing", "next_action": "Finish the tailored resume"},
        )
        today_response = self.client.get("/today")

        self.assertEqual(200, update_response.status_code, update_response.text)
        self.assertEqual("application_action", today_response.json()["action"]["kind"])
        self.assertIn("Finish the tailored resume", today_response.json()["action"]["description"])

    def _add_version(self, missing_skills):
        version = ResumeVersion(
            id=str(uuid4()),
            user_id=self.student.id,
            resume_id=self.resume.id,
            job_description="Requirements",
            base_content=self.resume.raw_text,
            content=self.resume.raw_text,
            changes=[],
            approval_status="approved",
            requirements=missing_skills,
            matched_skills=[],
            missing_skills=missing_skills,
            evidence_map={},
            project_suggestions=[],
            prompt_history=[],
            template_mode="clean_pdf",
        )
        self.db.add(version)
        self.db.commit()
        return version
