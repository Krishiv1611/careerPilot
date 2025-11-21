import streamlit as st
from utils.api import get_applications
from utils.state import init_state

init_state()

st.title("📊 Application History")

apps = get_applications()

if not apps:
    st.info("No applications saved yet.")
else:
    for app in apps:
        st.subheader(f"Application ID: {app['id']}")
        st.write(f"Fit Score: {app['overall_fit_score']}")
        st.write(f"Skill Match: {app['skill_match_score']}")
        st.write(f"Missing Skills: {app['missing_skills']}")
        st.write(f"Explanation: {app['fit_explanation']}")
        st.divider()
