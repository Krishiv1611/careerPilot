from typing import Dict, Any
from services.skill_extractor import SkillExtractor

def skill_mapping_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extracts skills from resume text using keyword + regex + semantic.
    """

    text = state["resume_text"]

    extractor = SkillExtractor()
    skills, categories = extractor.extract_skills(text)

    return {
        "extracted_skills": skills,
        "skill_categories": categories
    }

