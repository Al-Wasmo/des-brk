from datetime import datetime

from pydantic import BaseModel

from app.schemas.images import ImageAssetResponse


class AddContextRequest(BaseModel):
    image_asset_id: int


class ContextItemResponse(BaseModel):
    id: int
    image_asset_id: int
    created_at: datetime
    image: ImageAssetResponse
