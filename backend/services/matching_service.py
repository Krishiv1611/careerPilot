import re

from services.skill_extractor import SkillExtractor


def match_resume_to_job(resume_text, job_description):
    extractor = SkillExtractor()
    resume_skills, _ = extractor.extract_skills(resume_text)
    job_skills, _ = extractor.extract_skills(job_description)
    must_have_skills = _extract_must_have_skills(job_description, extractor)

    matched_skills = sorted(set(resume_skills) & set(job_skills))
    missing_skills = sorted(set(job_skills) - set(resume_skills))
    missing_must_haves = sorted(set(must_have_skills) - set(resume_skills))
    evidence_map = _evidence_map(resume_text, matched_skills)

    reasons = []
    if missing_must_haves:
        reasons.append("Missing must-have skills: " + ", ".join(missing_must_haves))
    if _requires_senior_experience(job_description):
        reasons.append("The job asks for senior-level experience or more than two years of experience.")

    if reasons:
        eligibility_status = "not_eligible"
    elif not job_skills:
        eligibility_status = "needs_review"
        reasons.append("No structured requirements were detected; review the original job page.")
    else:
        eligibility_status = "eligible"
        reasons.append("No blocking requirement was detected from the available text.")

    coverage = round((len(matched_skills) / len(job_skills)) * 100) if job_skills else 0
    return {
        "eligibility_status": eligibility_status,
        "eligibility_reasons": reasons,
        "coverage_percent": coverage,
        "requirements": job_skills,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "must_have_skills": must_have_skills,
        "missing_must_haves": missing_must_haves,
        "evidence_map": evidence_map,
    }


def _extract_must_have_skills(job_description, extractor):
    must_have_text = " ".join(
        re.findall(
            r"(?:must have|required|requirements?\s*:)([^.\n]+)",
            job_description,
            flags=re.IGNORECASE,
        )
    )
    skills, _ = extractor.extract_skills(must_have_text)
    return skills


def _requires_senior_experience(job_description):
    text = job_description.lower()
    if re.search(r"\b(senior|principal|staff|lead)\b", text):
        return True

    years = re.findall(r"(\d+)\s*(?:\+|to|-)?\s*(?:\d+)?\s*years?", text)
    return any(int(year) > 2 for year in years)


def _evidence_map(resume_text, matched_skills):
    lines = [line.strip() for line in resume_text.splitlines() if line.strip()]
    return {
        skill: [line for line in lines if skill.lower() in line.lower()][:3]
        for skill in matched_skills
    }
