from pathlib import Path
import sys
from unittest import TestCase

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from services.job_discovery_service import (
    _is_spam_training_program,
    build_search_query,
    is_fresher_job,
    run_job_search,
)
from services.matching_service import match_resume_to_job


class AdversarialJobDiscoveryTests(TestCase):
    """
    Empirical Adversarial Test Suite for Milestone 1.
    Challenges job discovery, experience filtering, and anti-spam heuristics.
    """

    # -------------------------------------------------------------------------
    # 1. Prompt Mandatory Edge Cases: Legitimate Fresher Postings (Must Accept)
    # -------------------------------------------------------------------------
    def test_prompt_fresher_edge_cases_accepted(self):
        cases = [
            ("Junior Developer", "Our company was founded 10 years ago. Looking for freshers.", "founded 10 years ago"),
            ("Junior Developer", "You will be mentored by senior engineer. 0-1 years exp.", "mentored by senior engineer"),
            ("Software Engineer", "Requires a 4-year degree in Computer Science.", "4-year degree"),
            ("Software Engineer", "0-3 years experience required for this entry-level role.", "0-3 years experience"),
            ("Software Engineer", "1-2 years experience preferred, freshers may also apply.", "1-2 years experience preferred"),
            ("Lead Generation Executive", "Entry level lead generation role in marketing team.", "Lead Generation Executive"),
        ]
        for title, desc, label in cases:
            with self.subTest(label=label):
                self.assertTrue(
                    is_fresher_job(title, desc),
                    f"Expected legitimate fresher job '{label}' to be accepted by is_fresher_job, but was rejected."
                )

    # -------------------------------------------------------------------------
    # 2. Prompt Mandatory Edge Cases: Senior Roles (Must Reject)
    # -------------------------------------------------------------------------
    def test_prompt_senior_roles_rejected(self):
        cases = [
            ("Senior Software Engineer", "Work with modern stack in a collaborative team.", "Senior Software Engineer"),
            ("Software Engineer", "5+ years experience required in Python and distributed systems.", "5+ years experience required"),
        ]
        for title, desc, label in cases:
            with self.subTest(label=label):
                self.assertFalse(
                    is_fresher_job(title, desc),
                    f"Expected senior role '{label}' to be rejected by is_fresher_job, but was accepted."
                )

    # -------------------------------------------------------------------------
    # 3. Prompt Mandatory Edge Cases: Deceptive Training Scams (Must Reject)
    # -------------------------------------------------------------------------
    def test_prompt_deceptive_training_scams_rejected(self):
        cases = [
            ("Junior Web Developer", "100% placement fee required prior to commencing job placement.", "100% placement fee required"),
            ("Junior Developer", "Enroll in training bootcamp for $500 to secure guaranteed interview.", "enroll in training bootcamp for $500"),
            ("Software Trainee", "Pay-after-placement ISA of 15% monthly salary once placed.", "pay-after-placement ISA"),
        ]
        for title, desc, label in cases:
            with self.subTest(label=label):
                self.assertTrue(
                    _is_spam_training_program(title, desc),
                    f"Expected deceptive training scam '{label}' to be flagged by _is_spam_training_program, but was allowed."
                )

    # -------------------------------------------------------------------------
    # 4. Deceptive Anti-Spam Stress Cases: Hyphenation, Acronyms & Deposits
    # -------------------------------------------------------------------------
    def test_hyphenated_pay_after_placement_variations_flagged(self):
        self.assertTrue(
            _is_spam_training_program("Junior Developer", "We offer a pay-after-placement model for all trainees."),
            "Hyphenated 'pay-after-placement' was not detected as spam."
        )
        self.assertTrue(
            _is_spam_training_program("Junior Developer", "We offer a pay after placement model for all trainees."),
            "Spaced 'pay after placement' was not detected as spam."
        )

    def test_placement_fee_variants_flagged(self):
        self.assertTrue(
            _is_spam_training_program("Junior Developer", "Candidates must pay a placement fee of Rs 10000 upon offer."),
            "'placement fee' was not detected as spam."
        )
        self.assertTrue(
            _is_spam_training_program("Junior Developer", "Placement charges apply once selected for the role."),
            "'placement charges' was not detected as spam."
        )

    def test_isa_income_share_agreement_variants_flagged(self):
        self.assertTrue(
            _is_spam_training_program("Junior Developer", "Requires signing an income share agreement with 15% CTC."),
            "'income share agreement' was not detected as spam."
        )
        self.assertTrue(
            _is_spam_training_program("Junior Developer", "Candidate will enter a pay-after-placement ISA agreement."),
            "'pay-after-placement ISA' was not detected as spam."
        )

    def test_laptop_and_equipment_deposit_variants_flagged(self):
        self.assertTrue(
            _is_spam_training_program("Junior Developer", "Refundable deposit for laptop required before dispatch."),
            "'deposit for laptop' was not detected as spam."
        )
        self.assertTrue(
            _is_spam_training_program("Junior Developer", "A laptop deposit of $500 is required upon accepting the offer."),
            "'laptop deposit' was not detected as spam."
        )

    # -------------------------------------------------------------------------
    # 5. Anti-Spam False Positives: Legitimate Training Mentions (Must Accept)
    # -------------------------------------------------------------------------
    def test_legitimate_training_mentions_not_flagged(self):
        cases = [
            ("Associate Engineer", "Comprehensive on-the-job training provided during the first 3 months."),
            ("ML Engineer Fresher", "Design, build, and optimize machine learning model training pipelines."),
            ("Graduate Trainee", "Paid training program with full monthly stipend and health insurance."),
            ("Junior Developer", "Generous annual budget for employees to attend external training courses."),
        ]
        for title, desc in cases:
            with self.subTest(title=title):
                self.assertFalse(
                    _is_spam_training_program(title, desc),
                    f"Legitimate training mention in '{title}' was incorrectly flagged as spam."
                )

    # -------------------------------------------------------------------------
    # 6. Experience Filter Stress Cases: Seniority & Range Boundaries
    # -------------------------------------------------------------------------
    def test_experience_range_boundaries(self):
        # 0-3 years accepted
        self.assertTrue(is_fresher_job("Software Engineer", "0-3 years experience required"))
        self.assertTrue(is_fresher_job("Software Engineer", "0 to 2 years experience required"))
        self.assertTrue(is_fresher_job("Software Engineer", "1-3 years experience preferred"))
        
        # 3+ years rejected
        self.assertFalse(is_fresher_job("Software Engineer", "3+ years of experience required"))
        self.assertFalse(is_fresher_job("Software Engineer", "Minimum 3 years experience required"))
        self.assertFalse(is_fresher_job("Software Engineer", "At least 3 years experience required"))
        self.assertFalse(is_fresher_job("Software Engineer", "3-5 years experience required"))
        self.assertFalse(is_fresher_job("Software Engineer", "4-6 years experience required"))
        self.assertFalse(is_fresher_job("Software Engineer", "5+ years of software development experience"))

    def test_title_seniority_detection(self):
        # Senior titles rejected
        self.assertFalse(is_fresher_job("Senior Software Engineer", "Open to motivated learners"))
        self.assertFalse(is_fresher_job("Sr. Frontend Engineer", "Collaborative team"))
        self.assertFalse(is_fresher_job("Staff Engineer", "Join our platform team"))
        self.assertFalse(is_fresher_job("Principal Architect", "Lead system architecture"))
        self.assertFalse(is_fresher_job("Tech Lead", "Guide team of 5"))
        self.assertFalse(is_fresher_job("Director of Engineering", "Oversee engineering"))
        self.assertFalse(is_fresher_job("VP of Technology", "Strategic vision"))

        # Non-senior leadership/lead titles accepted
        self.assertTrue(is_fresher_job("Lead Generation Executive", "Outbound marketing"))
        self.assertTrue(is_fresher_job("Leadership Trainee", "Rotational program for 2026 graduates"))
        self.assertTrue(is_fresher_job("Management Trainee", "Entry level corporate management track"))

    def test_company_history_and_mentorship_not_rejected(self):
        self.assertTrue(is_fresher_job("Junior Developer", "Our company has 10+ years of experience in AI. Freshers welcome."))
        self.assertTrue(is_fresher_job("Junior Developer", "Founded 15 years ago in Seattle. Open to 2025 graduates."))
        self.assertTrue(is_fresher_job("Junior Developer", "You will be coached by mentors who have 10+ years of experience."))
        self.assertTrue(is_fresher_job("Junior Developer", "Work closely with principal architects and senior staff engineers."))
        self.assertTrue(is_fresher_job("Junior Developer", "Reports directly to the Director of Engineering."))

    # -------------------------------------------------------------------------
    # 7. Search Query Negative Terms & Boundary Handling
    # -------------------------------------------------------------------------
    def test_build_search_query_robustness(self):
        # Safe handling of None, whitespace
        query_none = build_search_query(None)
        self.assertIn("fresher graduate entry level", query_none)
        self.assertIn("-bootcamp", query_none)

        query_spaces = build_search_query("   ", "   ", "   ")
        self.assertIn("fresher graduate entry level", query_spaces)

        # Standard role query includes all mandated negative terms
        query = build_search_query("Python Developer", "Bengaluru", "full-time")
        for term in ("-course", "-courses", "-training", "-trainings", "-bootcamp", "-bootcamps", "-tutorial", "-curriculum", "-syllabus", "-degree"):
            self.assertIn(term, query)

    # -------------------------------------------------------------------------
    # 8. End-to-End Pipeline Filtering: run_job_search
    # -------------------------------------------------------------------------
    def test_run_job_search_filters_adversarial_spam_and_senior(self):
        def adversarial_provider(_query):
            return ([
                {
                    "title": "Junior Python Developer",
                    "company": "Acme Corp",
                    "location": "Bengaluru",
                    "description": "Acme was founded 10 years ago. Looking for freshers with 0-2 years exp.",
                    "url": "https://jobs.lever.co/acme/101",
                    "source": "MockTavily",
                },
                {
                    "title": "Software Trainee",
                    "company": "Scam Academy",
                    "location": "Remote",
                    "description": "100% placement fee required prior to commencing job placement.",
                    "url": "https://jobs.lever.co/scam/102",
                    "source": "MockTavily",
                },
                {
                    "title": "Senior Backend Engineer",
                    "company": "Big Tech",
                    "location": "Bengaluru",
                    "description": "Requires 5+ years of experience in distributed systems.",
                    "url": "https://jobs.lever.co/bigtech/103",
                    "source": "MockTavily",
                },
            ], None)

        result = run_job_search("Python", providers=[adversarial_provider])
        returned_titles = [j["title"] for j in result["jobs"]]

        self.assertIn("Junior Python Developer", returned_titles, "Legitimate fresher job was dropped by pipeline.")
        self.assertNotIn("Senior Backend Engineer", returned_titles, "Senior job leaked into discovered fresher feed.")
        self.assertNotIn("Software Trainee", returned_titles, "100% placement fee scam leaked into discovered fresher feed.")

    # -------------------------------------------------------------------------
    # 9. False Positive on Company Legacy / Heritage in Experience & Matching
    # -------------------------------------------------------------------------
    def test_company_legacy_and_heritage_not_flagged_as_senior(self):
        desc = "Junior Python Developer. Company has 50 years of legacy in automotive industry. Required skills: Python, SQL."
        self.assertTrue(
            is_fresher_job("Junior Python Developer", desc),
            "Job mentioning '50 years of legacy' was incorrectly flagged as senior."
        )

        match_res = match_resume_to_job("Python, SQL developer", desc, job_title="Junior Python Developer")
        self.assertNotEqual(
            "not_eligible",
            match_res["eligibility_status"],
            "Fresher candidate was marked not_eligible due to company's '50 years of legacy'."
        )

    # -------------------------------------------------------------------------
    # 10. ATS URL Job Page Classifier False Rejections
    # -------------------------------------------------------------------------
    def test_ats_job_pages_with_standard_engineering_terms_accepted(self):
        from services.job_discovery_service import is_job_page
        self.assertTrue(
            is_job_page(
                "https://jobs.lever.co/stripe/software-engineer-early-career",
                "Software Engineer, Early Career",
                "Stripe is seeking an engineer to build payment infrastructure. Work on distributed systems."
            ),
            "Legitimate ATS job posting on Lever was rejected by is_job_page."
        )

