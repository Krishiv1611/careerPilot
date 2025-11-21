from typing import Dict, Any
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
import os
if not os.getenv("GOOGLE_API_KEY"):
    raise ValueError("GOOGLE_API_KEY not found in environment.")

from services.resume_formatter import ResumeFormatter


def resume_improver_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Resume Improver Agent (Gemini)
    ------------------------------
    Uses Gemini to rewrite / polish the resume so it matches the JD better,
    while following strict rules:
        - No fake experience
        - No invented job titles
        - No fake achievements or certifications
        - Only rephrasing, restructuring, clarifying
        - Add missing skills ONLY if supported by resume context
        - ATS-friendly, clean formatting
    """

    resume_text = state.get("resume_text", "")
    jd_text = state.get("job_description", "")
    missing_skills = state.get("missing_skills", [])
    fit_explanation = state.get("fit_explanation", "")

    if not resume_text:
        return {"improved_resume": resume_text}

    # -----------------------------------------
    # Gemini model
    # -----------------------------------------
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash-lite",
        temperature=0.15,
        max_output_tokens=1500,
        response_mime_type="text/plain",     # We want raw text
    )

    # -----------------------------------------
    # Prompt Template
    # -----------------------------------------
    prompt = PromptTemplate(
        input_variables=[
            "resume_text",
            "jd_text",
            "missing_skills",
            "fit_explanation",
        ],
        template="""
You are an elite resume optimization engine. Rewrite the following resume so that it is more
compelling, clearer, better structured, and better aligned with the job description.

STRICT RULES:
- Do NOT invent fake experience, projects, or technologies.
- Do NOT add any new job titles, companies, dates, or degrees.
- You MAY strengthen bullet points using resume’s actual content.
- You MAY reorganize, condense, or improve clarity.
- If the resume implicitly shows a missing skill (e.g., Python coding project → add "Python" once),
  you MAY add it. Otherwise, do NOT fabricate it.
- Keep formatting ATS-friendly (no tables, columns, icons).
- Use clean bullet points.
- Prioritize clarity and alignment with job requirements.
- NO markdown formatting, just plaintext resume output.

DATA FOR IMPROVING RESUME:

---------------------------
CURRENT RESUME:
{resume_text}

---------------------------
JOB DESCRIPTION:
{jd_text}

---------------------------
MISSING SKILLS (may include only if context supports):
{missing_skills}

---------------------------
FIT ANALYSIS (use for emphasis):
{fit_explanation}

---------------------------

Produce ONLY the improved resume (plain text).
"""
    )

    chain = prompt | llm | StrOutputParser()

    improved_raw = chain.invoke({
        "resume_text": resume_text,
        "jd_text": jd_text,
        "missing_skills": missing_skills,
        "fit_explanation": fit_explanation,
    })

    # -----------------------------------------
    # Format + clean output
    # -----------------------------------------
    improved_resume = ResumeFormatter.format_resume(improved_raw)

    return {"improved_resume": improved_resume}

