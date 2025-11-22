# app.py
import streamlit as st
from utils.state import init_state

st.set_page_config(
    page_title="CareerPilot AI",
    page_icon="🧭",
    layout="wide",
    initial_sidebar_state="expanded"
)

init_state()

# Custom CSS for better styling
st.markdown("""
    <style>
    .main-header {
        font-size: 3rem;
        font-weight: bold;
        text-align: center;
        margin-bottom: 1rem;
    }
    .sub-header {
        text-align: center;
        color: #666;
        margin-bottom: 2rem;
    }
    .stMetric {
        background-color: #f0f2f6;
        padding: 1rem;
        border-radius: 0.5rem;
    }
    </style>
""", unsafe_allow_html=True)

# Header
st.markdown('<h1 class="main-header">🧭 CareerPilot AI</h1>', unsafe_allow_html=True)
st.markdown('<p class="sub-header">Smart Job-Fit, Resume Improvement, ATS Matching – Powered by LangGraph + Gemini</p>', unsafe_allow_html=True)

# Quick stats
col1, col2, col3, col4 = st.columns(4)

with col1:
    st.metric("Resume", "✅ Uploaded" if st.session_state.resume_id else "❌ Not Uploaded")

with col2:
    st.metric("Job Selected", "✅ Selected" if st.session_state.job_id else "❌ Not Selected")

with col3:
    st.metric("Search Query", st.session_state.search_query or "None")

with col4:
    st.metric("SerpAPI", "🌐 Enabled" if st.session_state.use_serpapi else "❌ Disabled")

st.divider()

# Main content
st.info("👈 Use the left sidebar to navigate between steps.")

st.subheader("🚀 Quick Start Guide")
st.markdown("""
1. **📄 Upload Resume** - Upload your resume PDF
2. **🔍 Search Jobs** - Search for jobs or browse the database
3. **🤖 Run CareerPilot** - Execute the AI pipeline to get:
   - Resume analysis and skill extraction
   - Job fit scoring
   - Improved resume
   - Generated cover letter
4. **📊 View History** - Check your application history

### 🌐 SerpAPI Integration
Enable SerpAPI in the Search Jobs page to search for jobs from Google Jobs. 
This gives you access to real-time job postings from across the web!
""")

# Feature highlights
st.subheader("✨ Features")
col_feat1, col_feat2, col_feat3 = st.columns(3)

with col_feat1:
    st.markdown("""
    **🎯 Smart Job Matching**
    - Multi-strategy search (TF-IDF + Semantic)
    - External job search via SerpAPI
    - Hybrid ranking algorithm
    """)

with col_feat2:
    st.markdown("""
    **📊 ATS Scoring**
    - Skill match analysis
    - Missing skills identification
    - Overall fit score calculation
    """)

with col_feat3:
    st.markdown("""
    **✨ AI Enhancement**
    - Resume improvement suggestions
    - Cover letter generation
    - Skill extraction and categorization
    """)
