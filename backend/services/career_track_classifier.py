import hashlib
import hmac
from pathlib import Path
import pickle
import re


MODEL_VERSION = "resume-category-gbc-1.7.2"
MIN_CONFIDENCE = 0.10
ANALYSIS_DIR = Path(__file__).resolve().parents[1] / "analysis"

EXPECTED_CHECKSUMS = {
    "best_model.pkl": "84088e1fccee707d22fca73c9e01e167e8757bf56633c59839cf1cf2bab368b3",
    "tfidf.pkl": "6951b9aad7b4a5ddc334ec9c426ab1a1374e6ade0a6c05a9d341c05d679f1271",
}

CATEGORY_LABELS = {
    0: "Advocate",
    1: "Arts",
    2: "Automation Testing",
    3: "Blockchain",
    4: "Business Analyst",
    5: "Civil Engineer",
    6: "Data Science",
    7: "Database",
    8: "DevOps Engineer",
    9: "DotNet Developer",
    10: "ETL Developer",
    11: "Electrical Engineering",
    12: "HR",
    13: "Hadoop",
    14: "Health and fitness",
    15: "Java Developer",
    16: "Mechanical Engineer",
    17: "Network Security Engineer",
    18: "Operations Manager",
    19: "PMO",
    20: "Python Developer",
    21: "SAP Developer",
    22: "Sales",
    23: "Testing",
    24: "Web Designing",
}


class CareerTrackClassifier:
    def __init__(
        self,
        vectorizer=None,
        model=None,
        vectorizer_path=None,
        model_path=None,
        expected_checksums=None,
    ):
        self.vectorizer = vectorizer
        self.model = model
        self.vectorizer_path = Path(vectorizer_path or ANALYSIS_DIR / "tfidf.pkl")
        self.model_path = Path(model_path or ANALYSIS_DIR / "best_model.pkl")
        self.expected_checksums = expected_checksums or EXPECTED_CHECKSUMS
        self.load_error = None

    def suggest(self, resume_text, limit=3):
        if not (resume_text or "").strip():
            return self._result(available=True, suggestions=[])

        if not self._ensure_loaded():
            return self._result(
                available=False,
                suggestions=[],
                warning="Career-track model verification failed.",
            )

        try:
            cleaned_text = _clean_for_model(resume_text)
            features = self.vectorizer.transform([cleaned_text])
            probabilities = self.model.predict_proba(features)[0]
            candidates = []

            for class_id, probability in zip(self.model.classes_, probabilities):
                category = CATEGORY_LABELS.get(int(class_id))
                confidence = float(probability)
                if category and confidence >= MIN_CONFIDENCE:
                    candidates.append((category, confidence))

            candidates.sort(key=lambda item: item[1], reverse=True)
            suggestions = [
                {
                    "category": category,
                    "confidence": round(confidence, 4),
                    "rank": index,
                    "model_version": MODEL_VERSION,
                }
                for index, (category, confidence) in enumerate(candidates[:limit], start=1)
            ]
            return self._result(available=True, suggestions=suggestions)
        except Exception:
            return self._result(
                available=False,
                suggestions=[],
                warning="Career-track suggestions are temporarily unavailable.",
            )

    def _ensure_loaded(self):
        if self.vectorizer is not None and self.model is not None:
            return True
        if self.load_error:
            return False

        try:
            self._verify_artifact(self.vectorizer_path)
            self._verify_artifact(self.model_path)
            with self.vectorizer_path.open("rb") as vectorizer_file:
                self.vectorizer = pickle.load(vectorizer_file)
            with self.model_path.open("rb") as model_file:
                self.model = pickle.load(model_file)
            return True
        except Exception as error:
            self.load_error = error
            return False

    def _verify_artifact(self, path):
        expected = self.expected_checksums.get(path.name)
        if not expected or not path.is_file():
            raise ValueError("Missing trusted model artifact.")

        actual = hashlib.sha256(path.read_bytes()).hexdigest()
        if not hmac.compare_digest(actual.lower(), expected.lower()):
            raise ValueError("Model artifact checksum mismatch.")

    def _result(self, available, suggestions, warning=None):
        return {
            "available": available,
            "suggestions": suggestions,
            "warning": warning,
            "model_version": MODEL_VERSION,
        }


def _clean_for_model(text):
    cleaned = re.sub(r"https?\S+", " ", text)
    cleaned = re.sub(r"@\S+|#\S+", " ", cleaned)
    cleaned = re.sub(r"[^\w\s]", " ", cleaned)
    return " ".join(cleaned.lower().split())


_classifier = CareerTrackClassifier()


def suggest_career_tracks(resume_text, limit=3):
    return _classifier.suggest(resume_text, limit=limit)
