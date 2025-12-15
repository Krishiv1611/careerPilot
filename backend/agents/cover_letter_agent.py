from typing import Dict, Any
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
import os



def cover_letter_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Cover Letter Agent (Gemini)
    Generates a tailored, ATS-friendly, professional cover letter.
    """

    resume_text = state.get("resume_text", "")
    improved_resume = state.get("improved_resume", resume_text)
    jd_text = state.get("job_description", "")
    extracted_skills = state.get("extracted_skills", [])
    missing_skills = state.get("missing_skills", [])
    fit_explanation = state.get("fit_explanation", "")

    if not jd_text:
        return {"cover_letter": ""}

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
        temperature=0.25,
        max_output_tokens=900,
        response_mime_type="text/plain",
        google_api_key=google_api_key
    )

    # -----------------------------------------
    # Prompt Template
    # -----------------------------------------
    prompt = PromptTemplate(
        input_variables=[
            "resume_text",
            "improved_resume",
            "jd_text",
            "extracted_skills",
            "missing_skills",
            "fit_explanation"
        ],
        template="""
You are an expert career writer. Write a polished, persuasive, and ATS-friendly cover letter.

STRICT RULES:
- Do NOT invent fake experience, positions, or degrees.
- Do NOT create a fake company name or job title not present in the JD.
- Use ONLY strengths clearly visible in the resume.
- You MAY highlight achievements from the resume in more polished wording.
- Naturally align the letter with the Job Description.
- Mention technical + soft skills appropriately.
- Address missing skills politely (e.g., “I am actively strengthening my cloud skills…”).
- Keep it concise: 3–5 paragraphs.
- Use a professional, confident tone.
- No markdown, no titles, no section headers.
- START with: “Dear Hiring Manager,”
- END with a professional closing, such as “Sincerely,” or “Warm regards,”.

DATA FOR WRITING:

RESUME (RAW):
{resume_text}

IMPROVED RESUME:
{improved_resume}

JOB DESCRIPTION:
{jd_text}

CANDIDATE SKILLS:
{extracted_skills}

MISSING SKILLS:
{missing_skills}

FIT ANALYSIS:
{fit_explanation}

Write the final cover letter below:
"""
    )

    chain = prompt | llm | StrOutputParser()

    # Generate
    letter = chain.invoke({
        "resume_text": resume_text,
        "improved_resume": improved_resume,
        "jd_text": jd_text,
        "extracted_skills": extracted_skills,
        "missing_skills": missing_skills,
        "fit_explanation": fit_explanation,
    })

    return {"cover_letter": letter.strip()}

