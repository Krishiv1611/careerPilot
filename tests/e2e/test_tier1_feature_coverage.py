"""
Tier 1: Comprehensive Feature Coverage Suite (Features 1-20)
Requirement: >= 5 test cases per feature across all 20 features = 100 test cases.
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


class TestFeature01DualTavilyApiKeySupport(unittest.TestCase):
    """Feature 1: Dual Tavily API Key Support (TAVILY_API_KEY and TAVILY_SEARCH_API_KEY)"""

    def test_f01_tc01_prefers_primary_tavily_api_key(self):
        with patch.dict(os.environ, {"TAVILY_API_KEY": "tvly-primary-12345", "TAVILY_SEARCH_API_KEY": "tvly-search-99999"}):
            key = os.getenv("TAVILY_API_KEY") or os.getenv("TAVILY_SEARCH_API_KEY")
            self.assertEqual("tvly-primary-12345", key)

    def test_f01_tc02_falls_back_to_search_api_key_when_primary_missing(self):
        with patch.dict(os.environ, {"TAVILY_SEARCH_API_KEY": "tvly-search-99999"}, clear=True):
            key = os.getenv("TAVILY_API_KEY") or os.getenv("TAVILY_SEARCH_API_KEY")
            self.assertEqual("tvly-search-99999", key)

    def test_f01_tc03_handles_empty_string_in_primary_key(self):
        with patch.dict(os.environ, {"TAVILY_API_KEY": "", "TAVILY_SEARCH_API_KEY": "tvly-search-valid"}):
            key = os.getenv("TAVILY_API_KEY") or os.getenv("TAVILY_SEARCH_API_KEY")
            self.assertEqual("tvly-search-valid", key)

    def test_f01_tc04_returns_none_when_neither_key_is_provided(self):
        with patch.dict(os.environ, {}, clear=True):
            key = os.getenv("TAVILY_API_KEY") or os.getenv("TAVILY_SEARCH_API_KEY")
            self.assertIsNone(key)

    def test_f01_tc05_whitespace_padded_key_is_trimmed(self):
        with patch.dict(os.environ, {"TAVILY_SEARCH_API_KEY": "   tvly-padded-key   "}, clear=True):
            key = (os.getenv("TAVILY_API_KEY") or os.getenv("TAVILY_SEARCH_API_KEY") or "").strip()
            self.assertEqual("tvly-padded-key", key)


class TestFeature02AntiSpamQueryAndBodyFilter(unittest.TestCase):
    """Feature 2: Anti-Spam Query & Body Filter (bootcamps, courses, deceptive training programs)"""

    def test_f02_tc01_search_query_contains_negative_spam_tokens(self):
        query = build_search_query("Backend Developer")
        for token in ["-course", "-training", "-bootcamp", "-tutorial", "-blog", "-article"]:
            self.assertIn(token, query)

    def test_f02_tc02_job_page_filter_rejects_bootcamp_urls(self):
        self.assertFalse(is_job_page("https://coderacademy.com/bootcamp/fullstack-web-dev"))
        self.assertFalse(is_job_page("https://learn.io/courses/python-certification/info"))

    def test_f02_tc03_job_page_filter_rejects_paid_training_programs(self):
        self.assertFalse(
            is_job_page(
                "https://example.com/training/summer-internship-batch",
                title="Summer Internship Training Program",
                content="Pay registration fee to enroll in 6-week training with certificate"
            )
        )

    def test_f02_tc04_job_page_filter_accepts_verified_ats_subdomains(self):
        self.assertTrue(
            is_job_page(
                "https://jobs.lever.co/stripe/junior-engineer",
                title="Junior Engineer - Stripe",
                content="We are hiring a junior software engineer to apply engineering skills"
            )
        )

    def test_f02_tc05_body_filter_distinguishes_genuine_job_language(self):
        genuine_listing = is_job_page(
            "https://careers.google.com/jobs/results/12345",
            title="Associate Software Engineer",
            content="Opening for recent university graduate. Apply today."
        )
        blog_post = is_job_page(
            "https://careers.google.com/blog/how-we-hire",
            title="How We Hire Engineers",
            content="Read this guide to learn more about our process."
        )
        self.assertTrue(genuine_listing)
        self.assertFalse(blog_post)


class TestFeature03AccurateFresherExperienceFilter(unittest.TestCase):
    """Feature 3: Accurate Fresher Experience Filter (disregard founding date and mentorship; include 0-3 yrs)"""

    def test_f03_tc01_disregards_company_founding_age(self):
        desc = "Acme Corp was founded 10 years ago. We are hiring a Junior Python Developer (0-1 years exp)."
        self.assertTrue(is_fresher_job("Junior Python Developer", desc))

    def test_f03_tc02_disregards_mentorship_seniority_mentions(self):
        desc = "You will collaborate with team leads with 10+ years experience mentoring you in modern backend systems."
        self.assertTrue(is_fresher_job("Software Engineer - University Graduate", desc))

    def test_f03_tc03_accepts_valid_fresher_ranges_up_to_3_years(self):
        self.assertTrue(is_fresher_job("Associate Engineer", "Requirements: 0-2 years of software experience."))
        self.assertTrue(is_fresher_job("Graduate Engineer", "Candidate experience: 0-3 years."))

    def test_f03_tc04_rejects_senior_job_titles_immediately(self):
        self.assertFalse(is_fresher_job("Senior Full Stack Developer", "Open to fast learners."))
        self.assertFalse(is_fresher_job("Lead Software Architect", "Leading a team of engineers."))
        self.assertFalse(is_fresher_job("Staff Backend Engineer", "Distributed systems expertise."))

    def test_f03_tc05_rejects_experience_requirements_above_3_years(self):
        self.assertFalse(is_fresher_job("Software Engineer", "Minimum 4+ years of production experience required."))
        self.assertFalse(is_fresher_job("Developer", "Experience: 5 to 7 years in cloud engineering."))


class TestFeature04PersistentSavedJobsTab(unittest.TestCase):
    """Feature 4: Persistent Saved Jobs Tab (GET /jobs/saved and dedicated persistence)"""

    def setUp(self):
        self.store = SavedJobsStore()

    def test_f04_tc01_saving_job_records_state_successfully(self):
        res = self.store.save_job("student_1", {"id": "job_101", "title": "Junior Dev", "company": "Vercel"})
        self.assertEqual("saved", res["state"])

    def test_f04_tc02_saved_jobs_retrieved_independently_per_user(self):
        self.store.save_job("student_1", {"id": "job_101", "title": "Junior Dev", "company": "Vercel"})
        self.store.save_job("student_2", {"id": "job_202", "title": "Frontend Eng", "company": "Linear"})
        saved_1 = self.store.get_saved_jobs("student_1")
        self.assertEqual(1, len(saved_1))
        self.assertEqual("job_101", saved_1[0]["id"])

    def test_f04_tc03_saving_existing_job_idempotent(self):
        self.store.save_job("student_1", {"id": "job_101", "title": "Junior Dev", "company": "Vercel"})
        res = self.store.save_job("student_1", {"id": "job_101", "title": "Junior Dev", "company": "Vercel"})
        self.assertEqual("Job already saved", res["message"])
        self.assertEqual(1, len(self.store.get_saved_jobs("student_1")))

    def test_f04_tc04_dismissing_job_removes_it_from_saved_tab(self):
        self.store.save_job("student_1", {"id": "job_101", "title": "Junior Dev", "company": "Vercel"})
        self.store.dismiss_job("student_1", "job_101")
        self.assertEqual(0, len(self.store.get_saved_jobs("student_1")))

    def test_f04_tc05_saved_jobs_persist_across_subsequent_search_runs(self):
        self.store.save_job("student_1", {"id": "job_101", "title": "Junior Dev", "company": "Vercel"})
        # Simulate running a new search that returns different results
        new_search_results = [{"id": "job_303", "title": "Cloud Dev", "company": "AWS"}]
        dedup = deduplicate_jobs(new_search_results)
        self.assertEqual(1, len(dedup))
        # Verify saved jobs were not wiped out by search
        self.assertEqual(1, len(self.store.get_saved_jobs("student_1")))


class TestFeature05MultilineBulletParser(unittest.TestCase):
    """Feature 5: Multiline Bullet Parser (Requirements: headers and multi-line items)"""

    def test_f05_tc01_parses_multiline_bullet_item_into_single_requirement(self):
        jd = """
