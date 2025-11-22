import streamlit as st
from utils.api import get_jobs, run_careerpilot
from utils.state import init_state

init_state()

st.title("🔍 Search Jobs")

# Create two columns for layout
col1, col2 = st.columns([2, 1])

with col1:
    st.subheader("Job Search Options")
    
    # Search mode selection
    search_mode = st.radio(
        "Search Mode",
        ["Browse Database", "Search with Query"],
        horizontal=True
    )
    
    if search_mode == "Search with Query":
        search_query = st.text_input(
            "Enter job search query",
            value=st.session_state.search_query or "",
            placeholder="e.g., Python developer, Data scientist, Software engineer"
        )
        
        use_serpapi = st.checkbox(
            "🌐 Use SerpAPI for external job search",
            value=st.session_state.use_serpapi,
            help="Enable to search for jobs from Google Jobs via SerpAPI. Requires SerpAPI API key."
        )
        
        if st.button("🔍 Search Jobs", type="primary"):
            if not st.session_state.resume_id:
                st.error("⚠️ Please upload your resume first!")
                st.stop()
            
            if not search_query:
                st.error("⚠️ Please enter a search query!")
                st.stop()
            
            st.session_state.search_query = search_query
            st.session_state.use_serpapi = use_serpapi
            
            with st.spinner("🔍 Searching for jobs..."):
                payload = {
                    "resume_id": st.session_state.resume_id,
                    "search_query": search_query,
                    "use_serpapi": use_serpapi
                }
                
                try:
                    result = run_careerpilot(payload)
                    
                    # Always show debug info to help diagnose
                    with st.expander("🔧 Debug: API Response", expanded=False):
                        st.json(result)
                        st.write(f"**recommended_jobs type:** {type(result.get('recommended_jobs'))}")
                        st.write(f"**recommended_jobs value:** {result.get('recommended_jobs')}")
                        st.write(f"**recommended_jobs length:** {len(result.get('recommended_jobs', [])) if result.get('recommended_jobs') else 0}")
                    
                    # Get recommended_jobs - handle None case
                    recommended_jobs = result.get("recommended_jobs")
                    if recommended_jobs is None:
                        recommended_jobs = []
                    elif not isinstance(recommended_jobs, list):
                        st.warning(f"⚠️ recommended_jobs is not a list: {type(recommended_jobs)}")
                        recommended_jobs = []
                    
                    # Check for SerpAPI errors/warnings
                    if result.get("serpapi_error"):
                        st.error(f"❌ SerpAPI Error: {result.get('serpapi_error')}")
                    elif result.get("serpapi_warning"):
                        st.warning(f"⚠️ {result.get('serpapi_warning')}")
                    
                    # Store in session state
                    st.session_state.recommended_jobs = recommended_jobs
                    
                    if recommended_jobs and len(recommended_jobs) > 0:
                        st.success(f"✅ Found {len(recommended_jobs)} jobs!")
                    else:
                        st.warning("No jobs found. Try a different search query.")
                        if result.get("serpapi_warning"):
                            st.info(f"Note: {result.get('serpapi_warning')}")
                    
                    # Force rerun to show jobs immediately
                    st.rerun()
                            
                except Exception as e:
                    st.error(f"❌ Error searching jobs: {str(e)}")
                    st.exception(e)
        
        # Display recommended jobs from search
        recommended_jobs = st.session_state.get("recommended_jobs", [])
        if recommended_jobs and len(recommended_jobs) > 0:
            st.subheader(f"📋 Recommended Jobs ({len(recommended_jobs)} found)")
            
            for idx, job in enumerate(recommended_jobs):
                with st.expander(f"🎯 {job.get('title', 'N/A')} - {job.get('company', 'N/A')} (Score: {job.get('score', 0):.2f})"):
                    col_a, col_b = st.columns([3, 1])
                    with col_a:
                        st.write(f"**Company:** {job.get('company', 'N/A')}")
                        st.write(f"**Location:** {job.get('location', 'N/A')}")
                        if job.get('description'):
                            st.write("**Description:**")
                            st.text(job.get('description', '')[:500] + ("..." if len(job.get('description', '')) > 500 else ""))
                    with col_b:
                        if st.button(f"Select", key=f"select_{idx}"):
                            st.session_state.job_id = job.get('id')
                            st.success(f"✅ Selected: {job.get('title')}")
                            st.rerun()
        elif st.session_state.get("search_query"):
            # Show message if search was performed but no results
            st.info("💡 No jobs to display. Try searching again or check the search query.")
    
    else:
        # Browse database jobs
        st.subheader("📚 Jobs in Database")
        jobs = get_jobs()
        
        if not jobs:
            st.warning("No jobs in database. Add jobs via 'Add Job' page.")
        else:
            selected = st.selectbox(
                "Select a job",
                [None] + jobs,
                format_func=lambda j: f"{j['title']} - {j['company']}" if j else "Choose a job...",
                index=0
            )
            
            if selected:
                st.session_state.job_id = selected["id"]
                
                # Display job details in a nice card
                st.success(f"✅ Selected: {selected['title']}")
                
                col_info, col_details = st.columns([1, 2])
                
                with col_info:
                    st.metric("Company", selected.get('company', 'N/A'))
                    st.metric("Location", selected.get('location', 'N/A'))
                    if selected.get('employment_type'):
                        st.metric("Type", selected.get('employment_type'))
                
                with col_details:
                    st.write("**Job Description:**")
                    st.text_area(
                        "Description",
                        value=selected.get('description', 'No description available'),
                        height=200,
                        disabled=True,
                        label_visibility="collapsed"
                    )
                    
                    if selected.get('url'):
                        st.link_button("🔗 View Job Posting", selected.get('url'))

with col2:
    st.subheader("📊 Current Selection")
    st.info("**Resume ID:**\n" + (st.session_state.resume_id or "Not uploaded"))
    st.info("**Job ID:**\n" + (st.session_state.job_id or "Not selected"))
    if st.session_state.search_query:
        st.info("**Search Query:**\n" + st.session_state.search_query)
    if st.session_state.use_serpapi:
        st.success("🌐 SerpAPI enabled")
    
    # Show recommended jobs count
    recommended_jobs = st.session_state.get("recommended_jobs", [])
    if recommended_jobs and len(recommended_jobs) > 0:
        st.metric("Jobs Found", len(recommended_jobs))
