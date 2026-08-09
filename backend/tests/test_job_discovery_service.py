from pathlib import Path
import sys
from unittest import TestCase


BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from services.job_discovery_service import (
    build_search_query,
    deduplicate_jobs,
    is_fresher_job,
    is_job_page,
    normalize_tavily_job,
    run_job_search,
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
        self.assertFalse(is_fresher_job("Backend Engineer", "Requires 2-4 years of experience"))
        self.assertTrue(is_fresher_job("Graduate Backend Engineer", "Open to freshers and 0-2 years experience"))

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
