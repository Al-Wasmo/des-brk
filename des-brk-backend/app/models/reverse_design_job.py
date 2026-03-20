from datetime import datetime
from typing import Any

from sqlalchemy import JSON, Boolean, DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class ReverseDesignJobRecord(Base):
    __tablename__ = "reverse_design_jobs"

    job_id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    status: Mapped[str] = mapped_column(String(32), default="pending", index=True)
    prompt: Mapped[str] = mapped_column(Text)
    image_paths: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    auto_mode: Mapped[bool] = mapped_column(Boolean, default=False)

    result_json: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    error_text: Mapped[str | None] = mapped_column(Text, nullable=True)

    auto_generate_job_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    auto_generate_status: Mapped[str | None] = mapped_column(String(32), nullable=True)
    auto_generate_result_json: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    auto_generate_error_text: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
