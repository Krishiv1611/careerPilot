from pathlib import Path
import sys
from unittest import TestCase

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from services.bullet_enhancer_service import enhance_bullet_star


class BulletEnhancerServiceTests(TestCase):
    def test_converts_passive_bullet_to_action_star_format(self):
        passive = "worked on backend apis using python and made it faster"
        result = enhance_bullet_star(passive, "Backend Engineer")
        self.assertTrue(
            result["enhanced_bullet"].startswith("Architected")
            or result["enhanced_bullet"].startswith("Engineered")
        )
        self.assertIn("Python", result["enhanced_bullet"])
        self.assertTrue(result["metric_detected"] or "latency" in result["enhanced_bullet"])

    def test_preserves_existing_quantified_metrics(self):
        bullet = "Reduced database query latency by 42% by adding Redis cache"
        result = enhance_bullet_star(bullet)
        self.assertTrue(result["metric_detected"])
        self.assertIn("42%", result["enhanced_bullet"])
        self.assertIn("Redis", result["enhanced_bullet"])

    def test_handles_empty_or_whitespace_bullet(self):
        result = enhance_bullet_star("")
        self.assertIsInstance(result, dict)
        self.assertEqual(result["original_bullet"], "")
        self.assertIn("enhanced_bullet", result)
