from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class WorkspaceContextItem(Base):
    __tablename__ = "workspace_context_items"
    __table_args__ = (UniqueConstraint("workspace_id", "image_asset_id", name="uq_workspace_context_image"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    workspace_id: Mapped[int] = mapped_column(ForeignKey("workspaces.id"), index=True)
    image_asset_id: Mapped[int] = mapped_column(ForeignKey("image_assets.id"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
