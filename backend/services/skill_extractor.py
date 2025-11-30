# services/skill_extractor.py

import re
import numpy as np

from services.skill_database import (
    SKILL_VOCAB,
    SKILL_ALIASES,
    SKILL_CATEGORIES,
)
from services.text_cleaner import TextCleaner
from services.embedding import EmbeddingService


# ---------------------------------------------
# Cosine Similarity
# ---------------------------------------------
def cosine_sim(a, b):
    a = np.array(a)
    b = np.array(b)
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-10))


# ======================================================================
# ⭐ SkillExtractor Class
# ======================================================================
class SkillExtractor:
    """
    Extracts skills from resume/job text using:
    1. Keyword extraction
    2. Regex extraction
    3. Semantic extraction
    4. Alias normalization
    5. Categorization
    """

    def __init__(self, api_key: str = None):
        self.embedder = EmbeddingService(api_key=api_key)  # for semantic matching

    # -----------------------------------------
    # Normalize using alias rules
    # -----------------------------------------
    def normalize(self, skill: str) -> str:
        skill = skill.lower().strip()
        return SKILL_ALIASES.get(skill, skill)

    # -----------------------------------------
    # 1️⃣ Keyword Extraction
    # -----------------------------------------
    def keyword_extract(self, text: str):
        text_lower = text.lower()
        found = []

        for skill in SKILL_VOCAB:
            if skill in text_lower:
                found.append(skill)

        return found

    # -----------------------------------------
    # 2️⃣ Regex Extraction
    # -----------------------------------------
    TECH_REGEX = r"\b([a-zA-Z0-9\+\#\.\-]{2,20})\b"

    def regex_extract(self, text: str):
        matches = re.findall(self.TECH_REGEX, text)
        matches = [self.normalize(m.lower()) for m in matches]
        return [m for m in matches if m in SKILL_VOCAB]

    # -----------------------------------------
    # 3️⃣ Semantic Extraction
    # -----------------------------------------
    def semantic_extract(self, text: str, threshold: float = 0.60):
        sentences = [s.strip() for s in text.split("\n") if s.strip()]
        if not sentences:
            return []

        # Embed sentences
        sentence_vecs = self.embedder.model.embed_documents(sentences)

        # Embed skill vocab
        skill_vecs = self.embedder.model.embed_documents(SKILL_VOCAB)

        found = []

        for skill, s_vec in zip(SKILL_VOCAB, skill_vecs):
            for r_vec in sentence_vecs:
                sim = cosine_sim(s_vec, r_vec)
                if sim > threshold:
                    found.append(skill)
                    break

        return found

    # -----------------------------------------
    # Categorization
    # -----------------------------------------
    def categorize(self, skills):
        categorized = {}

        for category_name, skill_list in SKILL_CATEGORIES.items():
            categorized[category_name] = [
                skill for skill in skills if skill in skill_list
            ]

        return categorized

    # -----------------------------------------
    # FINAL WRAPPER
    # -----------------------------------------
    def extract_skills(self, text: str):
        """
        Clean text → run all extractors → dedupe → normalize → categorize.
        Returns:
            combined_skills (list)
            categorized_skills (dict)
        """
        cleaned = TextCleaner.clean_text(text)

        kw = self.keyword_extract(cleaned)
        rg = self.regex_extract(cleaned)
        sm = self.semantic_extract(cleaned)

        # Merge + dedupe
        combined = list(set(kw + rg + sm))

        # Normalize again
        combined = [self.normalize(s) for s in combined]

        # Sort for clean output
        combined = sorted(list(set(combined)))

        categorized = self.categorize(combined)

        return combined, categorized



