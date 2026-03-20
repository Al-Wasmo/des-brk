from pydantic import BaseModel, Field
from typing import Any


class ReverseDesignRequest(BaseModel):
    image_asset_ids: list[int] = Field(min_length=1)
    prompt: str = Field(min_length=1)
    auto_mode: bool = False


class ReverseDesignStartResponse(BaseModel):
    job_id: str
    status: str


class ReverseDesignJobStatusResponse(BaseModel):
    type: str
    job_id: str
    status: str
    auto_mode: bool = False
    updated_at: str | None = None
    error: str | None = None
    result: dict[str, Any] | None = None
    generate_job_id: str | None = None
    generate_result: dict[str, Any] | None = None
