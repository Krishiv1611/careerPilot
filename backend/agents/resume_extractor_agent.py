


import os
from services.pdf_reader import PDFReader
from services.embedding import EmbeddingService

def resume_extractor_agent(state):

    resume_id = state["resume_id"]
    
    # Check if we already have the text (passed from frontend)
    if state.get("resume_text"):
        print(f"[ResumeExtractor] Skipping extraction, using provided text.")
        return {
            "resume_text": state["resume_text"],
            # If these are also passed, they will be in state, but we return them to be safe/explicit
            "extracted_skills": state.get("extracted_skills", []),
            "skill_categories": state.get("skill_categories", {})
        }

    # Correct absolute path to the saved file
    file_path = os.path.join(
        os.getcwd(),
        "data",
        "resumes",
        f"{resume_id}.pdf"
    )

    if not os.path.exists(file_path):
        raise RuntimeError(f"Resume file not found at: {file_path}")

    reader = PDFReader()
    chunks = reader.extract_chunks(file_path)
    full_text = "\n".join(chunks)

    embedder = EmbeddingService(collection_name="resume_chunks")
    embedder.add_chunks(resume_id=resume_id, chunks=chunks)

    # Predict Field
    from services.resume_field_predictor import ResumeFieldPredictor
    predictor = ResumeFieldPredictor()
    category = predictor.predict(full_text)
    
    print(f"[ResumeExtractor] Predicted Category: {category}")

    return {
        "resume_text": full_text,
        "extracted_skills": [],
        "skill_categories": {},
        "resume_category": category,
        "search_query": category # Set search_query directly from prediction
    }
