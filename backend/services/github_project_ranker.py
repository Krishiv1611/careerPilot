from services.skill_extractor import SkillExtractor


def rank_projects(required_skills, repositories):
    required = set(required_skills)
    ranked = []
    extractor = SkillExtractor()

    for repository in repositories:
        evidence_text = " ".join([
            repository.get("readme", ""),
            " ".join(repository.get("files", [])),
        ])
        repository_skills, _ = extractor.extract_skills(evidence_text)
        matching_skills = sorted(required & set(repository_skills))

        if not matching_skills:
            continue

        project = {
            "kind": "existing_project",
            "owner": repository["owner"],
            "name": repository["name"],
            "url": repository["url"],
            "matching_skills": matching_skills,
            "score": len(matching_skills) / max(len(required), 1),
            "reason": "This existing repository contains evidence for " + ", ".join(matching_skills) + ".",
        }
        if repository.get("evidence_id"):
            project["evidence_id"] = repository["evidence_id"]
        ranked.append(project)

    return sorted(ranked, key=lambda project: project["score"], reverse=True)
