from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class ContextItem(Base):
    __tablename__ = "context_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    image_asset_id: Mapped[int] = mapped_column(ForeignKey("image_assets.id"), unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
