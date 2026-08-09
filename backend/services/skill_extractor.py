import re

from services.skill_database import SKILL_ALIASES, SKILL_CATEGORIES, SKILL_VOCAB
from services.text_cleaner import TextCleaner


class SkillExtractor:
    """Deterministic skill extraction used by resumes, jobs, matches, and GitHub evidence."""

    def __init__(self, _api_key=None):
        self.embedder = None

    def normalize(self, skill):
        normalized = skill.lower().strip()
        return SKILL_ALIASES.get(normalized, normalized)

    def keyword_extract(self, text):
        text_lower = text.lower()
        found = []

        for skill in SKILL_VOCAB:
            pattern = rf"(?<![a-z0-9]){re.escape(skill.lower().strip())}(?![a-z0-9])"
            if re.search(pattern, text_lower):
                found.append(skill)
        return found

    def regex_extract(self, text):
        matches = re.findall(r"\b([a-zA-Z0-9\+\#\.\-]{2,20})\b", text)
        normalized = [self.normalize(match) for match in matches]
        return [skill for skill in normalized if skill in SKILL_VOCAB]

    def semantic_extract(self, _text, _threshold=0.60):
        return []

    def categorize(self, skills):
        return {
            category: [skill for skill in skills if skill in category_skills]
            for category, category_skills in SKILL_CATEGORIES.items()
        }

    def extract_skills(self, text):
        cleaned = TextCleaner.clean_text(text)
        skills = self.keyword_extract(cleaned) + self.regex_extract(cleaned)
        normalized_skills = sorted({self.normalize(skill) for skill in skills})
        return normalized_skills, self.categorize(normalized_skills)
