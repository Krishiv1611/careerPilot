import streamlit as st
from utils.api import run_careerpilot, get_job_by_id
from utils.state import init_state

init_state()

st.title("🤖 Run CareerPilot AI")
st.markdown("Complete AI-powered job application pipeline with resume improvement and cover letter generation.")

# Validation checks
if not st.session_state.resume_id:
    st.error("⚠️ Please upload your resume first on the 'Upload Resume' page!")
    st.stop()

# Check if job is selected or search query is provided
has_job = st.session_state.job_id is not None
has_search = bool(st.session_state.search_query)

if not has_job and not has_search:
    st.warning("⚠️ Please either select a job from 'Search Jobs' page or provide a search query below.")
    
    st.subheader("Quick Search")
    search_query = st.text_input("Job Search Query", placeholder="e.g., Python developer")
    use_serpapi = st.checkbox(
        "🌐 Use SerpAPI for external job search",
        help="Enable to search for jobs from Google Jobs via SerpAPI"
    )
    
    if st.button("🔍 Search and Run", type="primary"):
        if search_query:
            st.session_state.search_query = search_query
            st.session_state.use_serpapi = use_serpapi
            st.rerun()
    st.stop()

# Configuration section
with st.expander("⚙️ Configuration", expanded=False):
    col1, col2 = st.columns(2)
    
    with col1:
        st.write(f"**Resume ID:** {st.session_state.resume_id}")
        if st.session_state.job_id:
            job = get_job_by_id(st.session_state.job_id)
            if job:
                st.write(f"**Selected Job:** {job.get('title')} - {job.get('company')}")
    
    with col2:
        if st.session_state.search_query:
            st.write(f"**Search Query:** {st.session_state.search_query}")
            st.write(f"**SerpAPI:** {'✅ Enabled' if st.session_state.use_serpapi else '❌ Disabled'}")

# Run button
if st.button("🚀 Run CareerPilot AI Pipeline", type="primary", use_container_width=True):
    payload = {
        "resume_id": st.session_state.resume_id,
        "job_id": st.session_state.job_id,
        "search_query": st.session_state.search_query,
        "use_serpapi": st.session_state.use_serpapi or False
    }
    
    progress_bar = st.progress(0)
    status_text = st.empty()
    
    try:
        status_text.text("🔄 Initializing pipeline...")
        progress_bar.progress(10)
        
        status_text.text("📄 Extracting resume data...")
        progress_bar.progress(20)
        
        status_text.text("🎯 Mapping skills...")
        progress_bar.progress(30)
        
        if payload.get("search_query"):
            if payload.get("use_serpapi"):
                status_text.text("🌐 Searching jobs via SerpAPI...")
            else:
                status_text.text("🔍 Searching jobs in database...")
            progress_bar.progress(40)
        
        status_text.text("📋 Analyzing job description...")
        progress_bar.progress(50)
        
        status_text.text("📊 Calculating fit score...")
        progress_bar.progress(60)
        
        status_text.text("✨ Improving resume...")
        progress_bar.progress(70)
        
        status_text.text("📝 Generating cover letter...")
        progress_bar.progress(80)
        
        status_text.text("💾 Saving application...")
        progress_bar.progress(90)
        
        result = run_careerpilot(payload)
        
        progress_bar.progress(100)
        status_text.text("✅ Pipeline completed!")
        
        st.session_state.careerpilot_result = result
        
        st.success("🎉 CareerPilot AI Pipeline completed successfully!")
        st.balloons()
        
    except Exception as e:
        progress_bar.empty()
        status_text.empty()
        st.error(f"❌ Error running pipeline: {str(e)}")
        st.exception(e)

