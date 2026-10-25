from io import BytesIO
import re
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import HRFlowable, Paragraph, SimpleDocTemplate, Spacer

KNOWN_SECTION_HEADERS = [
    "EDUCATION",
    "TECHNICAL SKILLS",
    "SKILLS & ABILITIES",
    "SKILLS",
    "EXPERIENCE",
    "WORK EXPERIENCE",
    "PROFESSIONAL EXPERIENCE",
    "PROJECTS",
    "PERSONAL PROJECTS",
    "LEADERSHIP",
    "CERTIFICATIONS",
    "AWARDS",
    "PUBLICATIONS",
    "SUMMARY",
    "PROFESSIONAL SUMMARY",
]


def parse_resume_sections(resume_text: str) -> dict:
    """Parse raw resume text into structured sections suitable for ATS typesetting."""
    lines = [line.strip() for line in resume_text.splitlines() if line.strip()]
    if not lines:
        return {"name": "Candidate", "contact": "", "sections": {}}

    name = lines[0]
    contact = ""
    start_idx = 1

    if len(lines) > 1 and any(
        marker in lines[1].lower()
        for marker in ("@", "phone", "github", "linkedin", ".com", "|")
    ):
        contact = lines[1]
        start_idx = 2

    sections = {}
    current_section = "GENERAL"
    sections[current_section] = []

    header_patterns = [
        re.compile(rf"^(?:#+\s*)?({re.escape(h)})(?::)?$", re.IGNORECASE)
        for h in KNOWN_SECTION_HEADERS
    ]

    for line in lines[start_idx:]:
        matched_header = None
        for pattern in header_patterns:
            m = pattern.match(line)
            if m:
                matched_header = m.group(1).upper()
                break

        if matched_header:
            current_section = matched_header
            sections[current_section] = []
        else:
            sections[current_section].append(line)

    if not sections.get("GENERAL"):
        sections.pop("GENERAL", None)

    return {
        "name": name,
        "contact": contact,
        "sections": sections,
    }


def generate_ats_pdf(resume_text: str) -> BytesIO:
    """Generate a clean, professional, single-column ATS-compliant PDF using ReportLab Platypus."""
    parsed = parse_resume_sections(resume_text)
    buffer = BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()

    name_style = ParagraphStyle(
        "ATSName",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=15,
        leading=18,
        alignment=1,  # Center
        textColor=colors.HexColor("#0f172a"),
        spaceAfter=3,
    )

    contact_style = ParagraphStyle(
        "ATSContact",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        alignment=1,  # Center
        textColor=colors.HexColor("#475569"),
        spaceAfter=8,
    )

    section_header_style = ParagraphStyle(
        "ATSSectionHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10.5,
        leading=13,
        textColor=colors.HexColor("#0f172a"),
        spaceBefore=7,
        spaceAfter=2,
        keepWithNext=True,
    )

    body_style = ParagraphStyle(
        "ATSBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12.5,
        textColor=colors.HexColor("#1e293b"),
        spaceAfter=2,
    )

    bullet_style = ParagraphStyle(
        "ATSBullet",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12.5,
        leftIndent=14,
        firstLineIndent=-10,
        textColor=colors.HexColor("#1e293b"),
        spaceAfter=2,
    )

    story = []

    # 1. Header (Name & Contact)
    story.append(Paragraph(escape(parsed["name"]), name_style))
    if parsed["contact"]:
        story.append(Paragraph(escape(parsed["contact"]), contact_style))
    else:
        story.append(Spacer(1, 4))

    # 2. Sections
    for section_title, content_lines in parsed["sections"].items():
        if not content_lines and section_title == "GENERAL":
            continue

        if section_title != "GENERAL":
            story.append(Spacer(1, 4))
            story.append(Paragraph(escape(section_title), section_header_style))
            story.append(
                HRFlowable(
                    width="100%",
                    thickness=0.75,
                    color=colors.HexColor("#cbd5e1"),
                    spaceBefore=1,
                    spaceAfter=4,
                )
            )

        for line in content_lines:
            escaped_line = escape(line)
            if line.startswith(("-", "*", "•")):
                clean_bullet = re.sub(r"^[-*•]\s*", "", escaped_line)
                story.append(Paragraph(f"&bull;&nbsp;&nbsp;{clean_bullet}", bullet_style))
            else:
                # Subheaders or titles with bolding if colon separated
                if ":" in escaped_line and len(escaped_line.split(":")[0]) < 25:
                    prefix, rest = escaped_line.split(":", 1)
                    formatted_line = f"<b>{prefix}:</b>{rest}"
                    story.append(Paragraph(formatted_line, body_style))
                else:
                    story.append(Paragraph(escaped_line, body_style))

    doc.build(story)
    buffer.seek(0)
    return buffer
