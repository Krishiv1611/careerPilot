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
                model="gemini-2.5-flash-lite",
                temperature=0.1,
                response_mime_type="application/json",
                google_api_key=google_api_key
            )

            prompt = PromptTemplate(
                input_variables=["resume_text"],
                template="""
You are an expert ATS (Applicant Tracking System) auditor. Analyze the following resume text.

RESUME TEXT:
{resume_text}

Evaluate based on:
1. **Formatting & Structure**: Is it clean, standard sections (Experience, Education, Skills)?
2. **Keywords & Content**: Are there strong action verbs? Specific skills?
3. **Clarity**: Is it easy to read?

Return STRICT JSON:
{{
  "ats_score": number (0-100),
  "ats_report": "Markdown string with 3-5 bullet points of specific feedback."
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
