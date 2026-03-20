import asyncio
import json
import logging
import uuid
from collections import defaultdict
from copy import deepcopy
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

from fastapi import WebSocket
from starlette.websockets import WebSocketState

from app.db.database import SessionLocal
from app.models.generate_design_job import GenerateDesignJobRecord
from app.services.generate_design_agent import GenerateDesignAgentError, run_generate_design

logger = logging.getLogger(__name__)


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class GenerateDesignJob:
    job_id: str
    design_doc: str
    image_paths: list[str]
    status: str = "pending"
    result: dict[str, Any] | None = None
    error: str | None = None
    created_at: str = field(default_factory=_utc_now_iso)
    updated_at: str = field(default_factory=_utc_now_iso)


class GenerateDesignJobManager:
    def __init__(self) -> None:
        self._jobs: dict[str, GenerateDesignJob] = {}
        self._job_sockets: dict[str, set[WebSocket]] = defaultdict(set)
        self._server: asyncio.AbstractServer | None = None
        self._lock = asyncio.Lock()

    async def start_agent_callback_server(self, host: str, port: int) -> None:
        if self._server is not None:
            return

        self._server = await asyncio.start_server(self._handle_agent_client, host, port)
        logger.info("Generate-design callback socket server listening on %s:%s", host, port)

    async def stop_agent_callback_server(self) -> None:
        if self._server is None:
            return
        self._server.close()
        await self._server.wait_closed()
        self._server = None

    async def create_and_start_job(
        self,
        *,
        design_doc: str,
        image_paths: list[str],
        callback_host: str,
        callback_port: int,
    ) -> str:
        job_id = str(uuid.uuid4())
        job = GenerateDesignJob(job_id=job_id, design_doc=design_doc, image_paths=image_paths)

        async with self._lock:
            self._jobs[job_id] = job

        await self._notify_job_update(job_id)
        asyncio.create_task(self._run_job(job_id=job_id, callback_host=callback_host, callback_port=callback_port))
        return job_id

    async def register_frontend_socket(self, job_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._job_sockets[job_id].add(websocket)

        await self._send_current_state(job_id, websocket)

    async def unregister_frontend_socket(self, job_id: str, websocket: WebSocket) -> None:
        async with self._lock:
            sockets = self._job_sockets.get(job_id)
            if not sockets:
                return
            sockets.discard(websocket)
            if not sockets:
                self._job_sockets.pop(job_id, None)

    async def _run_job(self, *, job_id: str, callback_host: str, callback_port: int) -> None:
        job = self._jobs.get(job_id)
        if job is None:
            return

        try:
            payload = await asyncio.to_thread(
                run_generate_design,
                job.design_doc,
                job.image_paths,
                job_id,
                callback_host,
                callback_port,
            )

            async with self._lock:
                current = self._jobs.get(job_id)
                if current is None or current.status in {"completed", "failed"}:
                    return
                current.status = "completed"
                current.result = payload
                current.error = None
                current.updated_at = _utc_now_iso()

            await self._notify_job_update(job_id)
        except GenerateDesignAgentError as exc:
            async with self._lock:
                current = self._jobs.get(job_id)
                if current is None or current.status in {"completed", "failed"}:
                    return
                current.status = "failed"
                current.error = str(exc)
                current.updated_at = _utc_now_iso()

            await self._notify_job_update(job_id)
        except Exception as exc:  # pragma: no cover
            logger.exception("Unexpected generate-design job error for %s", job_id)
            async with self._lock:
                current = self._jobs.get(job_id)
                if current is None or current.status in {"completed", "failed"}:
                    return
                current.status = "failed"
                current.error = f"Unexpected job error: {exc}"
                current.updated_at = _utc_now_iso()

            await self._notify_job_update(job_id)

    async def _handle_agent_client(self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter) -> None:
        addr = writer.get_extra_info("peername")
        try:
            data = await reader.readline()
            if not data:
                return

            payload = json.loads(data.decode("utf-8"))
            await self._ingest_agent_payload(payload)
        except Exception:
            logger.exception("Failed processing generate-design callback payload from %s", addr)
        finally:
            writer.close()
            await writer.wait_closed()

    async def _ingest_agent_payload(self, payload: dict[str, Any]) -> None:
        job_id = str(payload.get("job_id") or "").strip()
        if not job_id:
            return

        event = payload.get("event")
        result = payload.get("result") if isinstance(payload.get("result"), dict) else None
        error = payload.get("error")

        async with self._lock:
            job = self._jobs.get(job_id)
            if job is None:
                return
            if job.status in {"completed", "failed"}:
                return

            if event == "generate_design.completed":
                job.status = "completed"
                job.result = result
                job.error = None
            else:
                job.status = "failed"
                job.error = str(error or "Generate-design agent failed")
                if result:
                    job.result = result

            job.updated_at = _utc_now_iso()

        await self._notify_job_update(job_id)

    async def _send_current_state(self, job_id: str, websocket: WebSocket) -> None:
        async with self._lock:
            job = self._jobs.get(job_id)
        if job is None:
            await websocket.send_json(
                {
                    "type": "job.not_found",
                    "job_id": job_id,
                    "status": "not_found",
                }
            )
            return

        await websocket.send_json(self._job_to_socket_message(job))

    async def _notify_job_update(self, job_id: str) -> None:
        async with self._lock:
            job = self._jobs.get(job_id)
            sockets = list(self._job_sockets.get(job_id, set()))

        if job is None:
            return

        await asyncio.to_thread(self._persist_job_sync, deepcopy(job))

        message = self._job_to_socket_message(job)

        stale: list[WebSocket] = []
        for ws in sockets:
            try:
                if ws.application_state == WebSocketState.CONNECTED:
                    await ws.send_json(message)
                else:
                    stale.append(ws)
            except Exception:
                stale.append(ws)

        if stale:
            async with self._lock:
                socket_set = self._job_sockets.get(job_id)
                if socket_set:
                    for ws in stale:
                        socket_set.discard(ws)

    def _persist_job_sync(self, job: GenerateDesignJob) -> None:
        db = SessionLocal()
        try:
            row = db.get(GenerateDesignJobRecord, job.job_id)
            if row is None:
                row = GenerateDesignJobRecord(job_id=job.job_id)
                db.add(row)

            row.status = job.status
            row.design_doc = job.design_doc
            row.image_paths = job.image_paths
            row.result_json = job.result
            row.error_text = job.error
            db.commit()
        finally:
            db.close()

    def _job_to_socket_message(self, job: GenerateDesignJob) -> dict[str, Any]:
        if job.status == "completed":
            return {
                "type": "job.completed",
                "job_id": job.job_id,
                "status": job.status,
                "result": job.result,
                "updated_at": job.updated_at,
            }
        if job.status == "failed":
            return {
                "type": "job.failed",
                "job_id": job.job_id,
                "status": job.status,
                "error": job.error,
                "result": job.result,
                "updated_at": job.updated_at,
            }

        return {
            "type": "job.accepted",
            "job_id": job.job_id,
            "status": job.status,
            "updated_at": job.updated_at,
        }


generate_design_jobs = GenerateDesignJobManager()