# Display results
if st.session_state.careerpilot_result:
    result = st.session_state.careerpilot_result
    
    st.divider()
    st.header("📊 Results")
    
    # Recommended Jobs (if search was performed)
    if result.get("recommended_jobs"):
        st.subheader("🔍 Recommended Jobs")
        jobs = result.get("recommended_jobs", [])
        
        for idx, job in enumerate(jobs[:5]):  # Show top 5
            with st.expander(f"🎯 {job.get('title', 'N/A')} - {job.get('company', 'N/A')} (Match: {job.get('score', 0):.2%})"):
                col_a, col_b = st.columns([3, 1])
                with col_a:
                    st.write(f"**Company:** {job.get('company', 'N/A')}")
                    st.write(f"**Location:** {job.get('location', 'N/A')}")
                    if job.get('description'):
                        st.text(job.get('description', '')[:300] + "...")
                with col_b:
                    if st.button(f"Select Job", key=f"select_job_{idx}"):
                        st.session_state.job_id = job.get('id')
                        st.rerun()
        
        st.divider()
    
    # Resume Analysis
    if result.get("extracted_skills"):
        st.subheader("📄 Resume Analysis")
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.write("**Extracted Skills:**")
            skills = result.get("extracted_skills", [])
            if skills:
                st.write(", ".join(skills[:20]))  # Show first 20
            else:
                st.write("No skills extracted")
        
        with col2:
            if result.get("skill_categories"):
                st.write("**Skill Categories:**")
                categories = result.get("skill_categories", {})
                for cat, skills_list in categories.items():
                    st.write(f"**{cat}:** {', '.join(skills_list[:5])}")
        
        st.divider()
    
    # Job Analysis
    if result.get("job_description"):
        st.subheader("💼 Job Analysis")
        
        col1, col2 = st.columns(2)
        
        with col1:
            if result.get("job_skills"):
                st.write("**Required Skills:**")
                st.write(", ".join(result.get("job_skills", [])))
        
        with col2:
            if result.get("job_metadata"):
                metadata = result.get("job_metadata", {})
                if metadata.get("avg_semantic_score"):
                    st.metric("Semantic Match Score", f"{metadata.get('avg_semantic_score', 0):.2%}")
        
        st.divider()
    
    # Fit Score
    if result.get("overall_fit_score") is not None:
        st.subheader("📊 Fit Score Analysis")
        
        fit_score = result.get("overall_fit_score", 0)
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            st.metric("Overall Fit Score", f"{fit_score:.1%}")
        
        with col2:
            skill_match = result.get("skill_match_score", 0)
            st.metric("Skill Match Score", f"{skill_match:.1%}")
        
        with col3:
            if result.get("missing_skills"):
                missing_count = len(result.get("missing_skills", []))
                st.metric("Missing Skills", missing_count)
        
        # Progress bar for fit score
        st.progress(fit_score)
        
        if result.get("fit_explanation"):
            st.write("**Explanation:**")
            st.info(result.get("fit_explanation"))
        
        if result.get("missing_skills"):
            st.write("**Missing Skills:**")
            st.warning(", ".join(result.get("missing_skills", [])))
        
        st.divider()
    
    # Improved Resume
    if result.get("improved_resume"):
        st.subheader("✨ Improved Resume")
        
        with st.expander("View Improved Resume", expanded=False):
            st.text_area(
                "Improved Resume",
                value=result.get("improved_resume", ""),
                height=400,
                disabled=True,
                label_visibility="collapsed"
            )
        
        st.download_button(
            label="📥 Download Improved Resume",
            data=result.get("improved_resume", ""),
            file_name="improved_resume.txt",
            mime="text/plain"
        )
        
        st.divider()
    
    # Cover Letter
    if result.get("cover_letter"):
        st.subheader("📝 Generated Cover Letter")
        
        with st.expander("View Cover Letter", expanded=False):
            st.text_area(
                "Cover Letter",
                value=result.get("cover_letter", ""),
                height=400,
                disabled=True,
                label_visibility="collapsed"
            )
        
        st.download_button(
            label="📥 Download Cover Letter",
            data=result.get("cover_letter", ""),
            file_name="cover_letter.txt",
            mime="text/plain"
        )
        
        st.divider()
    
    # Application Info
    if result.get("application_id"):
        st.success(f"✅ Application saved with ID: {result.get('application_id')}")
    
    # Raw JSON (collapsible)
    with st.expander("🔧 View Raw JSON Response"):
        st.json(result)
