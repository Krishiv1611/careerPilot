# services/embeddings.py

from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document
from typing import List
import os


class EmbeddingService:
    """
    Embedding + VectorStore using Google Generative AI (Gemini)
    with ChromaDB (LangChain wrapper).
    Supports retrievers for semantic search.
    """

    def __init__(
        self,
        api_key: str = None,
        model_name: str = "models/text-embedding-004",
        persist_dir: str = None,
        collection_name: str = "resume_chunks"
    ):
        # Use provided key or fall back to env var
        self.api_key = api_key or os.getenv("GOOGLE_API_KEY")
        
        if not self.api_key:
            # Fallback for when key is not yet available (e.g. app startup)
            # We will handle this gracefully or raise error when actually used
            print("Warning: No Google API Key provided for EmbeddingService")

        self.model = GoogleGenerativeAIEmbeddings(
            model=model_name,
            google_api_key=self.api_key
        )

        BASE_DIR = os.path.dirname(
            os.path.dirname(
                os.path.dirname(os.path.abspath(__file__))
            )
        )

        if persist_dir is None:
            persist_dir = os.path.join(BASE_DIR, "backend/data/vectorstore/chroma")

        self.persist_dir = persist_dir
        self.collection_name = collection_name

        self.vectorstore = Chroma(
            collection_name=self.collection_name,
            embedding_function=self.model,
            persist_directory=self.persist_dir
        )

    # ------------------------------------------
    # Add chunks to Chroma
    # ------------------------------------------
    def add_chunks(self, resume_id: str, chunks: List[str]):
        documents = [
            Document(
                page_content=chunk,
                metadata={"resume_id": resume_id, "chunk_index": i}
            )
            for i, chunk in enumerate(chunks)
        ]
        self.vectorstore.add_documents(documents)
        self.vectorstore.persist()

    # ------------------------------------------
    # Retriever (no scores)
    # ------------------------------------------
    def get_retriever(self, k: int = 5, score_threshold: float = None):
        return self.vectorstore.as_retriever(
            search_kwargs={
                "k": k,
                **({"score_threshold": score_threshold} if score_threshold else {})
            }
        )

    def retrieve(self, text: str, k: int = 5):
        retriever = self.get_retriever(k=k)
        return retriever.get_relevant_documents(text)

    # ------------------------------------------
    # ❗ NEW: Real semantic search WITH SCORES
    # ------------------------------------------
    def similarity_search_with_score(self, text: str, k: int = 5):
        """
        Returns list of (Document, distance)
        Distance → lower = more similar
        """
        return self.vectorstore.similarity_search_with_score(text, k=k)



