from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.schemas.images import ImageAssetResponse


class WorkspaceCreateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)


class WorkspaceStateUpdateRequest(BaseModel):
    state: dict[str, Any] = Field(default_factory=dict)


class WorkspaceResponse(BaseModel):
    id: int
    name: str
    state_json: dict[str, Any] | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class WorkspaceContextAddRequest(BaseModel):
    image_asset_id: int


class WorkspaceContextItemResponse(BaseModel):
    id: int
    workspace_id: int
    image_asset_id: int
    created_at: datetime
    image: ImageAssetResponse
