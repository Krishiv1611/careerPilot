from pathlib import Path
import sys
from unittest import TestCase

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from services.ats_scorer_service import calculate_ats_score


class ATSScorerServiceTests(TestCase):
    def test_ideal_ats_resume_scores_high_grade_a(self):
        resume = """John Doe
john@example.com | 555-123-4567 | github.com/johndoe | linkedin.com/in/johndoe

TECHNICAL SKILLS
Languages: Python, SQL
Frameworks: FastAPI, React

EXPERIENCE
Software Engineering Intern, Acme Corp
- Engineered REST APIs using Python and FastAPI, increasing throughput by 35%.
- Optimized database queries in PostgreSQL, reducing query latency by 50ms across 10000 records.

EDUCATION
Bachelor of Science in Computer Science, State University, 2024
"""
        jd = "Requirements: Python, FastAPI, SQL. 0-2 years experience."
        result = calculate_ats_score(resume, jd)
        self.assertGreaterEqual(result["overall_score"], 80)
        self.assertIn(result["grade"], ["A", "B"])
        self.assertGreaterEqual(result["breakdown"]["keyword_match"], 20)
        self.assertGreaterEqual(result["breakdown"]["parseability"], 20)
        self.assertTrue(len(result["strengths"]) > 0)

    def test_penalizes_missing_must_haves_and_passive_bullets(self):
        resume = """John Doe
john@example.com

EXPERIENCE
- Worked on some stuff and helped with backend tasks.
"""
        jd = "Requirements: Must have Python, Docker, Kubernetes, AWS, PostgreSQL."
        result = calculate_ats_score(resume, jd)
        self.assertLess(result["overall_score"], 60)
        self.assertIn("Needs Work", result["grade"])
        self.assertTrue(any("missing" in f.lower() for f in result["feedback"]))

    def test_empty_resume_handling(self):
        result = calculate_ats_score("", "")
        self.assertEqual(result["overall_score"], 0)
        self.assertEqual(result["grade"], "Needs Work")
        self.assertIn("breakdown", result)
