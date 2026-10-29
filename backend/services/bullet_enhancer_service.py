import re

STRONG_ACTION_VERBS = {
    "worked on": "Engineered",
    "helped with": "Collaborated to design",
    "made": "Architected",
    "fixed": "Resolved",
    "responsible for": "Spearheaded",
    "handled": "Managed and deployed",
    "created": "Developed",
    "built": "Constructed and deployed",
}

TECH_PROPER_CASING = {
    "python": "Python",
    "fastapi": "FastAPI",
    "react": "React",
    "redis": "Redis",
    "docker": "Docker",
    "sql": "SQL",
    "postgres": "PostgreSQL",
    "postgresql": "PostgreSQL",
    "aws": "AWS",
    "gcp": "GCP",
    "azure": "Azure",
    "kubernetes": "Kubernetes",
    "graphql": "GraphQL",
    "typescript": "TypeScript",
    "javascript": "JavaScript",
    "node.js": "Node.js",
    "nodejs": "Node.js",
    "mongodb": "MongoDB",
    "api": "API",
    "apis": "APIs",
    "rest": "REST",
    "ci/cd": "CI/CD",
}


def enhance_bullet_star(bullet: str, target_role: str = "") -> dict:
    """Enhance a candidate bullet using the STAR (Situation, Task, Action, Result) methodology.

    Transforms weak/passive verbs into strong action verbs, injects quantified outcomes if missing,
    and formats technology names to proper casing.
    """
    raw_bullet = bullet or ""
    clean = re.sub(r"^[-*•]\s*", "", raw_bullet.strip()).rstrip(".").strip()

    if not clean:
        return {
            "original_bullet": raw_bullet,
            "enhanced_bullet": "",
            "action_verb": "",
            "metric_detected": False,
            "framework_breakdown": {
                "situation": "",
                "task": "",
                "action": "",
                "result": "",
            },
        }

    # Strip conversational pronouns like "I " or "We "
    clean = re.sub(r"^(?:I|We)\s+", "", clean, flags=re.IGNORECASE).strip()

    action_verb = "Engineered"
    enhanced = clean

    # 1. Replace weak passive openings with powerful technical action verbs
    for weak, strong in STRONG_ACTION_VERBS.items():
        if re.search(r"^" + re.escape(weak) + r"\b", clean, re.IGNORECASE):
            action_verb = strong.split()[0]
            enhanced = re.sub(r"^" + re.escape(weak) + r"\b", strong, clean, flags=re.IGNORECASE)
            break
    else:
        # If no weak verb matched, preserve/capitalize leading word
        first_word = clean.split()[0] if clean else ""
        if first_word.lower() in ["i", "we"]:
            enhanced = "Engineered " + " ".join(clean.split()[1:])
            action_verb = "Engineered"
        else:
            action_verb = first_word.capitalize()
            words = clean.split()
            enhanced = action_verb + (" " + " ".join(words[1:]) if len(words) > 1 else "")

    # 2. Check for metric presence (percentages, multipliers, latency, numbers)
    has_metric = bool(re.search(r"\b\d+(?:%|x|ms|s|k|m)?\b", clean, re.IGNORECASE))
    if not has_metric:
        enhanced = f"{enhanced}, reducing execution latency and improving throughput across core workflows"

    # 3. Capitalize proper nouns and tech names
    for word, proper in TECH_PROPER_CASING.items():
        enhanced = re.sub(r"\b" + re.escape(word) + r"\b", proper, enhanced, flags=re.IGNORECASE)

    if not enhanced.endswith("."):
        enhanced += "."

    return {
        "original_bullet": raw_bullet,
        "enhanced_bullet": enhanced,
        "action_verb": action_verb,
        "metric_detected": has_metric,
        "framework_breakdown": {
            "situation": f"Core engineering workflows for {target_role}" if target_role else "Core engineering workflow",
            "task": "System optimization and feature delivery",
            "action": action_verb,
            "result": "Quantified performance enhancement and metric impact" if has_metric else "Quantified performance enhancement",
        },
    }
