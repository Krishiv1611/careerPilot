from pathlib import Path
import sys
import tempfile
from unittest import TestCase


BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

try:
    from services.career_track_classifier import CareerTrackClassifier
except ImportError:
    CareerTrackClassifier = None


class FakeVectorizer:
    def __init__(self):
        self.calls = []

    def transform(self, texts):
        self.calls.append(texts)
        return texts


class FakeModel:
    def __init__(self, classes, probabilities):
        self.classes_ = classes
        self.probabilities = probabilities

    def predict_proba(self, _features):
        return [self.probabilities]


class CareerTrackClassifierTests(TestCase):
    def setUp(self):
        self.assertIsNotNone(
            CareerTrackClassifier,
            "The career-track classifier service is missing.",
        )

    def test_returns_the_three_strongest_known_categories_in_order(self):
        classifier = CareerTrackClassifier(
            vectorizer=FakeVectorizer(),
            model=FakeModel(
                classes=[8, 15, 20, 23],
                probabilities=[0.15, 0.55, 0.25, 0.05],
            ),
        )

        result = classifier.suggest("Built Java and Python applications.")

        self.assertTrue(result["available"])
        self.assertEqual(
            ["Java Developer", "Python Developer", "DevOps Engineer"],
            [item["category"] for item in result["suggestions"]],
        )
        self.assertEqual([1, 2, 3], [item["rank"] for item in result["suggestions"]])
        self.assertEqual(0.55, result["suggestions"][0]["confidence"])

    def test_ignores_unknown_classes_and_signals_below_the_threshold(self):
        classifier = CareerTrackClassifier(
            vectorizer=FakeVectorizer(),
            model=FakeModel(
                classes=[15, 20, 999],
                probabilities=[0.09, 0.80, 0.11],
            ),
        )

        result = classifier.suggest("Built a Python API.")

        self.assertEqual(1, len(result["suggestions"]))
        self.assertEqual("Python Developer", result["suggestions"][0]["category"])

    def test_empty_resume_returns_no_suggestions_without_running_the_model(self):
        vectorizer = FakeVectorizer()
        classifier = CareerTrackClassifier(
            vectorizer=vectorizer,
            model=FakeModel(classes=[20], probabilities=[1.0]),
        )

        result = classifier.suggest("   ")

        self.assertTrue(result["available"])
        self.assertEqual([], result["suggestions"])
        self.assertEqual([], vectorizer.calls)

    def test_checksum_mismatch_prevents_artifact_deserialization(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            vectorizer_path = Path(temp_dir) / "tfidf.pkl"
            model_path = Path(temp_dir) / "best_model.pkl"
            vectorizer_path.write_bytes(b"not a trusted pickle")
            model_path.write_bytes(b"not a trusted pickle")
            classifier = CareerTrackClassifier(
                vectorizer_path=vectorizer_path,
                model_path=model_path,
                expected_checksums={
                    vectorizer_path.name: "0" * 64,
                    model_path.name: "1" * 64,
                },
            )

            result = classifier.suggest("Built a Java application.")

            self.assertFalse(result["available"])
            self.assertEqual([], result["suggestions"])
            self.assertIn("verification", result["warning"].lower())
