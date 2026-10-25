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
    "myworkdayjobs.com",
    "smartrecruiters.com",
    "workable.com",
    "bamboohr.com",
]


def build_search_query(role, location=None, employment_type=None):
    clean_role = (role or "").strip()
    parts = [clean_role] if clean_role else []

    if location and location.strip():
        parts.append(location.strip())
    if employment_type and employment_type.strip():
        parts.append(employment_type.strip())

    parts.append("fresher graduate entry level")
    parts.append("-course -courses -training -trainings -bootcamp -bootcamps -tutorial -blog -article -news -curriculum -syllabus -degree")
    return " ".join(parts).strip()


def is_job_page(url, title="", content=""):
    if not url:
        return False

    parsed_url = urlsplit(url)
    host = parsed_url.netloc.lower()
    path = parsed_url.path.lower()
    page_text = f"{title} {content}".lower()

    rejected_paths = (
        "/blog", "/news", "/course", "/courses", "/tutorial", "/guide",
        "/training", "/bootcamp", "/bootcamps", "/curriculum", "/articles",
        "/pulse", "/post"
    )
    if any(value in path for value in rejected_paths):
        return False

    ats_hosts = (
        "jobs.lever.co",
        "boards.greenhouse.io",
        "jobs.ashbyhq.com",
        "myworkdayjobs.com",
        "smartrecruiters.com",
        "workable.com",
        "bamboohr.com",
    )
    ats_listing = any(domain in host for domain in ats_hosts) and len(
        [part for part in path.split("/") if part]
    ) >= 2
    if ats_listing:
        return True

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
        for value in ("apply", "hiring", "job", "opening", "internship", "graduate", "career", "engineer", "developer", "role", "position")
    )

    return job_path and job_language


SPAM_TRAINING_PATTERNS = [
    # Candidate fees, deposits, payments
    r"\b(?:registration|enrollment|admission|training|course|bootcamp|program|onboarding|processing|security|seat)\s+(?:fee|fees|cost|charge|charges|deposit|amount)\b",
    r"\b(?:fee|fees|charge|charges|cost)\s*(?:of|is|:|-)\s*(?:inr|rs\.?|usd|\$|€|£|\d+)",
    r"\bpay\s+(?:a\s+)?(?:nominal|small|upfront|mandatory|one-time|refundable|non-refundable)?\s*(?:fee|amount|charges?|deposit)\b",
    r"\b(?:refundable|non-refundable)\s+(?:fee|deposit|charges?|amount)\b",
    r"\b(?:candidates?|students?)\s+(?:need|needs|required|must|have)\s+to\s+pay\b",
    r"\b(?:fee\s+payable|fees\s+applicable|charges\s+apply)\b",
    r"\bself[- ]funded\s+(?:training|internship)\b",
    # Placement guarantees, ISAs, pay-after-placement schemes
    r"\b100%\s*(?:job\s+)?(?:placement\s+guarantee|guaranteed\s+placement|placement\s+assistance)\b",
    r"\b(?:100%\s*)?(?:job\s*)?placement\s*(?:fee|fees|cost|charge|charges)\b",
    r"\b(?:guaranteed|assured)\s+placement\b",
    r"\bpay[- ]after[- ]placement\b",
    r"\b(?:pay[- ]after[- ]placement\s+)?isa\b",
    r"\bincome\s+share\s+agreement\b",
    r"\bmoney[- ]back\s+guarantee\s+if\s+not\s+placed\b",
    # Course / batch enrollment disguised as a job
    r"\b(?:enroll|register)\s+(?:now|today)\s+(?:for|in)\s+(?:our|the|this)?\s*(?:course|program|batch|bootcamp|classes)\b",
    r"\b(?:batch|classes)\s+start(?:s|ing)?\s+(?:on|from|soon|every|weekly|monthly|\d)\b",
    r"\b(?:curriculum|syllabus)\s*:\s*",
    r"\bcourse\s+duration\s*:\s*\d+\s*(?:weeks?|months?|days?|hours?)\b",
    r"\blimited\s+seats?\s+(?:available|remaining)\b",
    r"\b(?:training|internship)\s+cum\s+placement\b",
    r"\btraining-cum-placement\b",
    # Scam / fake placement offers
    r"\bpay\s+(?:for\s+)?(?:laptop|equipment|offer\s+letter|interview|id\s+card|gate\s+pass)\b",
    r"\bdeposit\s+for\s+(?:laptop|assets?|tools?|id\s+card|equipment)\b",
    r"\b(?:laptop|equipment|assets?)\s+deposit\b",
    # Title-level spam keywords
    r"\b(?:bootcamp|placement\s+guarantee|pay[- ]after[- ]placement)\b",
]


