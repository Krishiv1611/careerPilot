from typing import Dict, Any
import os
import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field

class SearchQuery(BaseModel):
    query: str = Field(description="The optimized boolean search query")
    explanation: str = Field(description="Brief explanation of why this query was constructed")

def query_manager_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Query Manager Agent:
    Uses LLM to construct a high-quality, strict boolean search query 
    based on the resume category and extracted skills.
    
    Inputs: state["resume_category"], state["extracted_skills"]
    Outputs: updates state["search_query"]
    """
    
    print("--- QUERY MANAGER AGENT ---")
    
    resume_category = state.get("resume_category", "")
    extracted_skills = state.get("extracted_skills", [])
    
    # If we don't have a category, fall back to a generic query or existing one
    if not resume_category:
        print("No resume category found. Skipping query optimization.")
        return {}

    # Setup LLM
    api_key = state.get("google_api_key") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        print("No Google API Key. Skipping query optimization.")
        return {}
        
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        temperature=0.0,
        google_api_key=api_key,
        convert_system_message_to_human=True
    )
    
    parser = PydanticOutputParser(pydantic_object=SearchQuery)
    
    # Top 5 skills to avoid query bloat
    top_skills = extracted_skills[:5] if extracted_skills else []
    
    prompt_template = PromptTemplate(
        template="""
        You are an expert technical recruiter and search query engineer.
        Your task is to generate a STRICT boolean search query to find relevant job openings for a candidate.
        
        Candidate Profile:
        - Primary Field/Category: {category}
        - Top Skills: {skills}
        
        Goal:
        Construct a search string that:
        1. Targets specific job titles related to the "{category}".
        2. Includes 1-2 critical skills if they valid keywords (e.g. "Python", "React").
        3. MANDATORY: Includes specific intent keywords like "hiring", "jobs", "careers", "openings".
        4. MANDATORY: Excludes noise using the minus operator (e.g. -intern, -course, -tutorial, -blog, -news, -template).
        5. MANDATORY: Target specific job boards by including: (site:linkedin.com OR site:indeed.com OR site:naukri.com OR site:glassdoor.com)
        6. Returns actual job listings, NOT definitions or articles.
        
        Examples:
        - Input: Data Science, [Python, SQL]
        - Output: "Data Scientist" AND "Python" AND "jobs" (site:linkedin.com OR site:indeed.com OR site:naukri.com) -course -tutorial -internship
        
        {format_instructions}
        
        Generate the query now.
        """,
        input_variables=["category", "skills"],
        partial_variables={"format_instructions": parser.get_format_instructions()}
    )
    
    chain = prompt_template | llm | parser
    
    try:
        result = chain.invoke({
            "category": resume_category,
            "skills": ", ".join(top_skills)
        })
        
        print(f"Generated Query: {result.query}")
        
        return {
            "search_query": result.query
        }
        
    except Exception as e:
        print(f"Error in Query Manager: {e}")
        # Fallback to simple category + jobs
        fallback = f'{resume_category} "job openings" -course -tutorial'
        return {"search_query": fallback}
