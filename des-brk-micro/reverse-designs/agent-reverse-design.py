#!/usr/bin/env python3

import argparse
import json
import socket
import shutil
import subprocess
from datetime import datetime, timezone
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run reverse-design agent in Docker with staged images.")
    parser.add_argument(
        "--images",
        nargs="+",
        required=True,
        help="Absolute or relative paths to images that should be staged for analysis.",
    )
    parser.add_argument(
        "--prompt",
        required=True,
        help="User prompt text sent by backend.",
    )
    parser.add_argument(
        "--docker-image",
        default="gemini-cli:latest",
        help="Docker image containing gemini CLI and dependencies.",
    )
    parser.add_argument(
        "--output-file",
        default="reverse-design.md",
        help="Expected output markdown file name inside mounted /app dir.",
    )
    parser.add_argument(
        "--timeout-seconds",
        type=int,
        default=900,
        help="Maximum time for docker command execution.",
    )
    parser.add_argument(
        "--job-id",
        default="",
        help="Backend job id used for callback correlation.",
    )
    parser.add_argument(
        "--backend-socket-host",
        default="127.0.0.1",
        help="Backend socket callback host.",
    )
    parser.add_argument(
        "--backend-socket-port",
        type=int,
        default=8765,
        help="Backend socket callback port.",
    )
    return parser.parse_args()


def stage_images(image_paths: list[str], runs_root: Path) -> Path:
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S_%f")
    stage_dir = runs_root / timestamp
    stage_dir.mkdir(parents=True, exist_ok=False)

    for index, raw_path in enumerate(image_paths, start=1):
        src = Path(raw_path).expanduser().resolve()
        if not src.exists() or not src.is_file():
            raise FileNotFoundError(f"Image path does not exist or is not a file: {src}")

        # Keep deterministic order and preserve extension.
        ext = src.suffix or ".png"
        safe_name = f"{index:03d}_{src.stem}{ext}"
        dst = stage_dir / safe_name
        shutil.copy2(src, dst)

    return stage_dir


def run_docker(stage_dir: Path, docker_image: str, prompt: str, timeout_seconds: int) -> subprocess.CompletedProcess[str]:
    docker_command = [
        "docker",
        "run",
        "--rm",
        "-v",
        f"{stage_dir}:/app",
        docker_image,
        "gemini",
        "--yolo",
        "--prompt",
        prompt,
    ]

    return subprocess.run(
        docker_command,
        capture_output=True,
        text=True,
        check=False,
        timeout=timeout_seconds,
    )


def send_backend_callback(host: str, port: int, payload: dict) -> None:
    message = json.dumps(payload, ensure_ascii=False) + "\n"
    with socket.create_connection((host, port), timeout=10) as sock:
        sock.sendall(message.encode("utf-8"))


def resolve_output_markdown(stage_dir: Path, requested_output_file: str) -> Path | None:
    requested = stage_dir / requested_output_file
    if requested.exists() and requested.is_file():
        return requested

    markdown_candidates: list[Path] = [path for path in stage_dir.iterdir() if path.is_file() and path.suffix.lower() == ".md"]
    if not markdown_candidates:
        return None

    # Pick the newest markdown produced during the run.
    markdown_candidates.sort(key=lambda path: path.stat().st_mtime, reverse=True)
    return markdown_candidates[0]


def main() -> int:
    args = parse_args()

    script_dir = Path(__file__).resolve().parent
    runs_root = script_dir / "runs"

    try:
        stage_dir = stage_images(args.images, runs_root)
    except Exception as exc:
        failure = {"ok": False, "error": str(exc)}
        if args.job_id:
            callback_payload = {
                "event": "reverse_design.failed",
                "job_id": args.job_id,
                "error": str(exc),
                "result": failure,
                "timestamp_utc": datetime.now(timezone.utc).isoformat(),
            }
            try:
                send_backend_callback(args.backend_socket_host, args.backend_socket_port, callback_payload)
            except Exception:
                pass
        print(json.dumps(failure))
        return 1

    final_prompt = args.prompt.strip()

    try:
        process = run_docker(stage_dir, args.docker_image, final_prompt, args.timeout_seconds)
    except subprocess.TimeoutExpired:
        failure = {
            "ok": False,
            "error": f"Docker execution timed out after {args.timeout_seconds} seconds",
            "stage_dir": str(stage_dir),
        }
        if args.job_id:
            callback_payload = {
                "event": "reverse_design.failed",
                "job_id": args.job_id,
                "error": failure["error"],
                "result": failure,
                "timestamp_utc": datetime.now(timezone.utc).isoformat(),
            }
            try:
                send_backend_callback(args.backend_socket_host, args.backend_socket_port, callback_payload)
            except Exception:
                pass
        print(json.dumps(failure))
        return 1

    resolved_output_path = resolve_output_markdown(stage_dir, args.output_file)
    output_text = resolved_output_path.read_text(encoding="utf-8") if resolved_output_path else None

    result = {
        "ok": process.returncode == 0,
        "stage_dir": str(stage_dir),
        "output_file": str(resolved_output_path) if resolved_output_path else None,
        "output_text": output_text,
        "stdout": process.stdout,
        "stderr": process.stderr,
        "returncode": process.returncode,
    }

    if args.job_id:
        callback_payload = {
            "event": "reverse_design.completed" if result["ok"] else "reverse_design.failed",
            "job_id": args.job_id,
            "error": None if result["ok"] else (result["stderr"] or "Reverse-design agent failed"),
            "result": result,
            "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        }
        try:
            send_backend_callback(args.backend_socket_host, args.backend_socket_port, callback_payload)
        except Exception:
            pass

    print(json.dumps(result))
    return 0 if process.returncode == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
