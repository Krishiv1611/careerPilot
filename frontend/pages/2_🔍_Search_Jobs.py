import streamlit as st
from utils.api import get_jobs
from utils.state import init_state

init_state()

st.title("🔍 Search Jobs")

jobs = get_jobs()

if not jobs:
    st.warning("No jobs in database. Add jobs via backend.")
else:
    selected = st.selectbox("Select a job", jobs, format_func=lambda j: j["title"])

    if selected:
        st.session_state.job_id = selected["id"]
        st.success(f"Selected Job: {selected['title']}")
        st.json(selected)
