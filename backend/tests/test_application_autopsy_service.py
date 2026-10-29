from pathlib import Path
import sys
from unittest import TestCase

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from services.application_autopsy_service import run_application_autopsy


class ApplicationAutopsyServiceTests(TestCase):
    def test_identifies_fatal_blocker_and_links_to_growth_blueprint(self):
        resume = "Junior developer with HTML, CSS, JavaScript, and Node.js experience."
        jd = "Software Engineer: Must have production Docker containerization and Kubernetes experience."
        autopsy = run_application_autopsy(resume, jd)
        self.assertTrue(
            "docker" in autopsy["fatal_blocker"].lower()
            or "kubernetes" in autopsy["fatal_blocker"].lower()
        )
        self.assertEqual(48, autopsy["recovery_time_hours"])
        self.assertIn("recommended_blueprint", autopsy)
        self.assertIn("slug", autopsy["recommended_blueprint"])
