from pathlib import Path
import sys
from unittest import TestCase


BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from services.candidate_profile_service import build_profile_data


class CandidateProfileServiceTests(TestCase):
    def test_resume_skills_are_deduplicated_with_provenance(self):
        resumes = [
            {"id": "resume-1", "extracted_skills": ["python", "sql"]},
            {"id": "resume-2", "extracted_skills": ["Python", "fastapi"]},
        ]

        profile = build_profile_data(resumes, None)

        self.assertEqual(["fastapi", "python", "sql"], profile["skills"])
        self.assertEqual(["resume-1", "resume-2"], profile["skill_sources"]["python"])

    def test_student_preferences_are_kept_separate_from_evidence(self):
        stored_profile = {
            "target_roles": ["Backend Developer"],
            "preferred_locations": ["Bengaluru"],
            "employment_types": ["full-time"],
        }

        profile = build_profile_data([], stored_profile)

        self.assertEqual(["Backend Developer"], profile["target_roles"])
        self.assertEqual([], profile["skills"])
