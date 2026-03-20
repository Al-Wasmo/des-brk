from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.database import get_db
from app.models.image_asset import ImageAsset
from app.models.reverse_design_job import ReverseDesignJobRecord
from app.schemas.reverse_design import (
    ReverseDesignJobStatusResponse,
    ReverseDesignRequest,
    ReverseDesignStartResponse,
)
from app.services.reverse_design_jobs import reverse_design_jobs

router = APIRouter(prefix="/reverse-design", tags=["reverse-design"])


@router.get("/jobs/{job_id}", response_model=ReverseDesignJobStatusResponse)
def get_reverse_design_job_status(job_id: str, db: Session = Depends(get_db)):
    row = db.get(ReverseDesignJobRecord, job_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Reverse-design job not found")

    updated_at = row.updated_at.isoformat() if row.updated_at else None
    if row.auto_mode and row.auto_generate_status == "pending":
        return ReverseDesignJobStatusResponse(
            type="job.auto_generate_started",
            job_id=row.job_id,
            status=row.status,
            auto_mode=True,
            generate_job_id=row.auto_generate_job_id,
            updated_at=updated_at,
            result=row.result_json,
        )
    if row.auto_mode and row.auto_generate_status == "completed":
        return ReverseDesignJobStatusResponse(
            type="job.auto_generate_completed",
            job_id=row.job_id,
            status=row.status,
            auto_mode=True,
            generate_job_id=row.auto_generate_job_id,
            updated_at=updated_at,
            result=row.result_json,
            generate_result=row.auto_generate_result_json,
        )
    if row.auto_mode and row.auto_generate_status == "failed":
        return ReverseDesignJobStatusResponse(
            type="job.auto_generate_failed",
            job_id=row.job_id,
            status=row.status,
            auto_mode=True,
            generate_job_id=row.auto_generate_job_id,
            updated_at=updated_at,
            result=row.result_json,
            error=row.auto_generate_error_text or row.error_text,
        )
    if row.status == "completed":
        return ReverseDesignJobStatusResponse(
            type="job.completed",
            job_id=row.job_id,
            status=row.status,
            auto_mode=row.auto_mode,
            updated_at=updated_at,
            result=row.result_json,
        )
    if row.status == "failed":
        return ReverseDesignJobStatusResponse(
            type="job.failed",
            job_id=row.job_id,
            status=row.status,
            auto_mode=row.auto_mode,
            updated_at=updated_at,
            error=row.error_text,
            result=row.result_json,
        )
    return ReverseDesignJobStatusResponse(
        type="job.accepted",
        job_id=row.job_id,
        status=row.status,
        auto_mode=row.auto_mode,
        updated_at=updated_at,
    )


@router.post("/run", response_model=ReverseDesignStartResponse)
async def run_reverse_design_route(payload: ReverseDesignRequest, db: Session = Depends(get_db)):
    prompt = payload.prompt.strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt is required")

    image_ids = list(dict.fromkeys(payload.image_asset_ids))
    rows = list(db.scalars(select(ImageAsset).where(ImageAsset.id.in_(image_ids))))

    if not rows:
        raise HTTPException(status_code=404, detail="No matching images found")

    path_by_id = {row.id: row.local_image_path for row in rows}
    missing = [image_id for image_id in image_ids if not path_by_id.get(image_id)]
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Images are missing local_image_path: {missing}",
        )

    image_paths = [path_by_id[image_id] for image_id in image_ids if path_by_id.get(image_id)]

    job_id = await reverse_design_jobs.create_and_start_job(
        prompt=prompt,
        image_paths=image_paths,
        auto_mode=payload.auto_mode,
        callback_host=settings.reverse_design_callback_host,
        callback_port=settings.reverse_design_callback_port,
    )

    return ReverseDesignStartResponse(job_id=job_id, status="pending")


@router.websocket("/ws/{job_id}")
async def reverse_design_socket(websocket: WebSocket, job_id: str):
    await reverse_design_jobs.register_frontend_socket(job_id, websocket)

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        await reverse_design_jobs.unregister_frontend_socket(job_id, websocket)
