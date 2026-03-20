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

from app.core.config import settings
from app.db.database import SessionLocal
from app.models.reverse_design_job import ReverseDesignJobRecord
from app.services.generate_design_agent import GenerateDesignAgentError, run_generate_design
from app.services.reverse_design_agent import ReverseDesignAgentError, run_reverse_design

logger = logging.getLogger(__name__)


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class ReverseDesignJob:
    job_id: str
    prompt: str
    image_paths: list[str]
    auto_mode: bool = False
    status: str = "pending"
    result: dict[str, Any] | None = None
    error: str | None = None
    auto_generate_job_id: str | None = None
    auto_generate_status: str | None = None
    auto_generate_result: dict[str, Any] | None = None
    auto_generate_error: str | None = None
    created_at: str = field(default_factory=_utc_now_iso)
    updated_at: str = field(default_factory=_utc_now_iso)


class ReverseDesignJobManager:
    def __init__(self) -> None:
        self._jobs: dict[str, ReverseDesignJob] = {}
        self._job_sockets: dict[str, set[WebSocket]] = defaultdict(set)
        self._server: asyncio.AbstractServer | None = None
        self._lock = asyncio.Lock()

    async def start_agent_callback_server(self, host: str, port: int) -> None:
        if self._server is not None:
            return

        self._server = await asyncio.start_server(self._handle_agent_client, host, port)
        logger.info("Reverse-design callback socket server listening on %s:%s", host, port)

    async def stop_agent_callback_server(self) -> None:
        if self._server is None:
            return
        self._server.close()
        await self._server.wait_closed()
        self._server = None

    async def create_and_start_job(
        self,
        *,
        prompt: str,
        image_paths: list[str],
        auto_mode: bool,
        callback_host: str,
        callback_port: int,
    ) -> str:
        job_id = str(uuid.uuid4())
        job = ReverseDesignJob(
            job_id=job_id,
            prompt=prompt,
            image_paths=image_paths,
            auto_mode=auto_mode,
        )

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
                run_reverse_design,
                job.prompt,
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
            await self._maybe_run_auto_generate(job_id)
        except ReverseDesignAgentError as exc:
            async with self._lock:
                current = self._jobs.get(job_id)
                if current is None or current.status in {"completed", "failed"}:
                    return
                current.status = "failed"
                current.error = str(exc)
                current.updated_at = _utc_now_iso()

            await self._notify_job_update(job_id)
        except Exception as exc:  # pragma: no cover
            logger.exception("Unexpected reverse-design job error for %s", job_id)
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
            logger.exception("Failed processing reverse-design callback payload from %s", addr)
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

            if event == "reverse_design.completed":
                job.status = "completed"
                job.result = result
                job.error = None
            else:
                job.status = "failed"
                job.error = str(error or "Reverse-design agent failed")
                if result:
                    job.result = result

            job.updated_at = _utc_now_iso()

        await self._notify_job_update(job_id)
        await self._maybe_run_auto_generate(job_id)

    async def _maybe_run_auto_generate(self, job_id: str) -> None:
        async with self._lock:
            job = self._jobs.get(job_id)
            if job is None or job.status != "completed" or not job.auto_mode:
                return
            if job.auto_generate_status in {"pending", "completed", "failed"}:
                return

            design_doc = str((job.result or {}).get("output_text") or "").strip()
            if not design_doc:
                job.auto_generate_status = "failed"
                job.auto_generate_error = "Auto mode enabled but reverse-design output_text is empty"
                job.updated_at = _utc_now_iso()
                should_notify_failure = True
            else:
                child_job_id = str(uuid.uuid4())
                job.auto_generate_job_id = child_job_id
                job.auto_generate_status = "pending"
                job.auto_generate_error = None
                job.auto_generate_result = None
                job.updated_at = _utc_now_iso()
                image_paths = list(job.image_paths)
                should_notify_failure = False

        if should_notify_failure:
            await self._notify_job_update(job_id)
            return

        await self._notify_job_update(job_id)

        try:
            payload = await asyncio.to_thread(
                run_generate_design,
                design_doc,
                image_paths,
                child_job_id,
                settings.generate_design_callback_host,
                settings.generate_design_callback_port,
            )
            async with self._lock:
                current = self._jobs.get(job_id)
                if current is None:
                    return
                current.auto_generate_status = "completed"
                current.auto_generate_result = payload
                current.auto_generate_error = None
                current.updated_at = _utc_now_iso()
        except GenerateDesignAgentError as exc:
            async with self._lock:
                current = self._jobs.get(job_id)
                if current is None:
                    return
                current.auto_generate_status = "failed"
                current.auto_generate_error = str(exc)
                current.updated_at = _utc_now_iso()
        except Exception as exc:  # pragma: no cover
            logger.exception("Unexpected auto generate-design job error for %s", job_id)
            async with self._lock:
                current = self._jobs.get(job_id)
                if current is None:
                    return
                current.auto_generate_status = "failed"
                current.auto_generate_error = f"Unexpected auto generate error: {exc}"
                current.updated_at = _utc_now_iso()

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

    def _persist_job_sync(self, job: ReverseDesignJob) -> None:
        db = SessionLocal()
        try:
            row = db.get(ReverseDesignJobRecord, job.job_id)
            if row is None:
                row = ReverseDesignJobRecord(job_id=job.job_id)
                db.add(row)

            row.status = job.status
            row.prompt = job.prompt
            row.image_paths = job.image_paths
            row.auto_mode = job.auto_mode
            row.result_json = job.result
            row.error_text = job.error
            row.auto_generate_job_id = job.auto_generate_job_id
            row.auto_generate_status = job.auto_generate_status
            row.auto_generate_result_json = job.auto_generate_result
            row.auto_generate_error_text = job.auto_generate_error
            db.commit()
        finally:
            db.close()

    def _job_to_socket_message(self, job: ReverseDesignJob) -> dict[str, Any]:
        if job.auto_mode and job.auto_generate_status == "pending":
            return {
                "type": "job.auto_generate_started",
                "job_id": job.job_id,
                "status": job.status,
                "auto_mode": True,
                "generate_job_id": job.auto_generate_job_id,
                "result": job.result,
                "updated_at": job.updated_at,
            }
        if job.auto_mode and job.auto_generate_status == "completed":
            return {
                "type": "job.auto_generate_completed",
                "job_id": job.job_id,
                "status": job.status,
                "auto_mode": True,
                "generate_job_id": job.auto_generate_job_id,
                "result": job.result,
                "generate_result": job.auto_generate_result,
                "updated_at": job.updated_at,
            }
        if job.auto_mode and job.auto_generate_status == "failed":
            return {
                "type": "job.auto_generate_failed",
                "job_id": job.job_id,
                "status": job.status,
                "auto_mode": True,
                "generate_job_id": job.auto_generate_job_id,
                "error": job.auto_generate_error,
                "result": job.result,
                "updated_at": job.updated_at,
            }
        if job.status == "completed":
            return {
                "type": "job.completed",
                "job_id": job.job_id,
                "status": job.status,
                "auto_mode": job.auto_mode,
                "result": job.result,
                "updated_at": job.updated_at,
            }
        if job.status == "failed":
            return {
                "type": "job.failed",
                "job_id": job.job_id,
                "status": job.status,
                "auto_mode": job.auto_mode,
                "error": job.error,
                "result": job.result,
                "updated_at": job.updated_at,
            }

        return {
            "type": "job.accepted",
            "job_id": job.job_id,
            "status": job.status,
            "auto_mode": job.auto_mode,
            "updated_at": job.updated_at,
        }


reverse_design_jobs = ReverseDesignJobManager()
