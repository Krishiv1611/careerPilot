from datetime import datetime, timedelta, timezone


TERMINAL_APPLICATION_STATUSES = {"Rejected", "Withdrawn"}


def choose_today_action(
    resume_count,
    job_count,
    draft_version_count,
    applications,
    now=None,
):
    now = _as_utc(now or datetime.now(timezone.utc))
    active_applications = [
        application for application in applications
        if application.get("status") not in TERMINAL_APPLICATION_STATUSES
    ]

    due_follow_ups = [
        application for application in active_applications
        if application.get("follow_up_at")
        and _as_utc(application["follow_up_at"]) <= now
    ]
    if due_follow_ups:
        application = min(due_follow_ups, key=lambda item: _as_utc(item["follow_up_at"]))
        next_action = application.get("next_action") or "Follow up on this application."
        return _action(
            "follow_up_due",
            "Application follow-up due",
            "Keep a real application moving",
            next_action,
            "Review application",
            "/applications",
            "high",
        )

    upcoming_deadlines = [
        application for application in active_applications
        if application.get("deadline")
        and _as_utc(application["deadline"]) <= now + timedelta(days=1)
    ]
    if upcoming_deadlines:
        application = min(upcoming_deadlines, key=lambda item: _as_utc(item["deadline"]))
        next_action = application.get("next_action") or "Prepare for the next application deadline."
        return _action(
            "deadline_due",
            "Deadline within 24 hours",
            "Finish the time-sensitive application task",
            next_action,
            "Open application",
            "/applications",
            "high",
        )

    if draft_version_count:
        return _action(
            "resume_review",
            "Resume draft waiting",
            "Review supported resume changes",
            "Accept or reject every proposed line before downloading your tailored resume.",
            "Review draft",
            "/profile/tailor",
            "normal",
        )

    if resume_count == 0:
        return _action(
            "add_resume",
            "Start with your evidence",
            "Add your current resume",
            "CareerPilot needs your real experience and skills before it can explain job fit.",
            "Build my profile",
            "/profile",
            "normal",
        )

    if job_count == 0:
        return _action(
            "find_jobs",
            "Your profile is ready",
            "Find a relevant fresher role",
            "Search by role, location, and experience level instead of browsing a generic web feed.",
            "Find jobs",
            "/jobs",
            "normal",
        )

    if not applications:
        return _action(
            "review_job",
            "Turn a match into action",
            "Review a saved job",
            "Check the requirements and evidence before deciding whether to create an application.",
            "Review jobs",
            "/jobs",
            "normal",
        )

    planned = [application for application in active_applications if application.get("next_action")]
    if planned:
        application = planned[0]
        return _action(
            "application_action",
            "Your application plan",
            "Complete the next recorded action",
            application["next_action"],
            "Open applications",
            "/applications",
            "normal",
        )

    return _action(
        "growth_review",
        "Build stronger evidence",
        "Choose one focused growth priority",
        "Use recurring job gaps to decide which small project or proof will improve your applications.",
        "Open Growth",
        "/growth",
        "normal",
    )


def _action(kind, eyebrow, title, description, action, path, urgency):
    return {
        "kind": kind,
        "eyebrow": eyebrow,
        "title": title,
        "description": description,
        "action": action,
        "path": path,
        "urgency": urgency,
    }


def _as_utc(value):
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)
