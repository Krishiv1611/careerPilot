from typing import Dict, Any
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
import os


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
    # -----------------------------------------
    # Gemini model
    # -----------------------------------------
    google_api_key = state.get("google_api_key")
    if not google_api_key:
        raise ValueError("Google API Key not found in state")

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        temperature=0.15,
        max_output_tokens=1500,
        response_mime_type="text/plain",     # We want raw text
        google_api_key=google_api_key
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
You are an expert Resume Writer and Career Coach. Your task is to rewrite the candidate's resume to be **ATS-Optimized** and **highly relevant** to the target Job Description, while adhering to **STRICT TRUTHFULNESS**.

INPUT DATA:
-----------
CURRENT RESUME:
{resume_text}

JOB DESCRIPTION:
{jd_text}

MISSING SKILLS (Integrate ONLY if supported by context):
{missing_skills}

FIT ANALYSIS:
{fit_explanation}

--------------------------------------------------
CRITICAL RULES (ZERO HALLUCINATION):
1. **NO FAKE INFO**: Do NOT invent companies, job titles, dates, or degrees. Do NOT add specific numbers (e.g., "increased by 20%") unless they are in the original text.
2. **NO FAKE SKILLS**: Do NOT list skills the candidate clearly doesn't have.
3. **KEYWORD OPTIMIZATION**: You MUST integrate relevant keywords from the JD into the bullet points where semantically appropriate. This is CRITICAL for ATS scoring.
4. **REPHRASE & ALIGN**: Rewrite bullet points to match the JD's tone and terminology. If the JD asks for "Cross-functional collaboration" and the resume says "Worked with other teams", change it to "Collaborated cross-functionally with engineering and design teams".
5. **STRONG VERBS**: Start every bullet with a strong action verb (e.g., Engineered, Developed, Spearheaded, Optimized).
6. **ATS FORMAT**: Output a clean, plain-text resume. Use standard sections: SUMMARY, EXPERIENCE, SKILLS, EDUCATION, PROJECTS. No fancy markdown tables or icons.

GOAL:
Produce a significantly improved version of the resume that utilizes the exact language and keywords from the JD to maximize the ATS score, while remaining 100% truthful to the candidate's actual experience.

OUTPUT:
Produce ONLY the improved resume text.
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

