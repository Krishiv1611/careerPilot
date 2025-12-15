import os
import sys
from dotenv import load_dotenv

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

from agents.query_manager_agent import query_manager_agent
from agents.graph import build_careerpilot_graph
from models.database import SessionLocal
from agents.state import CareerPilotState

# Mock State
mock_state = {
    "resume_category": "Software Engineer",
    "extracted_skills": ["Python", "React", "FastAPI"],
    "google_api_key": os.getenv("GOOGLE_API_KEY"),
    "manual_jd_text": "We are looking for a Python Developer with React experience...",
    "resume_text": "Experienced Software Engineer with Python skills...",
    "db": SessionLocal()
}

def test_query_manager():
    print("\n--- Testing Query Manager ---")
    result = query_manager_agent(mock_state)
    query = result.get("search_query", "")
    print(f"Generated Query: {query}")
    
    if "site:linkedin.com" in query or "site:indeed.com" in query:
        print("✅ PASS: Query contains site-specific targeting.")
    else:
        print("❌ FAIL: Query missing site-specific targeting.")

def test_manual_flow():
    print("\n--- Testing Manual JD Flow ---")
    app = build_careerpilot_graph()
    
    # Run the graph
    # We expect it to skip search agents and go straight to analysis
    # Since we can't easily spy on internal nodes without LangSmith config in this script,
    # we'll check if we get an output "improved_resume" which implies the flow completed
    
    try:
        final_state = app.invoke(mock_state)
        if "improved_resume" in final_state and final_state["improved_resume"]:
             print("✅ PASS: Graph completed and produced improved resume.")
             print(f"Improved Resume Preview: {final_state['improved_resume'][:100]}...")
        else:
             print("❌ FAIL: Graph did not produce improved resume.")
             
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"❌ FAIL: Graph execution error: {e}")

if __name__ == "__main__":
    test_query_manager()
    # Note: test_manual_flow requires a real Google API Key to work fully, 
    # but we can at least check if it crashes or routing logic works up to a point.
    if os.getenv("GOOGLE_API_KEY"):
        test_manual_flow()
    else:
        print("Skipping full flow test due to missing GOOGLE_API_KEY")
