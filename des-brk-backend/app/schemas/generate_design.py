from pydantic import BaseModel, Field
from typing import Any


class GenerateDesignRequest(BaseModel):
    image_asset_ids: list[int] = Field(min_length=1)
    design_doc: str = Field(min_length=1)


class GenerateDesignStartResponse(BaseModel):
    job_id: str
    status: str


class GenerateDesignJobStatusResponse(BaseModel):
    type: str
    job_id: str
    status: str
    updated_at: str | None = None
    error: str | None = None
    result: dict[str, Any] | None = None
