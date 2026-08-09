from collections import Counter


def build_growth_plan(resume_versions):
    gap_counts = Counter()

    for version in resume_versions:
        gap_counts.update(version.get("missing_skills") or [])

    plan = []
    for skill, job_count in gap_counts.most_common(3):
        plan.append({
            "skill": skill,
            "job_count": job_count,
            "next_action": (
                f"Build or verify one small project using {skill}, then add the repository or result as evidence."
            ),
            "completion_rule": (
                f"Complete when CareerPilot can point to a resume line or approved repository that proves {skill}."
            ),
        })

    return plan


def complete_growth_priority(evidence_url="", external_confirmation=False):
    evidence_url = evidence_url.strip()
    if not evidence_url and not external_confirmation:
        raise ValueError("Add an evidence link or explicitly confirm completion outside CareerPilot.")

    return {
        "status": "completed",
        "completion_source": "evidence_link" if evidence_url else "external_confirmation",
        "evidence_url": evidence_url or None,
    }
