from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.image_asset import ImageAsset
from app.models.workspace import Workspace
from app.models.workspace_context_item import WorkspaceContextItem
from app.schemas.images import ImageAssetResponse
from app.schemas.workspaces import (
    WorkspaceContextAddRequest,
    WorkspaceContextItemResponse,
    WorkspaceCreateRequest,
    WorkspaceResponse,
    WorkspaceStateUpdateRequest,
)

router = APIRouter(prefix="/workspaces", tags=["workspaces"])


def _workspace_or_404(db: Session, workspace_id: int) -> Workspace:
    row = db.get(Workspace, workspace_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return row


def _to_context_response(item: WorkspaceContextItem, image: ImageAsset) -> WorkspaceContextItemResponse:
    return WorkspaceContextItemResponse(
        id=item.id,
        workspace_id=item.workspace_id,
        image_asset_id=item.image_asset_id,
        created_at=item.created_at,
        image=ImageAssetResponse.model_validate(image),
    )


def _touch_workspace(workspace: Workspace) -> None:
    workspace.updated_at = datetime.utcnow()


@router.get("", response_model=list[WorkspaceResponse])
def list_workspaces(db: Session = Depends(get_db)):
    query = select(Workspace).order_by(Workspace.updated_at.desc(), Workspace.id.desc())
    return list(db.scalars(query))


@router.post("", response_model=WorkspaceResponse)
def create_workspace(payload: WorkspaceCreateRequest, db: Session = Depends(get_db)):
    existing_count = db.scalar(select(func.count()).select_from(Workspace))
    default_name = f"Workspace {int(existing_count or 0) + 1}"
    name = payload.name.strip() if payload.name else default_name
    if not name:
        name = default_name

    row = Workspace(name=name, state_json={})
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("/{workspace_id}", response_model=WorkspaceResponse)
def get_workspace(workspace_id: int, db: Session = Depends(get_db)):
    return _workspace_or_404(db, workspace_id)


@router.delete("/{workspace_id}")
def delete_workspace(workspace_id: int, db: Session = Depends(get_db)):
    workspace = _workspace_or_404(db, workspace_id)
    db.execute(delete(WorkspaceContextItem).where(WorkspaceContextItem.workspace_id == workspace_id))
    db.delete(workspace)
    db.commit()
    return {"deleted": True}


@router.patch("/{workspace_id}/state", response_model=WorkspaceResponse)
def update_workspace_state(workspace_id: int, payload: WorkspaceStateUpdateRequest, db: Session = Depends(get_db)):
    row = _workspace_or_404(db, workspace_id)
    row.state_json = payload.state
    _touch_workspace(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("/{workspace_id}/context", response_model=list[WorkspaceContextItemResponse])
def list_workspace_context(workspace_id: int, db: Session = Depends(get_db)):
    _workspace_or_404(db, workspace_id)

    rows = db.execute(
        select(WorkspaceContextItem, ImageAsset)
        .join(ImageAsset, ImageAsset.id == WorkspaceContextItem.image_asset_id)
        .where(WorkspaceContextItem.workspace_id == workspace_id)
        .order_by(WorkspaceContextItem.created_at.desc())
    ).all()

    return [_to_context_response(item, image) for item, image in rows]


@router.post("/{workspace_id}/context", response_model=WorkspaceContextItemResponse)
def add_workspace_context(workspace_id: int, payload: WorkspaceContextAddRequest, db: Session = Depends(get_db)):
    workspace = _workspace_or_404(db, workspace_id)

    image = db.get(ImageAsset, payload.image_asset_id)
    if image is None:
        raise HTTPException(status_code=404, detail="Image not found")

    existing = db.scalar(
        select(WorkspaceContextItem).where(
            WorkspaceContextItem.workspace_id == workspace_id,
            WorkspaceContextItem.image_asset_id == payload.image_asset_id,
        )
    )
    if existing is not None:
        _touch_workspace(workspace)
        db.commit()
        return _to_context_response(existing, image)

    row = WorkspaceContextItem(workspace_id=workspace_id, image_asset_id=payload.image_asset_id)
    db.add(row)
    _touch_workspace(workspace)
    db.commit()
    db.refresh(row)

    return _to_context_response(row, image)


@router.delete("/{workspace_id}/context/{context_item_id}")
def delete_workspace_context_item(workspace_id: int, context_item_id: int, db: Session = Depends(get_db)):
    workspace = _workspace_or_404(db, workspace_id)

    row = db.get(WorkspaceContextItem, context_item_id)
    if row is None or row.workspace_id != workspace_id:
        raise HTTPException(status_code=404, detail="Workspace context item not found")

    db.delete(row)
    _touch_workspace(workspace)
    db.commit()
    return {"deleted": True}
