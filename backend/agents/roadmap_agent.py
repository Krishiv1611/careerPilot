# backend/agents/roadmap_agent.py

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field
from typing import List

class RoadmapStep(BaseModel):
    step_number: int = Field(description="The sequence number of the step")
    title: str = Field(description="Title of the milestone or step")
    description: str = Field(description="Detailed description of what to do in this step")
    resources: List[str] = Field(description="List of recommended resources (courses, books, docs) for this step")
    estimated_time: str = Field(description="Estimated time to complete this step (e.g., '2 weeks')")

class RoadmapOutput(BaseModel):
    roadmap: List[RoadmapStep] = Field(description="List of steps in the roadmap")

def generate_roadmap(resume_text: str, job_description: str, google_api_key: str):
    """
    Generates a structured career roadmap based on the gap between resume and JD.
    """
    
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        temperature=0.3,
        google_api_key=google_api_key
    )

    parser = JsonOutputParser(pydantic_object=RoadmapOutput)

    prompt = PromptTemplate(
        template="""
        You are an expert career coach and technical mentor.
        Your task is to create a detailed, step-by-step learning roadmap for a candidate to bridge the gap between their current skills (Resume) and the target job requirements (Job Description).

        RESUME:
        {resume_text}

        JOB DESCRIPTION:
        {job_description}

        INSTRUCTIONS:
        1. Analyze the gaps between the resume and the job description.
        2. Create a structured roadmap to fill these gaps and master the required skills.
        3. If the candidate is already a good fit, focus on advanced topics or "first 90 days" on the job.
        4. Break it down into logical steps (e.g., "Learn React Basics", "Master Advanced State Management").
        5. For each step, provide specific resources (names of courses, documentation links, or book titles).
        6. Provide a realistic time estimate for each step.
        7. The output MUST be a valid JSON object matching the specified format.

        {format_instructions}
        """,
        input_variables=["resume_text", "job_description"],
        partial_variables={"format_instructions": parser.get_format_instructions()}
    )

    chain = prompt | llm | parser

    try:
        result = chain.invoke({
            "resume_text": resume_text,
            "job_description": job_description
        })
        return result
    except Exception as e:
        print(f"Error generating roadmap: {e}")
        raise e
