import json
import logging
import os
import re
import urllib.request
import urllib.error
from typing import Any

from pydantic import BaseModel, Field
from services.skill_extractor import SkillExtractor
from services.resume_tailoring_service import find_unsupported_claims

logger = logging.getLogger(__name__)

ACTION_VERB_MAP = {
    r"\b(?:made|built|coded)\b": "Engineered",
    r"\b(?:worked on|helped with)\b": "Collaborated on developing",
    r"\b(?:created|did)\b": "Architected and implemented",
    r"\b(?:used|handled)\b": "Leveraged",
    r"\b(?:improved|sped up)\b": "Optimized performance of",
    r"\b(?:fixed|debugged)\b": "Diagnosed and resolved critical issues in",
    r"\b(?:tested|checked)\b": "Validated and automated testing for",
}


class TailoredBulletItem(BaseModel):
    original: str
    rewritten: str
    star_focus: str = Field(default="Action")
    skills_highlighted: list[str] = Field(default_factory=list)


class TailoredResumeResponse(BaseModel):
    summary: str | None = None
    tailored_bullets: list[TailoredBulletItem] = Field(default_factory=list)
    full_content: str
    changes_made: list[str] = Field(default_factory=list)


def truth_guard_check(original_text: str, candidate_text: str) -> tuple[bool, list[str]]:
    """Verify candidate text does not hallucinate new tools, skills, or quantitative metrics."""
    unsupported = find_unsupported_claims(original_text, candidate_text)
    reasons = []
    if unsupported["skills"]:
        reasons.append("Unsupported skills: " + ", ".join(unsupported["skills"]))
    if unsupported["numbers"]:
        reasons.append("Unsupported numbers: " + ", ".join(unsupported["numbers"]))

    is_safe = len(reasons) == 0
    return is_safe, reasons


def tailor_resume_with_ai(
    resume_text: str,
    instruction: str,
    job_description: str = "",
) -> TailoredResumeResponse:
    """Tailor resume text adhering strictly to the student's authentic claims using Gemini or deterministic fallback."""
    extractor = SkillExtractor()
    original_skills, _ = extractor.extract_skills(resume_text)

    # 1. Attempt Gemini LLM call if API key configured and reachable
    api_key = os.getenv("GOOGLE_API_KEY")
    if api_key and not _is_unsupported_claim_request(instruction, original_skills):
        llm_result = _call_gemini_tailor(resume_text, instruction, job_description, api_key)
        if llm_result:
            is_safe, _ = truth_guard_check(resume_text, llm_result.full_content)
            if is_safe:
                return llm_result

    # 2. Deterministic truth-guarded STAR enhancement fallback
    return _deterministic_star_tailor(resume_text, instruction, job_description, original_skills)


def _is_unsupported_claim_request(instruction: str, original_skills: list[str]) -> bool:
    extractor = SkillExtractor()
    instruction_skills, _ = extractor.extract_skills(instruction)
    unsupported_skills = set(instruction_skills) - set(original_skills)
    trigger_words = ("add", "claim", "include", "mention", "say i have")
    return bool(unsupported_skills and any(w in instruction.lower() for w in trigger_words))


def _call_gemini_tailor(
    resume_text: str,
    instruction: str,
    job_description: str,
    api_key: str,
) -> TailoredResumeResponse | None:
    system_prompt = (
        "You are an expert ATS resume coach for college students and freshers. "
        "Rewrite bullet points using the STAR method (Situation, Task, Action, Result) with strong action verbs. "
        "CRITICAL TRUTH GUARD: Use ONLY the technologies, frameworks, and metrics already present in the candidate's resume. "
        "NEVER invent metrics, percentages, tools, or experiences. Output strictly in JSON."
    )
    user_prompt = f"""
Candidate Resume:
{resume_text}

Target Job Description:
{job_description or "General Software Engineering / Entry Level Tech"}

Student Instruction:
{instruction}

Respond with a JSON object adhering to this schema:
{{
  "summary": "optional brief professional summary if requested or relevant",
  "tailored_bullets": [
    {{
      "original": "original bullet",
      "rewritten": "rewritten STAR bullet using strong action verbs",
      "star_focus": "Action or Result",
      "skills_highlighted": ["Python", "FastAPI"]
    }}
  ],
  "full_content": "the complete rewritten resume text containing all sections and enhanced bullets",
  "changes_made": ["Enhanced action verbs in backend project", "Restructured bullets using STAR methodology"]
}}
"""
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": system_prompt + "\n\n" + user_prompt}
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "response_mime_type": "application/json",
        },
    }
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")

    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            if response.status == 200:
                raw_body = response.read().decode("utf-8")
                res_json = json.loads(raw_body)
                content_text = res_json["candidates"][0]["content"]["parts"][0]["text"]
                parsed_dict = json.loads(content_text)
                return TailoredResumeResponse(**parsed_dict)
    except Exception as err:
        logger.debug(f"Gemini API invocation skipped/failed: {err}")
        return None


def _deterministic_star_tailor(
    resume_text: str,
    instruction: str,
    job_description: str,
    original_skills: list[str],
) -> TailoredResumeResponse:
    lines = [line.strip() for line in resume_text.splitlines() if line.strip()]
    rewritten_lines = []
    tailored_bullets = []
    changes = []

    extractor = SkillExtractor()
    job_skills, _ = extractor.extract_skills(job_description) if job_description else ([], {})
    matched_skills = [s for s in original_skills if s in job_skills]

    for line in lines:
        new_line = line
        # Enhance verbs if it looks like an experience or project bullet
        is_bullet = line.startswith(("-", "*", "•")) or any(s in line.lower() for s in original_skills)
        if is_bullet:
            for pattern, replacement in ACTION_VERB_MAP.items():
                if re.search(pattern, new_line, flags=re.IGNORECASE):
                    new_line = re.sub(pattern, replacement, new_line, count=1, flags=re.IGNORECASE)
                    break

            if new_line != line:
                tailored_bullets.append(
                    TailoredBulletItem(
                        original=line,
                        rewritten=new_line,
                        star_focus="Action",
                        skills_highlighted=[s for s in original_skills if s.lower() in new_line.lower()],
                    )
                )

        rewritten_lines.append(new_line)

    full_content = "\n".join(rewritten_lines)
    if tailored_bullets:
        changes.append(f"Enhanced {len(tailored_bullets)} bullet points with industry-standard STAR action verbs.")
    if matched_skills:
        changes.append(f"Highlighted alignment for job skills: {', '.join(matched_skills)}.")
    else:
        changes.append("Structured resume evidence for maximum ATS readability.")

    return TailoredResumeResponse(
        summary=None,
        tailored_bullets=tailored_bullets,
        full_content=full_content,
        changes_made=changes,
    )
