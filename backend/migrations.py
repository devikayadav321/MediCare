"""Small idempotent SQLite schema migrations for existing MediTrace databases."""
from sqlalchemy import inspect, text

from database import Base, engine
import models  # noqa: F401 - register all model tables with Base.metadata


def run_migrations() -> None:
    """Create any newly introduced tables without dropping existing records."""
    with engine.begin() as connection:
        connection.execute(text(
            "CREATE TABLE IF NOT EXISTS schema_migrations "
            "(revision VARCHAR(100) PRIMARY KEY, applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)"
        ))

    # create_all is non-destructive and only creates missing tables/indexes;
    # it leaves existing patient, report, extraction, and note rows intact.
    Base.metadata.create_all(bind=engine)

    # SQLite create_all does not add columns to existing tables. Add profile
    # and review metadata columns in place for pre-migration databases.
    report_columns = {column["name"] for column in inspect(engine).get_columns("reports")}
    user_columns = {column["name"] for column in inspect(engine).get_columns("users")}
    with engine.begin() as connection:
        if "full_name" not in user_columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN full_name VARCHAR"))
        if "reviewed_by_id" not in report_columns:
            connection.execute(text("ALTER TABLE reports ADD COLUMN reviewed_by_id INTEGER REFERENCES users(id)"))
        if "verified_at" not in report_columns:
            connection.execute(text("ALTER TABLE reports ADD COLUMN verified_at DATETIME"))

    with engine.begin() as connection:
        connection.execute(
            text("INSERT OR IGNORE INTO schema_migrations (revision) VALUES (:revision)"),
            {"revision": "20261103_report_sharing_audit_and_profiles"},
        )
