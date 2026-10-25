from pathlib import Path
import sys
from unittest import TestCase


BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from services.job_discovery_service import (
    _is_spam_training_program,
    build_search_query,
    deduplicate_jobs,
    is_fresher_job,
    is_job_page,
    normalize_tavily_job,
    run_job_search,
    search_serpapi,
    search_tavily,
)


class JobDiscoveryServiceTests(TestCase):
    def test_search_query_keeps_the_students_words(self):
        query = build_search_query("Python backend developer", "Bengaluru", "internship")

        self.assertIn("Python backend developer", query)
        self.assertIn("Bengaluru", query)
        self.assertIn("internship", query)
        self.assertIn("fresher", query)

    def test_articles_are_not_treated_as_jobs(self):
        self.assertFalse(
            is_job_page(
                "https://example.com/blog/best-python-careers",
                "Ten Python careers to consider",
                "Read our guide and join our course",
            )
        )

    def test_article_on_a_trusted_domain_is_still_not_a_job(self):
        self.assertFalse(
            is_job_page(
                "https://www.linkedin.com/pulse/how-to-find-a-graduate-job",
                "How to find a graduate job",
                "Read this guide before you apply",
            )
        )

    def test_company_career_pages_are_accepted(self):
        self.assertTrue(
            is_job_page(
                "https://jobs.lever.co/acme/abc123",
                "Graduate Software Engineer - Acme",
                "Apply for this full-time opening",
            )
        )

    def test_tavily_job_needs_a_company_name(self):
        job = normalize_tavily_job(
            {
                "title": "Graduate Software Engineer | Acme Careers",
                "url": "https://careers.acme.example/jobs/graduate-software-engineer",
                "content": "Acme is hiring a graduate software engineer in Bengaluru. Apply now.",
            }
        )

        self.assertIsNotNone(job)
        self.assertEqual("Graduate Software Engineer", job["title"])
        self.assertEqual("Acme", job["company"])
        self.assertEqual("candidate", job["verification_status"])

    def test_senior_jobs_are_removed_from_the_fresher_feed(self):
        self.assertFalse(is_fresher_job("Senior Backend Engineer", "Requires 5+ years of experience"))
        self.assertFalse(is_fresher_job("Backend Engineer", "Requires 4-6 years of experience"))
        self.assertTrue(is_fresher_job("Graduate Backend Engineer", "Open to freshers and 0-2 years experience"))

    def test_fresher_job_not_disqualified_by_company_history_or_degree_year(self):
        self.assertTrue(
            is_fresher_job(
                "Junior Software Engineer",
                "Acme was founded 10 years ago. We are looking for fresh graduates with 0-1 years experience.",
            )
        )
        self.assertTrue(
            is_fresher_job(
                "Associate Developer",
                "Must have completed B.Tech/BE within the last 3 years. Fresher role.",
            )
        )

    def test_search_query_excludes_training_bootcamps(self):
        query = build_search_query("Python developer")
        self.assertIn("-training", query)
        self.assertIn("-bootcamp", query)
        self.assertIn("-curriculum", query)

    def test_bootcamp_and_pulse_pages_are_rejected(self):
        self.assertFalse(
            is_job_page(
                "https://example.com/bootcamp/python-fullstack",
                "Full Stack Web Development Bootcamp",
                "Enroll today and get job assistance",
            )
        )
        self.assertFalse(
            is_job_page(
                "https://example.com/training/react-internship-program",
                "React Internship Training Program with Certificate",
                "Pay fee to join summer training internship",
            )
        )

    def test_same_job_from_two_sources_is_returned_once(self):
        jobs = [
            {
                "title": "Graduate Engineer",
                "company": "Acme",
                "url": "https://acme.example/jobs/123?utm_source=google",
                "source": "Google Jobs",
            },
            {
                "title": "Graduate Engineer",
                "company": "Acme",
                "url": "https://acme.example/jobs/123",
                "source": "Tavily",
            },
        ]

        result = deduplicate_jobs(jobs)

        self.assertEqual(1, len(result))
        self.assertEqual(["Google Jobs", "Tavily"], result[0]["sources"])

    def test_one_provider_can_fail_without_losing_other_results(self):
        def working_provider(_query):
            return ([{
                "title": "Junior Python Developer",
                "company": "Acme",
                "location": "Bengaluru",
                "description": "Entry-level role for graduates",
                "url": "https://jobs.lever.co/acme/123",
                "source": "Google Jobs",
            }], None)

        def failing_provider(_query):
            return ([], "Tavily timed out")

        result = run_job_search(
            "Python developer",
            "Bengaluru",
            "full-time",
            providers=[working_provider, failing_provider],
        )

        self.assertEqual(1, len(result["jobs"]))
        self.assertEqual(["Tavily timed out"], result["warnings"])

    # --- Tavily Dual-Key & Resilience Tests ---
    def test_tavily_search_executes_with_tavily_api_key(self):
        from unittest.mock import MagicMock, patch
        with patch.dict("os.environ", {"TAVILY_API_KEY": "test_tavily_key"}, clear=True):
            mock_module = MagicMock()
            mock_client = MagicMock()
            mock_client.search.return_value = {"results": []}
            mock_module.TavilyClient.return_value = mock_client
            with patch.dict("sys.modules", {"tavily": mock_module}):
                jobs, warning = search_tavily("python developer")
                mock_module.TavilyClient.assert_called_once_with(api_key="test_tavily_key")
                self.assertEqual([], jobs)
                self.assertEqual("Tavily found no likely job pages.", warning)

    def test_tavily_search_executes_with_tavily_search_api_key(self):
        from unittest.mock import MagicMock, patch
        with patch.dict("os.environ", {"TAVILY_SEARCH_API_KEY": "test_alt_key"}, clear=True):
            mock_module = MagicMock()
            mock_client = MagicMock()
            mock_client.search.return_value = {"results": []}
            mock_module.TavilyClient.return_value = mock_client
            with patch.dict("sys.modules", {"tavily": mock_module}):
                jobs, warning = search_tavily("python developer")
                mock_module.TavilyClient.assert_called_once_with(api_key="test_alt_key")
                self.assertEqual([], jobs)

    def test_tavily_search_unconfigured_returns_clean_warning(self):
        from unittest.mock import patch
        with patch.dict("os.environ", {}, clear=True):
            jobs, warning = search_tavily("python")
            self.assertEqual([], jobs)
            self.assertIn("Tavily is not configured", warning)

    def test_tavily_search_exception_is_handled_gracefully(self):
        from unittest.mock import MagicMock, patch
        with patch.dict("os.environ", {"TAVILY_API_KEY": "test_key"}, clear=True):
            mock_module = MagicMock()
            mock_client = MagicMock()
            mock_client.search.side_effect = ConnectionError("Tavily network timeout")
            mock_module.TavilyClient.return_value = mock_client
            with patch.dict("sys.modules", {"tavily": mock_module}):
                jobs, warning = search_tavily("python")
                self.assertEqual([], jobs)
                self.assertIn("Tavily search failed: Tavily network timeout", warning)

    # --- SerpAPI & Fallback Tests ---
    def test_serpapi_unconfigured_returns_clean_warning(self):
        from unittest.mock import patch
        with patch.dict("os.environ", {}, clear=True):
            jobs, warning = search_serpapi("python")
            self.assertEqual([], jobs)
            self.assertIn("SerpAPI is not configured", warning)

    def test_serpapi_search_exception_returns_clean_warning(self):
        from unittest.mock import patch
        with patch.dict("os.environ", {"SERPAPI_API_KEY": "test_serp_key"}):
            with patch("requests.get", side_effect=ConnectionError("SerpAPI network error")):
                jobs, warning = search_serpapi("python")
                self.assertEqual([], jobs)
                self.assertIn("SerpAPI search failed: SerpAPI network error", warning)

    def test_provider_fallback_when_serpapi_fails_and_tavily_succeeds(self):
        def failing_serpapi(_query):
            return [], "SerpAPI failed: 429 Too Many Requests"

        def working_tavily(_query):
            return ([{
                "title": "Graduate Python Engineer",
                "company": "Acme",
                "location": "Bengaluru",
                "description": "Full-time opening for 2026 graduates.",
                "url": "https://jobs.lever.co/acme/123",
                "source": "Tavily",
            }], None)

        result = run_job_search("Python", providers=[failing_serpapi, working_tavily])
        self.assertEqual(1, len(result["jobs"]))
        self.assertEqual("Graduate Python Engineer", result["jobs"][0]["title"])
        self.assertIn("SerpAPI failed: 429 Too Many Requests", result["warnings"])

    # --- Query Negative Terms Tests ---
    def test_search_query_contains_exhaustive_negative_terms(self):
        query = build_search_query("Frontend Engineer", "Remote", "full-time")
        for term in ("-course", "-courses", "-training", "-trainings", "-bootcamp", "-bootcamps", "-tutorial", "-curriculum", "-syllabus", "-degree"):
            self.assertIn(term, query)

    def test_search_query_safely_handles_none_and_whitespace(self):
        query = build_search_query(None, " ", "  ")
        self.assertIn("fresher graduate entry level", query)
        self.assertIn("-bootcamp", query)

    # --- Body Text Anti-Spam Heuristic Tests ---
    def test_body_anti_spam_detects_candidate_fees(self):
        self.assertTrue(_is_spam_training_program("Junior Developer", "Candidates must pay a registration fee of INR 1000 before joining."))
        self.assertTrue(_is_spam_training_program("React Trainee", "Training fee: Rs 15000 payable upon registration."))
        self.assertTrue(_is_spam_training_program("Software Intern", "A refundable security deposit of 5000 is required for onboarding."))
        self.assertTrue(_is_spam_training_program("Graduate Engineer", "Pay a small processing fee of $50 to apply."))

    def test_body_anti_spam_detects_placement_guarantees_and_isas(self):
        self.assertTrue(_is_spam_training_program("Python Developer", "100% placement guarantee course with top hiring partners."))
        self.assertTrue(_is_spam_training_program("Web Developer", "Pay after placement ISA of 15% after securing a job."))
        self.assertTrue(_is_spam_training_program("Full Stack Engineer", "Assured placement program after 6 months of training."))

    def test_body_anti_spam_detects_course_and_batch_enrollment(self):
        self.assertTrue(_is_spam_training_program("Junior Programmer", "Enroll today for our winter batch. Limited seats available."))
        self.assertTrue(_is_spam_training_program("Backend Trainee", "Batch starts on 1st November. Course duration: 12 weeks."))
        self.assertTrue(_is_spam_training_program("Java Intern", "Training cum placement program with certification."))

    def test_body_anti_spam_detects_equipment_deposit_scam(self):
        self.assertTrue(_is_spam_training_program("Software Engineer Fresher", "Pay security deposit for laptop and assets."))

    def test_body_anti_spam_allows_legitimate_job_descriptions(self):
        self.assertFalse(_is_spam_training_program("Junior Software Engineer", "Acme is hiring graduates. We provide comprehensive hands-on training and mentorship."))
        self.assertFalse(_is_spam_training_program("Associate Machine Learning Engineer", "Work with machine learning model training pipelines. 0-2 years experience."))
        self.assertFalse(_is_spam_training_program("Backend Engineer", "Company offers learning & development budget for external courses and certifications."))

    def test_run_job_search_filters_out_spam_training_jobs(self):
        def provider_with_spam(_query):
            return ([
                {
                    "title": "Graduate Python Developer",
                    "company": "Acme",
                    "location": "Bengaluru",
                    "description": "Full-time opening for graduates. Comprehensive mentorship provided.",
                    "url": "https://jobs.lever.co/acme/python-grad",
                    "source": "MockProvider",
                },
                {
                    "title": "Python Internship",
                    "company": "TrainingInstitute",
                    "location": "Remote",
                    "description": "Internship cum placement program. Registration fee of Rs 2500 required.",
                    "url": "https://jobs.lever.co/training/intern",
                    "source": "MockProvider",
                },
            ], None)

        result = run_job_search("Python", providers=[provider_with_spam])
        self.assertEqual(1, len(result["jobs"]))
        self.assertEqual("Graduate Python Developer", result["jobs"][0]["title"])

    # --- Fresher Experience Classifier Tests ---
    def test_is_fresher_job_isolates_company_and_mentor_experience(self):
        self.assertTrue(is_fresher_job("Junior Backend Engineer", "Acme has 10+ years of experience in finance. Freshers welcome."))
        self.assertTrue(is_fresher_job("Junior Developer", "Work with mentors who have 8+ years of experience."))
        self.assertTrue(is_fresher_job("Associate Engineer", "Over 20 years of experience delivering cloud solutions worldwide. Entry level role."))
        self.assertTrue(is_fresher_job("Software Engineer", "Acme was founded 10 years ago. Looking for fresh graduates."))

    def test_is_fresher_job_accepts_0_to_3_years_experience(self):
        self.assertTrue(is_fresher_job("Junior Engineer", "Requires 0-3 years experience."))
        self.assertTrue(is_fresher_job("Junior Engineer", "Requires 3 years of experience."))
        self.assertTrue(is_fresher_job("Junior Engineer", "0 to 3 years of experience required."))
        self.assertFalse(is_fresher_job("Developer", "Requires 5+ years of experience."))
        self.assertFalse(is_fresher_job("Developer", "Minimum 4-6 years of experience required."))

    def test_fresher_job_accepts_0_to_3_years_experience_ranges(self):
        self.assertTrue(is_fresher_job("Software Engineer", "0-3 years experience required"))
        self.assertTrue(is_fresher_job("Junior Developer", "Looking for entry level devs with 0 to 3 years of experience."))
        self.assertTrue(is_fresher_job("Associate Engineer", "1-3 years experience in web development."))
        self.assertTrue(is_fresher_job("Backend Developer", "Open to freshers and 0-2 years experience."))

    def test_fresher_job_not_disqualified_by_company_history_and_capability(self):
        self.assertTrue(
            is_fresher_job(
                "Software Engineer",
                "Acme has 10 years in business. Looking for candidates with 0-3 years experience.",
            )
        )
        self.assertTrue(
            is_fresher_job(
                "Junior Engineer",
                "With over 15+ years of experience delivering cloud solutions, Acme is hiring a Junior Engineer.",
            )
        )
        self.assertTrue(
            is_fresher_job(
                "Associate Developer",
                "We are a 10 years old startup looking for fresh talent. 0-1 years exp.",
            )
        )

    def test_fresher_job_not_disqualified_by_mentorship_or_reporting(self):
        self.assertTrue(
            is_fresher_job(
                "Junior Backend Developer",
                "You will be mentored by senior engineers. 0-2 years experience required.",
            )
        )
        self.assertTrue(
            is_fresher_job(
                "Graduate Software Engineer",
                "Work closely with principal architect and tech lead. Freshers welcome.",
            )
        )
        self.assertTrue(
            is_fresher_job(
                "Associate Engineer",
                "Reports directly to the Director of Technology. Fresher opening.",
            )
        )

    def test_non_senior_lead_titles_are_accepted(self):
        self.assertTrue(is_fresher_job("Lead Generation Executive", "Marketing role for freshers"))
        self.assertTrue(is_fresher_job("Leadership Trainee", "Graduate trainee rotational program"))
        self.assertTrue(is_fresher_job("Management Trainee", "Open to 2024 graduates"))

    def test_senior_requirements_are_strictly_rejected(self):
        self.assertFalse(is_fresher_job("Software Engineer", "Requires 3+ years of experience."))
        self.assertFalse(is_fresher_job("Software Engineer", "Minimum 3 years of experience in Python."))
        self.assertFalse(is_fresher_job("Software Engineer", "Candidate must have 4 years experience."))
        self.assertFalse(is_fresher_job("Python Developer", "Looking for developer with 3-5 years experience."))
        self.assertFalse(is_fresher_job("Tech Lead", "Python developer"))
        self.assertFalse(is_fresher_job("Director of Product", "Lead product roadmap"))

    # --- Saved Jobs Route Structure & Handlers Tests ---
    def test_saved_jobs_route_precedes_job_id_route_to_prevent_collision(self):
        source = (BACKEND_ROOT / "routers/job_router.py").read_text(encoding="utf-8")
        saved_pos = source.find('@router.get("/saved"')
        job_id_pos = source.find('@router.get("/{job_id}"')

        self.assertNotEqual(-1, saved_pos, "GET /saved route not found in job_router.py")
        self.assertNotEqual(-1, job_id_pos, "GET /{job_id} route not found in job_router.py")
        self.assertLess(saved_pos, job_id_pos, "GET /saved must be declared BEFORE GET /{job_id}")

    def test_unsave_route_is_defined_in_job_router(self):
        source = (BACKEND_ROOT / "routers/job_router.py").read_text(encoding="utf-8")
        self.assertIn('@router.post("/{job_id}/unsave"', source)

    def test_saved_jobs_handler_logic(self):
        from unittest.mock import MagicMock, patch
        mock_fastapi = MagicMock()
        mock_router = MagicMock()
        mock_router.get.side_effect = lambda *args, **kwargs: (lambda f: f)
        mock_router.post.side_effect = lambda *args, **kwargs: (lambda f: f)
        mock_fastapi.APIRouter.return_value = mock_router

        modules_to_mock = {
            "fastapi": mock_fastapi,
            "passlib": MagicMock(),
            "passlib.context": MagicMock(),
            "models.database": MagicMock(),
            "models.application_model": MagicMock(),
            "models.job_model": MagicMock(),
            "models.user_job_model": MagicMock(),
            "models.schemas": MagicMock(),
            "models.user_model": MagicMock(),
            "utils.auth": MagicMock(),
        }

        with patch.dict("sys.modules", modules_to_mock):
            if "routers.job_router" in sys.modules:
                del sys.modules["routers.job_router"]
            from routers import job_router

            mock_db = MagicMock()
            mock_user = MagicMock(id=1)
            mock_job = MagicMock(
                id="job_saved_1",
                title="Graduate Python Developer",
                company="Acme",
                location="Bengaluru",
                employment_type="full-time",
                experience_level="Entry level",
                skills=["python"],
                description="Graduate opening.",
                salary_range=None,
                url="https://jobs.lever.co/acme/saved1",
                posted_date=None,
                source="Tavily",
                verification_status="candidate",
                fetched_at=None,
            )
            mock_user_job = MagicMock(state="saved")
            mock_chain = mock_db.query.return_value.join.return_value.filter.return_value.order_by.return_value
            mock_chain.all.return_value = [(mock_job, mock_user_job)]

            saved_jobs = job_router.get_saved_jobs(db=mock_db, current_user=mock_user)
            self.assertEqual(1, len(saved_jobs))
            self.assertEqual("job_saved_1", saved_jobs[0]["id"])
            self.assertEqual("saved", saved_jobs[0]["user_state"])

    def test_unsave_job_handler_logic(self):
        from unittest.mock import MagicMock, patch
        mock_fastapi = MagicMock()
        mock_router = MagicMock()
        mock_router.get.side_effect = lambda *args, **kwargs: (lambda f: f)
        mock_router.post.side_effect = lambda *args, **kwargs: (lambda f: f)
        mock_fastapi.APIRouter.return_value = mock_router

        modules_to_mock = {
            "fastapi": mock_fastapi,
            "passlib": MagicMock(),
            "passlib.context": MagicMock(),
            "models.database": MagicMock(),
            "models.application_model": MagicMock(),
            "models.job_model": MagicMock(),
            "models.user_job_model": MagicMock(),
            "models.schemas": MagicMock(),
            "models.user_model": MagicMock(),
            "utils.auth": MagicMock(),
        }

        with patch.dict("sys.modules", modules_to_mock):
            if "routers.job_router" in sys.modules:
                del sys.modules["routers.job_router"]
            from routers import job_router

            mock_db = MagicMock()
            mock_user = MagicMock(id=1)
            mock_job = MagicMock(
                id="job_saved_1",
                title="Graduate Python Developer",
                company="Acme",
                location="Bengaluru",
                employment_type="full-time",
                experience_level="Entry level",
                skills=["python"],
                description="Graduate opening.",
                salary_range=None,
                url="https://jobs.lever.co/acme/saved1",
                posted_date=None,
                source="Tavily",
                verification_status="candidate",
                fetched_at=None,
            )
            mock_user_job = MagicMock(state="saved")
            with patch.object(job_router, "_get_user_job", return_value=(mock_job, mock_user_job)):
                response = job_router.unsave_job("job_saved_1", db=mock_db, current_user=mock_user)
                self.assertEqual("discovered", mock_user_job.state)
                self.assertEqual("discovered", response["user_state"])
                mock_db.commit.assert_called_once()

