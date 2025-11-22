import streamlit as st
from utils.api import upload_resume
from utils.state import init_state

init_state()

st.title("📄 Upload Resume")

uploaded_file = st.file_uploader("Upload your resume (PDF only)", type=["pdf"])

if uploaded_file:
    with st.spinner("Uploading and processing resume..."):
        result = upload_resume(uploaded_file)

    if "id" in result:
        st.success("✅ Resume uploaded successfully!")
        st.session_state.resume_id = result["id"]
        
        # Show only the raw text
        if "raw_text" in result:
            st.subheader("📝 Extracted Resume Text")
            st.text_area(
                "Resume Content",
                value=result["raw_text"],
                height=400,
                disabled=True,
                label_visibility="collapsed"
            )
            
            # Optional: Show metadata in expander
            with st.expander("ℹ️ Resume Details", expanded=False):
                st.write(f"**Resume ID:** {result.get('id')}")
                if result.get('created_at'):
                    st.write(f"**Uploaded:** {result.get('created_at')}")
        else:
            st.warning("⚠️ No text extracted from resume")
            st.json(result)
    else:
        st.error("❌ Upload failed")
        if "detail" in result:
            st.error(result["detail"])
