from datetime import datetime, timedelta, timezone
from uuid import uuid4

VALID_USER_JOB_STATES = {"discovered", "saved", "dismissed"}


def next_user_job_state(current_state, requested_state):
    if requested_state not in VALID_USER_JOB_STATES:
        raise ValueError(f"Unknown user job state: {requested_state}")

    if requested_state == "discovered" and current_state in {"saved", "dismissed"}:
        return current_state
    return requested_state


def should_show_user_job(state, fetched_at, now=None, max_age_days=30):
    if state == "dismissed":
        return False
    if state == "saved":
        return True
    if not fetched_at:
        return False

    now = now or datetime.now(timezone.utc)
    if fetched_at.tzinfo is None:
        fetched_at = fetched_at.replace(tzinfo=timezone.utc)
    return fetched_at >= now - timedelta(days=max_age_days)


def set_user_job_state(db, user_id, job_id, requested_state):
    from models.user_job_model import UserJob

    record = db.query(UserJob).filter(
        UserJob.user_id == user_id,
        UserJob.job_id == job_id,
    ).first()
    now = datetime.now(timezone.utc)

    if not record:
        record = UserJob(
            id=str(uuid4()),
            user_id=user_id,
            job_id=job_id,
            state=requested_state,
            created_at=now,
        )
        db.add(record)
    else:
        record.state = next_user_job_state(record.state, requested_state)

    record.updated_at = now
    return record


def find_user_job(db, user_id, job_id, include_dismissed=False):
    from models.job_model import Job
    from models.user_job_model import UserJob

    query = db.query(Job, UserJob).join(
        UserJob,
        UserJob.job_id == Job.id,
    ).filter(
        Job.id == job_id,
        UserJob.user_id == user_id,
    )
    if not include_dismissed:
        query = query.filter(UserJob.state != "dismissed")
    return query.first()
