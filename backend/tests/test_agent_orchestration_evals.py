from pathlib import Path
import sys
from unittest import TestCase

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from services.job_reality_service import audit_job_reality
from services.recruiter_xray_service import analyze_recruiter_xray
from services.bullet_enhancer_service import enhance_bullet_star
from services.interview_stress_test_service import generate_resume_defense_matrix
from services.application_autopsy_service import run_application_autopsy
from services.cover_letter_service import generate_tailored_cover_letter


class AgentOrchestrationEvalsTests(TestCase):
    def test_outreach_character_constraint_is_strictly_enforced_across_all_payloads(self):
        for candidate in ["Short Name", "Alexander Maximillian Montgomery III"]:
            for company in ["ShortCo", "International Business Machines Corporation Distributed Systems Division"]:
                pack = generate_tailored_cover_letter(candidate, "Python, FastAPI", "Engineer", company, "Description")
                self.assertLess(len(pack["outreach_note_300"]), 300)

    def test_job_reality_score_is_bounded_and_deterministic(self):
        result = audit_job_reality("Developer", "Python, React, AWS", "Acme")
        self.assertGreaterEqual(result["role_health_score"], 0)
        self.assertLessEqual(result["role_health_score"], 100)
        self.assertIn(result["health_verdict"], ["High Quality", "Proceed with Caution", "High-Risk Post"])

    def test_recruiter_xray_schema_integrity(self):
        result = analyze_recruiter_xray("Jane Doe | Software Engineer | Python, Docker")
        self.assertIn("hiring_manager_verdict", result)
        self.assertIn("visual_hotspots", result)
        self.assertIn("fluff_words_detected", result)
        self.assertIsInstance(result["fluff_words_detected"], list)

    def test_stress_test_and_autopsy_coherence(self):
        stress = generate_resume_defense_matrix("Built Docker containers", "Requires Docker and AWS")
        self.assertGreater(len(stress["drill_down_questions"]), 0)
        autopsy = run_application_autopsy("Junior Dev HTML", "Requires Docker")
        self.assertIn("slug", autopsy["recommended_blueprint"])
