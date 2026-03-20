from datetime import datetime

from pydantic import BaseModel, Field


class PromptPresetCreateRequest(BaseModel):
    prompt: str = Field(min_length=1)
    title: str | None = Field(default=None, min_length=1, max_length=255)


class PromptPresetResponse(BaseModel):
    id: int
    title: str
    prompt: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
