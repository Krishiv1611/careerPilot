from pathlib import Path
import sys
from unittest import TestCase


BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from services.application_service import build_new_application, change_status


class ApplicationStateMachineTests(TestCase):
    def test_creation_requires_student_confirmation(self):
        with self.assertRaises(ValueError):
            build_new_application("job-1", "resume-1", confirmed=False)

    def test_new_application_starts_as_saved(self):
        application = build_new_application("job-1", "resume-1", confirmed=True)

        self.assertEqual("Saved", application["status"])
        self.assertEqual("user", application["status_source"])
        self.assertEqual(1, len(application["timeline"]))

    def test_student_can_move_from_preparing_to_applied(self):
        result = change_status("Preparing", "Applied", "user")

        self.assertEqual("Applied", result["status"])
        self.assertEqual("user", result["status_source"])

    def test_impossible_status_jump_is_rejected(self):
        with self.assertRaises(ValueError):
            change_status("Saved", "Offer", "user")

    def test_student_can_move_directly_from_saved_to_applied(self):
        result = change_status("Saved", "Applied", "user")
        self.assertEqual("Applied", result["status"])

    def test_student_can_reopen_rejected_application(self):
        result_prep = change_status("Rejected", "Preparing", "user")
        self.assertEqual("Preparing", result_prep["status"])
        result_app = change_status("Rejected", "Applied", "user")
        self.assertEqual("Applied", result_app["status"])

    def test_student_can_reopen_withdrawn_application(self):
        result = change_status("Withdrawn", "Saved", "user")
        self.assertEqual("Saved", result["status"])

    def test_new_application_can_link_resume_version_id(self):
        application = build_new_application(
            "job-1",
            "resume-1",
            confirmed=True,
            resume_version_id="version-42",
        )
        self.assertEqual("version-42", application.get("resume_version_id"))

