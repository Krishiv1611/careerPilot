import streamlit as st
from utils.api import add_job
from datetime import date

st.set_page_config(page_title="Add Job", page_icon="➕")

st.title("➕ Add a New Job Posting")

st.write("Fill out the details below to create a job posting.")

# -------------------------------
# Dropdown Options
# -------------------------------
employment_types = [
    "Full-time", "Part-time", "Internship", "Contract", "Freelance"
]

experience_levels = [
    "Intern", "Entry-level", "Mid-level", "Senior", "Lead"
]

skill_options = [
    "Python", "FastAPI", "SQL", "React", "Node.js", "Docker", "AWS", "ML",
    "JavaScript", "C++", "Java", "HTML", "CSS", "REST APIs", "PostgreSQL",
]


# -------------------------------
# Form UI
# -------------------------------
with st.form("job_form"):

    st.subheader("Job Details")

    title = st.text_input("Job Title", placeholder="Backend Developer")

    company = st.text_input("Company Name", placeholder="Google")

    location = st.text_input("Location", placeholder="Bangalore, India")

    employment_type = st.selectbox(
        "Employment Type",
        employment_types
    )

    experience_level = st.selectbox(
        "Experience Level",
        experience_levels
    )

    skills = st.multiselect(
        "Required Skills",
        options=skill_options
    )

    salary_range = st.text_input("Salary Range", placeholder="10-20 LPA")

    posted_date = st.date_input(
        "Posted Date",
        value=date.today()
    )

    url = st.text_input("Job URL (Optional)", placeholder="https://...")

    description = st.text_area(
        "Job Description",
        placeholder="Describe the job responsibilities, requirements, and company details...",
        height=200
    )

    submitted = st.form_submit_button("Create Job")

# -------------------------------
# Submit Handling
# -------------------------------
if submitted:
    if not title or not company or not description:
        st.error("Please fill all mandatory fields: Title, Company, Description.")
    else:
        job_payload = {
            "title": title,
            "company": company,
            "location": location,
            "employment_type": employment_type,
            "experience_level": experience_level,
            "skills": ", ".join(skills) if skills else None,
            "description": description,
            "salary_range": salary_range,
            "url": url,
            "posted_date": str(posted_date)
        }

        response = add_job(job_payload)

        if response:
            st.success("✅ Job successfully added!")
            st.json(response)
        else:
            st.error("❌ Failed to add job. Check backend logs.")

