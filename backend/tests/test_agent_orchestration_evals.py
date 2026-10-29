from pathlib import Path
import re
import sys
from unittest import TestCase

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from services.application_autopsy_service import GROWTH_BLUEPRINTS, run_application_autopsy
from services.cover_letter_service import generate_tailored_cover_letter
from services.interview_stress_test_service import (
    determine_vulnerability_rating,
    generate_resume_defense_matrix,
)
from services.job_reality_service import audit_job_reality
from services.recruiter_xray_service import (
    FLUFF_CATALOG,
    STAR_WORD_REPLACEMENTS,
    analyze_recruiter_xray,
)


class AgentOrchestrationEvalsTests(TestCase):
    """End-to-end system evals across CareerPilot multi-agent orchestration,
    deterministic schema bounds, character limits, and generative coherence."""

    # -------------------------------------------------------------------------
    # 1. Multi-Channel Outreach Character Limits & Structural Integrity
    # -------------------------------------------------------------------------
    def test_multi_channel_outreach_character_constraints_across_payload_extremes(self):
        """Verify strict character boundaries (<200 for alumni, <300 for outreach/LinkedIn)
        and complete email pitch structure across varying lengths of candidate and company names."""
        candidate_names = [
            "Bo",
            "Jane Doe",
            "Alexander Maximillian Montgomery III",
            "Dr. Bartholomew Quintin Fitzwilliam-Smythe The Fourth, Esq.",
        ]
        company_names = [
            "Co",
            "Stripe",
            "International Business Machines Corporation Distributed Systems Division",
            "Super Massive Ultra Global Enterprise Cloud Infrastructure Solutions Incorporated",
        ]

        for candidate in candidate_names:
            for company in company_names:
                pack = generate_tailored_cover_letter(
                    candidate_name=candidate,
                    resume_text="Experienced engineer specializing in Python, FastAPI, Docker, and PostgreSQL.",
                    job_title="Senior Distributed Systems Engineer",
                    company=company,
                    job_description="Seeking distributed systems engineer skilled in Python and Docker.",
                )

                # 1. LinkedIn connection / Outreach Note strictly < 300 chars
                self.assertLess(
                    len(pack["outreach_note_300"]),
                    300,
                    f"Outreach note exceeded 300 chars for candidate='{candidate}', company='{company}' (len={len(pack['outreach_note_300'])})",
                )
                self.assertLess(
                    len(pack["linkedin_connection_note"]),
                    300,
                    f"LinkedIn note exceeded 300 chars for candidate='{candidate}', company='{company}'",
                )

                # 2. Alumni Casual Note strictly < 200 chars
                self.assertLess(
                    len(pack["alumni_casual_note"]),
                    200,
                    f"Alumni note exceeded 200 chars for candidate='{candidate}', company='{company}' (len={len(pack['alumni_casual_note'])})",
                )

                # 3. Cold Email Pitch structure
                self.assertIn("cold_email_pitch", pack)
                pitch = pack["cold_email_pitch"]
                self.assertIsInstance(pitch, dict)
                self.assertIn("subject", pitch)
                self.assertIn("body", pitch)
                self.assertTrue(len(pitch["subject"].strip()) > 0)
                self.assertTrue(len(pitch["body"].strip()) > 0)
                self.assertIn(candidate, pitch["subject"])
                self.assertIn("Best regards", pitch["body"])

                # 4. Screening answers coherence
                self.assertIn("screening_answers", pack)
                self.assertEqual(len(pack["screening_answers"]), 3)
                for qa in pack["screening_answers"]:
                    self.assertTrue(len(qa["question"]) > 0)
                    self.assertTrue(len(qa["answer"]) > 0)

    # -------------------------------------------------------------------------
    # 2. Recruiter X-Ray Fluff Auto-Remediation & Reviewer Personas
    # -------------------------------------------------------------------------
    def test_recruiter_xray_fluff_remediation_and_reviewer_personas(self):
        """Verify fluff detection, STAR-guided auto-remediation, and 3-reviewer persona verdicts."""
        fluffy_resume = (
            "I am a hardworking and passionate self-starter and a team player. "
            "Known as a quick learner, results-driven go-getter with an enthusiastic attitude. "
            "Detail-oriented professional with general development background."
        )

        result = analyze_recruiter_xray(fluffy_resume)

        # 1. Fluff detection
        fluff_detected = result.get("fluff_words_detected", [])
        self.assertGreaterEqual(len(fluff_detected), 5)
        detected_words = {f["word"].lower() for f in fluff_detected}
        self.assertIn("hardworking", detected_words)
        self.assertIn("passionate", detected_words)
        self.assertIn("self-starter", detected_words)

        # 2. Fluff auto-remediation preview
        remediated_text = result.get("remediated_text_preview", "")
        self.assertTrue(len(remediated_text) > 0)

        # Verify fluff words were replaced with STAR alternatives
        for fluff_word, star_word in STAR_WORD_REPLACEMENTS.items():
            if fluff_word in fluffy_resume.lower():
                # Original fluff word should be removed
                self.assertFalse(
                    re.search(r"\b" + re.escape(fluff_word) + r"\b", remediated_text, re.IGNORECASE),
                    f"Fluff word '{fluff_word}' still found in remediated text preview!",
                )
                # Remediated text should now contain the STAR replacement
                self.assertTrue(
                    re.search(r"\b" + re.escape(star_word) + r"\b", remediated_text, re.IGNORECASE),
                    f"STAR replacement '{star_word}' not found in remediated text preview!",
                )

        # 3. 3-Reviewer Personas
        self.assertIn("reviewer_personas", result)
        personas = result["reviewer_personas"]
        self.assertIn("screener_verdict", personas)
        self.assertIn("hiring_manager_verdict", personas)
        self.assertIn("tech_lead_verdict", personas)
        self.assertIn("hiring_manager_verdict", result)

        # Fluffy resume should receive cautious or disqualifying verdicts
        self.assertTrue(
            "DISQUALIFY" in personas["screener_verdict"] or "BORDERLINE" in personas["screener_verdict"]
        )
        self.assertIn("INSUFFICIENT DEPTH", personas["tech_lead_verdict"])

        # Compare with a high-rigor technical resume
        strong_resume = (
            "Senior Backend Engineer\n"
            "- Architected high-throughput FastAPI and PostgreSQL service handling 15,000 req/s with 45% latency reduction.\n"
            "- Deployed Docker and Kubernetes microservices with 99.99% uptime and Prometheus monitoring.\n"
            "- Built distributed caching layer in Redis reducing database load by 60%."
        )
        strong_result = analyze_recruiter_xray(strong_resume)
        strong_personas = strong_result["reviewer_personas"]
        self.assertIn("PASSED", strong_personas["screener_verdict"])
        self.assertIn("STRONG TECHNICAL RIGOR", strong_personas["tech_lead_verdict"])
        self.assertGreaterEqual(strong_result["screen_probability"], 75)

    # -------------------------------------------------------------------------
    # 3. Stress-Test Claim Vulnerability Ratings, Code Snippets & Answers
    # -------------------------------------------------------------------------
    def test_stress_test_claim_vulnerability_ratings_snippets_and_answers(self):
        """Verify vulnerability ratings (High Risk, Medium Risk, Rock Solid),
        syntax-highlightable code defense snippets, and detailed model interview answers."""
        # 1. Direct vulnerability rating classifier evaluations
        high_risk_claim = "Optimized query latency by 45% and boosted throughput by 3x"
        self.assertEqual("High Risk", determine_vulnerability_rating(high_risk_claim))

        medium_risk_claim = "Built containerized microservices with Docker and Kubernetes"
        self.assertEqual("Medium Risk", determine_vulnerability_rating(medium_risk_claim))

        rock_solid_claim = "Implemented automated unit tests and integration tests with pytest in CI/CD pipeline"
        self.assertEqual("Rock Solid", determine_vulnerability_rating(rock_solid_claim))

        # 2. Defense matrix generation with comprehensive claims
        resume_text = (
            "Staff Engineer\n"
            "- Optimized and reduced database query latency by 50% using PostgreSQL composite indexes.\n"
            "- Designed FastAPI asynchronous endpoints handling concurrent client streams.\n"
            "- Containerized backend microservices using multi-stage Docker builds.\n"
            "- Managed distributed caching with Redis and probabilistic expiration."
        )
        jd_text = "Requires deep experience in FastAPI, PostgreSQL, Docker, and Redis."
        matrix = generate_resume_defense_matrix(resume_text, jd_text, company="Stripe")

        questions = matrix.get("drill_down_questions", [])
        self.assertGreaterEqual(len(questions), 3)

        allowed_vulnerabilities = {"High Risk", "Medium Risk", "Rock Solid"}

        has_high_risk = False
        has_code_snippet = False
        has_model_answer = False

        for q in questions:
            # Check vulnerability rating boundedness
            self.assertIn(q["vulnerability_rating"], allowed_vulnerabilities)
            if q["vulnerability_rating"] == "High Risk":
                has_high_risk = True

            # Check syntax-highlightable code snippet
            self.assertIn("code_defense_snippet", q)
            snippet = q["code_defense_snippet"]
            self.assertIsInstance(snippet, str)
            self.assertTrue(len(snippet.strip()) > 20)
            # Code snippet should contain code keywords (SQL, Python, Dockerfile, etc.)
            code_signals = ["EXPLAIN", "FROM python", "create_async_engine", "redis", "def test_", "CREATE INDEX"]
            if any(sig in snippet for sig in code_signals):
                has_code_snippet = True

            # Check model interview answer
            self.assertIn("model_interview_answer", q)
            answer = q["model_interview_answer"]
            self.assertIsInstance(answer, str)
            self.assertTrue(len(answer.strip()) > 50)
            has_model_answer = True

            # Candidate defense blueprint & what interviewer tests
            self.assertTrue(len(q["what_interviewer_tests"].strip()) > 0)
            self.assertTrue(len(q["candidate_defense_blueprint"].strip()) > 0)

        self.assertTrue(has_high_risk, "Expected at least one High Risk claim in performance-related bullet points")
        self.assertTrue(has_code_snippet, "Expected code defense snippets for drill-down questions")
        self.assertTrue(has_model_answer, "Expected comprehensive model interview answers")

    # -------------------------------------------------------------------------
    # 4. Autopsy Pre-Mortem vs Post-Mortem, Severity Tags & Growth Deep Links
    # -------------------------------------------------------------------------
    def test_autopsy_pre_mortem_post_mortem_modes_and_growth_links(self):
        """Verify pre-mortem vs post-mortem modes, severity tags (FATAL, HIGH_RISK, MODERATE_RISK),
        and growth URL deep link format (/growth?skill=...)."""
        resume = "Full Stack Developer proficient in React, HTML, CSS, JavaScript, and Node.js."
        jd_docker = "Senior Backend Engineer: Must have production Docker containerization experience."

        # 1. Post-Mortem Mode on Terminal Applications (rejected, withdrawn, ghosted)
        for term_status in ["rejected", "withdrawn", "ghosted"]:
            post_res = run_application_autopsy(resume, jd_docker, status=term_status)
            self.assertEqual("post_mortem", post_res["mode"])
            self.assertEqual("FATAL", post_res["severity_tag"])
            self.assertEqual("CRITICAL", post_res["severity"])
            self.assertEqual("docker", post_res["missing_skill"])
            self.assertIn("Missing core requirement:", post_res["fatal_blocker"])
            self.assertEqual(48, post_res["recovery_time_hours"])
            self.assertIn("growth_url", post_res["recommended_blueprint"])
            self.assertEqual("/growth?skill=docker", post_res["recommended_blueprint"]["growth_url"])

        # 2. Pre-Mortem Mode on Active Applications (applied, interviewing, saved)
        for active_status in ["applied", "interviewing", "saved"]:
            pre_res = run_application_autopsy(resume, jd_docker, status=active_status)
            self.assertEqual("pre_mortem", pre_res["mode"])
            self.assertIn(pre_res["severity_tag"], ["HIGH_RISK", "MODERATE_RISK"])
            self.assertEqual("HIGH", pre_res["severity"])
            self.assertEqual("docker", pre_res["missing_skill"])
            self.assertIn("Pre-Mortem Risk:", pre_res["fatal_blocker"])
            self.assertEqual("/growth?skill=docker", pre_res["recommended_blueprint"]["growth_url"])

        # 3. Verify all registered growth blueprints produce valid /growth?skill=... deep links
        for skill_key, bp in GROWTH_BLUEPRINTS.items():
            jd_for_skill = f"Role requiring extensive {skill_key} experience."
            autopsy_for_skill = run_application_autopsy(
                resume_text="Proficient only in basic scripting.",
                job_description=jd_for_skill,
                status="applied",
            )
            bp_result = autopsy_for_skill["recommended_blueprint"]
            self.assertIn("growth_url", bp_result)
            self.assertTrue(
                bp_result["growth_url"].startswith("/growth?skill="),
                f"Blueprint for '{skill_key}' has invalid growth_url format: {bp_result['growth_url']}",
            )

    # -------------------------------------------------------------------------
    # 5. Job Reality Audit Score Boundedness, Detected Tech & Safety Warnings
    # -------------------------------------------------------------------------
    def test_job_reality_audit_boundedness_tech_count_and_warnings(self):
        """Verify role health score boundedness (0-100), detected_tech_count,
        and ghost job / burnout / disguised role warning detection."""
        allowed_verdicts = {"High Quality", "Proceed with Caution", "High-Risk Post"}

        # 1. Normal Healthy Role
        healthy_res = audit_job_reality(
            title="Junior Software Engineer",
            description=(
                "Join Stripe's engineering team as a Junior Software Engineer. We provide structured mentorship "
                "by senior engineers to help you grow. In this role, you will build and maintain backend services "
                "using Python and FastAPI. We offer comprehensive health insurance, learning budget, flexible hours, "
                "and an inclusive engineering culture with standard 40-hour work weeks."
            ),
            company="Stripe",
        )
        self.assertGreaterEqual(healthy_res["role_health_score"], 0)
        self.assertLessEqual(healthy_res["role_health_score"], 100)
        self.assertEqual("High Quality", healthy_res["health_verdict"])
        self.assertIsInstance(healthy_res["detected_tech_count"], int)
        self.assertGreaterEqual(healthy_res["detected_tech_count"], 1)
        self.assertEqual("Low", healthy_res["ghost_job_risk"])

        # 2. Ghost Job / Truncated Description Signals
        ghost_res = audit_job_reality(
            title="Developer",
            description="Confidential agency looking for talent.",
            company="Confidential",
        )
        self.assertGreaterEqual(ghost_res["role_health_score"], 0)
        self.assertLessEqual(ghost_res["role_health_score"], 100)
        self.assertIn(ghost_res["health_verdict"], allowed_verdicts)
        self.assertEqual("High", ghost_res["ghost_job_risk"])
        self.assertTrue(
            any("Ghost Job" in flag for flag in ghost_res["red_flags"]),
            "Expected ghost job indicator in red flags",
        )

        # 3. Burnout Culture & Toxic Patterns
        burnout_res = audit_job_reality(
            title="Rockstar Developer",
            description=(
                "Fast-paced environment! We work hard, play hard and wear many hats. "
                "Weekend availability and 24/7 support required during urgent hiring crunch time."
            ),
            company="Chaos Corp",
        )
        self.assertGreaterEqual(burnout_res["role_health_score"], 0)
        self.assertLessEqual(burnout_res["role_health_score"], 100)
        self.assertEqual("High-Risk Post", burnout_res["health_verdict"])
        # Should flag burnout phrases
        red_flags_str = " ".join(burnout_res["red_flags"]).lower()
        self.assertIn("work hard, play hard", red_flags_str)
        self.assertIn("wear many hats", red_flags_str)
        self.assertIn("weekend availability", red_flags_str)

        # 4. Disguised Non-Engineering Role
        disguised_res = audit_job_reality(
            title="Tech Trainee",
            description="Lead generation and telecalling clients with 100% commission compensation.",
            company="Sales Hub",
        )
        self.assertEqual("High-Risk Post", disguised_res["health_verdict"])
        flags_str = " ".join(disguised_res["red_flags"]).lower()
        self.assertTrue("commission" in flags_str or "telecalling" in flags_str)

        # 5. Junior Tech Stack Overload
        overload_res = audit_job_reality(
            title="Junior Software Engineer",
            description=(
                "Entry level graduate role: Must know Python, Java, C++, Go, Rust, React, Angular, Vue, "
                "FastAPI, Docker, Kubernetes, AWS, GCP, Azure, PostgreSQL, Redis, Kafka, and GraphQL."
            ),
            company="Overload Inc",
        )
        self.assertGreaterEqual(overload_res["detected_tech_count"], 10)
        overload_flags = " ".join(overload_res["red_flags"]).lower()
        self.assertIn("overload", overload_flags)
