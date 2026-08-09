from pathlib import Path
import sys
from unittest import TestCase


BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from services.github_evidence_service import build_github_resume_proposal


class GitHubEvidenceServiceTests(TestCase):
    def test_builds_proposal_only_from_student_confirmed_repository_evidence(self):
        proposal = build_github_resume_proposal(
            repository="student/campus-api",
            evidence={"matching_skills": ["Python", "FastAPI"]},
            selected_skills=["FastAPI"],
            contribution="I designed and implemented the API endpoints.",
            wording="Designed and implemented FastAPI endpoints for a campus service.",
            outcome="Used by 40 students during our final demo.",
            confirmed=True,
        )

        self.assertEqual(["FastAPI"], proposal["skills"])
        self.assertIn("student/campus-api", proposal["resume_line"])
        self.assertIn("Used by 40 students", proposal["resume_line"])

    def test_rejects_a_skill_the_repository_did_not_support(self):
        with self.assertRaisesRegex(ValueError, "not supported"):
            build_github_resume_proposal(
                repository="student/campus-api",
                evidence={"matching_skills": ["Python"]},
                selected_skills=["Kubernetes"],
                contribution="I implemented the API endpoints.",
                wording="Implemented a Kubernetes deployment.",
                outcome="",
                confirmed=True,
            )

    def test_requires_explicit_student_confirmation(self):
        with self.assertRaisesRegex(ValueError, "confirm"):
            build_github_resume_proposal(
                repository="student/campus-api",
                evidence={"matching_skills": ["Python"]},
                selected_skills=["Python"],
                contribution="I implemented the API endpoints.",
                wording="Implemented Python API endpoints.",
                outcome="",
                confirmed=False,
            )
