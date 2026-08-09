from pathlib import Path
import sys
from unittest import TestCase


BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from services.text_cleaner import TextCleaner


class TextCleanerTests(TestCase):
    def test_resume_sections_and_bullets_keep_their_lines(self):
        text = "SKILLS\nPython   SQL\n\nPROJECTS\n- Built an API"

        cleaned = TextCleaner.clean_text(text)

        self.assertEqual("SKILLS\nPython SQL\nPROJECTS\n- Built an API", cleaned)
