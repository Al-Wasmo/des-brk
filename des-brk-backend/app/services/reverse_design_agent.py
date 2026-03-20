import json
import subprocess
import sys
from pathlib import Path

from app.core.config import settings


class ReverseDesignAgentError(RuntimeError):
    pass


def _resolve_script_path() -> Path:
    script_path = settings.microservice_dir / settings.reverse_design_script_name
    if not script_path.exists():
        raise ReverseDesignAgentError(f"Script not found: {script_path}")
    return script_path


def run_reverse_design(
    prompt: str,
    image_paths: list[str],
    job_id: str,
    callback_host: str,
    callback_port: int,
) -> dict:
    if not image_paths:
        raise ReverseDesignAgentError("At least one image path is required")

    script_path = _resolve_script_path()

    command = [
        sys.executable,
        str(script_path),
        "--prompt",
        prompt,
        "--images",
        *image_paths,
        "--output-file",
        "design-doc.md",
        "--timeout-seconds",
        str(settings.reverse_design_timeout_seconds),
        "--job-id",
        job_id,
        "--backend-socket-host",
        callback_host,
        "--backend-socket-port",
        str(callback_port),
    ]

    process = subprocess.run(
        command,
        cwd=str(script_path.parent),
        capture_output=True,
        text=True,
        timeout=settings.reverse_design_timeout_seconds + 30,
        check=False,
    )

    stdout = process.stdout.strip()
    if not stdout:
        raise ReverseDesignAgentError(process.stderr.strip() or "Reverse-design agent produced no output")

    try:
        payload = json.loads(stdout)
    except json.JSONDecodeError as exc:
        raise ReverseDesignAgentError("Invalid JSON output from reverse-design agent") from exc

    if process.returncode != 0 or not payload.get("ok", False):
        error_message = payload.get("error") or payload.get("stderr") or process.stderr.strip() or "Reverse-design agent failed"
        raise ReverseDesignAgentError(error_message)

    return payload
