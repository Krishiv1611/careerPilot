# utils/api.py
import requests

BASE_URL = "http://127.0.0.1:8000"

def upload_resume(file):
    files = {"file": (file.name, file, "application/pdf")}
    res = requests.post(f"{BASE_URL}/resume/upload", files=files)
    return res.json()

def add_job(job_data):
    res = requests.post(f"{BASE_URL}/jobs/add", json=job_data)
    return res.json()

def run_careerpilot(payload):
    res = requests.post(f"{BASE_URL}/careerpilot/analyze", json=payload)
    return res.json()

def get_jobs():
    res = requests.get(f"{BASE_URL}/jobs/all")
    return res.json()

def get_applications():
    res = requests.get(f"{BASE_URL}/applications/all")
    return res.json()

def get_job_by_id(job_id):
    """Get a specific job by ID"""
    jobs = get_jobs()
    for job in jobs:
        if job.get("id") == job_id:
            return job
    return None
