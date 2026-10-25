"""
Tier 4: Real-World Scenarios Suite (End-to-End User Workflows)
Requirement: 10 comprehensive multi-step real-world application scenarios.
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


class TestTier4RealWorldScenarios(unittest.TestCase):
    """Tier 4: 10 Comprehensive End-to-End User Workflow Scenarios"""

    def test_scenario_01_fresh_cs_graduate_applying_to_first_junior_role(self):
        """
        Scenario 1: Fresh CS graduate discovering an entry role, saving it,
        verifying zero hard blockers, generating outreach, and moving directly to Applied.
        """
        # Step 1: Query construction and job validation
        query = build_search_query("Junior Software Engineer", location="Bangalore", employment_type="Full-time")
        self.assertIn("fresher graduate entry level", query)

        job_desc = """
Hiring Junior Software Engineer for exciting cloud platform.
Requirements:
* B.Tech / BE in Computer Science or related degree
* Strong foundation in Python and SQL
* Experience with Git version control
Preferred:
* Familiarity with Docker containerization
"""
        self.assertTrue(is_fresher_job("Junior Software Engineer", job_desc))

        # Step 2: Save job in persistent tab
        saved_store = SavedJobsStore()
        job = {"id": "job_cs_fresh", "title": "Junior Software Engineer", "company": "Swiggy"}
        saved_store.save_job("student_cs_1", job)
        self.assertEqual(1, len(saved_store.get_saved_jobs("student_cs_1")))

        # Step 3: Match against candidate resume
        resume = """
EDUCATION
B.Tech in Computer Science, 2025
SKILLS
Python, SQL, Git
PROJECTS
- Developed database migration tool using Python and SQL
"""
        match_res = match_resume_to_job(resume, job_desc)
        self.assertEqual("eligible", match_res["eligibility_status"])
        self.assertEqual([], match_res["hard_blockers"])
        self.assertIn("docker", match_res["preferred_gaps"])

        # Step 4: Outreach generation
        outreach = OutreachService.generate_outreach(
            job["title"], job["company"], "Rohit Verma", match_res["matched_skills"]
        )
        self.assertLess(outreach["linkedin_char_count"], 300)
        self.assertIn("Rohit Verma", outreach["email_subject"])

        # Step 5: Application workflow (Saved -> Applied directly)
        app_store = ApplicationStore()
        app = app_store.create_application(job["id"], "student_cs_1", resume_version_id="rv_fresh_v1")
        app_store.transition_status(app["id"], "Applied")
        self.assertEqual("Applied", app_store._apps[app["id"]]["status"])

    def test_scenario_02_self_taught_dev_transitioning_to_frontend_with_github(self):
        """
        Scenario 2: Self-taught developer linking GitHub profile, leveraging
        verified repository evidence for resume tailoring, and accepting diffs.
        """
        # Step 1: Link GitHub profile
        gh = GitHubConnector.fetch_user_profile("self_taught_coder")
        self.assertIn("TypeScript", gh["top_languages"])
        self.assertGreater(gh["public_repos"], 0)

        # Step 2: Resume tailoring with natural language instruction
        orig_resume = """
