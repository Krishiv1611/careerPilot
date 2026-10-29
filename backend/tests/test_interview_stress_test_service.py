from pathlib import Path
import sys
from unittest import TestCase

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from services.interview_stress_test_service import generate_resume_defense_matrix


class InterviewStressTestServiceTests(TestCase):
    def test_generates_aggressive_technical_drilldowns_for_resume_claims(self):
        resume = """
        - Optimized PostgreSQL database queries reducing API latency by 45%.
        - Built Docker container microservices deployed to AWS ECS.
        """
        jd = "Seeking Senior Backend Engineer with PostgreSQL indexing and AWS experience."
        matrix = generate_resume_defense_matrix(resume, jd, "Datadog")
        self.assertGreaterEqual(len(matrix["drill_down_questions"]), 2)
        q = matrix["drill_down_questions"][0]
        self.assertIn("claim", q)
        self.assertIn("candidate_defense_blueprint", q)
        self.assertTrue(
            any(
                "postgresql" in item["question"].lower() or "latency" in item["question"].lower()
                for item in matrix["drill_down_questions"]
            )
        )