def _is_spam_training_program(title="", description=""):
    title_text = (title or "").lower()
    description_text = (description or "").lower()
    combined_text = f"{title_text} {description_text}"

    if any(term in title_text for term in ("bootcamp", "placement guarantee", "pay after placement", "pay-after-placement")):
        return True

    return any(re.search(pattern, combined_text, re.IGNORECASE) for pattern in SPAM_TRAINING_PATTERNS)


def _is_company_or_mentor_sentence(sentence: str) -> bool:
    patterns = [
        r"\b(?:founded|established|in\s+business|track\s+record|history|legacy|heritage)\b",
        r"\b(?:mentors?|leaders?|leadership|managers?|seniors?|team)\b",
        r"\b(?:we|our\s+company|our\s+team|our\s+firm|company)\s+(?:has|have)\s+\d+\+?\s*years?\b",
        r"\b(?:over|more\s+than)\s+\d+\+?\s*years?\s+(?:of\s+)?(?:experience|expertise|history|service|legacy|heritage)\s+(?:delivering|providing|serving|building|in\s+business|across)\b",
        r"\b(?:over|more\s+than)\s+(?:1\d|[2-9]\d)\s*\+?\s*years?\s+(?:of\s+)?(?:experience|expertise|history|service|legacy|heritage)\b",
        r"\b(?:with\s+over|with\s+more\s+than|bringing)\s+\d+\+?\s*years?\s+(?:of\s+)?(?:experience|expertise)\b",
    ]
    return any(re.search(p, sentence, re.IGNORECASE) for p in patterns)


SENIOR_TITLE_PATTERN = re.compile(
    r"\b(senior|sr\.?|principal|staff|architect|director|vp|vice\s+president|head\s+of)\b"
    r"|\blead\b(?!\s+(?:gen(?:eration|erator)|trainee)\b)"
    r"|\bmanager\b(?!\s+trainee\b)",
    re.IGNORECASE,
)