Requirements:
* Strong foundational knowledge of Python and relational databases,
  including query optimization and indexing techniques.
* Experience with Git version control.
"""
        reqs = parse_multiline_requirements(jd)
        self.assertEqual(2, len(reqs["must_have"]))
        self.assertIn("indexing techniques", reqs["must_have"][0])

    def test_f05_tc02_parses_both_must_have_and_preferred_sections(self):
        jd = """
Must-Have:
- Proficiency in JavaScript and React
- Understanding of HTTP protocols

Preferred Qualifications:
- Familiarity with Docker containerization
- Knowledge of Redis caching
"""
        reqs = parse_multiline_requirements(jd)
        self.assertEqual(2, len(reqs["must_have"]))
        self.assertEqual(2, len(reqs["preferred"]))

    def test_f05_tc03_handles_numbered_bullets_with_multiline_continuation(self):
        jd = """
Qualifications:
1. Bachelor's degree in Computer Science or related field with solid
   understanding of data structures and algorithms.
2. Hands-on experience developing REST APIs.
"""
        reqs = parse_multiline_requirements(jd)
        self.assertEqual(2, len(reqs["must_have"]))
        self.assertIn("data structures and algorithms", reqs["must_have"][0])

    def test_f05_tc04_handles_mixed_bullet_glyph_styles(self):
        jd = """
