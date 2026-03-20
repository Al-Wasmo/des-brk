import json
import subprocess
import sys
from pathlib import Path

from app.core.config import settings


class GenerateDesignAgentError(RuntimeError):
    pass


def _resolve_script_path() -> Path:
    script_path = settings.microservice_dir / settings.generate_design_script_name
    if not script_path.exists():
        raise GenerateDesignAgentError(f"Script not found: {script_path}")
    return script_path


def run_generate_design(
    design_doc: str,
    image_paths: list[str],
    job_id: str,
    callback_host: str,
    callback_port: int,
) -> dict:
    if not image_paths:
        raise GenerateDesignAgentError("At least one image path is required")

    if not design_doc.strip():
        raise GenerateDesignAgentError("Design document is required")

    script_path = _resolve_script_path()

    command = [
        sys.executable,
        str(script_path),
        "--design-doc",
        design_doc,
        "--images",
        *image_paths,
        "--output-file",
        "index.html",
        "--timeout-seconds",
        str(settings.generate_design_timeout_seconds),
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
        timeout=settings.generate_design_timeout_seconds + 30,
        check=False,
    )

    stdout = process.stdout.strip()
    if not stdout:
        raise GenerateDesignAgentError(process.stderr.strip() or "Generate-design agent produced no output")

    try:
        payload = json.loads(stdout)
    except json.JSONDecodeError as exc:
        raise GenerateDesignAgentError("Invalid JSON output from generate-design agent") from exc

    if process.returncode != 0 or not payload.get("ok", False):
        error_message = payload.get("error") or payload.get("stderr") or process.stderr.strip() or "Generate-design agent failed"
        raise GenerateDesignAgentError(error_message)

    return payload
