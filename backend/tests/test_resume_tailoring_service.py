from pathlib import Path
import sys
from unittest import TestCase


BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from services.resume_tailoring_service import (
    analyze_resume_for_job,
    apply_simple_prompt,
    find_unsupported_claims,
)


class ResumeTailoringServiceTests(TestCase):
    def test_analysis_separates_supported_and_missing_skills(self):
        result = analyze_resume_for_job(
            "Built a Python API with FastAPI for a college project.",
            "We need Python, FastAPI, Docker, and Kubernetes.",
        )

        self.assertEqual(["fastapi", "python"], result["matched_skills"])
        self.assertEqual(["docker", "kubernetes"], result["missing_skills"])
        self.assertNotIn("Docker", result["tailored_text"])
        self.assertTrue(all(item["kind"] == "future_project" for item in result["project_suggestions"]))

    def test_truth_guard_rejects_new_technology_and_metrics(self):
        original = "Built a Python API for a college project."
        candidate = "Built a Kubernetes platform that improved speed by 40%."

        unsupported = find_unsupported_claims(original, candidate)

        self.assertIn("kubernetes", unsupported["skills"])
        self.assertIn("40", unsupported["numbers"])

    def test_prompt_can_emphasize_existing_evidence(self):
        original = "Education: B.Tech\nBuilt a Python API\nVolunteer experience"

        updated = apply_simple_prompt(original, "Emphasize Python")

        self.assertEqual("Built a Python API", updated.splitlines()[0])

    def test_prompt_cannot_add_an_unsupported_skill(self):
        with self.assertRaises(ValueError):
            apply_simple_prompt("Built a Python API", "Add Kubernetes to my skills")

    def test_prompt_can_remove_a_line_by_its_existing_phrase(self):
        resume_text = "Summary\nBuilt a Python API\nUnrelated objective statement"

        result = apply_simple_prompt(
            resume_text,
            "Remove the unrelated objective statement",
        )

        self.assertEqual("Summary\nBuilt a Python API", result)

    def test_prompt_can_tailor_existing_evidence_to_the_job_description(self):
        resume_text = "Education\nBuilt a Python API\nCreated a React portfolio"
        job_description = "We need Python and FastAPI experience."

        result = apply_simple_prompt(
            resume_text,
            "Tailor this to the job description",
            job_description=job_description,
        )

        self.assertEqual("Built a Python API", result.splitlines()[0])