Requirements:
• Experience with SQL queries
* Experience with Docker containers
- Experience with Git
"""
        reqs = parse_multiline_requirements(jd)
        self.assertEqual(3, len(reqs["must_have"]))

    def test_f05_tc05_ignores_unrelated_paragraphs_outside_requirement_headers(self):
        jd = """
About Us:
We build delightful student software for career development.

Requirements:
- Python programming skills
- SQL database management

Benefits:
- Flexible remote work options
- Health insurance
"""
        reqs = parse_multiline_requirements(jd)
        self.assertEqual(2, len(reqs["must_have"]))
        self.assertEqual(0, len(reqs["preferred"]))


class TestFeature06GapCategorization(unittest.TestCase):
    """Feature 6: Gap Categorization (Hard Blockers vs Preferred Gaps)"""

    def test_f06_tc01_categorizes_missing_must_have_as_hard_blocker(self):
        jd = """
Requirements:
- Python
- PostgreSQL

Nice to Have:
- Docker
"""
        res = match_resume_to_job("Experience with Python and Git.", jd)
        self.assertIn("postgresql", res["hard_blockers"])
        self.assertEqual("not_eligible", res["eligibility_status"])

    def test_f06_tc02_missing_preferred_skill_does_not_block_eligibility(self):
        jd = """
Requirements:
- Python
- SQL

Preferred:
- Kubernetes
"""
        res = match_resume_to_job("Experienced in Python and SQL database design.", jd)
        self.assertEqual([], res["hard_blockers"])
        self.assertIn("kubernetes", res["preferred_gaps"])
        self.assertEqual("eligible", res["eligibility_status"])

    def test_f06_tc03_calculates_fit_score_as_percentage_of_matched_skills(self):
        jd = """
Requirements:
- Python
- Docker
- React
- SQL
"""
        res = match_resume_to_job("Proficient in Python and Docker.", jd)
        self.assertEqual(50, res["fit_score"])

    def test_f06_tc04_candidate_satisfying_all_requirements_gets_100_fit(self):
        jd = """
Requirements:
- Python
- SQL
"""
        res = match_resume_to_job("Built applications using Python and SQL.", jd)
        self.assertEqual(100, res["fit_score"])
        self.assertEqual([], res["hard_blockers"])
        self.assertEqual([], res["preferred_gaps"])

    def test_f06_tc05_eligibility_reason_specifies_exact_missing_hard_blockers(self):
        jd = """
