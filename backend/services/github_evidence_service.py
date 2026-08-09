def build_github_resume_proposal(
    repository,
    evidence,
    selected_skills,
    contribution,
    wording,
    outcome="",
    confirmed=False,
):
    if not confirmed:
        raise ValueError("You must confirm that this describes your own contribution.")

    contribution = contribution.strip()
    wording = wording.strip()
    outcome = outcome.strip()
    if len(contribution) < 10:
        raise ValueError("Describe what you personally contributed to this project.")
    if len(wording) < 10:
        raise ValueError("Add a clear resume line for this project.")

    supported_skills = {
        skill.casefold(): skill
        for skill in evidence.get("matching_skills", [])
    }
    chosen_skills = []
    for skill in selected_skills:
        canonical_skill = supported_skills.get(skill.casefold())
        if not canonical_skill:
            raise ValueError(f"{skill} is not supported by the retrieved repository evidence.")
        if canonical_skill not in chosen_skills:
            chosen_skills.append(canonical_skill)

    if not chosen_skills:
        raise ValueError("Choose at least one skill supported by this repository.")

    resume_line = f"- {repository}: {wording}"
    if outcome:
        resume_line += f" Outcome: {outcome}"

    return {
        "repository": repository,
        "skills": chosen_skills,
        "contribution": contribution,
        "wording": wording,
        "outcome": outcome or None,
        "resume_line": resume_line,
    }
