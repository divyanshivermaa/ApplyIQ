from sqlmodel import SQLModel

# Alembic will import this and read SQLModel.metadata
metadata = SQLModel.metadata
