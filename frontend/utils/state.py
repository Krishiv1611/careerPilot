# utils/state.py
import streamlit as st

def init_state():
    if "resume_id" not in st.session_state:
        st.session_state.resume_id = None
    if "job_id" not in st.session_state:
        st.session_state.job_id = None
    if "search_query" not in st.session_state:
        st.session_state.search_query = ""
