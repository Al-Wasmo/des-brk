from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.database import get_db
from app.models.generate_design_job import GenerateDesignJobRecord
from app.models.image_asset import ImageAsset
from app.schemas.generate_design import (
    GenerateDesignJobStatusResponse,
    GenerateDesignRequest,
    GenerateDesignStartResponse,
)
from app.services.generate_design_jobs import generate_design_jobs

router = APIRouter(prefix="/generate-design", tags=["generate-design"])


@router.get("/jobs/{job_id}", response_model=GenerateDesignJobStatusResponse)
def get_generate_design_job_status(job_id: str, db: Session = Depends(get_db)):
    row = db.get(GenerateDesignJobRecord, job_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Generate-design job not found")

    updated_at = row.updated_at.isoformat() if row.updated_at else None
    if row.status == "completed":
        return GenerateDesignJobStatusResponse(
            type="job.completed",
            job_id=row.job_id,
            status=row.status,
            updated_at=updated_at,
            result=row.result_json,
        )
    if row.status == "failed":
        return GenerateDesignJobStatusResponse(
            type="job.failed",
            job_id=row.job_id,
            status=row.status,
            updated_at=updated_at,
            error=row.error_text,
            result=row.result_json,
        )
    return GenerateDesignJobStatusResponse(
        type="job.accepted",
        job_id=row.job_id,
        status=row.status,
        updated_at=updated_at,
    )


@router.post("/run", response_model=GenerateDesignStartResponse)
async def run_generate_design_route(payload: GenerateDesignRequest, db: Session = Depends(get_db)):
    design_doc = payload.design_doc.strip()
    if not design_doc:
        raise HTTPException(status_code=400, detail="Design document is required")

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

    job_id = await generate_design_jobs.create_and_start_job(
        design_doc=design_doc,
        image_paths=image_paths,
        callback_host=settings.generate_design_callback_host,
        callback_port=settings.generate_design_callback_port,
    )

    return GenerateDesignStartResponse(job_id=job_id, status="pending")


@router.websocket("/ws/{job_id}")
async def generate_design_socket(websocket: WebSocket, job_id: str):
    await generate_design_jobs.register_frontend_socket(job_id, websocket)

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        await generate_design_jobs.unregister_frontend_socket(job_id, websocket)
