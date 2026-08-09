from typing import Callable, Literal, TypedDict


JobProvider = Callable[[str], tuple[list[dict], str | None]]
CareerTrackPredictor = Callable[..., dict]
CareerTask = Literal[
    "discover_jobs",
    "analyze_resume",
    "edit_resume",
    "rank_github_evidence",
    "suggest_career_tracks",
]


class CareerWorkflowState(TypedDict, total=False):
    task: CareerTask

    role: str
    location: str | None
    employment_type: str | None
    providers: list[JobProvider]
    job_search_result: dict

    resume_text: str
    current_resume_text: str
    job_description: str
    instruction: str
    resume_analysis: dict
    resume_edit_result: dict

    missing_skills: list[str]
    repository_evidence: list[dict]
    github_project_result: dict

    career_track_predictor: CareerTrackPredictor
    career_track_result: dict

    handled_by: str
