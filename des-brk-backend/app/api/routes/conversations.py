from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.conversation import Conversation
from app.models.conversation_message import ConversationMessage
from app.schemas.conversations import (
    ConversationCreateRequest,
    ConversationResponse,
    MessageCreateRequest,
    MessageResponse,
)

router = APIRouter(prefix="/conversations", tags=["conversations"])


@router.post("", response_model=ConversationResponse)
def create_conversation(payload: ConversationCreateRequest, db: Session = Depends(get_db)):
    row = Conversation(title=payload.title.strip())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("", response_model=list[ConversationResponse])
def list_conversations(db: Session = Depends(get_db)):
    return list(db.scalars(select(Conversation).order_by(Conversation.created_at.desc())))


@router.get("/{conversation_id}/messages", response_model=list[MessageResponse])
def list_messages(conversation_id: int, db: Session = Depends(get_db)):
    conversation = db.get(Conversation, conversation_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")

    query = (
        select(ConversationMessage)
        .where(ConversationMessage.conversation_id == conversation_id)
        .order_by(ConversationMessage.created_at.asc())
    )
    return list(db.scalars(query))


@router.post("/{conversation_id}/messages", response_model=MessageResponse)
def add_message(conversation_id: int, payload: MessageCreateRequest, db: Session = Depends(get_db)):
    conversation = db.get(Conversation, conversation_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")

    row = ConversationMessage(
        conversation_id=conversation_id,
        role=payload.role.strip(),
        content=payload.content,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row
