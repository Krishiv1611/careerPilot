import re
from services.skill_extractor import SkillExtractor


def parse_linkedin_text_profile(text: str) -> dict:
    """Parse text from a LinkedIn 'Save to PDF' or exported profile."""
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    if not lines:
        return {"name": "", "headline": "", "location": "", "education": "", "skills": []}

    name = lines[0]
    headline = lines[1] if len(lines) > 1 else ""
    location = lines[2] if len(lines) > 2 and ("area" in lines[2].lower() or "," in lines[2]) else ""

    extractor = SkillExtractor()
    skills, _ = extractor.extract_skills(text)

    education_lines = []
    in_edu = False
    for line in lines:
        if line.lower() == "education":
            in_edu = True
            continue
        if in_edu:
            if any(marker in line.lower() for marker in ("experience", "skills", "certifications", "languages")):
                break
            education_lines.append(line)

    education = " | ".join(education_lines[:3]) if education_lines else ""

    return {
        "name": name,
        "headline": headline,
        "location": location,
        "education": education,
        "skills": sorted(skills),
    }
