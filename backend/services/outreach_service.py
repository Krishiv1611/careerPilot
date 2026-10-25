def generate_outreach_package(
    job_title: str,
    company_name: str,
    candidate_name: str = "Candidate",
    key_skills: list[str] | None = None,
    recruiter_name: str | None = None,
) -> dict:
    """Generate high-conversion, professional recruiter outreach notes and cold emails."""
    recruiter_display = recruiter_name.strip() if recruiter_name else "there"
    skills = key_skills or ["Python", "FastAPI"]
    top_skill = skills[0] if skills else "software engineering"
    skills_summary = ", ".join(skills[:2])

    # 1. LinkedIn Connection Request Note (Hard limit: 300 characters)
    linkedin_note = (
        f"Hi {recruiter_display}, I'm applying for the {job_title} role at {company_name}. "
        f"I specialize in {top_skill} and built matching projects. "
        f"I'd love to connect and learn more about your team's work!"
    )
    if len(linkedin_note) > 300:
        linkedin_note = (
            f"Hi {recruiter_display}, applying for the {job_title} role at {company_name}. "
            f"Experienced in {top_skill} with strong project evidence. "
            f"Would love to connect!"
        )
    if len(linkedin_note) > 300:
        linkedin_note = linkedin_note[:297] + "..."

    # 2. Cold Email
    subject = f"Application / Inquiry: {job_title} - {candidate_name} ({company_name})"
    email_body = f"""Hi {recruiter_display},

I recently applied for the {job_title} opening at {company_name}. As an aspiring software engineer with hands-on experience in {skills_summary}, I have built projects focused on clean architecture, reliable APIs, and robust data management.

I would love to learn more about engineering priorities on the {company_name} team. My resume and project portfolio are attached for your convenience.

Thank you very much for your time and consideration!

Best regards,
{candidate_name}
"""

    # 3. Follow-up Note (3-5 days later)
    follow_up_note = (
        f"Hi {recruiter_display}, I hope your week is going well! I wanted to follow up on my recent "
        f"application for the {job_title} role at {company_name}. I remain very enthusiastic about the "
        f"opportunity to contribute with my background in {skills_summary}. "
        f"Thank you again for your time and review!\n\nBest,\n{candidate_name}"
    )

    return {
        "linkedin_note": linkedin_note,
        "linkedin_char_count": len(linkedin_note),
        "cold_email": {
            "subject": subject,
            "body": email_body,
        },
        "follow_up_note": follow_up_note,
    }
