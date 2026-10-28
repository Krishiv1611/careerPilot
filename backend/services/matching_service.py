import re

from services.ats_scorer_service import calculate_ats_score
from services.job_discovery_service import is_fresher_job
from services.skill_extractor import SkillExtractor


def match_resume_to_job(resume_text, job_description, job_title=""):
    extractor = SkillExtractor()
    resume_skills, _ = extractor.extract_skills(resume_text)
    job_skills, _ = extractor.extract_skills(job_description)
    must_have_skills = _extract_must_have_skills(job_description, extractor)

    matched_skills = sorted(set(resume_skills) & set(job_skills))
    missing_skills = sorted(set(job_skills) - set(resume_skills))
    missing_must_haves = sorted(set(must_have_skills) - set(resume_skills))
    hard_blockers = missing_must_haves
    preferred_gaps = sorted(set(missing_skills) - set(missing_must_haves))
    evidence_map = _evidence_map(resume_text, matched_skills)

    reasons = []
    if missing_must_haves:
        reasons.append("Missing must-have skills: " + ", ".join(missing_must_haves))
    if _requires_senior_experience(job_description, job_title=job_title):
        reasons.append("The job asks for senior-level experience or more than two years of experience.")

    if reasons:
        eligibility_status = "not_eligible"
    elif not job_skills:
        eligibility_status = "needs_review"
        reasons.append("No structured requirements were detected; review the original job page.")
    else:
        eligibility_status = "eligible"
        reasons.append("No blocking requirement was detected from the available text.")

    ats_diag = calculate_ats_score(resume_text, job_description)
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
        "hard_blockers": hard_blockers,
        "preferred_gaps": preferred_gaps,
        "evidence_map": evidence_map,
        "ats_score": ats_diag["overall_score"],
        "ats_diagnostic": ats_diag,
    }



def _extract_must_have_skills(job_description, extractor):
    texts = []

    # 1. Multiline requirements sections
    section_pattern = (
        r"(?:(?:^|\n)\s*(?:requirements?|qualifications?|must[- ]haves?|"
        r"what you(?:'ll| will) need|minimum qualifications?|basic qualifications?)[:\s]*\n)"
        r"([\s\S]*?)(?=(?:\n\s*(?:nice to have|preferred|bonus|plus|benefits|about (?:us|the company)|responsibilities)\b|\n\s*\n\s*\n|\Z))"
    )
    for match in re.findall(section_pattern, job_description, flags=re.IGNORECASE):
        texts.append(match)

    # 2. Inline requirements statements
    inline_matches = re.findall(
        r"(?:must have|required|requirements?\s*:)([^.\n]+)",
        job_description,
        flags=re.IGNORECASE,
    )
    texts.extend(inline_matches)

    must_have_text = " ".join(texts)
    skills, _ = extractor.extract_skills(must_have_text)
    return skills


def _requires_senior_experience(job_description, job_title=""):
    return not is_fresher_job(job_title, job_description)


def _evidence_map(resume_text, matched_skills):
    lines = [line.strip() for line in resume_text.splitlines() if line.strip()]
    return {
        skill: [line for line in lines if skill.lower() in line.lower()][:3]
        for skill in matched_skills
    }
