from pathlib import Path
import sys
from unittest import TestCase

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from services.recruiter_xray_service import analyze_recruiter_xray


class RecruiterXRayServiceTests(TestCase):
    def test_detects_fluff_words_and_recommends_replacements(self):
        resume = """
        John Doe | Software Engineer
        Summary: I am a hardworking, passionate, and detail-oriented self-starter seeking an entry role.
        Experience:
        - Worked on various web tasks and was a great team player.
        """
        result = analyze_recruiter_xray(resume)
        fluff_words = [f["word"] for f in result["fluff_words_detected"]]
        self.assertIn("hardworking", fluff_words)
        self.assertIn("passionate", fluff_words)
        self.assertIn("self-starter", fluff_words)
        self.assertIn("team player", fluff_words)
        self.assertLess(result["screen_probability"], 50)
        self.assertTrue(any("metric" in r.lower() or "fluff" in r.lower() for r in result["instant_red_flags"]))

    def test_awards_high_screen_probability_for_impactful_resume(self):
        resume = """
        Jane Smith | Backend Engineer | github.com/janesmith
        Technical Skills: Python, FastAPI, Docker, PostgreSQL, Redis, AWS
        Experience:
        Backend Engineer Intern - FinTech Corp
        - Architected high-throughput payment ingestion pipeline using FastAPI & Redis, reducing p99 latency by 38%.
        - Deployed containerized microservices to AWS ECS using Docker and GitHub Actions CI/CD.
        """
        jd = "Seeking Backend Engineer with Python, FastAPI, Docker, and distributed systems experience."
        result = analyze_recruiter_xray(resume, jd)
        self.assertGreaterEqual(result["screen_probability"], 80)
        self.assertTrue(any("FastAPI" in g for g in result["instant_green_flags"]))
        self.assertIn("High", result["hiring_manager_verdict"])
