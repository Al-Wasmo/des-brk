from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.conversations import router as conversations_router
from app.api.routes.context import router as context_router
from app.api.routes.generate_design import router as generate_design_router
from app.api.routes.images import router as images_router
from app.api.routes.prompts import router as prompts_router
from app.api.routes.reverse_design import router as reverse_design_router
from app.api.routes.workspaces import router as workspaces_router
from app.core.config import settings
from app.db.database import Base, engine
from app.models.context_item import ContextItem
from app.models.conversation import Conversation
from app.models.conversation_message import ConversationMessage
from app.models.generate_design_job import GenerateDesignJobRecord
from app.models.image_asset import ImageAsset
from app.models.prompt_preset import PromptPreset
from app.models.reverse_design_job import ReverseDesignJobRecord
from app.models.workspace import Workspace
from app.models.workspace_context_item import WorkspaceContextItem
from app.services.generate_design_jobs import generate_design_jobs
from app.services.reverse_design_jobs import reverse_design_jobs

app = FastAPI(title="des-brk-backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    await reverse_design_jobs.start_agent_callback_server(
        settings.reverse_design_callback_host,
        settings.reverse_design_callback_port,
    )
    await generate_design_jobs.start_agent_callback_server(
        settings.generate_design_callback_host,
        settings.generate_design_callback_port,
    )


@app.on_event("shutdown")
async def on_shutdown() -> None:
    await reverse_design_jobs.stop_agent_callback_server()
    await generate_design_jobs.stop_agent_callback_server()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(images_router, prefix="/api/v1")
app.include_router(context_router, prefix="/api/v1")
app.include_router(conversations_router, prefix="/api/v1")
app.include_router(prompts_router, prefix="/api/v1")
app.include_router(workspaces_router, prefix="/api/v1")
app.include_router(reverse_design_router, prefix="/api/v1")
app.include_router(generate_design_router, prefix="/api/v1")
