from pathlib import Path
import sys
from unittest import TestCase

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from services.job_reality_service import audit_job_reality


class JobRealityServiceTests(TestCase):
    def test_detects_high_quality_software_engineering_role(self):
        title = "Junior Backend Engineer"
        jd = """
        We are seeking a junior backend engineer to join our core payments infrastructure team.
        You will be mentored by senior engineers and work on REST APIs and databases.
        Requirements:
        - Python
        - FastAPI or Flask
        - PostgreSQL
        - Git
        Benefits: competitive salary, health insurance, flexible working hours.
        """
        audit = audit_job_reality(title, jd, company="Stripe")
        self.assertGreaterEqual(audit["role_health_score"], 80)
        self.assertEqual("High Quality", audit["health_verdict"])
        self.assertEqual("Low", audit["ghost_job_risk"])
        self.assertTrue(len(audit["green_flags"]) > 0)
        self.assertEqual(0, len(audit["red_flags"]))

    def test_detects_tech_stack_overload_and_burnout_phrasing(self):
        title = "Fresher Full Stack Web3 Developer"
        jd = """
        Urgent hiring for a fast-paced startup! Candidate must be a rockstar ninja willing to work hard play hard and wear many hats.
        Weekend availability required during crunch times.
        Mandatory skills:
        Python, Java, C++, Rust, Solidity, Flutter, React, Vue, Angular, Kubernetes, Docker, AWS, GCP, Azure, Kafka, Cassandra, GraphQL.
        Stipend: Performance based after 6 months.
        """
        audit = audit_job_reality(title, jd, company="Sketchy Agency")
        self.assertLess(audit["role_health_score"], 50)
        self.assertEqual("High-Risk Post", audit["health_verdict"])
        self.assertTrue(any("overload" in r.lower() for r in audit["red_flags"]))
        self.assertTrue(any("burnout" in r.lower() or "weekend" in r.lower() or "hats" in r.lower() for r in audit["red_flags"]))
        self.assertEqual("High", audit["ghost_job_risk"])

    def test_detects_disguised_sales_or_unpaid_trials(self):
        title = "Junior Software Developer"
        jd = """
        Looking for freshers. Role involves cold calling potential clients to explain our software products, lead generation, and door to door business development.
        100% commission based pay.
        """
        audit = audit_job_reality(title, jd, company="Direct Marketing Corp")
        self.assertLess(audit["role_health_score"], 40)
        self.assertTrue(any("sales" in r.lower() or "commission" in r.lower() for r in audit["red_flags"]))

    def test_flags_ghost_job_warning_for_vague_repost(self):
        desc = "Seeking rockstar engineer to join our confidential dynamic pipeline. Immediate opening. No specific requirements listed."
        result = audit_job_reality("Developer", desc, "Confidential Agency")
        self.assertEqual("High", result["ghost_job_risk"])
        self.assertIn("detected_tech_count", result)
        self.assertIsInstance(result["detected_tech_count"], int)
