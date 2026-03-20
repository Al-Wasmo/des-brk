from datetime import datetime

from pydantic import BaseModel, Field


class ImageSearchRequest(BaseModel):
    topic: str = Field(min_length=1)


class ImageAssetResponse(BaseModel):
    id: int
    topic: str
    name: str
    href: str
    thumbnail_url: str | None
    local_image_path: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class ImageSearchResponse(BaseModel):
    topic: str
    count: int
    items: list[ImageAssetResponse]
