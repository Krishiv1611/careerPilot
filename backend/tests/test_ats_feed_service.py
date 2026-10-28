from pathlib import Path
import sys
from unittest import TestCase
from unittest.mock import patch

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from services.ats_feed_service import normalize_ats_posting, fetch_direct_ats_jobs


class ATSFeedServiceTests(TestCase):
    def test_normalize_ats_posting_extracts_clean_job_record_lever(self):
        raw_lever = {
            "id": "lever-123",
            "text": "Junior Software Engineer",
            "categories": {"location": "Bengaluru", "commitment": "Full-time", "team": "Engineering"},
            "descriptionPlain": "We are seeking a junior backend engineer. Requirements: Python, SQL. 0-2 years experience.",
            "hostedUrl": "https://jobs.lever.co/stripe/lever-123",
        }
        job = normalize_ats_posting(raw_lever, provider="lever", company="Stripe")
        self.assertIsNotNone(job)
        self.assertEqual("Junior Software Engineer", job["title"])
        self.assertEqual("Stripe", job["company"])
        self.assertEqual("verified_ats", job["verification_status"])
        self.assertIn("Python", job["description"])
        self.assertEqual("https://jobs.lever.co/stripe/lever-123", job["job_url"])

    def test_normalize_ats_posting_extracts_clean_job_record_greenhouse(self):
        raw_gh = {
            "id": 456,
            "title": "Associate Software Engineer",
            "location": {"name": "Remote"},
            "content": "Requirements: Python, React. Entry level 0-1 years.",
            "absolute_url": "https://boards.greenhouse.io/airbnb/jobs/456",
        }
        job = normalize_ats_posting(raw_gh, provider="greenhouse", company="Airbnb")
        self.assertIsNotNone(job)
        self.assertEqual("Associate Software Engineer", job["title"])
        self.assertEqual("Airbnb", job["company"])
        self.assertEqual("verified_ats", job["verification_status"])

    def test_drops_senior_jobs_from_direct_feed(self):
        raw_gh = {
            "id": "gh-789",
            "title": "Principal Distributed Systems Architect",
            "content": "Requires 10+ years experience in high throughput systems.",
            "absolute_url": "https://boards.greenhouse.io/uber/jobs/789",
        }
        job = normalize_ats_posting(raw_gh, provider="greenhouse", company="Uber")
        self.assertIsNone(job)

    @patch("services.ats_feed_service._fetch_json_endpoint")
    def test_fetch_direct_ats_jobs_aggregates_fresher_roles(self, mock_fetch):
        mock_fetch.return_value = [
            {
                "id": "item-1",
                "text": "Software Engineering Intern",
                "categories": {"location": "San Francisco", "commitment": "Internship"},
                "descriptionPlain": "Summer 2027 SWE internship. Python and algorithms.",
                "hostedUrl": "https://jobs.lever.co/openai/item-1",
            }
        ]
        results = fetch_direct_ats_jobs(query="software", limit=5)
        self.assertTrue(len(results) > 0)
        self.assertEqual("verified_ats", results[0]["verification_status"])
        self.assertEqual("Software Engineering Intern", results[0]["title"])
