# app.py
import streamlit as st
from utils.state import init_state

st.set_page_config(page_title="CareerPilot AI", page_icon="🧭", layout="wide")
init_state()

st.title("🧭 CareerPilot AI")
st.write("Smart Job-Fit, Resume Improvement, ATS Matching – Powered by LangGraph + Gemini")
st.info("Use the left sidebar to navigate between steps.")
