import re

VERIFIED_TECH_KEYWORDS = [
    "Python", "FastAPI", "React", "Docker", "PostgreSQL",
    "Redis", "TypeScript", "AWS", "SQL", "Git", "Go",
    "Java", "Node.js", "Kubernetes", "GraphQL", "Tailwind"
]


def generate_tailored_cover_letter(
    candidate_name: str,
    resume_text: str,
    job_title: str,
    company: str,
    job_description: str = "",
) -> dict:
    name = (candidate_name or "").strip() or "Candidate"
    comp = (company or "").strip() or "the engineering team"
    role = (job_title or "").strip() or "Software Engineer"
    resume = resume_text or ""

    # Extract verified tech mentions
    techs = [
        t for t in VERIFIED_TECH_KEYWORDS
        if re.search(r'\b' + re.escape(t) + r'\b', resume, re.IGNORECASE)
    ]
    top_techs = ", ".join(techs[:3]) if techs else "modern full-stack technologies"
    primary_tech = techs[0] if techs else "my tech stack"

    # Paragraph 1: Hook and alignment
    para1 = (
        f"Dear Hiring Team at {comp},\n\n"
        f"I am writing to express my strong interest in the {role} position. "
        f"With hands-on engineering experience building robust software using {top_techs}, "
        f"I am excited about the opportunity to contribute directly to {comp}'s mission and engineering standards."
    )

    # Paragraph 2: Verified technical evidence
    para2 = (
        f"In my recent project work, I developed production-ready services emphasizing clean architecture, "
        f"automated testing, and performance optimization. Specifically, I engineered solutions leveraging {top_techs}, "
        f"focusing on reliability, low latency, and maintainable code grounded in real-world testing."
    )

    # Paragraph 3: Professional close
    para3 = (
        f"I welcome the opportunity to discuss how my technical foundation and rapid execution can support {comp}'s roadmap. "
        f"Thank you for your time and consideration.\n\n"
        f"Sincerely,\n{name}"
    )

    cover_letter = f"{para1}\n\n{para2}\n\n{para3}"

    # LinkedIn Outreach Note: STRICTLY under 300 characters
    outreach = f"Hi! I saw the {role} opening at {comp} and applied. With hands-on experience in {top_techs}, I'd love to connect and follow your engineering updates. Best, {name}"
    if len(outreach) >= 300:
        outreach = f"Hi! Applied for the {role} role at {comp}. Experienced with {top_techs} and eager to connect. Best, {name}"
    if len(outreach) >= 300:
        outreach = f"Hi! Applied for {role} at {comp}. Experienced with {top_techs}. Would love to connect! Best, {name}"
    if len(outreach) >= 300:
        outreach = f"Hi! Applied for {role} at {comp}. Would love to connect! Best, {name}"
    if len(outreach) >= 300:
        outreach = outreach[:295] + "..."

    # Alumni Casual Note: Low-friction peer/alumni outreach STRICTLY under 200 characters
    alumni_note = f"Hi! Saw your work at {comp}. As a fellow engineer working with {top_techs}, would love to connect briefly and say hello! Best, {name}"
    if len(alumni_note) >= 200:
        alumni_note = f"Hi! Saw your work at {comp}. Fellow engineer in {primary_tech}—would love to connect briefly! Best, {name}"
    if len(alumni_note) >= 200:
        alumni_note = f"Hi! Fellow engineer exploring {comp}. Would love to connect briefly and follow your updates! Best, {name}"
    if len(alumni_note) >= 200:
        alumni_note = f"Hi! Fellow engineer interested in {comp}. Would love to connect! Best, {name}"
    if len(alumni_note) >= 200:
        alumni_note = f"Hi! Would love to connect regarding {comp}. Best, {name}"
    if len(alumni_note) >= 200:
        alumni_note = alumni_note[:195] + "..."

    # Cold Email / InMail Pitch: Complete pitch with subject line, 2 tight paragraphs & call to action
    email_subject = f"Application: {role} at {comp} - {name}"
    email_body = (
        f"Hi Hiring Team at {comp},\n\n"
        f"I recently applied for the {role} position and wanted to introduce myself directly. "
        f"I specialize in building production-ready services using {top_techs}, with a focus on code quality, "
        f"low latency, and reliable architecture.\n\n"
        f"Given {comp}'s engineering standards, I would love to contribute my experience in {primary_tech} "
        f"to your team's upcoming initiatives. Would you be open to a brief 10-minute conversation this week "
        f"to discuss how my background aligns with your engineering roadmap?\n\n"
        f"Best regards,\n{name}"
    )

    screening_answers = [
        {
            "question": f"Why do you want to join {comp}?",
            "answer": (
                f"I admire {comp}'s technical engineering standards and high-impact culture. "
                f"My background in {top_techs} aligns directly with your stack and allows me to deliver value from day one."
            ),
        },
        {
            "question": f"Describe a challenging problem you solved with {primary_tech}.",
            "answer": (
                f"I engineered a modular service handling concurrent requests, isolating bottlenecks "
                f"via structured logging and automated integration testing to ensure high reliability."
            ),
        },
        {
            "question": "How do you ensure code reliability and avoid production regressions?",
            "answer": (
                "I follow test-driven development and contract validation, writing automated unit and integration tests "
                "before deployment while monitoring runtime latency and error rates."
            ),
        },
    ]

    return {
        "cover_letter_text": cover_letter,
        "outreach_note_300": outreach,
        "linkedin_connection_note": outreach,
        "alumni_casual_note": alumni_note,
        "cold_email_pitch": {
            "subject": email_subject,
            "body": email_body,
        },
        "character_count": len(outreach),
        "screening_answers": screening_answers,
    }