SKILLS
JavaScript, HTML, CSS
EXPERIENCE
- Built personal portfolio and web applications
"""
        instruction = "Highlight TypeScript and React development using STAR format"
        tailored = tailor_resume_bullets(orig_resume, "Frontend Developer JD", instruction)
        self.assertTrue(len(tailored["bullets"]) > 0)
        bullet = tailored["bullets"][0]

        # Step 3: Diff review and acceptance
        changes = build_line_changes(orig_resume, orig_resume.replace("Built personal portfolio", bullet["tailored_text"]))
        if changes:
            approved = apply_change_decisions(orig_resume, changes, {changes[0]["id"]: "accepted"})
            self.assertTrue(approved["all_resolved"])

    def test_scenario_03_competitive_programmer_leveraging_leetcode_for_backend(self):
        """
        Scenario 3: Competitive programmer integrating LeetCode problem solving proof
        into outreach and recruiter applications.
        """
        # Step 1: Fetch verified LeetCode stats
        lc = LeetCodeConnector.fetch_user_stats("algo_titan")
        self.assertGreater(lc["total_solved"], 100)

        # Step 2: Hub registration
        hub = ConnectorsHub()
        hub.link_platform("leetcode", lc)
        self.assertEqual(1, hub.get_hub_status()["connected_count"])

        # Step 3: Generate high-impact recruiter note citing LeetCode proof
        outreach = OutreachService.generate_outreach(
            "Backend Engineer", "Coinbase", "Kiran Rao", ["Python", "Algorithms"],
            leetcode_stats=lc
        )
        self.assertLess(outreach["linkedin_char_count"], 300)
        self.assertIn("LeetCode", outreach["linkedin_note"])
        self.assertIn(str(lc["total_solved"]), outreach["email_body"])

    def test_scenario_04_student_recovering_from_accidental_rejection_and_reapplying(self):
        """
        Scenario 4: Student accidentally marks an application Rejected, recovers
        it via state machine reopening, updates to tailored resume v2, and moves to Interview.
        """
        app_store = ApplicationStore()
        kanban = KanbanBoard()

        # Step 1: Create application and advance
        app = app_store.create_application("job_canva", "user_1", resume_version_id="rv_v1")
        kanban.add_card(app["id"], "Product Engineer", "Canva", resume_version_id="rv_v1")

        # Step 2: Progress to Applied then accidental Rejected
        app_store.transition_status(app["id"], "Applied")
        app_store.transition_status(app["id"], "Rejected")
        kanban.move_card(app["id"], "Saved", "Applied")
        kanban.move_card(app["id"], "Applied", "Rejected")
        self.assertEqual(1, len(kanban.board["Rejected"]))

        # Step 3: Reopen application to Preparing
        app_store.transition_status(app["id"], "Preparing")
        kanban.move_card(app["id"], "Rejected", "Preparing")
        self.assertEqual("Preparing", app_store._apps[app["id"]]["status"])
        self.assertEqual(1, len(kanban.board["Preparing"]))

        # Step 4: Upgrade resume version and advance to Interview
        app_store.link_resume_version(app["id"], "rv_v2_enhanced")
        app_store.transition_status(app["id"], "Applied")
        app_store.transition_status(app["id"], "Interview")
        self.assertEqual("Interview", app_store._apps[app["id"]]["status"])
        self.assertEqual("rv_v2_enhanced", app_store._apps[app["id"]]["resume_version_id"])

    def test_scenario_05_anti_spam_scraper_defense_and_founding_date_disambiguation(self):
        """
        Scenario 5: Search results containing deceptive bootcamp spam and company
        founding age are properly sanitized and categorized.
        """
        # Spurious bootcamp listing
        bootcamp_url = "https://bootcamp-academy.com/training/react-fullstack"
        self.assertFalse(is_job_page(bootcamp_url, "Fullstack Bootcamp", "Pay registration fee"))

        # Real listing with corporate history mention
        genuine_listing_text = """
We are hiring an Associate Software Engineer.
Acme Corp was founded 14 years ago and has grown to a team of 500 engineers.
Mentors with 10+ years experience will guide you.
Requirements:
* 0-2 years software development experience
* Proficiency in Python and Git
"""
        self.assertTrue(is_fresher_job("Associate Software Engineer", genuine_listing_text))

        # Rejection of senior job
        senior_listing = "Senior Backend Engineer with minimum 5+ years experience"
        self.assertFalse(is_fresher_job("Senior Backend Engineer", senior_listing))

    def test_scenario_06_international_student_unicode_name_and_complex_resume(self):
        """
        Scenario 6: International student with non-ASCII unicode characters
        and complex multiline resume generating compliant ATS PDF.
        """
        student_name = "René François Ångström"
        resume_text = """
EDUCATION
École Polytechnique, MS Computer Science

