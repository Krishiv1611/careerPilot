from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Dict
import numpy as np


class TFIDFSearch:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(stop_words="english")
        self.job_texts = []
        self.job_ids = []
        self.matrix = None

    def index_jobs(self, jobs: List[Dict]):
        """
        jobs = [ { "id": ..., "title": ..., "description": ... } ]
        """
        self.job_ids = [job["id"] for job in jobs]
        self.job_texts = [
            job["title"] + " " + job["description"] for job in jobs
        ]

        self.matrix = self.vectorizer.fit_transform(self.job_texts)

    def search(self, query: str, top_k=10):
        if self.matrix is None:
            raise RuntimeError("No jobs indexed in TF-IDF model")

        query_vec = self.vectorizer.transform([query])
        scores = cosine_similarity(query_vec, self.matrix).flatten()

        top_indices = np.argsort(scores)[::-1][:top_k]

        results = []
        for idx in top_indices:
            results.append({
                "job_id": self.job_ids[idx],
                "score": float(scores[idx])
            })

        return results
