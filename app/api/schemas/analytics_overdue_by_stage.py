from pydantic import BaseModel


class OverdueByStageRow(BaseModel):
    stage: str
    count: int
