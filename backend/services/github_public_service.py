import json
import logging
import urllib.request
import urllib.error

logger = logging.getLogger(__name__)


def _query_github_api(username: str) -> list[dict] | None:
    url = f"https://api.github.com/users/{username}/repos?sort=updated&per_page=30"
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "CareerPilot-CoPilot/1.0",
            "Accept": "application/vnd.github.v3+json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=8) as response:
            if response.status == 200:
                return json.loads(response.read().decode("utf-8"))
    except Exception as err:
        logger.debug(f"GitHub query failed for {username}: {err}")
    return None


def fetch_github_summary(username: str) -> dict:
    """Fetch public repositories and star summary for candidate GitHub profile."""
    clean_username = username.strip().lstrip("@")
    repos = _query_github_api(clean_username)

    if repos is None or not isinstance(repos, list):
        return {
            "username": clean_username,
            "found": False,
            "public_repos": 0,
            "total_stars": 0,
            "top_languages": [],
            "top_projects": [],
            "bullet_point": "",
        }

    total_stars = 0
    language_counts = {}
    top_projects = []

    for r in repos:
        if r.get("fork"):
            continue
        stars = r.get("stargazers_count", 0)
        total_stars += stars
        lang = r.get("language")
        if lang:
            language_counts[lang] = language_counts.get(lang, 0) + 1

        top_projects.append({
            "name": r.get("name"),
            "description": r.get("description") or "",
            "stars": stars,
            "language": lang,
            "url": r.get("html_url"),
        })

    sorted_langs = sorted(language_counts.keys(), key=lambda k: language_counts[k], reverse=True)[:4]
    top_projects.sort(key=lambda p: p["stars"], reverse=True)

    summary = {
        "username": clean_username,
        "found": True,
        "public_repos": len(repos),
        "total_stars": total_stars,
        "top_languages": sorted_langs,
        "top_projects": top_projects[:5],
    }
    summary["bullet_point"] = format_github_bullet(summary)
    return summary


def format_github_bullet(summary: dict) -> str:
    """Format GitHub activity into a resume project bullet."""
    repos = summary.get("public_repos", 0)
    stars = summary.get("total_stars", 0)
    langs = summary.get("top_languages", [])

    parts = [f"Maintained {repos} public repositories"]
    if langs:
        parts.append(f"leveraging {', '.join(langs)}")
    if stars > 0:
        parts.append(f"with {stars} stars across open-source tools")

    return " ".join(parts) + "."
