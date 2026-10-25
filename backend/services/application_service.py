from datetime import datetime, timezone


ALLOWED_TRANSITIONS = {
    "Saved": {"Preparing", "Applied", "Withdrawn"},
    "Preparing": {"Saved", "Applied", "Withdrawn"},
    "Applied": {"Assessment", "Interview", "Offer", "Rejected", "Withdrawn"},
    "Assessment": {"Interview", "Offer", "Rejected", "Withdrawn"},
    "Interview": {"Offer", "Rejected", "Withdrawn"},
    "Offer": {"Applied", "Interview", "Withdrawn"},
    "Rejected": {"Saved", "Preparing", "Applied"},
    "Withdrawn": {"Saved", "Preparing", "Applied"},
}


def build_new_application(job_id, resume_id=None, confirmed=False, resume_version_id=None):
    if not confirmed:
        raise ValueError("Confirm before adding this job to Applications.")

    application = {
        "job_id": job_id,
        "resume_id": resume_id,
        "status": "Saved",
        "status_source": "user",
        "timeline": [_timeline_event("Saved", "user")],
    }
    if resume_version_id:
        application["resume_version_id"] = resume_version_id
    return application


def change_status(current_status, new_status, source="user"):
    if current_status not in ALLOWED_TRANSITIONS:
        raise ValueError(f"Unknown current status: {current_status}")

    if new_status not in ALLOWED_TRANSITIONS[current_status]:
        raise ValueError(f"Cannot move an application from {current_status} to {new_status}.")

    return {
        "status": new_status,
        "status_source": source,
        "timeline_event": _timeline_event(new_status, source),
    }


def _timeline_event(status, source):
    return {
        "status": status,
        "source": source,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
