import json
import subprocess
import sys
from pathlib import Path

from app.core.config import settings


class MicroserviceSearchError(RuntimeError):
    pass


def _resolve_script_path() -> Path:
    script_path = settings.microservice_dir / settings.search_script_name
    if not script_path.exists():
        raise MicroserviceSearchError(f"Script not found: {script_path}")
    return script_path


def _resolve_local_image_path(local_image: str, script_path: Path) -> str:
    local_image_path = Path(local_image)
    if local_image_path.is_absolute():
        return str(local_image_path)

    # New micro layout writes relative paths from script cwd (e.g. images/topic/file.png).
    from_script_dir = (script_path.parent / local_image_path).resolve()
    if from_script_dir.exists():
        return str(from_script_dir)

    # Backward-compatible fallback for older layout/path behavior.
    from_micro_root = (settings.microservice_dir / local_image_path).resolve()
    return str(from_micro_root)


def run_search(topic: str) -> list[dict]:
    script_path = _resolve_script_path()

    process = subprocess.run(
        [sys.executable, str(script_path), topic],
        cwd=str(script_path.parent),
        capture_output=True,
        text=True,
        timeout=settings.script_timeout_seconds,
        check=False,
    )

    if process.returncode != 0:
        raise MicroserviceSearchError(process.stderr.strip() or "Search script failed")

    try:
        raw_items = json.loads(process.stdout)
    except json.JSONDecodeError as exc:
        raise MicroserviceSearchError("Invalid JSON output from search script") from exc

    normalized: list[dict] = []
    for item in raw_items:
        local_image = item.get("local_image")
        if local_image:
            local_image = _resolve_local_image_path(local_image, script_path)

        normalized.append(
            {
                "name": item.get("name", ""),
                "href": item.get("href", ""),
                "thumbnail_url": item.get("thumbnail"),
                "local_image_path": local_image,
            }
        )

    return normalized