def _clean_job_description(text):
    text_clean = text or ""

    sentences = re.split(r"[\.\n;]", text_clean)
    filtered = [s for s in sentences if not _is_company_or_mentor_sentence(s)]
    text_clean = " . ".join(filtered)

    # 1. Company founding, age, and general tenure
    text_clean = re.sub(
        r"\b(?:founded|established|operating|started)\s+(?:in\s+\d{4}\s*)?(?:\([^)]*\)\s*)?(?:about|around|approx(?:\.|imately)?|over|nearly)?\s*\d+\+?\s*years?\s*ago\b",
        " ",
        text_clean,
        flags=re.IGNORECASE,
    )
    text_clean = re.sub(
        r"\b\d+\+?\s*years?\s*ago\b",
        " ",
        text_clean,
        flags=re.IGNORECASE,
    )
    text_clean = re.sub(
        r"\b\d+\+?\s*years?[\s-]old\s+(?:startup|company|firm|organization|business)\b",
        " ",
        text_clean,
        flags=re.IGNORECASE,
    )
    text_clean = re.sub(
        r"\b(?:over|more than|\+)?\s*\d+\+?\s*years?\s+in\s+(?:the\s+)?(?:business|market|industry|it\s+market)\b",
        " ",
        text_clean,
        flags=re.IGNORECASE,
    )
    text_clean = re.sub(
        r"\b\d+\+?\s*years?\s+(?:in\s+business|in\s+the\s+market|of\s+(?:industry|market|business|domain|proven|excellence|innovation|delivering|providing|serving|combined|legacy|heritage))\b[^\n.,]*",
        " ",
        text_clean,
        flags=re.IGNORECASE,
    )
    text_clean = re.sub(
        r"\b(?:we\s+have|our\s+company\s+has|our\s+firm\s+has|our\s+team\s+has|with\s+over|with\s+more\s+than|bringing\s+over|bringing)\s+\d+\+?\s*years?\s+(?:of\s+)?(?:experience|expertise|history|excellence|combined)?\b[^\n.,]*",
        " ",
        text_clean,
        flags=re.IGNORECASE,
    )
    text_clean = re.sub(
        r"\bfor\s+(?:over|more than|\+)?\s*\d+\+?\s*years?\b",
        " ",
        text_clean,
        flags=re.IGNORECASE,
    )
    text_clean = re.sub(
        r"\b(?:has|have)\s+\d+\+?\s*years?\s+(?:of\s+)?(?:experience|expertise)\s+in\b[^\n.,]*",
        " ",
        text_clean,
        flags=re.IGNORECASE,
    )

    # 2. Education duration / graduation recency
    text_clean = re.sub(
        r"\b(?:within|in)\s+(?:the\s+)?(?:last|past)\s*\d+\s*years?\b",
        " ",
        text_clean,
        flags=re.IGNORECASE,
    )
    text_clean = re.sub(
        r"\bpast\s+\d+\s*years?\b",
        " ",
        text_clean,
        flags=re.IGNORECASE,
    )
    text_clean = re.sub(
        r"\b\d+[\s-]years?\s+(?:integrated\s+)?(?:degree|bachelor|program|course|diploma|m\.?tech|b\.?tech|graduation)\b",
        " ",
        text_clean,
        flags=re.IGNORECASE,
    )

    # 3. Mentorship and organizational reporting context
    text_clean = re.sub(
        r"\b(?:mentored|coached|guided|trained|supported)\s+by\s+[^\n.,;]+",
        " ",
        text_clean,
        flags=re.IGNORECASE,
    )
    text_clean = re.sub(
        r"\b(?:work|working)\s+(?:closely\s+)?(?:with|alongside)\s+(?:a\s+|an\s+)?(?:senior|lead|principal|staff|experienced|expert|veteran)[^\n.,;]*",
        " ",
        text_clean,
        flags=re.IGNORECASE,
    )
    text_clean = re.sub(
        r"\b(?:report|reports|reporting)\s+(?:directly\s+)?to\s+[^\n.,;]+",
        " ",
        text_clean,
        flags=re.IGNORECASE,
    )
    text_clean = re.sub(
        r"\b(?:learn|learning)\s+from\s+[^\n.,;]+",
        " ",
        text_clean,
        flags=re.IGNORECASE,
    )
    text_clean = re.sub(
        r"\bmentors?\s+who\s+have\s+[^\n.,;]+",
        " ",
        text_clean,
        flags=re.IGNORECASE,
    )
    text_clean = re.sub(
        r"\bmentors?\s+with\s+[^\n.,;]+",
        " ",
        text_clean,
        flags=re.IGNORECASE,
    )

    return text_clean


def _extract_job_title(job_description, explicit_title=""):
    title = (explicit_title or "").strip()
    if title:
        return title

    desc = job_description or ""
    title_match = re.search(
        r"^(?:job\s+title|title|role|position)\s*[:\-]\s*(.+)$",
        desc,
        flags=re.MULTILINE | re.IGNORECASE,
    )
    if title_match:
        return title_match.group(1).strip()

    lines = [line.strip() for line in desc.splitlines() if line.strip()]
    if lines:
        first_line = lines[0]
        if (
            len(first_line) <= 60
            and not first_line.endswith((".", "!", "?"))
            and not re.search(
                r"\b(we|you|our|looking|hiring|seeking|welcome|responsibilities|requirements|about)\b",
                first_line,
                re.IGNORECASE,
            )
        ):
            return first_line

    return ""


