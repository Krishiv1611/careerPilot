from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]


class StudentProductSurfaceTests(unittest.TestCase):
    def test_rejected_interview_files_are_removed(self):
        interview_files = [
            "backend/agents/interview_agent.py",
            "backend/agents/interview_evaluator_agent.py",
            "backend/agents/interview_graph.py",
            "backend/agents/interview_state.py",
            "backend/models/interview_model.py",
            "backend/routers/interview_router.py",
            "frontend/src/pages/InterviewSetup.jsx",
            "frontend/src/pages/ActiveInterview.jsx",
            "frontend/src/pages/InterviewReport.jsx",
        ]

        remaining = [path for path in interview_files if (ROOT / path).exists()]

        self.assertEqual([], remaining, f"Interview files still present: {remaining}")

    def test_rejected_interview_routes_and_navigation_are_removed(self):
        product_surface_files = [
            "backend/main.py",
            "backend/models/__init__.py",
            "backend/models/schemas.py",
            "backend/models/user_model.py",
            "frontend/src/App.jsx",
            "frontend/src/components/layout/Navbar.jsx",
        ]

        banned_markers = (
            "interview_router",
            "InterviewSession",
            "InterviewCreate",
            "InterviewResponse",
            "Interview Prep",
            "/interview/",
        )

        violations = []
        for relative_path in product_surface_files:
            source = (ROOT / relative_path).read_text(encoding="utf-8")
            for marker in banned_markers:
                if marker in source:
                    violations.append(f"{relative_path}: {marker}")

        self.assertEqual([], violations, f"Interview surface still wired: {violations}")

    def test_browser_source_does_not_store_provider_credentials(self):
        frontend_source = ROOT / "frontend/src"
        banned_markers = (
            "googleApiKey_",
            "serpApiKey_",
            "tavilyApiKey_",
            "APIKeyModal",
        )

        violations = []
        for source_path in frontend_source.rglob("*"):
            if source_path.suffix not in {".js", ".jsx"}:
                continue
            source = source_path.read_text(encoding="utf-8")
            for marker in banned_markers:
                if marker in source:
                    violations.append(f"{source_path.relative_to(ROOT)}: {marker}")

        self.assertEqual([], violations, f"Provider credentials still reach browser source: {violations}")

    def test_replaced_prototype_pages_are_removed(self):
        prototype_pages = [
            "frontend/src/pages/AddJob.jsx",
            "frontend/src/pages/AnalyzeJD.jsx",
            "frontend/src/pages/CareerPilot.jsx",
            "frontend/src/components/settings/APIKeyModal.jsx",
        ]

        remaining = [path for path in prototype_pages if (ROOT / path).exists()]
        self.assertEqual([], remaining, f"Replaced prototype pages still present: {remaining}")

    def test_resume_upload_does_not_accept_browser_provider_keys(self):
        source = (ROOT / "backend/routers/resume_router.py").read_text(encoding="utf-8")

        self.assertNotIn("google_api_key", source)
        self.assertNotIn("Form(", source)

    def test_browser_does_not_store_session_tokens(self):
        frontend_source = (ROOT / "frontend/src/services/api.js").read_text(encoding="utf-8")
        auth_source = (ROOT / "frontend/src/context/AuthContext.jsx").read_text(encoding="utf-8")

        self.assertNotIn("localStorage", frontend_source)
        self.assertNotIn("localStorage", auth_source)


if __name__ == "__main__":
    unittest.main()
