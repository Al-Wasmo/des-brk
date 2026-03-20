from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.prompt_preset import PromptPreset
from app.schemas.prompts import PromptPresetCreateRequest, PromptPresetResponse

router = APIRouter(prefix="/prompts", tags=["prompts"])


@router.get("", response_model=list[PromptPresetResponse])
def list_prompt_presets(db: Session = Depends(get_db)):
    query = select(PromptPreset).order_by(PromptPreset.updated_at.desc(), PromptPreset.id.desc())
    return list(db.scalars(query))


@router.post("", response_model=PromptPresetResponse)
def save_prompt_preset(payload: PromptPresetCreateRequest, db: Session = Depends(get_db)):
    prompt_text = payload.prompt.strip()
    if not prompt_text:
        raise HTTPException(status_code=400, detail="Prompt is required")

    title = payload.title.strip() if payload.title else ""
    if not title:
        first_line = next((line.strip() for line in prompt_text.splitlines() if line.strip()), "Saved prompt")
        title = first_line[:255]

    row = PromptPreset(title=title, prompt=prompt_text)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.delete("/{prompt_id}")
def delete_prompt_preset(prompt_id: int, db: Session = Depends(get_db)):
    row = db.get(PromptPreset, prompt_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Prompt preset not found")

    db.delete(row)
    db.commit()
    return {"deleted": True}
