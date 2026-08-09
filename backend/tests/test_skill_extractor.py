import os
from pathlib import Path
import sys
from unittest import TestCase
from unittest.mock import patch


BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from services.skill_extractor import SkillExtractor


class SkillExtractorTests(TestCase):
    def test_initializes_without_provider_key_for_deterministic_extraction(self):
        with patch.dict(os.environ, {"GOOGLE_API_KEY": ""}):
            extractor = SkillExtractor()

        self.assertIsNone(extractor.embedder)
        self.assertIn("python", extractor.keyword_extract("Built an API with Python and FastAPI"))

    def test_keyword_extraction_uses_token_boundaries(self):
        extractor = SkillExtractor.__new__(SkillExtractor)

        skills = extractor.keyword_extract("Created robust reports for an ongoing project")

        self.assertNotIn("r", skills)
        self.assertNotIn("go", skills)