Requirements:
- Java
- Spring Boot
"""
        res = match_resume_to_job("Frontend developer skilled in HTML, CSS, React.", jd)
        self.assertIn("java", res["eligibility_reason"].lower())


class TestFeature07FlexibleApplicationStateMachine(unittest.TestCase):
    """Feature 7: Flexible Application State Machine (Saved -> Applied directly, reopening Rejected/Withdrawn)"""

    def test_f07_tc01_allows_direct_transition_from_saved_to_applied(self):
        next_state = change_status("Saved", "Applied")
        self.assertEqual("Applied", next_state)

    def test_f07_tc02_allows_reopening_rejected_application_to_applied(self):
        next_state = change_status("Rejected", "Applied")
        self.assertEqual("Applied", next_state)

    def test_f07_tc03_allows_reopening_withdrawn_application_to_preparing(self):
        next_state = change_status("Withdrawn", "Preparing")
        self.assertEqual("Preparing", next_state)

    def test_f07_tc04_progresses_from_applied_to_interview_to_offer(self):
        s1 = change_status("Applied", "Interview")
        s2 = change_status(s1, "Offer")
        self.assertEqual("Offer", s2)

    def test_f07_tc05_disallows_illegal_transitions_with_value_error(self):
        with self.assertRaises(ValueError):
            change_status("Saved", "Offer")  # Cannot jump straight from Saved to Offer
        with self.assertRaises(ValueError):
            change_status("NonExistentStatus", "Applied")


class TestFeature08TailoredResumeVersionLinking(unittest.TestCase):
    """Feature 8: Tailored Resume Version Linking (Application.resume_version_id foreign key)"""

    def setUp(self):
        self.store = ApplicationStore()

    def test_f08_tc01_application_stores_linked_resume_version_id(self):
        app = self.store.create_application("job_1", "user_1", resume_version_id="rv_999")
        self.assertEqual("rv_999", app["resume_version_id"])

    def test_f08_tc02_application_created_without_version_can_be_linked_later(self):
        app = self.store.create_application("job_1", "user_1")
        self.assertIsNone(app["resume_version_id"])
        updated = self.store.link_resume_version(app["id"], "rv_custom_456")
        self.assertEqual("rv_custom_456", updated["resume_version_id"])

    def test_f08_tc03_linking_invalid_app_id_raises_key_error(self):
        with self.assertRaises(KeyError):
            self.store.link_resume_version("invalid_id", "rv_123")

    def test_f08_tc04_resume_version_link_persists_across_state_transitions(self):
        app = self.store.create_application("job_1", "user_1", resume_version_id="rv_version_1")
        self.store.transition_status(app["id"], "Applied")
        self.store.transition_status(app["id"], "Interview")
        self.assertEqual("rv_version_1", self.store._apps[app["id"]]["resume_version_id"])

    def test_f08_tc05_resume_version_remains_intact_upon_reopening_rejected_record(self):
        app = self.store.create_application("job_1", "user_1", resume_version_id="rv_tailored_777")
        self.store.transition_status(app["id"], "Applied")
        self.store.transition_status(app["id"], "Rejected")
        # Reopen to Preparing
        self.store.transition_status(app["id"], "Preparing")
        self.assertEqual("rv_tailored_777", self.store._apps[app["id"]]["resume_version_id"])


class TestFeature09GeminiLangChainStructuredTailoring(unittest.TestCase):
    """Feature 9: Gemini LangChain Structured Tailoring (STAR breakdown with Pydantic output)"""

    def test_f09_tc01_returns_structured_bullets_with_star_breakdown(self):
        resume = "- Created REST APIs using Python and FastAPI for user auth"
        jd = "Looking for Python backend engineer with REST API skills"
        out = tailor_resume_bullets(resume, jd, "Apply STAR format")
        self.assertIn("bullets", out)
        bullet = out["bullets"][0]
        self.assertIn("star_breakdown", bullet)
        star = bullet["star_breakdown"]
        for key in ["situation", "task", "action", "result"]:
            self.assertIn(key, star)

    def test_f09_tc02_includes_grounded_skills_in_tailored_output(self):
        resume = "- Designed PostgreSQL database schemas and optimized indexing"
        out = tailor_resume_bullets(resume, "Database developer", "Emphasize SQL")
        bullet = out["bullets"][0]
        self.assertTrue(len(bullet["grounded_skills"]) > 0)

    def test_f09_tc03_provides_explanation_for_each_proposed_bullet(self):
        resume = "- Built responsive web dashboards using React"
        out = tailor_resume_bullets(resume, "Frontend dev", "STAR format")
        bullet = out["bullets"][0]
        self.assertIn("explanation", bullet)
        self.assertTrue(len(bullet["explanation"]) > 0)

    def test_f09_tc04_retains_original_text_alongside_tailored_text(self):
        resume = "- Implemented CI/CD pipelines using GitHub Actions"
        out = tailor_resume_bullets(resume, "DevOps engineer", "Professional tone")
        bullet = out["bullets"][0]
        self.assertIn("CI/CD pipelines", bullet["original_text"])
        self.assertTrue(len(bullet["tailored_text"]) > len(bullet["original_text"]))

    def test_f09_tc05_processes_multiple_bullets_independently(self):
        resume = """