SKILLS
Python, PostgreSQL, Docker, Linux

EXPERIENCE
- Engineered distributed microservices with Python and PostgreSQL.
- Implemented automated regression testing pipelines reducing build flakiness.
"""
        # Step 1: TruthGuard validation
        is_valid, reason, sanitized = TruthGuardEngine.validate_bullet(
            "Engineered distributed microservices with Python and PostgreSQL.",
            "Engineered distributed microservices with Python and PostgreSQL adhering to clean architecture.",
            {"python", "postgresql"},
            set()
        )
        self.assertTrue(is_valid)

        # Step 2: Single-column ATS PDF compilation
        pdf_buf = AtsPdfService.build_pdf(resume_text, candidate_name=student_name)
        pdf_bytes = pdf_buf.getvalue()
        self.assertTrue(pdf_bytes.startswith(b"%PDF-"))
        self.assertGreater(len(pdf_bytes), 1000)

    def test_scenario_07_full_application_lifecycle_search_to_offer(self):
        """
        Scenario 7: Complete student lifecycle: Discovery -> Save -> Tailor -> ATS PDF
        -> Direct Apply -> Recruiter Outreach -> Offer!
        """
        # Step 1: Job Discovery
        raw_job = {
            "title": "Junior Backend Developer at Figma",
            "url": "https://jobs.lever.co/figma/junior-backend",
            "content": "We are hiring for this opening. Apply now. Requirements: Python, SQL. 0-2 years experience."
        }
        job = normalize_tavily_job(raw_job)
        self.assertIsNotNone(job)

        # Step 2: Save Job
        saved_store = SavedJobsStore()
        saved_store.save_job("student_lifecycle", job)

        # Step 3: Match & Tailor
        resume = "Experienced in Python and SQL database design."
        match_res = match_resume_to_job(resume, job["description"])
        tailored = tailor_resume_bullets(resume, job["description"], "STAR format")
        bullet = tailored["bullets"][0]["tailored_text"]

        # Step 4: Build ATS PDF
        full_resume = f"SKILLS\nPython, SQL\nEXPERIENCE\n- {bullet}"
        pdf_buf = AtsPdfService.build_pdf(full_resume, candidate_name="Maya Lin")
        self.assertTrue(pdf_buf.getvalue().startswith(b"%PDF-"))

        # Step 5: Application workflow (Saved -> Applied directly)
        app_store = ApplicationStore()
        app = app_store.create_application(job["id"], "student_lifecycle", resume_version_id="rv_maya_v1")
        app_store.transition_status(app["id"], "Applied")

        # Step 6: Recruiter outreach
        outreach = OutreachService.generate_outreach(job["title"], job["company"], "Maya Lin", match_res["matched_skills"])
        self.assertLess(outreach["linkedin_char_count"], 300)

        # Step 7: Progress to Offer
        app_store.transition_status(app["id"], "Interview")
        app_store.transition_status(app["id"], "Offer")
        self.assertEqual("Offer", app_store._apps[app["id"]]["status"])

    def test_scenario_08_truth_guard_preventing_resume_inflation(self):
        """
        Scenario 8: Prompt attempting to fabricate metrics and claim unmentioned skills
        is intercepted, sanitized, and safely integrated into diff review.
        """
        orig_bullet = "Created REST endpoints in Python."
        # Adversarial attempt to inject unmentioned Kubernetes and 400% revenue boost
        adversarial_tailored = "Engineered REST endpoints in Python and Kubernetes, accelerating revenue by 400%."

        is_valid, reason, sanitized = TruthGuardEngine.validate_bullet(
            orig_bullet, adversarial_tailored, {"python"}, {"kubernetes"}
        )
        self.assertFalse(is_valid)
        self.assertNotIn("400%", sanitized)
        self.assertNotIn("kubernetes", sanitized.lower())

        # Review and accept sanitized bullet
        changes = build_line_changes(orig_bullet, sanitized)
        res = apply_change_decisions(orig_bullet, changes, {changes[0]["id"]: "accepted"})
        self.assertEqual(sanitized, res["content"])

    def test_scenario_09_high_volume_student_managing_50_applications_across_kanban(self):
        """
        Scenario 9: High-volume student managing 50 applications across 6 Kanban columns
        with view toggling and state integrity.
        """
        kanban = KanbanBoard()
        app_store = ApplicationStore()

        # Create 50 applications
        for i in range(50):
            app = app_store.create_application(f"job_{i}", "student_power", resume_version_id=f"rv_{i % 5}")
            kanban.add_card(app["id"], f"Role {i}", f"Company {i}", resume_version_id=app["resume_version_id"])

        self.assertEqual(50, len(kanban.board["Saved"]))

        # Distribute 10 to Applied, 10 to Preparing, 5 to Interview, 5 to Offer, 5 to Rejected
        for i in range(10):
            kanban.move_card(f"app-{i+1}", "Saved", "Applied")
        for i in range(10, 20):
            kanban.move_card(f"app-{i+1}", "Saved", "Preparing")
        for i in range(20, 25):
            kanban.move_card(f"app-{i+1}", "Saved", "Applied")
            kanban.move_card(f"app-{i+1}", "Applied", "Interview")
        for i in range(25, 30):
            kanban.move_card(f"app-{i+1}", "Saved", "Applied")
            kanban.move_card(f"app-{i+1}", "Applied", "Interview")
            kanban.move_card(f"app-{i+1}", "Interview", "Offer")
        for i in range(30, 35):
            kanban.move_card(f"app-{i+1}", "Saved", "Applied")
            kanban.move_card(f"app-{i+1}", "Applied", "Rejected")

        self.assertEqual(15, len(kanban.board["Saved"]))
        self.assertEqual(10, len(kanban.board["Applied"]))
        self.assertEqual(10, len(kanban.board["Preparing"]))
        self.assertEqual(5, len(kanban.board["Interview"]))
        self.assertEqual(5, len(kanban.board["Offer"]))
        self.assertEqual(5, len(kanban.board["Rejected"]))

        # Toggle view modes
        kanban.set_view_mode("list")
        self.assertEqual("list", kanban.view_mode)
        kanban.set_view_mode("kanban")
        self.assertEqual("kanban", kanban.view_mode)

    def test_scenario_10_multi_platform_evidence_fusion_and_outreach(self):
        """
        Scenario 10: Seamless fusion of LeetCode (algorithmic rigor), GitHub
        (open source repos), and LinkedIn (education & headline) into a cohesive candidate outreach.
        """
        # Step 1: Connect platforms
        hub = ConnectorsHub()
        lc = LeetCodeConnector.fetch_user_stats("elite_candidate")
        gh = GitHubConnector.fetch_user_profile("elite_candidate")
        li_pdf = b"%PDF-1.4 LinkedIn Profile for Elite Candidate"
        li = LinkedInConnector.parse_profile_pdf(li_pdf)

        hub.link_platform("leetcode", lc)
        hub.link_platform("github", gh)
        hub.link_platform("linkedin", {"url": "https://linkedin.com/in/elite-candidate", "data": li})
        self.assertEqual(3, hub.get_hub_status()["connected_count"])

        # Step 2: Generate cohesive outreach referencing all three evidence sources
        outreach = OutreachService.generate_outreach(
            "Associate Backend Engineer", "Datadog", "Ananya Sen",
            ["Python", "Distributed Systems"],
            leetcode_stats=lc,
            github_stats=gh
        )

        # Verification of constraints
        self.assertLess(outreach["linkedin_char_count"], 300)
        self.assertLessEqual(outreach["linkedin_char_count"], 299)
        self.assertIn("Datadog", outreach["linkedin_note"])
        self.assertIn(str(lc["total_solved"]), outreach["email_body"])
        self.assertIn(str(gh["public_repos"]), outreach["email_body"])
        self.assertIn("Ananya Sen", outreach["email_subject"])


if __name__ == "__main__":
    unittest.main()
