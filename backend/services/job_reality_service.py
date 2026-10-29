import re

from services.skill_extractor import SkillExtractor

BURNOUT_PATTERNS = [
    (r"\bwork\s+hard[,\s]+play\s+hard\b", "Toxic 'work hard, play hard' culture flag"),
    (r"\bwear\s+many\s+hats\b", "Role boundary ambiguity ('wear many hats')"),
    (r"\bweekend\s+availability\b", "Weekend availability required"),
    (r"\bcrunch\s+time\b", "Unstructured crunch time expectations"),
    (r"\b(?:rockstar|ninja|wizard|guru)\b", "Vague 'rockstar/ninja' expectations often hiding understaffing"),
    (r"\b24\s*/?\s*7\s+(?:availability|support|on[- ]call)\b", "24/7 round-the-clock availability requirement"),
    (r"\burgent\s+hiring\b", "Urgent hiring pressure signal"),
]

DISGUISED_ROLE_PATTERNS = [
    (r"\b(?:cold\s+calling|telecalling|telesales)\b", "Disguised telemarketing/cold calling task"),
    (r"\b(?:lead\s+generation|business\s+development\s+executive)\b", "Non-engineering lead generation responsibilities"),
    (r"\bdoor\s+to\s+door\b", "Field sales / door-to-door solicitation"),
    (r"\b100%\s*commission\b|\bcommission\s+based\s+pay\b", "Unsalaried / 100% commission compensation"),
    (r"\bperformance\s+based\s+(?:stipend|pay)\s+after\b", "Deferred / unpaid trial period disguised as a role"),
]

GREEN_FLAG_PATTERNS = [
    (r"\b(?:mentored|mentorship|guidance)\s+by\s+senior\b", "Structured senior engineering mentorship"),
    (r"\bhealth\s+insurance\b", "Standard comprehensive health benefits"),
    (r"\bflexible\s+(?:working\s+hours|hours|schedule)\b", "Flexible work schedule"),
    (r"\blearning\s+(?:budget|and\s+development|stipend)\b", "Dedicated learning & development support"),
]


def audit_job_reality(title: str, description: str, company: str = "") -> dict:
    """Audit a job posting for ghost job signals, tech stack overload, burnout culture, and disguised roles."""
    text = f"{title} {description}".lower()
    red_flags = []
    green_flags = []

    score = 85

    # 1. Disguised Role & Unpaid Trial Check
    for pattern, desc in DISGUISED_ROLE_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            red_flags.append(desc)
            score -= 35

    # 2. Burnout & Culture Check
    burnout_count = 0
    for pattern, desc in BURNOUT_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            red_flags.append(desc)
            burnout_count += 1
            score -= 12

    # 3. Tech Stack Overload Check
    extractor = SkillExtractor()
    extracted_skills, _ = extractor.extract_skills(description)
    if len(extracted_skills) >= 10:
        red_flags.append(
            f"Tech stack overload: {len(extracted_skills)} disparate technologies required for an entry-level title."
        )
        score -= 25
    elif len(extracted_skills) <= 6 and len(extracted_skills) >= 2:
        green_flags.append("Focused, realistic technology requirements for an early-career engineer.")

    # 4. Mentorship & Health Signals
    for pattern, desc in GREEN_FLAG_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            green_flags.append(desc)
            score += 5

    # 5. Ghost Job & Stale Indicators
    ghost_risk = "Low"
    if score < 50:
        ghost_risk = "High"
    elif score < 70 or burnout_count >= 2:
        ghost_risk = "Moderate"

    final_score = max(10, min(100, score))

    if final_score >= 75:
        verdict = "High Quality"
    elif final_score >= 50:
        verdict = "Proceed with Caution"
    else:
        verdict = "High-Risk Post"

    return {
        "role_health_score": final_score,
        "health_verdict": verdict,
        "red_flags": red_flags,
        "green_flags": green_flags,
        "ghost_job_risk": ghost_risk,
    }
