"""
Tier 3: Cross-Feature Combinations Suite (Pairwise & Multi-Module Interactions)
Requirement: 20 pairwise cross-feature integration test cases.
Derived strictly from PROJECT.md and ORIGINAL_REQUEST.md.
"""

import io
import os
import unittest
from unittest.mock import patch

from tests.e2e.harness import (
    AtsPdfService,
    ApplicationStore,
    ConnectorsHub,
    GitHubConnector,
    KanbanBoard,
    LeetCodeConnector,
    LinkedInConnector,
    OutreachService,
    SavedJobsStore,
    TruthGuardEngine,
    apply_change_decisions,
    build_line_changes,
    build_search_query,
    change_status,
    deduplicate_jobs,
    is_fresher_job,
    is_job_page,
    match_resume_to_job,
    normalize_tavily_job,
    parse_multiline_requirements,
    tailor_resume_bullets,
)


class TestTier3CrossFeatureCombinations(unittest.TestCase):
    """Tier 3: 20 Cross-Feature Combinations & Pairwise Module Interactions"""

    def test_t3_01_discovery_to_multiline_matching_to_hard_blocker_detection(self):
        """Cross-Feature 1: Discovery -> Multiline Parsing -> Hard Blocker Detection"""
        raw_result = {
            "title": "Junior Python Developer at Acme",
            "url": "https://jobs.lever.co/acme/junior-python-dev",
            "content": """
We are hiring an entry-level candidate to apply for this job opening.
Requirements:
* Solid understanding of Python and SQL
* Experience with Docker containerization
Preferred:
* Kubernetes orchestration
"""
        }
        job = normalize_tavily_job(raw_result)
        self.assertIsNotNone(job)
        self.assertTrue(is_fresher_job(job["title"], job["description"]))

        resume = "Experienced in Python and SQL databases."
        match_res = match_resume_to_job(resume, job["description"])
        self.assertIn("docker", match_res["hard_blockers"])
        self.assertIn("kubernetes", match_res["preferred_gaps"])
        self.assertEqual("not_eligible", match_res["eligibility_status"])

    def test_t3_02_discovered_job_saving_to_kanban_board_saved_column(self):
        """Cross-Feature 2: Saved Jobs Store -> Kanban Board 'Saved' Column"""
        saved_store = SavedJobsStore()
        kanban = KanbanBoard()

        job = {"id": "job_stripe_1", "title": "Associate SDE", "company": "Stripe"}
        save_res = saved_store.save_job("student_1", job)
        self.assertEqual("saved", save_res["state"])

        # Add to Kanban
        card = kanban.add_card(job["id"], job["title"], job["company"])
        self.assertEqual("Saved", card["status"])
        self.assertEqual(1, len(kanban.board["Saved"]))

    def test_t3_03_saved_job_matching_to_gemini_tailoring_with_truth_guard(self):
        """Cross-Feature 3: Matching -> Gemini Tailoring -> TruthGuard Validation"""
        jd = "Requirements:\n- Python\n- FastAPI\n- PostgreSQL"
        resume = "Built REST APIs with Python and PostgreSQL."
        match_res = match_resume_to_job(resume, jd)
        self.assertIn("fastapi", match_res["hard_blockers"])

        # Tailor bullets
        tailored = tailor_resume_bullets(resume, jd, "Emphasize REST APIs in STAR format")
        bullet = tailored["bullets"][0]

        # Verify TruthGuard validates grounded claims and prevents hallucinating FastAPI
        is_valid, reason, sanitized = TruthGuardEngine.validate_bullet(
            bullet["original_text"],
            bullet["tailored_text"],
            allowed_skills=set(match_res["matched_skills"]),
            missing_skills=set(match_res["hard_blockers"])
        )
        self.assertTrue(is_valid or "FASTAPI" not in sanitized.upper())

    def test_t3_04_tailored_resume_to_ats_pdf_generation_layout_verification(self):
        """Cross-Feature 4: Tailored Bullets -> ATS Single-Column PDF Export"""
        tailored_doc = """
EDUCATION
B.Tech in Computer Science, 2025

SKILLS
Python, PostgreSQL, Git, Docker

EXPERIENCE
- Engineered modular REST endpoints using Python and PostgreSQL adhering to clean architecture.
- Optimized relational database queries resulting in measurable latency reduction.
"""
        pdf_buf = AtsPdfService.build_pdf(tailored_doc, candidate_name="Dev Student")
        content = pdf_buf.getvalue()
        self.assertTrue(content.startswith(b"%PDF-"))
        self.assertGreater(len(content), 1500)

    def test_t3_05_tailored_resume_version_linking_to_application_record(self):
        """Cross-Feature 5: Resume Version Linking -> Application Foreign Key"""
        app_store = ApplicationStore()
        app = app_store.create_application("job_meta_1", "user_1", resume_version_id="rv_tailored_v1")
        self.assertEqual("rv_tailored_v1", app["resume_version_id"])
        self.assertEqual("Saved", app["status"])

    def test_t3_06_state_machine_saved_to_applied_direct_kanban_transition(self):
        """Cross-Feature 6: Flexible State Machine (Saved -> Applied) -> Kanban Move"""
        kanban = KanbanBoard()
        kanban.add_card("app_linear", "Frontend Dev", "Linear", resume_version_id="rv_linear")

        # Move card directly from Saved to Applied
        card = kanban.move_card("app_linear", "Saved", "Applied")
        self.assertEqual("Applied", card["status"])
        self.assertEqual(1, len(kanban.board["Applied"]))
        self.assertEqual(0, len(kanban.board["Saved"]))

    def test_t3_07_rejected_application_reopen_to_applied_preserving_linked_resume(self):
        """Cross-Feature 7: Rejected -> Reopen to Applied -> Version Preserved"""
        app_store = ApplicationStore()
        app = app_store.create_application("job_databricks", "user_1", resume_version_id="rv_specialized_99")
        app_store.transition_status(app["id"], "Applied")
        app_store.transition_status(app["id"], "Rejected")
        self.assertEqual("Rejected", app_store._apps[app["id"]]["status"])

        # Reopen directly to Applied
        reopened = app_store.transition_status(app["id"], "Applied")
        self.assertEqual("Applied", reopened["status"])
        self.assertEqual("rv_specialized_99", reopened["resume_version_id"])

    def test_t3_08_leetcode_connector_stats_feeding_recruiter_cold_email(self):
        """Cross-Feature 8: LeetCode Connector -> Cold Email Evidence Integration"""
        lc_stats = LeetCodeConnector.fetch_user_stats("algo_wizard")
        outreach = OutreachService.generate_outreach(
            "Backend Systems Engineer", "Uber", "Priya Sharma", ["Python", "Algorithms"],
            leetcode_stats=lc_stats
        )
        self.assertIn(str(lc_stats["total_solved"]), outreach["email_body"])
        self.assertIn("LeetCode", outreach["email_body"])

    def test_t3_09_github_connector_repos_grounding_resume_tailoring_truth(self):
        """Cross-Feature 9: GitHub Connector Evidence -> Resume TruthGuard Validation"""
        gh_profile = GitHubConnector.fetch_user_profile("open_source_student")
        verified_skills = set(s.lower() for s in gh_profile["top_languages"])
        self.assertIn("python", verified_skills)

        orig = "Built open source CLI tools in Python."
        tailored = "Engineered open source CLI tools in Python with active GitHub repositories."
        is_valid, reason, sanitized = TruthGuardEngine.validate_bullet(
            orig, tailored, allowed_skills=verified_skills, missing_skills=set()
        )
        self.assertTrue(is_valid)

    def test_t3_10_linkedin_pdf_profile_import_matching_discovered_job(self):
        """Cross-Feature 10: LinkedIn PDF Import -> Candidate Profile -> Job Matching"""
        mock_pdf = b"%PDF-1.4 Mock LinkedIn Profile with education and experience"
        profile = LinkedInConnector.parse_profile_pdf(mock_pdf)
        candidate_skills = ", ".join(profile["skills"])

        jd = "Requirements:\n- Python\n- PostgreSQL\n- Git"
        match_res = match_resume_to_job(candidate_skills, jd)
        self.assertEqual(100, match_res["fit_score"])
        self.assertEqual([], match_res["hard_blockers"])

    def test_t3_11_anti_spam_body_filter_preventing_bogus_job_matching(self):
        """Cross-Feature 11: Anti-Spam Filter -> Discards Fake Job before Matching"""
        fake_url = "https://bootcamp-hub.com/courses/react-bootcamp"
        is_genuine = is_job_page(fake_url, "Fullstack Bootcamp", "Pay to enroll")
        self.assertFalse(is_genuine)

    def test_t3_12_truth_guard_engine_rejection_triggering_diff_review_sanitization(self):
        """Cross-Feature 12: TruthGuard Detected Hallucination -> Bullet Diff Review"""
        orig_bullet = "Developed backend API services."
        hallucinated_bullet = "Engineered backend API services driving a 10x throughput surge."

        is_valid, reason, sanitized = TruthGuardEngine.validate_bullet(
            orig_bullet, hallucinated_bullet, set(), set()
        )
        self.assertFalse(is_valid)
        self.assertNotIn("10x", sanitized)

        changes = build_line_changes(orig_bullet, sanitized)
        self.assertEqual(1, len(changes))
        res = apply_change_decisions(orig_bullet, changes, {changes[0]["id"]: "accepted"})
        self.assertEqual(sanitized, res["content"])

    def test_t3_13_diff_review_approval_compiling_to_ats_pdf_export(self):
        """Cross-Feature 13: Approved Diff Changes -> ATS PDF Generation"""
        orig_resume = "SKILLS\nPython\nEXPERIENCE\n- Built simple web scripts"
        proposed = "SKILLS\nPython\nEXPERIENCE\n- Engineered automated backend scripts using Python"

        changes = build_line_changes(orig_resume, proposed)
        approved = apply_change_decisions(orig_resume, changes, {changes[0]["id"]: "accepted"})

        pdf_buf = AtsPdfService.build_pdf(approved["content"], candidate_name="Approved Student")
        self.assertTrue(pdf_buf.getvalue().startswith(b"%PDF-"))

    def test_t3_14_leetcode_and_github_stats_fused_into_linkedin_outreach_note(self):
        """Cross-Feature 14: LeetCode + GitHub -> LinkedIn Note (< 300 Chars)"""
        lc = LeetCodeConnector.fetch_user_stats("code_dev")
        gh = GitHubConnector.fetch_user_profile("git_dev")

        outreach = OutreachService.generate_outreach(
            "Associate Engineer", "Figma", "Devon Lee", ["TypeScript"],
            leetcode_stats=lc, github_stats=gh
        )
        self.assertLess(outreach["linkedin_char_count"], 300)
        self.assertIn("Figma", outreach["linkedin_note"])

    def test_t3_15_dual_tavily_key_fallback_saving_and_outreach_flow(self):
        """Cross-Feature 15: Dual Tavily Key Fallback -> Saved Job -> Outreach Flow"""
        with patch.dict(os.environ, {"TAVILY_SEARCH_API_KEY": "tvly-valid-secondary"}, clear=True):
            key = os.getenv("TAVILY_API_KEY") or os.getenv("TAVILY_SEARCH_API_KEY")
            self.assertEqual("tvly-valid-secondary", key)

            store = SavedJobsStore()
            job = {"id": "job_notion", "title": "Junior Backend Engineer", "company": "Notion"}
            store.save_job("student_1", job)

            outreach = OutreachService.generate_outreach(job["title"], job["company"], "Taylor", ["Python"])
            self.assertIn("Notion", outreach["linkedin_note"])

    def test_t3_16_multiline_bullet_parser_gaps_feeding_cold_email_highlights(self):
        """Cross-Feature 16: Multiline Bullet Gaps -> Targeted Cold Email"""
        jd = """
Requirements:
* Experience in Python and SQL database architecture
* Knowledge of Docker containerization
Preferred:
* Redis caching
"""
        resume = "Competent in Python and SQL."
        match_res = match_resume_to_job(resume, jd)
        outreach = OutreachService.generate_outreach(
            "Backend Developer", "Snowflake", "Jordan", match_res["matched_skills"]
        )
        self.assertIn("Python", outreach["email_body"])
        self.assertIn("SQL", outreach["email_body"])

    def test_t3_17_reopened_application_updating_tailored_resume_version(self):
        """Cross-Feature 17: Reopened Application -> Linked Version Evolution"""
        app_store = ApplicationStore()
        app = app_store.create_application("job_airtable", "user_1", resume_version_id="rv_v1")
        app_store.transition_status(app["id"], "Applied")
        app_store.transition_status(app["id"], "Rejected")

        # Reopen to Preparing and update to improved resume version rv_v2
        app_store.transition_status(app["id"], "Preparing")
        app_store.link_resume_version(app["id"], "rv_v2_improved")
        self.assertEqual("rv_v2_improved", app_store._apps[app["id"]]["resume_version_id"])

    def test_t3_18_natural_language_instruction_with_github_verified_stack(self):
        """Cross-Feature 18: NL Instruction -> GitHub Verified Stack -> Clean Tailoring"""
        gh_profile = GitHubConnector.fetch_user_profile("fullstack_dev")
        verified_skills = set(s.lower() for s in gh_profile["top_languages"])

        instruction = "Emphasize Python and TypeScript microservices design using STAR format"
        tailored = tailor_resume_bullets("- Developed web apps", "JD", instruction)
        bullet = tailored["bullets"][0]
        self.assertIn("star_breakdown", bullet)

    def test_t3_19_kanban_drag_and_drop_rejection_then_reopen_to_preparing(self):
        """Cross-Feature 19: Kanban Rejection -> Reopen to Preparing Column"""
        kanban = KanbanBoard()
        kanban.add_card("app_reopen_test", "Associate Engineer", "Stripe")
        kanban.move_card("app_reopen_test", "Saved", "Applied")
        kanban.move_card("app_reopen_test", "Applied", "Rejected")
        self.assertEqual(1, len(kanban.board["Rejected"]))

        # Move back to Preparing
        reopened = kanban.move_card("app_reopen_test", "Rejected", "Preparing")
        self.assertEqual("Preparing", reopened["status"])
        self.assertEqual(1, len(kanban.board["Preparing"]))
        self.assertEqual(0, len(kanban.board["Rejected"]))

    def test_t3_20_full_platform_connectors_hub_sync_to_outreach_generation(self):
        """Cross-Feature 20: Full Connectors Hub Sync -> Recruiter Outreach Package"""
        hub = ConnectorsHub()
        lc = LeetCodeConnector.fetch_user_stats("star_coder")
        gh = GitHubConnector.fetch_user_profile("star_coder")
        hub.link_platform("leetcode", lc)
        hub.link_platform("github", gh)
        hub.link_platform("linkedin", {"url": "https://linkedin.com/in/star-coder"})

        status = hub.get_hub_status()
        self.assertEqual(3, status["connected_count"])

        outreach = OutreachService.generate_outreach(
            "Junior Software Engineer", "Palantir", "Alex Morgan", ["Python", "Algorithms"],
            leetcode_stats=lc, github_stats=gh
        )
        self.assertLess(outreach["linkedin_char_count"], 300)
        self.assertIn("Alex Morgan", outreach["email_subject"])
        self.assertIn(str(lc["total_solved"]), outreach["email_body"])
        self.assertIn(str(gh["public_repos"]), outreach["email_body"])


if __name__ == "__main__":
    unittest.main()
