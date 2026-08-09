import os
import re
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from urllib.parse import urlsplit, urlunsplit

import requests


TRUSTED_JOB_DOMAINS = [
    "naukri.com",
    "internshala.com",
    "linkedin.com",
    "wellfound.com",
    "cutshort.io",
    "jobs.lever.co",
    "boards.greenhouse.io",
    "jobs.ashbyhq.com",
]


def build_search_query(role, location=None, employment_type=None):
    parts = [role.strip()]

    if location:
        parts.append(location.strip())
    if employment_type:
        parts.append(employment_type.strip())

    parts.append("fresher graduate entry level")
    parts.append("-course -tutorial -blog -article -news")
    return " ".join(parts)


def is_job_page(url, title="", content=""):
    if not url:
        return False

    parsed_url = urlsplit(url)
    host = parsed_url.netloc.lower()
    path = parsed_url.path.lower()
    page_text = f"{title} {content}".lower()

    rejected_paths = ("/blog", "/news", "/course", "/tutorial", "/guide")
    if any(value in path for value in rejected_paths):
        return False

    ats_hosts = ("jobs.lever.co", "boards.greenhouse.io", "jobs.ashbyhq.com")
    ats_listing = any(domain in host for domain in ats_hosts) and len(
        [part for part in path.split("/") if part]
    ) >= 2
    job_path = any(
        value in path
        for value in (
            "/jobs/",
            "/job/",
            "/job-listing",
            "/positions/",
            "/openings/",
            "/internship/detail",
        )
    )
    job_language = any(
        value in page_text
        for value in ("apply", "hiring", "job", "opening", "internship", "graduate")
    )

    return (ats_listing or job_path) and job_language


def is_fresher_job(title, description=""):
    title_text = (title or "").lower()
    description_text = (description or "").lower()

    senior_titles = ("senior", "sr.", "sr ", "principal", "staff", "lead", "manager", "architect")
    if any(value in title_text for value in senior_titles):
        return False

    experience_ranges = re.findall(
        r"\b(\d+)\s*(?:to|-|\u2013|\u2014)\s*(\d+)\s*(?:years?|yrs?)",
        description_text,
    )
    minimum_experience = re.findall(
        r"\b(\d+)\s*\+\s*(?:years?|yrs?)",
        description_text,
    )
    fixed_experience = re.findall(
        r"(?<![-\u2013\u2014\d])\b(\d+)\s*(?:years?|yrs?)",
        description_text,
    )

    if any(int(maximum) > 2 for _, maximum in experience_ranges):
        return False
    if any(int(years) > 2 for years in minimum_experience + fixed_experience):
        return False

    return True


def normalize_tavily_job(result):
    raw_title = (result.get("title") or "").strip()
    url = (result.get("url") or "").strip()
    content = (result.get("content") or "").strip()

    if not is_job_page(url, raw_title, content):
        return None

    title, company = _split_title_and_company(raw_title)
    if not title or not company:
        return None

    return {
        "title": title,
        "company": company,
        "location": "Not specified",
        "employment_type": None,
        "experience_level": "Entry level",
        "skills": [],
        "description": content,
        "salary_range": None,
        "url": url,
        "source": "Tavily",
        "verification_status": "candidate",
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }


def deduplicate_jobs(jobs):
    unique_jobs = []
    seen = {}

    for job in jobs:
        canonical_url = _canonical_url(job.get("url"))
        fallback_key = f"{job.get('title', '').lower()}|{job.get('company', '').lower()}"
        key = canonical_url or fallback_key

        if key in seen:
            existing_job = seen[key]
            source = job.get("source")
            if source and source not in existing_job["sources"]:
                existing_job["sources"].append(source)
            continue

        copied_job = dict(job)
        copied_job["url"] = canonical_url or job.get("url")
        copied_job["sources"] = [job["source"]] if job.get("source") else []
        seen[key] = copied_job
        unique_jobs.append(copied_job)

    return unique_jobs


def run_job_search(role, location=None, employment_type=None, providers=None):
    query = build_search_query(role, location, employment_type)
    providers = providers or [search_serpapi, search_tavily]
    jobs = []
    warnings = []

    with ThreadPoolExecutor(max_workers=len(providers)) as executor:
        futures = [executor.submit(provider, query) for provider in providers]
        for future in futures:
            try:
                provider_jobs, warning = future.result()
                jobs.extend(provider_jobs)
                if warning:
                    warnings.append(warning)
            except Exception as error:
                warnings.append(f"A job search provider failed: {error}")

    valid_jobs = []
    for job in jobs:
        if not job.get("title") or not job.get("company") or not job.get("url"):
            continue
        if not is_job_page(job["url"], job["title"], job.get("description", "")):
            continue
        if not is_fresher_job(job["title"], job.get("description", "")):
            continue
        valid_jobs.append(job)

    return {
        "query": query,
        "jobs": deduplicate_jobs(valid_jobs),
        "warnings": warnings,
    }


def search_serpapi(query):
    api_key = os.getenv("SERPAPI_API_KEY")
    if not api_key:
        return [], "SerpAPI is not configured on the server."

    response = requests.get(
        "https://serpapi.com/search.json",
        params={"engine": "google_jobs", "q": query, "api_key": api_key},
        timeout=20,
    )
    response.raise_for_status()

    jobs = []
    for result in response.json().get("jobs_results", []):
        job = _normalize_serpapi_job(result)
        if job:
            jobs.append(job)

    warning = None if jobs else "SerpAPI found no likely fresher job pages."
    return jobs, warning


def search_tavily(query):
    api_key = os.getenv("TAVILY_API_KEY")
    if not api_key:
        return [], "Tavily is not configured on the server."

    from tavily import TavilyClient

    response = TavilyClient(api_key=api_key).search(
        query=query,
        search_depth="advanced",
        max_results=10,
        include_domains=TRUSTED_JOB_DOMAINS,
    )

    jobs = []
    for result in response.get("results", []):
        job = normalize_tavily_job(result)
        if job:
            jobs.append(job)

    warning = None if jobs else "Tavily found no likely job pages."
    return jobs, warning


def _normalize_serpapi_job(result):
    title = (result.get("title") or "").strip()
    company = (result.get("company_name") or "").strip()
    description = (result.get("description") or "").strip()
    url = _serpapi_job_url(result)

    if not title or not company or not url:
        return None

    return {
        "title": title,
        "company": company,
        "location": result.get("location") or "Not specified",
        "employment_type": _serpapi_employment_type(result),
        "experience_level": "Entry level",
        "skills": [],
        "description": description,
        "salary_range": None,
        "url": url,
        "source": "Google Jobs",
        "verification_status": "candidate",
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }


def _serpapi_job_url(result):
    apply_options = result.get("apply_options") or []
    if apply_options:
        return apply_options[0].get("link")
    return result.get("share_link") or result.get("link")


def _serpapi_employment_type(result):
    extensions = result.get("detected_extensions") or {}
    return extensions.get("schedule_type")


def _split_title_and_company(raw_title):
    parts = re.split(r"\s+[|–—]\s+|\s+-\s+", raw_title, maxsplit=1)
    if len(parts) < 2:
        return raw_title.strip(), None

    title = parts[0].strip()
    company = re.sub(r"\s+(careers|jobs)$", "", parts[1].strip(), flags=re.IGNORECASE)
    return title, company.strip() or None


def _canonical_url(url):
    if not url:
        return None

    parsed_url = urlsplit(url)
    clean_path = parsed_url.path.rstrip("/")
    return urlunsplit((parsed_url.scheme, parsed_url.netloc.lower(), clean_path, "", ""))
