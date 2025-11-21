# services/resume_formatter.py

class ResumeFormatter:
    """
    Helps clean and format LLM-generated resume sections.
    Ensures consistent bullet points, spacing, and ATS readability.
    """

    @staticmethod
    def format_resume(text: str) -> str:
        # Normalize bullet points
        bullets = ["-", "•", "*", "‣"]
        for b in bullets:
            text = text.replace(f"{b} ", "- ")

        # Remove double spaces and clean lines
        lines = [line.strip() for line in text.split("\n")]
        lines = [line for line in lines if line]  # remove empty lines

        return "\n".join(lines)
