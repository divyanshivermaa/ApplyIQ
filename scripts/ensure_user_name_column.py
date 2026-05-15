import sys
from pathlib import Path

from sqlalchemy import create_engine, text

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.core.config import settings


def main() -> None:
    engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
    with engine.begin() as conn:
        exists = conn.execute(
            text(
                """
                SELECT EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name = 'user'
                      AND column_name = 'name'
                )
                """
            )
        ).scalar()

        print(f"name_exists_before={exists}")

        if not exists:
            conn.execute(
                text(
                    """
                    ALTER TABLE "user"
                    ADD COLUMN name VARCHAR NOT NULL DEFAULT ''
                    """
                )
            )
            conn.execute(text('ALTER TABLE "user" ALTER COLUMN name DROP DEFAULT'))
            print("added user.name")

        result = conn.execute(
            text(
                """
                UPDATE "user"
                SET name = split_part(email, '@', 1)
                WHERE name = ''
                """
            )
        )
        if result.rowcount:
            print(f"backfilled_blank_names={result.rowcount}")

        exists_after = conn.execute(
            text(
                """
                SELECT EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name = 'user'
                      AND column_name = 'name'
                )
                """
            )
        ).scalar()
        print(f"name_exists_after={exists_after}")


if __name__ == "__main__":
    main()
