from pathlib import Path
import re
from unittest import TestCase


BACKEND_ROOT = Path(__file__).resolve().parents[1]


class JobRouteSecurityTests(TestCase):
    def test_every_job_route_requires_the_current_user(self):
        source = (BACKEND_ROOT / "routers/job_router.py").read_text(encoding="utf-8")
        route_count = len(re.findall(r"@router\.(?:get|post|put|patch|delete)", source))
        protected_count = source.count("Depends(get_current_user)")

        self.assertEqual(route_count, protected_count)
