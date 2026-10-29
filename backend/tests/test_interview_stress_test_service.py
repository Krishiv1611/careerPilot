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

    def test_drill_down_includes_vulnerability_rating_and_code_snippet(self):
        resume = "Optimized PostgreSQL database queries reducing API latency by 45% using Redis."
        jd = "Backend Engineer with PostgreSQL and Redis."
        res = generate_resume_defense_matrix(resume, jd, "Stripe")
        self.assertGreater(len(res["drill_down_questions"]), 0)
        q = res["drill_down_questions"][0]
        self.assertIn("vulnerability_rating", q)
        self.assertIn("code_defense_snippet", q)
        self.assertIn("model_interview_answer", q)
        self.assertEqual(q["vulnerability_rating"], "High Risk")
        self.assertIn("EXPLAIN", q["code_defense_snippet"] + q["candidate_defense_blueprint"])

    def test_vulnerability_ratings_classify_high_medium_and_rock_solid(self):
        resume = """
        - Slashed query execution time by 60% with distributed Redis cache.
        - Deployed microservices using Docker containers to AWS ECS.
        - Built integration test suites with pytest ensuring zero regressions.
        """
        jd = "Senior Systems Engineer"
        res = generate_resume_defense_matrix(resume, jd, "Netflix")
        questions = res["drill_down_questions"]
        ratings = {q["claim"]: q["vulnerability_rating"] for q in questions}

        # Find the claims and verify ratings
        high_risk_found = any(q["vulnerability_rating"] == "High Risk" for q in questions)
        medium_risk_found = any(q["vulnerability_rating"] == "Medium Risk" for q in questions)
        self.assertTrue(high_risk_found)
        self.assertTrue(medium_risk_found)

        # Verify production-grade snippets
        snippets = " ".join(q["code_defense_snippet"] for q in questions)
        self.assertTrue("FROM python" in snippets or "redis_client" in snippets or "EXPLAIN" in snippets)

    def test_fallback_generates_model_answer_and_code_defense(self):
        resume = ""
        jd = ""
        res = generate_resume_defense_matrix(resume, jd, "Acme Corp")
        self.assertEqual(len(res["drill_down_questions"]), 1)
        fallback = res["drill_down_questions"][0]
        self.assertIn("vulnerability_rating", fallback)
        self.assertIn("code_defense_snippet", fallback)
        self.assertIn("model_interview_answer", fallback)
        self.assertIn("def test_reproduce_and_verify_regression_fix", fallback["code_defense_snippet"])
