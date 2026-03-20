from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.image_asset import ImageAsset
from app.schemas.images import ImageAssetResponse, ImageSearchRequest, ImageSearchResponse
from app.services.microservice_search import MicroserviceSearchError, run_search

router = APIRouter(prefix="/images", tags=["images"])


@router.post("/search", response_model=ImageSearchResponse)
def search_images(payload: ImageSearchRequest, db: Session = Depends(get_db)):
    topic = payload.topic.strip()
    if not topic:
        raise HTTPException(status_code=400, detail="Topic is required")

    try:
        items = run_search(topic.strip().replace(" ","-"))
    except MicroserviceSearchError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    stored: list[ImageAsset] = []
    for item in items:
        href = item.get("href", "").strip()
        if not href:
            continue

        row = db.scalar(select(ImageAsset).where(ImageAsset.href == href))
        if row is None:
            row = ImageAsset(
                topic=topic,
                name=item.get("name", ""),
                href=href,
                thumbnail_url=item.get("thumbnail_url"),
                local_image_path=item.get("local_image_path"),
            )
            db.add(row)
        else:
            row.topic = topic
            row.name = item.get("name", row.name)
            row.thumbnail_url = item.get("thumbnail_url")
            row.local_image_path = item.get("local_image_path")

        stored.append(row)

    db.commit()
    for row in stored:
        db.refresh(row)

    return ImageSearchResponse(topic=topic, count=len(stored), items=stored)


@router.get("", response_model=list[ImageAssetResponse])
def list_images(topic: str | None = None, db: Session = Depends(get_db)):
    query = select(ImageAsset).order_by(ImageAsset.created_at.desc())
    if topic:
        query = query.where(ImageAsset.topic == topic)
    return list(db.scalars(query))
