from typing import Dict, Any
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
import json

class ATSService:
    @staticmethod
    def calculate_score(resume_text: str, google_api_key: str) -> Dict[str, Any]:
        """
        Calculates ATS score and generates a report for the given resume text.
        """
        if not resume_text or not google_api_key:
            return {"ats_score": 0.0, "ats_report": "Missing resume text or API key."}

        try:
            llm = ChatGoogleGenerativeAI(
                model="gemini-2.5-flash",
                temperature=0.1,
                response_mime_type="application/json",
                google_api_key=google_api_key
            )

            prompt = PromptTemplate(
                input_variables=["resume_text"],
                template="""
You are a strict, highly critical Applicant Tracking System (ATS) and expert resume auditor.
Your job is to brutally evaluate the resume text below and assign a realistic score.

RESUME TEXT:
{resume_text}

SCORING CRITERIA (0-100):
- **0-40 (Critical Fail)**: Missing essential sections (Experience, Skills), extremely short, or unintelligible.
- **41-60 (Weak)**: Generic descriptions, no measurable results, poor formatting, overuse of buzzwords ("hard worker", "team player").
- **61-75 (Average)**: Standard structure, lists duties but not achievements, lacks specific technical keywords.
- **76-89 (Strong)**: Clear structure, strong action verbs, includes some metrics/numbers, good keyword density.
- **90-100 (Exceptional)**: Perfect structure, every role has quantified achievements (e.g., "Increased revenue by 20%"), tailored technical skills, zero fluff.

INSTRUCTIONS:
1. Be critical. Do NOT give a high score (85+) unless the resume has **quantified achievements** (numbers, percentages) and specific technical depth.
2. Deduct points for: generic summaries, lack of dates, spelling errors, or vague descriptions.
3. If the resume is just a list of responsibilities without results, the score MUST be below 75.

Return STRICT JSON:
{{
  "ats_score": number (integer 0-100),
  "ats_report": "Markdown string with 3-5 bullet points of specific, actionable feedback. Focus on what is missing or weak."
}}
"""
            )

            chain = prompt | llm | StrOutputParser()
            raw = chain.invoke({"resume_text": resume_text})
            
            # Parse JSON safely
            try:
                data = json.loads(raw)
            except:
                # Fallback extraction if JSON is messy
                s = raw.find("{")
                e = raw.rfind("}") + 1
                data = json.loads(raw[s:e])

            return {
                "ats_score": float(data.get("ats_score", 0)),
                "ats_report": data.get("ats_report", "No report generated.")
            }

        except Exception as e:
            print(f"ATS Service Error: {e}")
            return {"ats_score": 0.0, "ats_report": f"Error calculating ATS score: {str(e)}"}
