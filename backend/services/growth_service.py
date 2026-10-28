from collections import Counter
import json
import re
import urllib.error
import urllib.request

from services.growth_blueprint_database import BLUEPRINTS, get_skill_blueprint


def build_growth_plan(resume_versions):
    gap_counts = Counter()

    for version in resume_versions:
        gap_counts.update(version.get("missing_skills") or [])

    plan = []
    for skill, job_count in gap_counts.most_common(3):
        blueprint = get_skill_blueprint(skill)
        blueprint_title = blueprint["title"] if blueprint else f"{skill.capitalize()} Production Proof"
        plan.append({
            "skill": skill,
            "job_count": job_count,
            "blueprint_title": blueprint_title,
            "blueprint_available": blueprint is not None,
            "next_action": (
                f"Build or verify one small project using {skill} according to the blueprint, then submit repository as evidence."
            ),
            "completion_rule": (
                f"Complete when CareerPilot inspects repository files and verifies authentic {skill} implementation."
            ),
        })

    return plan


def complete_growth_priority(evidence_url="", external_confirmation=False):
    evidence_url = evidence_url.strip()
    if not evidence_url and not external_confirmation:
        raise ValueError("Add an evidence link or explicitly confirm completion outside CareerPilot.")

    return {
        "status": "completed",
        "completion_source": "evidence_link" if evidence_url else "external_confirmation",
        "evidence_url": evidence_url or None,
    }


def _extract_github_owner_repo(repo_url: str):
    match = re.search(r"github\.com/([^/]+)/([^/#?]+)", repo_url)
    if not match:
        return None, None
    owner, repo = match.group(1), match.group(2)
    if repo.endswith(".git"):
        repo = repo[:-4]
    return owner, repo


def _fetch_repo_meta(owner: str, repo: str) -> dict:
    url = f"https://api.github.com/repos/{owner}/{repo}"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "CareerPilot-CodeInspector/1.0", "Accept": "application/vnd.github.v3+json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            return json.loads(resp.read().decode())
    except Exception:
        return {}


def _fetch_repo_contents(owner: str, repo: str) -> list[str]:
    url = f"https://api.github.com/repos/{owner}/{repo}/contents"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "CareerPilot-CodeInspector/1.0", "Accept": "application/vnd.github.v3+json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            items = json.loads(resp.read().decode())
            if isinstance(items, list):
                return [item.get("name", "") for item in items if isinstance(item, dict)]
            return []
    except Exception:
        return []


def verify_github_growth_submission(repo_url: str, required_skill: str) -> dict:
    """Inspect public GitHub repository to verify authentic project evidence for a skill gap."""
    owner, repo = _extract_github_owner_repo(repo_url)
    if not owner or not repo:
        return {
            "verified": False,
            "reasons": ["Invalid GitHub repository URL. Must be in format https://github.com/owner/repo."],
            "detected_files": [],
            "generated_bullet": None,
        }

    meta = _fetch_repo_meta(owner, repo)
    if not meta or not meta.get("name"):
        return {
            "verified": False,
            "reasons": [f"Could not find public GitHub repository '{owner}/{repo}' or repository is private."],
            "detected_files": [],
            "generated_bullet": None,
        }

    contents = _fetch_repo_contents(owner, repo)
    detected_files = [f for f in contents if f]
    detected_lower = [f.lower() for f in detected_files]

    reasons = []
    blueprint = get_skill_blueprint(required_skill)
    required_files = blueprint["required_files"] if blueprint else [required_skill.lower()]

    matched_files = []
    for req_file in required_files:
        req_clean = req_file.lower()
        if any(req_clean in f for f in detected_lower):
            matched_files.append(req_file)

    if not matched_files:
        reasons.append(
            f"Missing required implementation files for {required_skill}. Expected: {', '.join(required_files)}."
        )

    if len(detected_files) <= 1 and any("readme" in f for f in detected_lower):
        reasons.append("Repository appears empty or only contains a README file.")

    if meta.get("fork"):
        reasons.append("Repository is a fork; original contributions must be demonstrated.")

    verified = len(matched_files) > 0 and len(detected_files) > 1

    if verified:
        reasons.append(f"Successfully verified {required_skill} implementation files: {', '.join(matched_files)}.")
        bullet = (
            blueprint["suggested_bullet"]
            if blueprint
            else f"Engineered public project utilizing {required_skill.capitalize()} with verifiable GitHub repository implementation."
        )
    else:
        bullet = None

    return {
        "verified": verified,
        "reasons": reasons,
        "detected_files": detected_files,
        "generated_bullet": bullet,
    }
