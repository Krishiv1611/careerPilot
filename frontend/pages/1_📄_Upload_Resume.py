import streamlit as st
from utils.api import upload_resume
from utils.state import init_state

init_state()

st.title("📄 Upload Resume")

uploaded_file = st.file_uploader("Upload your resume (PDF only)", type=["pdf"])

if uploaded_file:
    st.write("Uploading...")
    result = upload_resume(uploaded_file)

    if "id" in result:
        st.success("Resume uploaded successfully!")
        st.session_state.resume_id = result["id"]
        st.json(result)
    else:
        st.error("Upload failed")
