from typing import Dict, Any
import os
if not os.getenv("GOOGLE_API_KEY"):
    raise ValueError("GOOGLE_API_KEY not found in environment.")
import json

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser


def fit_score_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Compute ATS fit score using Gemini LLM + heuristics.
    Output added to state:
        - overall_fit_score
        - skill_match_score
        - missing_skills
        - fit_explanation
    """

    # -----------------------------
    # Extract from state
    # -----------------------------
    resume_text = state.get("resume_text", "")
    resume_skills = state.get("extracted_skills", [])
    job_skills = state.get("job_skills", [])
    jd_text = state.get("job_description", "")

    job_metadata = state.get("job_metadata", {})
    top_chunks = job_metadata.get("top_matching_chunks", [])
    semantic_scores = job_metadata.get("semantic_scores", [])
    avg_semantic_score = job_metadata.get("avg_semantic_score", 0.0)

    # Compute missing skills
    missing_skills = [s for s in job_skills if s not in resume_skills]

    # Simple non-LLM score to supplement LLM output
    # Return as decimal (0.0 to 1.0) instead of percentage
    skill_match_score = round(
        (1 - len(missing_skills) / max(len(job_skills), 1)), 4
    )

    # -----------------------------
    # Gemini LLM
    # -----------------------------
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash-lite",
        temperature=0.15,
        response_mime_type="application/json"
    )

    # -----------------------------
    # Prompt
    # -----------------------------
    prompt = PromptTemplate(
        input_variables=[
            "resume_skills",
            "job_skills",
            "missing_skills",
            "semantic_scores",
            "avg_semantic_score",
            "top_chunks",
            "resume_text",
            "jd_text"
        ],
        template="""
You are an ATS scoring system. Evaluate the candidate against the job.

RESUME SKILLS:
{resume_skills}

JOB SKILLS:
{job_skills}

MISSING SKILLS:
{missing_skills}

SEMANTIC MATCH SCORES:
{semantic_scores}

AVERAGE SEMANTIC MATCH:
{avg_semantic_score}

TOP RESUME CHUNKS MATCHING JD:
{top_chunks}

RESUME TEXT:
{resume_text}

JOB DESCRIPTION:
{jd_text}

Return STRICT JSON ONLY:
{{
  "fit_score": number (0-100 scale, where 0 is no match and 100 is perfect match),
  "reasoning": "...",
  "missing_skills": []
}}
"""
    )

    chain = prompt | llm | StrOutputParser()

    raw = chain.invoke({
        "resume_skills": resume_skills,
        "job_skills": job_skills,
        "missing_skills": missing_skills,
        "semantic_scores": semantic_scores,
        "avg_semantic_score": avg_semantic_score,
        "top_chunks": top_chunks,
        "resume_text": resume_text,
        "jd_text": jd_text
    })

    # -----------------------------
    # Safely parse JSON
    # -----------------------------
    try:
        data = json.loads(raw)
    except:
        s = raw.find("{")
        e = raw.rfind("}") + 1
        data = json.loads(raw[s:e])

    # -----------------------------
    # Normalize fit_score to decimal (0.0 to 1.0)
    # LLM might return 0-100 scale, so normalize it
    # -----------------------------
    fit_score_raw = float(data.get("fit_score", 0))
    
    # If score is > 1, assume it's on 0-100 scale and normalize
    if fit_score_raw > 1.0:
        overall_fit_score = round(fit_score_raw / 100.0, 4)
    else:
        overall_fit_score = round(fit_score_raw, 4)
    
    # Ensure it's between 0 and 1
    overall_fit_score = max(0.0, min(1.0, overall_fit_score))

    # -----------------------------
    # Add to state
    # -----------------------------
    return {
        "overall_fit_score": overall_fit_score,
        "skill_match_score": skill_match_score,
        "missing_skills": data.get("missing_skills", missing_skills),
        "fit_explanation": data.get("reasoning", "")
    }

