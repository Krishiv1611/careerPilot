from typing import Dict, Any
from services.skill_extractor import SkillExtractor

def skill_mapping_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extracts skills from resume text using keyword + regex + semantic.
    """

    text = state["resume_text"]
    
    # Check if we already have skills (passed from frontend)
    if state.get("extracted_skills") and len(state.get("extracted_skills")) > 0:
        print(f"[SkillMapping] Skipping extraction, using provided skills.")
        return {
            "extracted_skills": state["extracted_skills"],
            "skill_categories": state.get("skill_categories", {})
        }

    extractor = SkillExtractor()
    skills, categories = extractor.extract_skills(text)

    # Auto-generate search query if missing
    updates = {
        "extracted_skills": skills,
        "skill_categories": categories
    }

    if not state.get("search_query"):
        try:
            # Use LLM to generate a better search query
            from langchain_google_genai import ChatGoogleGenerativeAI
            from langchain_core.prompts import PromptTemplate
            from langchain_core.output_parsers import StrOutputParser

            google_api_key = state.get("google_api_key")
            if google_api_key:
                llm = ChatGoogleGenerativeAI(
                    model="gemini-2.5-flash-lite",
                    temperature=0.3,
                    google_api_key=google_api_key
                )
                
                prompt = PromptTemplate(
                    input_variables=["skills"],
                    template="""
                    You are an expert recruiter. Based on these skills, generate a SINGLE, concise job search query for Google Jobs.
                    Focus on the most important technical roles.
                    
                    Skills: {skills}
                    
                    Return ONLY the query string (e.g., "Senior Python Developer Jobs"). Do not add quotes or explanations.
                    """
                )
                
                chain = prompt | llm | StrOutputParser()
                
                # Use top 10 skills for context
                top_skills = skills[:10] if skills else ["General"]
                query = chain.invoke({"skills": ", ".join(top_skills)})
                
                # Clean up query
                query = query.strip().replace('"', '')
                if not query.lower().endswith("jobs"):
                    query += " Jobs"
                    
                updates["search_query"] = query
                print(f"[SkillMapping] LLM Auto-generated query: {updates['search_query']}")
            else:
                raise Exception("No Google API Key")
                
        except Exception as e:
            print(f"[SkillMapping] LLM query generation failed: {e}")
            # Fallback to simple join
            top_skills = skills[:3] if skills else ["General"]
            updates["search_query"] = " ".join(top_skills) + " Jobs"
            print(f"[SkillMapping] Fallback Auto-generated query: {updates['search_query']}")

    return updates

