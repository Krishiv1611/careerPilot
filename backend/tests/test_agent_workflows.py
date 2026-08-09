from pathlib import Path
import sys
from unittest import TestCase


BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

try:
    from agents.career_supervisor import run_career_workflow
except ImportError:
    run_career_workflow = None


class CareerAgentWorkflowTests(TestCase):
    def setUp(self):
        self.assertIsNotNone(
            run_career_workflow,
            "The CareerPilot multi-agent workflow entry point is missing.",
        )

    def test_supervisor_routes_job_discovery_to_the_job_agent(self):
        def provider(_query):
            return ([
                {
                    "title": "Graduate Python Developer",
                    "company": "Acme",
                    "location": "Bengaluru",
                    "description": "Entry-level opening for graduates. Apply now.",
                    "url": "https://jobs.lever.co/acme/graduate-python",
                    "source": "Test provider",
                },
                {
                    "title": "How to find a graduate job",
                    "company": "LinkedIn Editorial",
                    "description": "Read this guide before you apply.",
                    "url": "https://www.linkedin.com/pulse/find-graduate-job",
                    "source": "Test provider",
                },
            ], None)

        result = run_career_workflow({
            "task": "discover_jobs",
            "role": "Python developer",
            "location": "Bengaluru",
            "employment_type": "full-time",
            "providers": [provider],
        })

        self.assertEqual("job_discovery_agent", result["handled_by"])
        self.assertEqual(1, len(result["job_search_result"]["jobs"]))
        self.assertEqual(
            "Graduate Python Developer",
            result["job_search_result"]["jobs"][0]["title"],
        )

    def test_supervisor_routes_resume_analysis_to_the_evidence_agent(self):
        result = run_career_workflow({
            "task": "analyze_resume",
            "resume_text": "Built a Python API with FastAPI.",
            "job_description": "We need Python, FastAPI, and Docker.",
        })

        analysis = result["resume_analysis"]
        self.assertEqual("resume_evidence_agent", result["handled_by"])
        self.assertEqual(["fastapi", "python"], analysis["matched_skills"])
        self.assertEqual(["docker"], analysis["missing_skills"])
        self.assertNotIn("Docker", analysis["tailored_text"])

    def test_resume_agent_applies_safe_prompt_edits(self):
        result = run_career_workflow({
            "task": "edit_resume",
            "resume_text": "Education: B.Tech\nBuilt a Python API\nVolunteer experience",
            "current_resume_text": "Education: B.Tech\nBuilt a Python API\nVolunteer experience",
            "instruction": "Emphasize Python",
        })

        self.assertEqual("resume_evidence_agent", result["handled_by"])
        self.assertEqual(
            "Built a Python API",
            result["resume_edit_result"]["content"].splitlines()[0],
        )

    def test_resume_agent_rejects_prompted_claims_without_evidence(self):
        with self.assertRaisesRegex(ValueError, "unsupported skills"):
            run_career_workflow({
                "task": "edit_resume",
                "resume_text": "Built a Python API",
                "current_resume_text": "Built a Python API",
                "instruction": "Add Kubernetes to my skills",
            })

    def test_resume_agent_ranks_existing_github_evidence(self):
        result = run_career_workflow({
            "task": "rank_github_evidence",
            "missing_skills": ["docker", "kubernetes"],
            "repository_evidence": [{
                "owner": "student",
                "name": "deployment-project",
                "url": "https://github.com/student/deployment-project",
                "readme": "A Python service packaged with Docker.",
                "files": ["Dockerfile", "app.py"],
            }],
        })

        projects = result["github_project_result"]["projects"]
        self.assertEqual("resume_evidence_agent", result["handled_by"])
        self.assertEqual(1, len(projects))
        self.assertEqual(["docker"], projects[0]["matching_skills"])

    def test_resume_agent_suggests_career_tracks_with_its_classifier_tool(self):
        def predictor(resume_text, limit=3):
            self.assertIn("Python", resume_text)
            self.assertEqual(3, limit)
            return {
                "available": True,
                "suggestions": [{
                    "category": "Python Developer",
                    "confidence": 0.72,
                    "rank": 1,
                    "model_version": "test-model",
                }],
                "warning": None,
                "model_version": "test-model",
            }

        result = run_career_workflow({
            "task": "suggest_career_tracks",
            "resume_text": "Built a Python API with FastAPI.",
            "career_track_predictor": predictor,
        })

        self.assertEqual("resume_evidence_agent", result["handled_by"])
        self.assertEqual(
            "Python Developer",
            result["career_track_result"]["suggestions"][0]["category"],
        )

    def test_supervisor_rejects_unknown_work_instead_of_guessing(self):
        with self.assertRaisesRegex(ValueError, "Unsupported career workflow task"):
            run_career_workflow({"task": "write_cover_letter"})
