from sqlalchemy import text
from app.db.session import engine

SQL_STATEMENTS = [
    "UPDATE application SET current_stage = UPPER(TRIM(current_stage));",
    "UPDATE application_stage SET stage = UPPER(TRIM(stage));",
]


def main() -> None:
    with engine.begin() as conn:
        for stmt in SQL_STATEMENTS:
            conn.execute(text(stmt))
    print("Normalized existing stage values in application and application_stage tables.")


if __name__ == "__main__":
    main()
