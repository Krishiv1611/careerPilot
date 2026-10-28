from datetime import datetime, timezone
import json
import re
import urllib.request
import urllib.error

from services.job_discovery_service import is_fresher_job, _is_spam_training_program


CURATED_PUBLIC_ATS_COMPANIES = [
    {"provider": "lever", "company": "Stripe", "board": "stripe"},
    {"provider": "lever", "company": "Figma", "board": "figma"},
    {"provider": "lever", "company": "Postman", "board": "postman"},
    {"provider": "lever", "company": "Cloudflare", "board": "cloudflare"},
    {"provider": "greenhouse", "company": "Airbnb", "board": "airbnb"},
    {"provider": "greenhouse", "company": "GitLab", "board": "gitlab"},
    {"provider": "greenhouse", "company": "Reddit", "board": "reddit"},
    {"provider": "greenhouse", "company": "Canonical", "board": "canonical"},
    {"provider": "ashby", "company": "Ramp", "board": "ramp"},
    {"provider": "ashby", "company": "Linear", "board": "linear"},
]


def _fetch_json_endpoint(url: str):
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "CareerPilot-DirectJobSync/1.0", "Accept": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=4) as response:
            return json.loads(response.read().decode())
    except Exception:
        return None


def normalize_ats_posting(raw_posting: dict, provider: str, company: str) -> dict | None:
    """Normalize a raw posting from Lever, Greenhouse, or Ashby into CareerPilot standard format.

    Enforces fresher/junior experience filters and anti-spam heuristic gates.
    """
    if not isinstance(raw_posting, dict):
        return None

    if provider == "lever":
        posting_id = str(raw_posting.get("id") or "")
        title = raw_posting.get("text") or ""
        job_url = raw_posting.get("hostedUrl") or raw_posting.get("applyUrl") or ""
        categories = raw_posting.get("categories") or {}
        location = categories.get("location") or "Remote"
        employment_type = categories.get("commitment") or "Full-time"
        description = raw_posting.get("descriptionPlain") or raw_posting.get("description") or ""

    elif provider == "greenhouse":
        posting_id = str(raw_posting.get("id") or "")
        title = raw_posting.get("title") or ""
        job_url = raw_posting.get("absolute_url") or ""
        loc_obj = raw_posting.get("location")
        location = loc_obj.get("name", "Remote") if isinstance(loc_obj, dict) else "Remote"
        employment_type = "Full-time"
        content = raw_posting.get("content") or ""
        # Strip HTML tags
        description = re.sub(r"<[^>]+>", " ", content).strip()

    elif provider == "ashby":
        posting_id = str(raw_posting.get("id") or "")
        title = raw_posting.get("title") or ""
        job_url = raw_posting.get("jobUrl") or ""
        location = raw_posting.get("locationName") or "Remote"
        employment_type = raw_posting.get("employmentType") or "Full-time"
        content = raw_posting.get("descriptionPlain") or raw_posting.get("descriptionHtml") or ""
        description = re.sub(r"<[^>]+>", " ", content).strip()

    else:
        return None

    if not title or not job_url:
        return None

    # Filter out senior, staff, lead, director roles or roles requiring >2-3 years
    if not is_fresher_job(title, description):
        return None

    # Filter out scam or training programs
    if _is_spam_training_program(title, description):
        return None

    return {
        "id": f"ats-{provider}-{posting_id or abs(hash(job_url)) % 10000000}",
        "title": title.strip(),
        "company": company.strip(),
        "location": location.strip(),
        "job_url": job_url.strip(),
        "description": description.strip(),
        "verification_status": "verified_ats",
        "posted_at": datetime.now(timezone.utc).isoformat(),
        "employment_type": employment_type,
        "source": f"{provider.capitalize()} Public ATS Feed",
    }


def fetch_direct_ats_jobs(query: str = "", limit: int = 15) -> list[dict]:
    """Fetch and aggregate verified fresher job listings directly from public company ATS endpoints."""
    results = []
    keywords = [k.lower() for k in query.split() if len(k) > 2] if query else []

    for entry in CURATED_PUBLIC_ATS_COMPANIES:
        if len(results) >= limit:
            break

        provider = entry["provider"]
        company = entry["company"]
        board = entry["board"]

        if provider == "lever":
            url = f"https://api.lever.co/v0/postings/{board}?mode=json"
            data = _fetch_json_endpoint(url)
            items = data if isinstance(data, list) else []

        elif provider == "greenhouse":
            url = f"https://boards-api.greenhouse.io/v1/boards/{board}/jobs?content=true"
            data = _fetch_json_endpoint(url)
            items = data.get("jobs", []) if isinstance(data, dict) else []

        elif provider == "ashby":
            url = f"https://api.ashbyhq.com/posting-api/job-board/{board}"
            data = _fetch_json_endpoint(url)
            items = data.get("jobs", []) if isinstance(data, dict) else []

        else:
            items = []

        for item in items:
            normalized = normalize_ats_posting(item, provider=provider, company=company)
            if not normalized:
                continue

            # Query keyword filter
            if keywords:
                full_text = f"{normalized['title']} {normalized['description']}".lower()
                if not any(k in full_text for k in keywords):
                    continue

            results.append(normalized)
            if len(results) >= limit:
                break

    return results
