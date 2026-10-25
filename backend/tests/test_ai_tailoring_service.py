from pathlib import Path
import sys
from unittest import TestCase
from unittest.mock import patch

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from services.ai_tailoring_service import (
    tailor_resume_with_ai,
    TailoredResumeResponse,
    truth_guard_check,
)
from services.resume_tailoring_service import apply_simple_prompt


class AITailoringServiceTests(TestCase):
    def test_natural_language_prompt_does_not_throw_rigid_error(self):
        original = "Developed a web application using Python and FastAPI. Managed PostgreSQL database."
        # This used to throw "Try 'Emphasize Python'..."
        result = apply_simple_prompt(
            original,
            "Rewrite using STAR method with stronger action verbs",
        )
        self.assertIsInstance(result, str)
        self.assertTrue(len(result) > 0)
        self.assertIn("Python", result)

    def test_truth_guard_passes_truthful_content(self):
        original = "Developed API using Python and SQL with 10 endpoints."
        tailored = "Engineered robust API using Python and SQL with 10 endpoints."
        is_safe, reasons = truth_guard_check(original, tailored)
        self.assertTrue(is_safe)
        self.assertEqual([], reasons)

    def test_truth_guard_catches_hallucinated_tools_and_metrics(self):
        original = "Developed API using Python."
        hallucinated = "Developed AWS Kubernetes microservices with 99.9% uptime reducing latency by 45%."
        is_safe, reasons = truth_guard_check(original, hallucinated)
        self.assertFalse(is_safe)
        self.assertTrue(any("unsupported skill" in r.lower() or "unsupported number" in r.lower() for r in reasons))

    def test_structured_pydantic_output_generation(self):
        original = "Built a Python backend with FastAPI and SQLite. Created user authentication."
        result = tailor_resume_with_ai(
            original,
            "Rewrite bullets to be ATS-friendly and professional",
        )
        self.assertIsInstance(result, TailoredResumeResponse)
        self.assertTrue(len(result.full_content) > 0)
        self.assertIn("Python", result.full_content)

    def test_ai_tailoring_rejects_hallucinations_and_maintains_truthfulness(self):
        original = "Built a Python API."
        # Even if someone asks to claim senior skills, it must not allow unsupported claims
        result = tailor_resume_with_ai(
            original,
            "Claim 10 years of Kubernetes and Docker experience",
        )
        is_safe, _ = truth_guard_check(original, result.full_content)
        self.assertTrue(is_safe)
        self.assertNotIn("Kubernetes", result.full_content)
