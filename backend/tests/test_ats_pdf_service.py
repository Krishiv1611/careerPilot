from io import BytesIO
from pathlib import Path
import sys
from unittest import TestCase

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from services.ats_pdf_service import generate_ats_pdf, parse_resume_sections


class ATSPdfServiceTests(TestCase):
    def test_parse_sections_identifies_standard_headers(self):
        resume_text = """John Doe
john.doe@example.com | (555) 123-4567 | github.com/johndoe | linkedin.com/in/johndoe

EDUCATION
Bachelor of Science in Computer Science, Tech University, 2024
GPA: 3.8 / 4.0

TECHNICAL SKILLS
Languages: Python, JavaScript, SQL
Frameworks: FastAPI, React, Node.js

EXPERIENCE
Software Engineering Intern, Acme Corp
- Developed REST APIs in Python and FastAPI
- Optimized database queries in PostgreSQL

PROJECTS
CareerPilot Co-Pilot
- Built intelligent career navigation platform
"""
        sections = parse_resume_sections(resume_text)
        self.assertEqual("John Doe", sections["name"])
        self.assertIn("john.doe@example.com", sections["contact"])
        self.assertIn("EDUCATION", sections["sections"])
        self.assertIn("TECHNICAL SKILLS", sections["sections"])
        self.assertIn("EXPERIENCE", sections["sections"])
        self.assertIn("PROJECTS", sections["sections"])

    def test_generate_ats_pdf_returns_valid_pdf_stream(self):
        resume_text = """Jane Smith
jane@email.com | Seattle, WA

EXPERIENCE
Junior Engineer, Startup Labs
- Built automated data ingestion pipelines using Python
"""
        pdf_stream = generate_ats_pdf(resume_text)
        self.assertIsInstance(pdf_stream, BytesIO)
        pdf_bytes = pdf_stream.getvalue()
        self.assertTrue(len(pdf_bytes) > 500)
        self.assertTrue(pdf_bytes.startswith(b"%PDF-"))

    def test_empty_or_minimal_text_does_not_crash(self):
        pdf_stream = generate_ats_pdf("Simple text resume")
        self.assertIsInstance(pdf_stream, BytesIO)
        self.assertTrue(pdf_stream.getvalue().startswith(b"%PDF-"))
