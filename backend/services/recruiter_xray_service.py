import re

FLUFF_CATALOG = {
    "hardworking": "Replace with evidence of sustained output (e.g. 'Delivered 14 features across 3 sprint cycles')",
    "passionate": "Replace with tangible project contributions or open-source commits",
    "self-starter": "Replace with autonomous initiative (e.g. 'Spearheaded migration to Docker')",
    "team player": "Replace with collaboration metrics (e.g. 'Partnered with 4 engineers in agile sprint')",
    "detail-oriented": "Replace with quality metrics (e.g. 'Achieved 98% test coverage with zero regressions')",
    "quick learner": "Replace with rapid execution (e.g. 'Mastered Go in 2 weeks to ship payment gateway')",
    "results-driven": "Replace with specific revenue, latency, or throughput metrics",
    "enthusiastic": "Replace with documented domain achievements",
    "go-getter": "Replace with proactive architectural contributions",
}

HIGH_VALUE_TECH = [
    "python", "fastapi", "docker", "kubernetes", "postgresql", "redis", "aws",
    "react", "typescript", "graphql", "kafka", "ci/cd", "microservices"
]

TECH_DISPLAY = {
    "fastapi": "FastAPI",
    "postgresql": "PostgreSQL",
    "aws": "AWS",
    "ci/cd": "CI/CD",
    "graphql": "GraphQL",
}


def analyze_recruiter_xray(resume_text: str, job_description: str = "") -> dict:
    text_lower = (resume_text or "").lower()
    fluff_found = []

    # 1. Detect Fluff Words
    for word, replacement in FLUFF_CATALOG.items():
        pattern = r"\b" + re.escape(word) + r"\b"
        matches = list(re.finditer(pattern, text_lower))
        for m in matches:
            start = max(0, m.start() - 25)
            end = min(len(resume_text), m.end() + 25)
            fluff_found.append({
                "word": word,
                "context": "..." + resume_text[start:end].strip() + "...",
                "replacement": replacement,
            })

    # 2. Extract Instant Green Flags
    green_flags = []
    for tech in HIGH_VALUE_TECH:
        if re.search(r"\b" + re.escape(tech) + r"\b", text_lower):
            display = TECH_DISPLAY.get(tech, tech.title())
            green_flags.append(display)

    # 3. Check for Quantified Metrics & Format Red Flags
    red_flags = []
    has_metrics = bool(re.search(r"\b\d+(?:%|x|ms|s|k|m)?\b", resume_text or ""))
    if not has_metrics:
        red_flags.append("Zero quantified metrics detected: Hiring managers skim for numbers first")

    if len(fluff_found) >= 3:
        red_flags.append(f"High fluff density ({len(fluff_found)} buzzwords): Dilutes technical authority")

    lines = [line.strip() for line in (resume_text or "").splitlines() if line.strip()]
    has_bullets = any(line.startswith(("-", "•", "*")) for line in lines)
    if not has_bullets and len(lines) > 5:
        red_flags.append("Wall of text: Missing clear bullet point structure for 6-second skim")

    # 4. Calculate Screen Probability
    score = 65
    score += len(green_flags) * 5
    if has_metrics:
        score += 15
    score -= len(fluff_found) * 8
    score -= len(red_flags) * 10
    screen_prob = max(15, min(95, score))

    if screen_prob >= 75:
        verdict = f"High Screen Probability ({screen_prob}%): Immediate technical authority, crisp bullets, clear impact signals."
    elif screen_prob >= 50:
        verdict = f"Moderate Screen Probability ({screen_prob}%): Solid baseline, but eliminate fluff and quantify top bullets to guarantee screen."
    else:
        verdict = f"Low Screen Probability ({screen_prob}%): Risk of immediate pass. Heavy buzzword density or unquantified claims."

    visual_hotspots = [
        {"zone": "Header & Target Title", "weight": "High (Sec 0-1)", "guidance": "Recruiter validates role match immediately"},
        {"zone": "Top 2 Work/Project Bullets", "weight": "Critical (Sec 2-4)", "guidance": "Recruiter looks for quantified technical impact"},
        {"zone": "Technical Skills Matrix", "weight": "High (Sec 5-6)", "guidance": "Recruiter scans for required stack keywords"},
    ]

    return {
        "hiring_manager_verdict": verdict,
        "screen_probability": screen_prob,
        "visual_hotspots": visual_hotspots,
        "fluff_words_detected": fluff_found,
        "instant_green_flags": green_flags[:6],
        "instant_red_flags": red_flags,
        "scan_duration_estimate_sec": 6,
    }