def is_fresher_job(title, description=""):
    resolved_title = _extract_job_title(description, title)
    if resolved_title and SENIOR_TITLE_PATTERN.search(resolved_title):
        return False

    clean_text = _clean_job_description(description)

    # 1. Range requirements (e.g. 0-3 years, 1-3 years, 3-5 years)
    ranges = re.findall(
        r"(?<![-–—\d])(\d+)\s*(?:to|-|\u2013|\u2014)\s*(\d+)\s*(?:years?|yrs?|yoe)\b",
        clean_text,
        re.IGNORECASE,
    )
    for min_str, _ in ranges:
        if int(min_str) > 2:
            return False

    # 2. Plus requirements (e.g. 3+ years, 5+ years)
    plus_matches = re.findall(
        r"(?<![-–—\d])(\d+)\s*\+\s*(?:years?|yrs?|yoe)\b",
        clean_text,
        re.IGNORECASE,
    )
    for yr in plus_matches:
        if int(yr) >= 3:
            return False

    # 3. Minimum / at least requirements (e.g. Minimum 3 years)
    min_matches = re.findall(
        r"\b(?:minimum|at least|min\.?)\s*(\d+)\s*(?:years?|yrs?|yoe)\b",
        clean_text,
        re.IGNORECASE,
    )
    for yr in min_matches:
        if int(yr) >= 3:
            return False

    # 4. Explicit candidate single requirements of 4+ years
    single_matches = re.findall(
        r"(?<![-–—\d])(\d+)\s*(?:years?|yrs?|yoe)\b(?:\s+(?:of\s+[\w\s]{0,25})?(?:experience|exp))?",
        clean_text,
        re.IGNORECASE,
    )
    for yr in single_matches:
        if int(yr) >= 4:
            return False

    return True


def normalize_tavily_job(result):
    raw_title = (result.get("title") or "").strip()
    url = (result.get("url") or "").strip()
    content = (result.get("content") or "").strip()

    if not is_job_page(url, raw_title, content):
        return None

    if _is_spam_training_program(raw_title, content):
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
        if _is_spam_training_program(job["title"], job.get("description", "")):
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
    api_key = (os.getenv("SERPAPI_API_KEY") or "").strip()
    if not api_key:
        return [], "SerpAPI is not configured on the server."

    try:
        response = requests.get(
            "https://serpapi.com/search.json",
            params={"engine": "google_jobs", "q": query, "api_key": api_key},
            timeout=20,
        )
        response.raise_for_status()
        data = response.json()
    except Exception as exc:
        return [], f"SerpAPI search failed: {exc}"

    jobs = []
    for result in data.get("jobs_results", []):
        job = _normalize_serpapi_job(result)
        if job:
            jobs.append(job)

    warning = None if jobs else "SerpAPI found no likely fresher job pages."
    return jobs, warning


def search_tavily(query):
    api_key = (os.getenv("TAVILY_API_KEY") or os.getenv("TAVILY_SEARCH_API_KEY") or "").strip()
    if not api_key:
        return [], "Tavily is not configured on the server."

    try:
        from tavily import TavilyClient
    except ImportError:
        return [], "tavily-python is not installed on the server."

    try:
        os.environ["TAVILY_API_KEY"] = api_key
        client = TavilyClient(api_key=api_key)
        response = client.search(
            query=query,
            search_depth="advanced",
            max_results=10,
            include_domains=TRUSTED_JOB_DOMAINS,
        )
    except Exception as exc:
        return [], f"Tavily search failed: {exc}"

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

    if _is_spam_training_program(title, description):
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
