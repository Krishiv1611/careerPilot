from typing import Dict, Any
from sqlalchemy.orm import Session

from models.job_model import Job
from services.tfidf_search import TFIDFSearch
from services.embedding import EmbeddingService
from services.text_cleaner import TextCleaner


def job_search_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Multi-strategy job search:
    1. Keyword search (TF-IDF)
    2. Semantic search (Chroma)
    3. Hybrid fusion ranking
    """

    # -----------------------------------------
    # Load query + DB session
    # -----------------------------------------
    query = state.get("search_query", "")
    if not query:
        raise ValueError("search_query missing in state")

    db: Session = state["db"]
    cleaned_query = TextCleaner.clean_for_embeddings(query)

    # -----------------------------------------
    # Load jobs from DB
    # -----------------------------------------
    jobs = db.query(Job).all()
    if not jobs:
        return {"recommended_jobs": []}

    job_dicts = [
        {
            "id": job.id,
            "title": job.title,
            "company": job.company,
            "location": job.location,
            "description": job.description,
        }
        for job in jobs
    ]

    # -----------------------------------------
    # TF-IDF keyword search
    # -----------------------------------------
    tfidf = TFIDFSearch()
    tfidf.index_jobs(job_dicts)

    keyword_results = tfidf.search(query, top_k=10)
    keyword_scores = {r["job_id"]: r["score"] for r in keyword_results}

    # Normalize
    if keyword_scores:
        mk = max(keyword_scores.values())
        if mk > 0:
            keyword_scores = {k: v / mk for k, v in keyword_scores.items()}

    # -----------------------------------------
    # Semantic Search (Chroma)
    # -----------------------------------------
    embedder = EmbeddingService(collection_name="job_chunks")

    results = embedder.vectorstore.similarity_search_with_score(cleaned_query, k=10)

    semantic_scores = {}

    for doc, dist in results:
        job_id = doc.metadata.get("job_id")
        if not job_id:
            continue

        sim = 1 / (1 + dist)
        semantic_scores[job_id] = sim

    # Normalize
    if semantic_scores:
        ms = max(semantic_scores.values())
        if ms > 0:
            semantic_scores = {k: v / ms for k, v in semantic_scores.items()}

    # -----------------------------------------
    # Hybrid Fusion Score
    # -----------------------------------------
    combined = {}
    for job in job_dicts:
        jid = job["id"]
        combined[jid] = 0.5 * keyword_scores.get(jid, 0.0) + \
                        0.5 * semantic_scores.get(jid, 0.0)

    # -----------------------------------------
    # Final Ranking
    # -----------------------------------------
    ranked = sorted(job_dicts, key=lambda j: combined.get(j["id"], 0), reverse=True)[:10]

    for job in ranked:
        job["score"] = round(combined.get(job["id"], 0), 4)

    return {"recommended_jobs": ranked}




