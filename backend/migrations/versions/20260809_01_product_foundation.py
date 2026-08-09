"""Student application OS product foundation.

Revision ID: 20260809_01
Revises:
"""
from alembic import op
from datetime import datetime, timezone
import sqlalchemy as sa
from uuid import uuid4


revision = "20260809_01"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    connection = op.get_bind()
    created_tables = _create_core_tables(connection)
    inspector = sa.inspect(connection)
    table_names = inspector.get_table_names()

    if "jobs" in table_names and "jobs" not in created_tables:
        job_columns = {column["name"] for column in inspector.get_columns("jobs")}
        if "verification_status" not in job_columns:
            op.add_column("jobs", sa.Column("verification_status", sa.String(), nullable=True))
            op.execute("UPDATE jobs SET verification_status = 'stored' WHERE verification_status IS NULL")
            op.alter_column("jobs", "verification_status", nullable=False)
        if "fetched_at" not in job_columns:
            op.add_column("jobs", sa.Column("fetched_at", sa.DateTime(timezone=True), nullable=True))

    if "resumes" in table_names and "resumes" not in created_tables:
        resume_columns = {column["name"] for column in inspector.get_columns("resumes")}
        if "original_filename" not in resume_columns:
            op.add_column("resumes", sa.Column("original_filename", sa.String(), nullable=True))
        if "file_type" not in resume_columns:
            op.add_column("resumes", sa.Column("file_type", sa.String(), nullable=True))
            op.execute("UPDATE resumes SET file_type = 'pdf' WHERE file_type IS NULL")
            op.alter_column("resumes", "file_type", nullable=False)
        if "stored_filename" not in resume_columns:
            op.add_column("resumes", sa.Column("stored_filename", sa.String(), nullable=True))
        if "career_track_suggestions" not in resume_columns:
            op.add_column(
                "resumes",
                sa.Column("career_track_suggestions", sa.JSON(), nullable=True),
            )
            op.execute(
                "UPDATE resumes SET career_track_suggestions = '[]' "
                "WHERE career_track_suggestions IS NULL"
            )
            op.alter_column("resumes", "career_track_suggestions", nullable=False)

    if "applications" in table_names and "applications" not in created_tables:
        application_columns = {column["name"] for column in inspector.get_columns("applications")}
        new_columns = [
            ("status", sa.Column("status", sa.String(), nullable=True)),
            ("status_source", sa.Column("status_source", sa.String(), nullable=True)),
            ("next_action", sa.Column("next_action", sa.Text(), nullable=True)),
            ("deadline", sa.Column("deadline", sa.DateTime(), nullable=True)),
            ("follow_up_at", sa.Column("follow_up_at", sa.DateTime(), nullable=True)),
            ("notes", sa.Column("notes", sa.Text(), nullable=True)),
            ("timeline", sa.Column("timeline", sa.JSON(), nullable=True)),
        ]
        for name, column in new_columns:
            if name not in application_columns:
                op.add_column("applications", column)

        op.execute("UPDATE applications SET status = 'Saved' WHERE status IS NULL")
        op.execute("UPDATE applications SET status_source = 'legacy_analysis' WHERE status_source IS NULL")
        op.execute("UPDATE applications SET timeline = '[]' WHERE timeline IS NULL")
        op.alter_column("applications", "status", nullable=False)
        op.alter_column("applications", "status_source", nullable=False)
        op.alter_column("applications", "timeline", nullable=False)
        op.alter_column("applications", "overall_fit_score", nullable=True)

    _create_new_tables()
    _upgrade_resume_version_table()
    _upgrade_github_evidence_table()
    _backfill_application_job_ownership()
    _create_model_indexes()


