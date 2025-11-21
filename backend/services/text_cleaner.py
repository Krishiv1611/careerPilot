# services/text_cleaner.py

import re
import unicodedata


class TextCleaner:
    """
    Utility class for cleaning and normalizing resume and job description text.
    Used by ResumeExtractorAgent, JDAnalyzerAgent, SkillMappingAgent, etc.
    """

    @staticmethod
    def normalize_unicode(text: str) -> str:
        """Normalize unicode characters to standard forms."""
        return unicodedata.normalize("NFKD", text)

    @staticmethod
    def remove_multiple_spaces(text: str) -> str:
        """Convert multiple spaces/newlines into clean spacing."""
        text = re.sub(r'\n+', '\n', text)          # remove multiple newlines
        text = re.sub(r'\s+', ' ', text)           # remove multiple spaces
        return text.strip()

    @staticmethod
    def remove_non_ascii(text: str) -> str:
        """Remove weird unicode symbols but preserve useful punctuation."""
        return re.sub(r'[^\x00-\x7F]+', ' ', text)

    @staticmethod
    def clean_text(text: str) -> str:
        """
        Full cleaning pipeline:
        - lowercase optional (disabled because resumes need case)
        - unicode normalization
        - remove non-ascii
        - collapse whitespace
        - trim spaces
        """
        if not text:
            return ""

        text = TextCleaner.normalize_unicode(text)
        text = TextCleaner.remove_non_ascii(text)
        text = TextCleaner.remove_multiple_spaces(text)

        return text

    @staticmethod
    def clean_for_embeddings(text: str) -> str:
        """
        Cleaner version used before computing embeddings.
        Removes special characters and keeps meaningful text.
        """
        if not text:
            return ""

        text = TextCleaner.clean_text(text)
        text = re.sub(r'[^a-zA-Z0-9.,;:!?()\-\n ]+', ' ', text)  # strict filtering
        text = TextCleaner.remove_multiple_spaces(text)

        return text.strip()
