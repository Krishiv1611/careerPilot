import re

from services.skill_extractor import SkillExtractor


def analyze_resume_for_job(resume_text, job_description):
    extractor = SkillExtractor()
    resume_skills, _ = extractor.extract_skills(resume_text)
    job_skills, _ = extractor.extract_skills(job_description)

    matched_skills = sorted(set(resume_skills) & set(job_skills))
    missing_skills = sorted(set(job_skills) - set(resume_skills))

    return {
        "requirements": job_skills,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "evidence_map": _build_evidence_map(resume_text, matched_skills),
        "project_suggestions": _build_project_suggestions(missing_skills),
        "tailored_text": _prioritize_lines(resume_text, matched_skills),
    }


def find_unsupported_claims(original_text, candidate_text):
    extractor = SkillExtractor()
    original_skills, _ = extractor.extract_skills(original_text)
    candidate_skills, _ = extractor.extract_skills(candidate_text)

    original_numbers = set(re.findall(r"\d+(?:\.\d+)?", original_text))
    candidate_numbers = set(re.findall(r"\d+(?:\.\d+)?", candidate_text))

    return {
        "skills": sorted(set(candidate_skills) - set(original_skills)),
        "numbers": sorted(candidate_numbers - original_numbers),
    }


def apply_simple_prompt(resume_text, instruction, job_description=""):
    extractor = SkillExtractor()
    resume_skills, _ = extractor.extract_skills(resume_text)
    instruction_skills, _ = extractor.extract_skills(instruction)

    unsupported_skills = sorted(set(instruction_skills) - set(resume_skills))
    add_words = ("add", "include", "claim", "mention")
    if unsupported_skills and any(word in instruction.lower() for word in add_words):
        raise ValueError(
            "Cannot add unsupported skills: " + ", ".join(unsupported_skills)
        )

    normalized_instruction = instruction.strip()
    instruction_lower = normalized_instruction.lower()

    if any(word in instruction_lower for word in ("emphasize", "highlight", "prioritize", "focus")):
        supported_targets = sorted(set(instruction_skills) & set(resume_skills))
        if not supported_targets:
            raise ValueError("Name an existing skill to emphasize.")
        return _prioritize_lines(resume_text, supported_targets)

    if "shorten" in instruction_lower or "concise" in instruction_lower:
        lines = _clean_lines(resume_text)
        return "\n".join(lines[:25])

    remove_match = re.match(
        r"^(?:remove|delete)\s+(?:the\s+)?(.+?)(?:\s+line)?[.!]?$",
        normalized_instruction,
        flags=re.IGNORECASE,
    )
    if remove_match:
        target = remove_match.group(1).strip(" \"'")
        lines = _clean_lines(resume_text)
        kept_lines = [line for line in lines if target.lower() not in line.lower()]
        if len(kept_lines) == len(lines):
            raise ValueError(f"No resume line contains: {target}")
        return "\n".join(kept_lines)

    if "tailor" in instruction_lower or "job description" in instruction_lower or "match the jd" in instruction_lower:
        if not job_description.strip():
            raise ValueError("This instruction needs the job description linked to the version.")
        matched_skills = analyze_resume_for_job(resume_text, job_description)["matched_skills"]
        if not matched_skills:
            raise ValueError("No existing resume evidence matches the detected job skills.")
        return _prioritize_lines(resume_text, matched_skills)

    from services.ai_tailoring_service import tailor_resume_with_ai
    response = tailor_resume_with_ai(resume_text, instruction, job_description)
    return response.full_content


def _build_evidence_map(resume_text, skills):
    evidence_map = {}
    lines = _clean_lines(resume_text)

    for skill in skills:
        matching_lines = [line for line in lines if skill.lower() in line.lower()]
        evidence_map[skill] = matching_lines[:3]

    return evidence_map


def _build_project_suggestions(missing_skills):
    suggestions = []

    for skill in missing_skills[:3]:
        suggestions.append({
            "kind": "future_project",
            "title": f"Build evidence for {skill}",
            "description": (
                f"Create a small, deployable project that uses {skill}. "
                "Add it to the resume only after the work exists and you can explain it."
            ),
            "skills": [skill],
        })

    return suggestions


def _prioritize_lines(text, skills):
    lines = _clean_lines(text)
    matching_lines = []
    remaining_lines = []

    for line in lines:
        if any(skill.lower() in line.lower() for skill in skills):
            matching_lines.append(line)
        else:
            remaining_lines.append(line)

    return "\n".join(matching_lines + remaining_lines)


def _clean_lines(text):
    return [line.strip() for line in text.splitlines() if line.strip()]