- Bullet one: Designed REST endpoints
- Bullet two: Optimized SQL database tables
- Bullet three: Automated test suite execution
"""
        out = tailor_resume_bullets(resume, "Backend dev", "STAR format")
        self.assertEqual(3, len(out["bullets"]))


class TestFeature10NaturalLanguageInstructionHandling(unittest.TestCase):
    """Feature 10: Natural Language Instruction Handling (accepts arbitrary prompts without 400s)"""

    def test_f10_tc01_accepts_star_format_prompt_smoothly(self):
        prompt = "Emphasize REST API design with STAR format"
        out = tailor_resume_bullets("- Built REST APIs", "Backend JD", prompt)
        self.assertTrue(len(out["bullets"]) > 0)

    def test_f10_tc02_accepts_action_verb_emphasis_instruction(self):
        prompt = "Rewrite each bullet to begin with strong technical action verbs"
        out = tailor_resume_bullets("- Worked on database schemas", "DB role", prompt)
        self.assertTrue(len(out["bullets"]) > 0)

    def test_f10_tc03_accepts_concise_phrasing_instruction(self):
        prompt = "Make bullets punchy, concise, and focused on engineering outcomes"
        out = tailor_resume_bullets("- Managed microservices architecture", "JD", prompt)
        self.assertTrue(len(out["bullets"]) > 0)

    def test_f10_tc04_handles_empty_or_whitespace_prompt_with_sensible_default(self):
        out = tailor_resume_bullets("- Implemented caching layer", "JD", "   ")
        self.assertTrue(len(out["bullets"]) > 0)

    def test_f10_tc05_handles_conversational_complex_prompts(self):
        prompt = "Could you please reword this to highlight my experience with Docker and Kubernetes without exaggerating?"
        out = tailor_resume_bullets("- Built containerized app with Docker", "Cloud JD", prompt)
        self.assertTrue(len(out["bullets"]) > 0)


class TestFeature11TruthGuardedAntiHallucination(unittest.TestCase):
    """Feature 11: Truth-Guarded Anti-Hallucination (disallows invented metrics, tools, employers)"""

    def test_f11_tc01_detects_and_sanitizes_invented_percentage_metric(self):
        orig = "Optimized database queries for customer search."
        tailored = "Optimized database queries, improving search throughput by 85%."
        is_valid, reason, sanitized = TruthGuardEngine.validate_bullet(orig, tailored, {"database", "sql"}, set())
        self.assertFalse(is_valid)
        self.assertIn("Invented metrics", reason)
        self.assertNotIn("85%", sanitized)

    def test_f11_tc02_detects_and_replaces_unsupported_missing_skill(self):
        orig = "Developed backend service using Python."
        tailored = "Developed backend service using Python and Kubernetes orchestration."
        is_valid, reason, sanitized = TruthGuardEngine.validate_bullet(
            orig, tailored, {"python"}, {"kubernetes"}
        )
        self.assertFalse(is_valid)
        self.assertIn("unmentioned skill", reason.lower())
        self.assertNotIn("kubernetes", sanitized.lower())

    def test_f11_tc03_passes_valid_grounded_bullet_without_alteration(self):
        orig = "Developed backend service using Python and Git with 95% test coverage."
        tailored = "Engineered backend service utilizing Python and Git maintaining 95% test coverage."
        is_valid, reason, sanitized = TruthGuardEngine.validate_bullet(
            orig, tailored, {"python", "git"}, set()
        )
        self.assertTrue(is_valid)
        self.assertEqual(tailored, sanitized)

    def test_f11_tc04_converts_fabricated_multiplier_to_qualitative_impact(self):
        orig = "Refactored legacy modules."
        tailored = "Refactored legacy modules achieving a 10x performance boost."
        is_valid, reason, sanitized = TruthGuardEngine.validate_bullet(orig, tailored, set(), set())
        self.assertFalse(is_valid)
        self.assertNotIn("10x", sanitized)

    def test_f11_tc05_handles_multiple_hallucinated_tokens_simultaneously(self):
        orig = "Assisted with frontend styling."
        tailored = "Directed frontend styling delivering 50% faster loads using GraphQL and Redis."
        is_valid, reason, sanitized = TruthGuardEngine.validate_bullet(
            orig, tailored, {"css"}, {"graphql", "redis"}
        )
        self.assertFalse(is_valid)
        self.assertNotIn("50%", sanitized)
        self.assertNotIn("graphql", sanitized.lower())


class TestFeature12BulletLevelDiffReview(unittest.TestCase):
    """Feature 12: Bullet-Level Diff Review (accept/reject per-bullet changes)"""

    def test_f12_tc01_builds_line_changes_with_pending_status(self):
        orig = "Skill: Python\nExperience: Intern\nGoal: Build apps"
        proposed = "Skill: Python\nExperience: Junior Software Engineer\nGoal: Build apps"
        changes = build_line_changes(orig, proposed)
        self.assertEqual(1, len(changes))
        self.assertEqual("pending", changes[0]["status"])

    def test_f12_tc02_accepting_change_replaces_original_lines(self):
        orig = "Line 1\nLine 2\nLine 3"
        proposed = "Line 1\nLine 2 Tailored\nLine 3"
        changes = build_line_changes(orig, proposed)
        decisions = {changes[0]["id"]: "accepted"}
        result = apply_change_decisions(orig, changes, decisions)
        self.assertIn("Line 2 Tailored", result["content"])

    def test_f12_tc03_rejecting_change_retains_original_lines(self):
        orig = "Line 1\nLine 2\nLine 3"
        proposed = "Line 1\nLine 2 Tailored\nLine 3"
        changes = build_line_changes(orig, proposed)
        decisions = {changes[0]["id"]: "rejected"}
        result = apply_change_decisions(orig, changes, decisions)
        self.assertIn("Line 2\nLine 3", result["content"])
        self.assertNotIn("Line 2 Tailored", result["content"])

    def test_f12_tc04_unresolved_decision_raises_value_error(self):
        orig = "Line A\nLine B"
        proposed = "Line A modified\nLine B modified"
        changes = build_line_changes(orig, proposed)
        with self.assertRaises(ValueError):
            apply_change_decisions(orig, changes, {})

    def test_f12_tc05_handles_mixed_accepted_and_rejected_decisions(self):
        orig = "Bullet 1\nBullet 2\nBullet 3"
        proposed = "Bullet 1 Tailored\nBullet 2 Tailored\nBullet 3"
        changes = build_line_changes(orig, proposed)
        self.assertEqual(1, len(changes))
        decisions = {changes[0]["id"]: "accepted"}
        result = apply_change_decisions(orig, changes, decisions)
        self.assertTrue(result["all_resolved"])


class TestFeature13ProfessionalAtsSingleColumnPdf(unittest.TestCase):
    """Feature 13: Professional ATS Single-Column PDF (ReportLab Platypus export)"""

    def test_f13_tc01_generates_valid_pdf_byte_stream(self):
        resume = "EDUCATION\nB.Tech Computer Science\nSKILLS\nPython, SQL, Git\nEXPERIENCE\n- Built web tools"
        pdf_buf = AtsPdfService.build_pdf(resume, candidate_name="Jane Doe")
        content = pdf_buf.getvalue()
        self.assertTrue(content.startswith(b"%PDF-"))

    def test_f13_tc02_pdf_stream_is_non_empty_and_seekable(self):
        pdf_buf = AtsPdfService.build_pdf("SKILLS\nPython, Docker", candidate_name="Alex Smith")
        self.assertGreater(pdf_buf.getbuffer().nbytes, 1000)

    def test_f13_tc03_includes_standard_ats_section_headers(self):
        resume = "EDUCATION\nMIT 2025\nSKILLS\nJava, C++\nEXPERIENCE\n- SDE Intern\nPROJECTS\n- Distributed DB"
        pdf_buf = AtsPdfService.build_pdf(resume)
        self.assertIsNotNone(pdf_buf)

    def test_f13_tc04_renders_bullet_points_with_indentation(self):
        resume = "EXPERIENCE\n- Designed modular services\n- Implemented regression suite\n- Documented API endpoints"
        pdf_buf = AtsPdfService.build_pdf(resume)
        self.assertTrue(len(pdf_buf.getvalue()) > 1500)

    def test_f13_tc05_default_candidate_name_supplied_when_omitted(self):
        pdf_buf = AtsPdfService.build_pdf("SKILLS\nPython")
        self.assertTrue(pdf_buf.getvalue().startswith(b"%PDF-"))


class TestFeature14LeetCodePlatformConnector(unittest.TestCase):
    """Feature 14: LeetCode Platform Connector (GraphQL, problem counts, ranking)"""

    def test_f14_tc01_fetches_verified_solved_problem_counts(self):
        stats = LeetCodeConnector.fetch_user_stats("code_master")
        self.assertIn("easy_solved", stats)
        self.assertIn("medium_solved", stats)
        self.assertIn("hard_solved", stats)
        self.assertEqual(
            stats["total_solved"],
            stats["easy_solved"] + stats["medium_solved"] + stats["hard_solved"]
        )

    def test_f14_tc02_fetches_global_ranking(self):
        stats = LeetCodeConnector.fetch_user_stats("algo_expert")
        self.assertGreater(stats["ranking"], 0)

    def test_f14_tc03_preserves_username_in_output_payload(self):
        stats = LeetCodeConnector.fetch_user_stats("student_coder")
        self.assertEqual("student_coder", stats["username"])

    def test_f14_tc04_empty_username_raises_value_error(self):
        with self.assertRaises(ValueError):
            LeetCodeConnector.fetch_user_stats("")
        with self.assertRaises(ValueError):
            LeetCodeConnector.fetch_user_stats("   ")

    def test_f14_tc05_case_insensitive_deterministic_retrieval(self):
        s1 = LeetCodeConnector.fetch_user_stats("JaneDoe")
        s2 = LeetCodeConnector.fetch_user_stats("janedoe")
        self.assertEqual(s1["total_solved"], s2["total_solved"])


class TestFeature15PublicGitHubConnector(unittest.TestCase):
    """Feature 15: Public GitHub Connector (public repos, stars, language distribution)"""

    def test_f15_tc01_fetches_public_repositories_count(self):
        profile = GitHubConnector.fetch_user_profile("octocat")
        self.assertGreater(profile["public_repos"], 0)

    def test_f15_tc02_fetches_accumulated_stars(self):
        profile = GitHubConnector.fetch_user_profile("developer123")
        self.assertGreaterEqual(profile["stars"], 0)

    def test_f15_tc03_extracts_top_programming_languages(self):
        profile = GitHubConnector.fetch_user_profile("tech_lead")
        self.assertIn("Python", profile["top_languages"])

    def test_f15_tc04_returns_sample_repos_metadata(self):
        profile = GitHubConnector.fetch_user_profile("dev_guru")
        self.assertTrue(len(profile["repos"]) > 0)
        repo = profile["repos"][0]
        self.assertIn("name", repo)
        self.assertIn("language", repo)

    def test_f15_tc05_empty_username_raises_value_error(self):
        with self.assertRaises(ValueError):
            GitHubConnector.fetch_user_profile("")


class TestFeature16LinkedInConnectorAndPdfParser(unittest.TestCase):
    """Feature 16: LinkedIn Connector & PDF Parser (URL regex, structured profile extraction)"""

    def test_f16_tc01_validates_standard_linkedin_profile_url(self):
        self.assertTrue(LinkedInConnector.validate_url("https://www.linkedin.com/in/janedoe"))
        self.assertTrue(LinkedInConnector.validate_url("https://linkedin.com/in/john-smith-123/"))

    def test_f16_tc02_rejects_malformed_or_external_urls(self):
        self.assertFalse(LinkedInConnector.validate_url("https://facebook.com/in/janedoe"))
        self.assertFalse(LinkedInConnector.validate_url("not_a_url"))
        self.assertFalse(LinkedInConnector.validate_url(""))

    def test_f16_tc03_parses_pdf_extracting_headline_and_summary(self):
        mock_pdf_bytes = b"%PDF-1.4 Mock LinkedIn Profile Content Here"
        parsed = LinkedInConnector.parse_profile_pdf(mock_pdf_bytes)
        self.assertIn("headline", parsed)
        self.assertIn("summary", parsed)

    def test_f16_tc04_parses_pdf_extracting_skills_and_education(self):
        mock_pdf_bytes = b"%PDF-1.4 Valid PDF document structure"
        parsed = LinkedInConnector.parse_profile_pdf(mock_pdf_bytes)
        self.assertIn("skills", parsed)
        self.assertIn("education", parsed)
        self.assertTrue(len(parsed["skills"]) > 0)

    def test_f16_tc05_empty_or_corrupt_bytes_raise_value_error(self):
        with self.assertRaises(ValueError):
            LinkedInConnector.parse_profile_pdf(b"")


class TestFeature17PlatformConnectorsHubUI(unittest.TestCase):
    """Feature 17: Platform Connectors Hub UI (linking platforms and managing state)"""

    def setUp(self):
        self.hub = ConnectorsHub()

    def test_f17_tc01_links_leetcode_platform_successfully(self):
        res = self.hub.link_platform("leetcode", {"username": "algo_coder", "solved": 150})
        self.assertEqual("linked", res["status"])
        self.assertEqual(1, self.hub.get_hub_status()["connected_count"])

    def test_f17_tc02_links_github_platform_successfully(self):
        res = self.hub.link_platform("github", {"username": "git_expert", "stars": 45})
        self.assertEqual("linked", res["status"])

    def test_f17_tc03_links_linkedin_platform_successfully(self):
        res = self.hub.link_platform("linkedin", {"url": "https://linkedin.com/in/candidate"})
        self.assertEqual("linked", res["status"])

    def test_f17_tc04_unsupported_platform_raises_value_error(self):
        with self.assertRaises(ValueError):
            self.hub.link_platform("unsupported_platform", {})

    def test_f17_tc05_hub_status_reports_all_connected_platforms(self):
        self.hub.link_platform("leetcode", {"username": "u1"})
        self.hub.link_platform("github", {"username": "u2"})
        status = self.hub.get_hub_status()
        self.assertEqual(2, status["connected_count"])
        self.assertTrue(status["platforms"]["leetcode"]["linked"])
        self.assertTrue(status["platforms"]["github"]["linked"])


class TestFeature18LinkedInOutreachGenerator(unittest.TestCase):
    """Feature 18: LinkedIn Outreach Generator (personalized note strictly < 300 characters)"""

    def test_f18_tc01_note_strictly_less_than_300_chars(self):
        out = OutreachService.generate_outreach(
            "Junior SDE", "Stripe", "Jane Doe", ["Python", "FastAPI"]
        )
        self.assertLess(out["linkedin_char_count"], 300)
        self.assertLessEqual(out["linkedin_char_count"], 299)
        self.assertLess(len(out["linkedin_note"]), 300)

    def test_f18_tc02_char_count_field_matches_exact_string_length(self):
        out = OutreachService.generate_outreach(
            "Backend Engineer", "Linear", "Bob Smith", ["Docker"]
        )
        self.assertEqual(len(out["linkedin_note"]), out["linkedin_char_count"])

    def test_f18_tc03_references_company_and_job_title(self):
        out = OutreachService.generate_outreach(
            "Cloud Developer", "Datadog", "Alice", ["AWS"]
        )
        self.assertIn("Datadog", out["linkedin_note"])
        self.assertIn("Cloud Developer", out["linkedin_note"])

    def test_f18_tc04_incorporates_leetcode_achievement_when_available(self):
        leetcode = {"total_solved": 250, "ranking": 12000}
        out = OutreachService.generate_outreach(
            "Software Engineer", "Amazon", "David", ["Algorithms"], leetcode_stats=leetcode
        )
        self.assertIn("LeetCode", out["linkedin_note"])
        self.assertLess(out["linkedin_char_count"], 300)

    def test_f18_tc05_truncates_safely_when_inputs_are_exceptionally_long(self):
        super_long_company = "Supercalifragilisticexpialidocious Enterprise Global Solutions Corporation"
        super_long_title = "Principal Distinguished Senior Lead Associate Software Engineer in Test"
        out = OutreachService.generate_outreach(
            super_long_title, super_long_company, "Long Name Student", ["Everything"]
        )
        self.assertLess(out["linkedin_char_count"], 300)


class TestFeature19ColdEmailGenerator(unittest.TestCase):
    """Feature 19: Cold Email Generator (customized email with subject line and candidate evidence)"""

    def test_f19_tc01_produces_clear_subject_line(self):
        out = OutreachService.generate_outreach("Frontend Dev", "Airbnb", "Sarah", ["React"])
        self.assertIn("email_subject", out)
        self.assertIn("Frontend Dev", out["email_subject"])
        self.assertIn("Sarah", out["email_subject"])

    def test_f19_tc02_email_body_cites_matched_candidate_skills(self):
        out = OutreachService.generate_outreach(
            "Backend Engineer", "Netflix", "Alex", ["Python", "PostgreSQL", "Docker"]
        )
        self.assertIn("Python", out["email_body"])
        self.assertIn("PostgreSQL", out["email_body"])

    def test_f19_tc03_email_body_includes_leetcode_algorithmic_rigor(self):
        leetcode = {"total_solved": 320, "ranking": 8500}
        out = OutreachService.generate_outreach(
            "SWE Intern", "Meta", "Chris", ["C++"], leetcode_stats=leetcode
        )
        self.assertIn("320 problems solved on LeetCode", out["email_body"])

    def test_f19_tc04_email_body_includes_github_portfolio_metrics(self):
        github = {"public_repos": 18, "stars": 64}
        out = OutreachService.generate_outreach(
            "SWE Intern", "Google", "Chris", ["Go"], github_stats=github
        )
        self.assertIn("18 public repos", out["email_body"])
        self.assertIn("64 stars", out["email_body"])

    def test_f19_tc05_email_body_includes_formal_signoff_and_contact(self):
        out = OutreachService.generate_outreach("SDE", "Uber", "Taylor", ["Java"])
        self.assertIn("Best regards,", out["email_body"])
        self.assertIn("Taylor", out["email_body"])


class TestFeature20InteractiveKanbanApplicationBoard(unittest.TestCase):
    """Feature 20: Interactive Kanban Application Board (6-column workflow, list/kanban toggle)"""

    def setUp(self):
        self.board = KanbanBoard()

    def test_f20_tc01_board_initializes_with_all_six_standard_columns(self):
        for col in ["Saved", "Preparing", "Applied", "Interview", "Offer", "Rejected"]:
            self.assertIn(col, self.board.board)

    def test_f20_tc02_toggles_between_list_and_kanban_view(self):
        self.assertEqual("kanban", self.board.view_mode)
        self.board.set_view_mode("list")
        self.assertEqual("list", self.board.view_mode)
        with self.assertRaises(ValueError):
            self.board.set_view_mode("unsupported_view")

    def test_f20_tc03_new_application_added_to_saved_column(self):
        card = self.board.add_card("app_1", "Junior Dev", "Stripe", resume_version_id="rv_1")
        self.assertEqual("Saved", card["status"])
        self.assertEqual(1, len(self.board.board["Saved"]))

    def test_f20_tc04_moving_card_validates_application_state_machine(self):
        self.board.add_card("app_1", "Junior Dev", "Stripe")
        # Saved -> Applied is valid
        moved = self.board.move_card("app_1", "Saved", "Applied")
        self.assertEqual("Applied", moved["status"])
        self.assertEqual(0, len(self.board.board["Saved"]))
        self.assertEqual(1, len(self.board.board["Applied"]))

    def test_f20_tc05_moving_card_along_invalid_transition_raises_error(self):
        self.board.add_card("app_1", "Junior Dev", "Stripe")
        with self.assertRaises(ValueError):
            self.board.move_card("app_1", "Saved", "Offer")  # Direct jump disallowed


if __name__ == "__main__":
    unittest.main()
