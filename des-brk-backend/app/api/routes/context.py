from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.context_item import ContextItem
from app.models.image_asset import ImageAsset
from app.schemas.context import AddContextRequest, ContextItemResponse
from app.schemas.images import ImageAssetResponse

router = APIRouter(prefix="/context", tags=["context"])


def _to_response(item: ContextItem, image: ImageAsset) -> ContextItemResponse:
    return ContextItemResponse(
        id=item.id,
        image_asset_id=item.image_asset_id,
        created_at=item.created_at,
        image=ImageAssetResponse.model_validate(image),
    )


@router.get("", response_model=list[ContextItemResponse])
def list_context(db: Session = Depends(get_db)):
    rows = db.execute(
        select(ContextItem, ImageAsset)
        .join(ImageAsset, ImageAsset.id == ContextItem.image_asset_id)
        .order_by(ContextItem.created_at.desc())
    ).all()
    return [_to_response(item, image) for item, image in rows]


@router.post("", response_model=ContextItemResponse)
def add_context(payload: AddContextRequest, db: Session = Depends(get_db)):
    image = db.get(ImageAsset, payload.image_asset_id)
    if image is None:
        raise HTTPException(status_code=404, detail="Image not found")

    existing = db.scalar(select(ContextItem).where(ContextItem.image_asset_id == payload.image_asset_id))
    if existing is not None:
        return _to_response(existing, image)

    row = ContextItem(image_asset_id=payload.image_asset_id)
    db.add(row)
    db.commit()
    db.refresh(row)

    return _to_response(row, image)


@router.delete("/{context_item_id}")
def delete_context_item(context_item_id: int, db: Session = Depends(get_db)):
    row = db.get(ContextItem, context_item_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Context item not found")

    db.delete(row)
    db.commit()
    return {"deleted": True}
