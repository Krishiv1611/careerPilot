import json
import logging
import urllib.request
import urllib.error

logger = logging.getLogger(__name__)

LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql"

LEETCODE_QUERY = """
query getUserProfile($username: String!) {
  matchedUser(username: $username) {
    username
    profile {
      ranking
    }
    submitStats {
      acSubmissionNum {
        difficulty
        count
      }
    }
  }
}
"""


def _query_leetcode_graphql(username: str) -> dict | None:
    payload = {
        "query": LEETCODE_QUERY,
        "variables": {"username": username},
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        LEETCODE_GRAPHQL_URL,
        data=data,
        headers={
            "Content-Type": "application/json",
            "User-Agent": "CareerPilot-CoPilot/1.0",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=8) as response:
            if response.status == 200:
                res_data = json.loads(response.read().decode("utf-8"))
                return res_data.get("data")
    except Exception as err:
        logger.debug(f"LeetCode query failed for {username}: {err}")
    return None


def fetch_leetcode_stats(username: str) -> dict:
    """Fetch public LeetCode algorithmic problem solving statistics."""
    clean_username = username.strip().lstrip("@")
    data = _query_leetcode_graphql(clean_username)

    if not data or not data.get("matchedUser"):
        return {
            "username": clean_username,
            "found": False,
            "total_solved": 0,
            "easy_solved": 0,
            "medium_solved": 0,
            "hard_solved": 0,
            "ranking": None,
            "bullet_point": "",
        }

    user_data = data["matchedUser"]
    ranking = (user_data.get("profile") or {}).get("ranking")
    submission_nums = (user_data.get("submitStats") or {}).get("acSubmissionNum", [])

    diff_map = {item.get("difficulty", ""): item.get("count", 0) for item in submission_nums}
    total_solved = diff_map.get("All", 0)
    easy_solved = diff_map.get("Easy", 0)
    medium_solved = diff_map.get("Medium", 0)
    hard_solved = diff_map.get("Hard", 0)

    stats = {
        "username": clean_username,
        "found": True,
        "total_solved": total_solved,
        "easy_solved": easy_solved,
        "medium_solved": medium_solved,
        "hard_solved": hard_solved,
        "ranking": ranking,
        "acceptance_rate": 0.0,
    }
    stats["bullet_point"] = format_leetcode_bullet(stats)
    return stats


def format_leetcode_bullet(stats: dict) -> str:
    """Format LeetCode stats into an ATS-friendly, evidence-backed resume bullet."""
    total = stats.get("total_solved", 0)
    medium = stats.get("medium_solved", 0)
    hard = stats.get("hard_solved", 0)
    ranking = stats.get("ranking")

    parts = [f"Solved {total}+ algorithmic problems on LeetCode"]
    breakdown = []
    if medium:
        breakdown.append(f"{medium} Medium")
    if hard:
        breakdown.append(f"{hard} Hard")
    if breakdown:
        parts.append(f"({', '.join(breakdown)})")

    if ranking and ranking > 0:
        parts.append(f"with global contest/platform ranking of #{ranking:,}")

    return " ".join(parts) + "."
