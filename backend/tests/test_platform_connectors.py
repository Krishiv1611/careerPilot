from pathlib import Path
import sys
from unittest import TestCase
from unittest.mock import patch

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from services.leetcode_service import fetch_leetcode_stats, format_leetcode_bullet
from services.github_public_service import fetch_github_summary, format_github_bullet
from services.linkedin_pdf_service import parse_linkedin_text_profile


class PlatformConnectorsTests(TestCase):
    def test_format_leetcode_bullet_produces_truthful_ats_line(self):
        stats = {
            "username": "alexdev",
            "total_solved": 245,
            "easy_solved": 95,
            "medium_solved": 125,
            "hard_solved": 25,
            "ranking": 124500,
            "acceptance_rate": 62.5,
        }
        bullet = format_leetcode_bullet(stats)
        self.assertIn("245", bullet)
        self.assertIn("125 Medium", bullet)
        self.assertIn("LeetCode", bullet)

    @patch("services.leetcode_service._query_leetcode_graphql")
    def test_fetch_leetcode_stats_handles_valid_response(self, mock_query):
        mock_query.return_value = {
            "matchedUser": {
                "username": "coderboy",
                "profile": {"ranking": 45000},
                "submitStats": {
                    "acSubmissionNum": [
                        {"difficulty": "All", "count": 150},
                        {"difficulty": "Easy", "count": 60},
                        {"difficulty": "Medium", "count": 75},
                        {"difficulty": "Hard", "count": 15},
                    ]
                },
            }
        }
        stats = fetch_leetcode_stats("coderboy")
        self.assertEqual("coderboy", stats["username"])
        self.assertEqual(150, stats["total_solved"])
        self.assertEqual(75, stats["medium_solved"])
        self.assertEqual(45000, stats["ranking"])
        self.assertTrue(len(stats["bullet_point"]) > 0)

    @patch("services.leetcode_service._query_leetcode_graphql")
    def test_fetch_leetcode_stats_handles_user_not_found(self, mock_query):
        mock_query.return_value = {"matchedUser": None}
        stats = fetch_leetcode_stats("unknown_user_404")
        self.assertFalse(stats["found"])
        self.assertEqual(0, stats["total_solved"])

    def test_format_github_bullet_highlights_stars_and_languages(self):
        summary = {
            "username": "octocat",
            "public_repos": 12,
            "total_stars": 34,
            "top_languages": ["Python", "TypeScript", "Go"],
        }
        bullet = format_github_bullet(summary)
        self.assertIn("12 public repositories", bullet)
        self.assertIn("Python, TypeScript", bullet)
        self.assertIn("34 stars", bullet)

    def test_parse_linkedin_text_profile_extracts_sections(self):
        linkedin_text = """John Doe
Software Engineer | Ex-Google Intern | CS @ Stanford
San Francisco Bay Area

Experience
Acme Corporation
Software Engineering Intern
June 2023 - August 2023 (3 months)
- Developed Python microservices.

Education
Stanford University
Bachelor of Science, Computer Science
2020 - 2024

Skills
Python • FastAPI • React • PostgreSQL • Docker
"""
        parsed = parse_linkedin_text_profile(linkedin_text)
        self.assertEqual("John Doe", parsed["name"])
        self.assertIn("Software Engineer", parsed["headline"])
        self.assertIn("Stanford University", parsed["education"])
        self.assertIn("python", parsed["skills"])
        self.assertIn("fastapi", parsed["skills"])
        self.assertIn("docker", parsed["skills"])