def _create_core_tables(connection):
    table_names = set(sa.inspect(connection).get_table_names())
    created_tables = set()

    if "users" not in table_names:
        op.create_table(
            "users",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("email", sa.String(), nullable=False),
            sa.Column("full_name", sa.String(), nullable=True),
            sa.Column("hashed_password", sa.String(), nullable=False),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=True,
            ),
        )
        created_tables.add("users")

    if "resumes" not in table_names:
        op.create_table(
            "resumes",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("user_name", sa.String(), nullable=True),
            sa.Column("raw_text", sa.Text(), nullable=False),
            sa.Column("extracted_skills", sa.JSON(), nullable=True),
            sa.Column("skill_categories", sa.JSON(), nullable=True),
            sa.Column("ats_score", sa.Float(), nullable=True),
            sa.Column("ats_report", sa.Text(), nullable=True),
            sa.Column("resume_category", sa.String(), nullable=True),
            sa.Column(
                "career_track_suggestions",
                sa.JSON(),
                nullable=False,
                server_default="[]",
            ),
            sa.Column("experience", sa.Text(), nullable=True),
            sa.Column("education", sa.Text(), nullable=True),
            sa.Column("original_filename", sa.String(), nullable=True),
            sa.Column("file_type", sa.String(), nullable=False, server_default="pdf"),
            sa.Column("stored_filename", sa.String(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=True),
        )
        created_tables.add("resumes")

    if "jobs" not in table_names:
        op.create_table(
            "jobs",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("title", sa.String(), nullable=False),
            sa.Column("company", sa.String(), nullable=False),
            sa.Column("location", sa.String(), nullable=True),
            sa.Column("employment_type", sa.String(), nullable=True),
            sa.Column("experience_level", sa.String(), nullable=True),
            sa.Column("skills", sa.JSON(), nullable=True),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("salary_range", sa.String(), nullable=True),
            sa.Column("url", sa.String(), nullable=True),
            sa.Column("posted_date", sa.Date(), nullable=True),
            sa.Column("source", sa.String(), nullable=True),
            sa.Column(
                "verification_status",
                sa.String(),
                nullable=False,
                server_default="stored",
            ),
            sa.Column("fetched_at", sa.DateTime(timezone=True), nullable=True),
        )
        created_tables.add("jobs")

    if "applications" not in table_names:
        op.create_table(
            "applications",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("resume_id", sa.String(), sa.ForeignKey("resumes.id"), nullable=True),
            sa.Column("job_id", sa.String(), sa.ForeignKey("jobs.id"), nullable=True),
            sa.Column("status", sa.String(), nullable=False, server_default="Saved"),
            sa.Column("status_source", sa.String(), nullable=False, server_default="user"),
            sa.Column("next_action", sa.Text(), nullable=True),
            sa.Column("deadline", sa.DateTime(), nullable=True),
            sa.Column("follow_up_at", sa.DateTime(), nullable=True),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("timeline", sa.JSON(), nullable=False, server_default="[]"),
            sa.Column("overall_fit_score", sa.Float(), nullable=True),
            sa.Column("skill_match_score", sa.Float(), nullable=True),
            sa.Column("missing_skills", sa.JSON(), nullable=True),
            sa.Column("fit_explanation", sa.Text(), nullable=True),
            sa.Column("ats_score", sa.Float(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=True),
        )
        created_tables.add("applications")

    return created_tables


def _create_new_tables():
    connection = op.get_bind()
    table_names = sa.inspect(connection).get_table_names()

    if "resume_versions" not in table_names:
        op.create_table(
            "resume_versions",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("resume_id", sa.String(), sa.ForeignKey("resumes.id"), nullable=False),
            sa.Column("job_id", sa.String(), sa.ForeignKey("jobs.id"), nullable=True),
            sa.Column("job_description", sa.Text(), nullable=False),
            sa.Column("base_content", sa.Text(), nullable=False),
            sa.Column("content", sa.Text(), nullable=False),
            sa.Column("changes", sa.JSON(), nullable=False, server_default="[]"),
            sa.Column("approval_status", sa.String(), nullable=False, server_default="draft"),
            sa.Column("source_version_id", sa.String(), nullable=True),
            sa.Column("approved_at", sa.DateTime(), nullable=True),
            sa.Column("requirements", sa.JSON(), nullable=False),
            sa.Column("matched_skills", sa.JSON(), nullable=False),
            sa.Column("missing_skills", sa.JSON(), nullable=False),
            sa.Column("evidence_map", sa.JSON(), nullable=False),
            sa.Column("project_suggestions", sa.JSON(), nullable=False),
            sa.Column("prompt_history", sa.JSON(), nullable=False),
            sa.Column("template_mode", sa.String(), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=True),
        )

    table_names = sa.inspect(connection).get_table_names()
    if "github_connections" not in table_names:
        op.create_table(
            "github_connections",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("installation_id", sa.String(), nullable=False, unique=True),
            sa.Column("account_login", sa.String(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=True),
        )

    table_names = sa.inspect(connection).get_table_names()
    if "github_evidence" not in table_names:
        op.create_table(
            "github_evidence",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("resume_version_id", sa.String(), sa.ForeignKey("resume_versions.id"), nullable=False),
            sa.Column("repository", sa.String(), nullable=False),
            sa.Column("evidence", sa.JSON(), nullable=False),
            sa.Column("approval_status", sa.String(), nullable=False, server_default="pending"),
            sa.Column("student_contribution", sa.Text(), nullable=True),
            sa.Column("approved_wording", sa.Text(), nullable=True),
            sa.Column("approved_skills", sa.JSON(), nullable=False, server_default="[]"),
            sa.Column("outcome", sa.Text(), nullable=True),
            sa.Column("proposal_version_id", sa.String(), nullable=True),
            sa.Column("approved_at", sa.DateTime(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=True),
        )

    table_names = sa.inspect(connection).get_table_names()
    if "match_results" not in table_names:
        op.create_table(
            "match_results",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("resume_id", sa.String(), sa.ForeignKey("resumes.id"), nullable=False),
            sa.Column("job_id", sa.String(), sa.ForeignKey("jobs.id"), nullable=False),
            sa.Column("eligible", sa.Boolean(), nullable=False),
            sa.Column("eligibility_status", sa.String(), nullable=False),
            sa.Column("eligibility_reasons", sa.JSON(), nullable=False),
            sa.Column("coverage_percent", sa.Float(), nullable=False),
            sa.Column("requirements", sa.JSON(), nullable=False),
            sa.Column("matched_skills", sa.JSON(), nullable=False),
            sa.Column("missing_skills", sa.JSON(), nullable=False),
            sa.Column("must_have_skills", sa.JSON(), nullable=False),
            sa.Column("missing_must_haves", sa.JSON(), nullable=False),
            sa.Column("evidence_map", sa.JSON(), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=True),
        )

    table_names = sa.inspect(connection).get_table_names()
    if "candidate_profiles" not in table_names:
        op.create_table(
            "candidate_profiles",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("target_roles", sa.JSON(), nullable=False),
            sa.Column("preferred_locations", sa.JSON(), nullable=False),
            sa.Column("employment_types", sa.JSON(), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.Column("updated_at", sa.DateTime(), nullable=True),
        )

    table_names = sa.inspect(connection).get_table_names()
    if "user_jobs" not in table_names:
        op.create_table(
            "user_jobs",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("job_id", sa.String(), sa.ForeignKey("jobs.id"), nullable=False),
            sa.Column("state", sa.String(), nullable=False, server_default="discovered"),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
            sa.UniqueConstraint("user_id", "job_id", name="uq_user_jobs_user_job"),
        )

    table_names = sa.inspect(connection).get_table_names()
    if "growth_priorities" not in table_names:
        op.create_table(
            "growth_priorities",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("skill", sa.String(), nullable=False),
            sa.Column("job_count", sa.Integer(), nullable=False, server_default="1"),
            sa.Column("next_action", sa.Text(), nullable=False),
            sa.Column("completion_rule", sa.Text(), nullable=False),
            sa.Column("status", sa.String(), nullable=False, server_default="active"),
            sa.Column("completion_source", sa.String(), nullable=True),
            sa.Column("evidence_url", sa.Text(), nullable=True),
            sa.Column("completed_at", sa.DateTime(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.Column("updated_at", sa.DateTime(), nullable=True),
            sa.UniqueConstraint("user_id", "skill", name="uq_growth_priorities_user_skill"),
        )


def _upgrade_resume_version_table():
    connection = op.get_bind()
    table_names = sa.inspect(connection).get_table_names()
    if "resume_versions" not in table_names:
        return

    columns = {
        column["name"] for column in sa.inspect(connection).get_columns("resume_versions")
    }
    if "base_content" not in columns:
        op.add_column("resume_versions", sa.Column("base_content", sa.Text(), nullable=True))
        op.execute("UPDATE resume_versions SET base_content = content WHERE base_content IS NULL")
        op.alter_column("resume_versions", "base_content", nullable=False)
    if "changes" not in columns:
        op.add_column("resume_versions", sa.Column("changes", sa.JSON(), nullable=True))
        op.execute("UPDATE resume_versions SET changes = '[]' WHERE changes IS NULL")
        op.alter_column("resume_versions", "changes", nullable=False)
    if "approval_status" not in columns:
        op.add_column("resume_versions", sa.Column("approval_status", sa.String(), nullable=True))
        op.execute("UPDATE resume_versions SET approval_status = 'approved' WHERE approval_status IS NULL")
        op.alter_column("resume_versions", "approval_status", nullable=False)
    if "source_version_id" not in columns:
        op.add_column("resume_versions", sa.Column("source_version_id", sa.String(), nullable=True))
    if "approved_at" not in columns:
        op.add_column("resume_versions", sa.Column("approved_at", sa.DateTime(), nullable=True))
        op.execute("UPDATE resume_versions SET approved_at = created_at WHERE approval_status = 'approved'")


def _upgrade_github_evidence_table():
    connection = op.get_bind()
    if "github_evidence" not in sa.inspect(connection).get_table_names():
        return

    column_details = {
        column["name"]: column
        for column in sa.inspect(connection).get_columns("github_evidence")
    }
    columns = set(column_details)
    needs_required_upgrade = (
        "approval_status" not in columns
        or "approved_skills" not in columns
        or column_details.get("approval_status", {}).get("nullable", False)
        or column_details.get("approved_skills", {}).get("nullable", False)
    )
    additions = [
        ("approval_status", sa.Column("approval_status", sa.String(), nullable=True)),
        ("student_contribution", sa.Column("student_contribution", sa.Text(), nullable=True)),
        ("approved_wording", sa.Column("approved_wording", sa.Text(), nullable=True)),
        ("approved_skills", sa.Column("approved_skills", sa.JSON(), nullable=True)),
        ("outcome", sa.Column("outcome", sa.Text(), nullable=True)),
        ("proposal_version_id", sa.Column("proposal_version_id", sa.String(), nullable=True)),
        ("approved_at", sa.Column("approved_at", sa.DateTime(), nullable=True)),
    ]
    for name, column in additions:
        if name not in columns:
            op.add_column("github_evidence", column)

    op.execute("UPDATE github_evidence SET approval_status = 'pending' WHERE approval_status IS NULL")
    op.execute("UPDATE github_evidence SET approved_skills = '[]' WHERE approved_skills IS NULL")
    if needs_required_upgrade:
        with op.batch_alter_table("github_evidence") as batch_op:
            batch_op.alter_column("approval_status", nullable=False)
            batch_op.alter_column("approved_skills", nullable=False)


def _backfill_application_job_ownership():
    connection = op.get_bind()
    table_names = set(sa.inspect(connection).get_table_names())
    if not {"applications", "user_jobs"}.issubset(table_names):
        return

    existing = {
        (row.user_id, row.job_id)
        for row in connection.execute(sa.text("SELECT user_id, job_id FROM user_jobs"))
    }
    missing_rows = []
    for row in connection.execute(sa.text(
        "SELECT DISTINCT user_id, job_id FROM applications WHERE job_id IS NOT NULL"
    )):
        if (row.user_id, row.job_id) in existing:
            continue
        missing_rows.append({
            "id": str(uuid4()),
            "user_id": row.user_id,
            "job_id": row.job_id,
            "state": "saved",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        })

    if missing_rows:
        user_jobs = sa.table(
            "user_jobs",
            sa.column("id", sa.String()),
            sa.column("user_id", sa.Integer()),
            sa.column("job_id", sa.String()),
            sa.column("state", sa.String()),
            sa.column("created_at", sa.DateTime(timezone=True)),
            sa.column("updated_at", sa.DateTime(timezone=True)),
        )
        op.bulk_insert(user_jobs, missing_rows)


def _create_model_indexes():
    connection = op.get_bind()
    table_names = set(sa.inspect(connection).get_table_names())
    indexes = [
        ("ix_users_id", "users", ["id"], False),
        ("ix_users_email", "users", ["email"], True),
        ("ix_resumes_id", "resumes", ["id"], False),
        ("ix_jobs_id", "jobs", ["id"], False),
        ("ix_applications_id", "applications", ["id"], False),
        ("ix_candidate_profiles_id", "candidate_profiles", ["id"], False),
        ("ix_candidate_profiles_user_id", "candidate_profiles", ["user_id"], True),
        ("ix_github_connections_id", "github_connections", ["id"], False),
        ("ix_github_connections_user_id", "github_connections", ["user_id"], True),
        ("ix_github_evidence_id", "github_evidence", ["id"], False),
        ("ix_github_evidence_user_id", "github_evidence", ["user_id"], False),
        ("ix_github_evidence_resume_version_id", "github_evidence", ["resume_version_id"], False),
        ("ix_growth_priorities_id", "growth_priorities", ["id"], False),
        ("ix_growth_priorities_user_id", "growth_priorities", ["user_id"], False),
        ("ix_match_results_id", "match_results", ["id"], False),
        ("ix_match_results_user_id", "match_results", ["user_id"], False),
        ("ix_match_results_resume_id", "match_results", ["resume_id"], False),
        ("ix_match_results_job_id", "match_results", ["job_id"], False),
        ("ix_resume_versions_id", "resume_versions", ["id"], False),
        ("ix_resume_versions_user_id", "resume_versions", ["user_id"], False),
        ("ix_resume_versions_resume_id", "resume_versions", ["resume_id"], False),
        ("ix_resume_versions_job_id", "resume_versions", ["job_id"], False),
        ("ix_user_jobs_id", "user_jobs", ["id"], False),
        ("ix_user_jobs_user_id", "user_jobs", ["user_id"], False),
        ("ix_user_jobs_job_id", "user_jobs", ["job_id"], False),
    ]

    for name, table_name, columns, unique in indexes:
        if table_name not in table_names:
            continue
        existing_names = {
            index["name"] for index in sa.inspect(connection).get_indexes(table_name)
        }
        if name not in existing_names:
            op.create_index(name, table_name, columns, unique=unique)


def downgrade():
    op.drop_table("growth_priorities")
    op.drop_table("user_jobs")
    op.drop_table("candidate_profiles")
    op.drop_table("match_results")
    op.drop_table("github_evidence")
    op.drop_table("github_connections")
    op.drop_table("resume_versions")
