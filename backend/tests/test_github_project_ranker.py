from pathlib import Path
import sys
from unittest import TestCase


BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from services.github_project_ranker import rank_projects


class GitHubProjectRankerTests(TestCase):
    def test_existing_project_is_ranked_by_missing_jd_evidence(self):
        repositories = [
            {
                "owner": "student",
                "name": "campus-deploy",
                "url": "https://github.com/student/campus-deploy",
                "readme": "A Docker and Kubernetes deployment for a FastAPI service.",
                "files": ["Dockerfile", "k8s/deployment.yaml", "main.py"],
            },
            {
                "owner": "student",
                "name": "portfolio",
                "url": "https://github.com/student/portfolio",
                "readme": "A static HTML portfolio.",
                "files": ["index.html"],
            },
        ]

        ranked = rank_projects(["docker", "kubernetes"], repositories)

        self.assertEqual("campus-deploy", ranked[0]["name"])
        self.assertEqual(["docker", "kubernetes"], ranked[0]["matching_skills"])
        self.assertEqual("existing_project", ranked[0]["kind"])
        self.assertEqual(1, len(ranked))
