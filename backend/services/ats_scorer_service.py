import re

from services.ats_pdf_service import parse_resume_sections
from services.matching_service import _extract_must_have_skills
from services.skill_extractor import SkillExtractor

ACTION_VERB_SET = {
    "engineered",
    "architected",
    "developed",
    "built",
    "implemented",
    "optimized",
    "designed",
    "automated",
    "spearheaded",
    "accelerated",
    "reduced",
    "increased",
    "deployed",
    "scaled",
    "created",
    "refactored",
    "authored",
    "orchestrated",
    "programmed",
    "integrated",
    "analyzed",
    "launched",
}


def calculate_ats_score(resume_text: str, job_description: str = "") -> dict:
    """Calculate an authoritative 100-point deterministic ATS diagnostic score.

    Rubric breakdown:
    - Parseability & Contact Hygiene: 25 points
    - Keyword & Skill Match: 35 points
    - STAR Action Verbs & Quantitative Metrics: 25 points
    - Structural Completeness: 15 points
    """
    if not resume_text or not resume_text.strip():
        return {
            "overall_score": 0,
            "grade": "Needs Work",
            "breakdown": {
                "parseability": 0,
                "keyword_match": 0,
                "action_metrics": 0,
                "structure_hygiene": 0,
            },
            "feedback": ["Resume content is empty."],
            "strengths": [],
        }

    feedback = []
    strengths = []

    # 1. Parseability & Contact Hygiene (25 pts)
    parse_pts = 25
    sections = parse_resume_sections(resume_text)
    name = sections.get("name", "").strip()
    if not name or len(name.split()) < 2:
        parse_pts -= 5
        feedback.append("Candidate name formatting is ambiguous (-5 pts).")

    contact = sections.get("contact", "")
    if not contact or "@" not in contact:
        parse_pts -= 10
        feedback.append("Contact line missing standard email address (-10 pts).")

    if parse_pts == 25:
        strengths.append("Clean, single-column machine-parseable layout with complete contact info.")
    parse_pts = max(0, parse_pts)

    # 2. Keyword & Skill Match (35 pts)
    keyword_pts = 35
    if job_description and job_description.strip():
        extractor = SkillExtractor()
        resume_skills, _ = extractor.extract_skills(resume_text)
        job_skills, _ = extractor.extract_skills(job_description)
        must_haves = _extract_must_have_skills(job_description, extractor)

        if must_haves:
            missing_must = set(must_haves) - set(resume_skills)
            must_ratio = (len(must_haves) - len(missing_must)) / len(must_haves)
            keyword_pts = round(must_ratio * 35)
            if missing_must:
                feedback.append(
                    f"Missing critical must-have keywords: {', '.join(sorted(missing_must))} (-{35 - keyword_pts} pts)."
                )
            else:
                strengths.append("100% must-have skills matched.")
        elif job_skills:
            matched = set(resume_skills) & set(job_skills)
            ratio = len(matched) / len(job_skills)
            keyword_pts = round(ratio * 35)
            if ratio < 0.5:
                feedback.append("Resume contains less than 50% of the target job keywords.")
            elif ratio >= 0.8:
                strengths.append("Strong keyword alignment with job requirements.")
        else:
            keyword_pts = 25
    else:
        # General resume assessment without JD
        extractor = SkillExtractor()
        resume_skills, _ = extractor.extract_skills(resume_text)
        if len(resume_skills) >= 6:
            keyword_pts = 30
            strengths.append(f"Strong technical skill density ({len(resume_skills)} skills detected).")
        elif len(resume_skills) >= 3:
            keyword_pts = 22
        else:
            keyword_pts = 12
            feedback.append("Low technical skill density detected in resume.")

    keyword_pts = max(0, min(35, keyword_pts))

    # 3. Action Verbs & Quantitative Metrics (25 pts)
    lines = [
        line.strip()
        for line in resume_text.splitlines()
        if line.strip().startswith(("-", "*", "•", "–"))
    ]
    if lines:
        action_count = 0
        metric_count = 0
        for line in lines:
            clean_line = line.lstrip("-*•– ").strip()
            words = re.findall(r"\b[A-Za-z]+\b", clean_line.lower())
            if words and words[0] in ACTION_VERB_SET:
                action_count += 1
            if re.search(r"\b\d+(?:\.\d+)?%?|\$\d+", clean_line):
                metric_count += 1

        action_ratio = action_count / len(lines)
        metric_ratio = metric_count / len(lines)
        action_pts = round((action_ratio * 15) + (metric_ratio * 10))

        if action_ratio < 0.4:
            feedback.append("Too few bullet points begin with strong action verbs (-8 pts).")
        if metric_ratio < 0.3:
            feedback.append("Bullet points lack measurable metrics, numbers, or percentages (-7 pts).")
        if action_pts >= 18:
            strengths.append("Strong STAR action verbs and quantitative metrics detected.")
    else:
        action_pts = 8
        feedback.append("No standard bullet points detected in project or experience sections (-15 pts).")

    action_pts = max(0, min(25, action_pts))

    # 4. Structure & Completeness (15 pts)
    struct_pts = 15
    detected_sections = set(sections.get("sections", {}).keys())
    if not any(s in detected_sections for s in ("EXPERIENCE", "WORK EXPERIENCE", "PROJECTS", "PERSONAL PROJECTS")):
        struct_pts -= 8
        feedback.append("Missing distinct EXPERIENCE or PROJECTS section header (-8 pts).")
    if not any(s in detected_sections for s in ("TECHNICAL SKILLS", "SKILLS", "SKILLS & ABILITIES")):
        struct_pts -= 4
        feedback.append("Missing dedicated TECHNICAL SKILLS section (-4 pts).")
    if not any(s in detected_sections for s in ("EDUCATION",)):
        struct_pts -= 3
        feedback.append("Missing EDUCATION section (-3 pts).")

    struct_pts = max(0, min(15, struct_pts))

    overall = max(0, min(100, parse_pts + keyword_pts + action_pts + struct_pts))
    if overall >= 80:
        grade = "A"
    elif overall >= 65:
        grade = "B"
    elif overall >= 50:
        grade = "C"
    else:
        grade = "Needs Work"

    return {
        "overall_score": overall,
        "grade": grade,
        "breakdown": {
            "parseability": parse_pts,
            "keyword_match": keyword_pts,
            "action_metrics": action_pts,
            "structure_hygiene": struct_pts,
        },
        "feedback": feedback,
        "strengths": strengths,
    }
