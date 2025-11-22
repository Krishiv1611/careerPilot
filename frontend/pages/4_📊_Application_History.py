import streamlit as st
from utils.api import get_applications, get_job_by_id
from utils.state import init_state

init_state()

st.title("📊 Application History")
st.markdown("View all your saved job applications and their fit scores.")

apps = get_applications()

if not apps:
    st.info("📭 No applications saved yet. Run the CareerPilot AI pipeline to create your first application!")
else:
    st.metric("Total Applications", len(apps))
    st.divider()
    
    # Sort by fit score (highest first)
    apps_sorted = sorted(apps, key=lambda x: x.get('overall_fit_score', 0), reverse=True)
    
    for idx, app in enumerate(apps_sorted, 1):
        # Get job details
        job = get_job_by_id(app.get('job_id'))
        job_title = job.get('title', 'Unknown') if job else 'Unknown Job'
        job_company = job.get('company', 'Unknown') if job else 'Unknown Company'
        
        with st.container():
            col_header, col_score = st.columns([3, 1])
            
            with col_header:
                st.subheader(f"#{idx} {job_title} - {job_company}")
                st.caption(f"Application ID: {app.get('id', 'N/A')}")
                if app.get('created_at'):
                    st.caption(f"Created: {app.get('created_at')}")
            
            with col_score:
                fit_score = app.get('overall_fit_score', 0)
                st.metric("Fit Score", f"{fit_score:.1%}")
                
                # Color code based on score
                if fit_score >= 0.8:
                    st.success("Excellent Match! 🎯")
                elif fit_score >= 0.6:
                    st.info("Good Match 👍")
                elif fit_score >= 0.4:
                    st.warning("Moderate Match ⚠️")
                else:
                    st.error("Low Match ❌")
            
            # Score breakdown
            col1, col2, col3 = st.columns(3)
            
            with col1:
                skill_match = app.get('skill_match_score', 0)
                st.metric("Skill Match", f"{skill_match:.1%}")
            
            with col2:
                if app.get('ats_score'):
                    st.metric("ATS Score", f"{app.get('ats_score', 0):.1%}")
                else:
                    st.metric("ATS Score", "N/A")
            
            with col3:
                missing_skills = app.get('missing_skills', [])
                st.metric("Missing Skills", len(missing_skills) if missing_skills else 0)
            
            # Progress bar
            st.progress(fit_score)
            
            # Missing skills
            if missing_skills:
                st.write("**Missing Skills:**")
                st.warning(", ".join(missing_skills))
            
            # Explanation
            if app.get('fit_explanation'):
                with st.expander("📝 View Fit Explanation"):
                    st.write(app.get('fit_explanation'))
            
            # Job details link
            if job and job.get('url'):
                st.link_button("🔗 View Job Posting", job.get('url'))
            
            st.divider()
