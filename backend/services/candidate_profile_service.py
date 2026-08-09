def build_profile_data(resumes, stored_profile=None):
    stored_profile = stored_profile or {}
    skill_sources = {}

    for resume in resumes:
        resume_id = _value(resume, "id")
        for skill in _value(resume, "extracted_skills") or []:
            normalized_skill = skill.strip().lower()
            sources = skill_sources.setdefault(normalized_skill, [])
            if resume_id not in sources:
                sources.append(resume_id)

    return {
        "target_roles": _value(stored_profile, "target_roles") or [],
        "preferred_locations": _value(stored_profile, "preferred_locations") or [],
        "employment_types": _value(stored_profile, "employment_types") or [],
        "skills": sorted(skill_sources),
        "skill_sources": skill_sources,
    }


def _value(item, key):
    if isinstance(item, dict):
        return item.get(key)
    return getattr(item, key, None)
