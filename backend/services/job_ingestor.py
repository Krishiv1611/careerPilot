# services/job_ingestor.py

from typing import List
from services.text_cleaner import TextCleaner
from services.embedding import EmbeddingService
from langchain_text_splitters import RecursiveCharacterTextSplitter


class JobIngestor:
    """
    Service: Job Ingestion Pipeline
    - Cleans JD text
    - Chunks JD
    - Embeds chunks into Chroma with metadata { job_id, chunk_index }
    - Used when creating or updating job postings
    """

    def __init__(self, chunk_size=1500, chunk_overlap=200):
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap
        )

    def ingest_job(self, job_id: str, job_description: str):
        """
        Main method to store job description into Chroma vector DB.
        """

        # 1. Clean text
        cleaned = TextCleaner.clean_text(job_description)

        # 2. Create chunks
        chunks = self.splitter.split_text(cleaned)

        # 3. Embed chunks into Chroma under 'job_chunks'
        embedder = EmbeddingService(collection_name="job_chunks")

        docs = []
        for idx, chunk in enumerate(chunks):
            docs.append({
                "page_content": chunk,
                "metadata": {
                    "job_id": job_id,
                    "chunk_index": idx
                }
            })

        # Convert to LangChain Document objects
        from langchain_core.documents import Document
        docs = [Document(page_content=d["page_content"], metadata=d["metadata"]) for d in docs]

        embedder.vectorstore.add_documents(docs)
        embedder.vectorstore.persist()

        return {
            "num_chunks": len(chunks),
            "job_id": job_id
        }
