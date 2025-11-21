import streamlit as st
from utils.api import run_careerpilot
from utils.state import init_state

init_state()

st.title("🤖 Run CareerPilot AI")

if not st.session_state.resume_id:
    st.error("Upload your resume first!")
    st.stop()

if not st.session_state.job_id:
    st.error("Select a job first!")
    st.stop()

search_query = st.text_input("Optional: Job Search Query", value="backend developer")

if st.button("Run AI Pipeline"):
    payload = {
        "resume_id": st.session_state.resume_id,
        "job_id": st.session_state.job_id,
        "search_query": search_query
    }

    st.write("Running CareerPilot AI…")
    result = run_careerpilot(payload)

    st.success("Pipeline Completed!")
    st.json(result)
