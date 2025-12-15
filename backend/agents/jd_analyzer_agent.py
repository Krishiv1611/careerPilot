from typing import Dict, Any
from sqlalchemy.orm import Session

from models.job_model import Job
from services.text_cleaner import TextCleaner
from services.skill_extractor import SkillExtractor
from services.embedding import EmbeddingService


def jd_analyzer_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Job Description Analyzer Agent
    Loads JD from DB using job_id
    Extracts skills from JD
    Performs semantic matching (JD → resume_chunks)
    """

    # ----------------------------------------
    # Load DB session + job_id
    # ----------------------------------------
    db: Session = state["db"]
    # If manual JD is provided, use it directly
    if state.get("manual_jd_text"):
        jd_text = state["manual_jd_text"]
        # Dummy job object for consistency if needed, or just proceed with text
    else:
        if not job_id:
            return {
                "job_description": "",
                "job_skills": [],
                "job_metadata": {}
            }
            
        # ----------------------------------------
        # Get JD from database
        # ----------------------------------------
        job = db.query(Job).filter(Job.id == job_id).first()
    
        if not job:
            return {
                "job_description": "",
                "job_skills": [],
                "job_metadata": {}
            }
    
        jd_text = job.description

    # ----------------------------------------
    # Clean JD
    # ----------------------------------------
    cleaned_jd = TextCleaner.clean_text(jd_text)

    # ----------------------------------------
    # Extract Skills from JD
    # ----------------------------------------
    extractor = SkillExtractor()
    job_skills, _ = extractor.extract_skills(cleaned_jd)

    # ----------------------------------------
    # Semantic Matching JD ⟶ Resume Chunks
    # ----------------------------------------
    embedder = EmbeddingService(collection_name="resume_chunks")

    raw_results = embedder.vectorstore.similarity_search_with_score(
        cleaned_jd,
        k=5
    )

    top_chunks = []
    sources = []
    scores = []

    for doc, dist in raw_results:
        sim = 1 / (1 + dist)
        top_chunks.append(doc.page_content)
        sources.append(doc.metadata)
        scores.append(round(sim, 4))

    avg_score = round(sum(scores) / len(scores), 4) if scores else 0.0

    # ----------------------------------------
    # Build Metadata
    # ----------------------------------------
    job_metadata = {
        "top_matching_chunks": top_chunks,
        "chunk_sources": sources,
        "semantic_scores": scores,
        "avg_semantic_score": avg_score
    }

    return {
        "job_description": jd_text,
        "job_skills": job_skills,
        "job_metadata": job_metadata
    }

