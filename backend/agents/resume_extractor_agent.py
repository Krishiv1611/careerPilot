


import os
from services.pdf_reader import PDFReader
from services.embedding import EmbeddingService

def resume_extractor_agent(state):

    resume_id = state["resume_id"]

    # Correct absolute path to the saved file
    file_path = os.path.join(
        os.getcwd(),
        "backend",
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

    return {
        "resume_text": full_text,
        "extracted_skills": [],
        "skill_categories": {}
    }
