#!/usr/bin/env python3

import argparse
import json
import socket
import shutil
import subprocess
from datetime import datetime, timezone
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run design-generation agent in Docker with staged images.")
    parser.add_argument(
        "--images",
        nargs="+",
        required=True,
        help="Absolute or relative paths to images that should be staged for generation context.",
    )
    parser.add_argument(
        "--docker-image",
        default="gemini-cli:latest",
        help="Docker image containing gemini CLI and dependencies.",
    )
    parser.add_argument(
        "--design-doc",
        required=True,
        help="Design document text that should be appended to the generation prompt.",
    )
    parser.add_argument(
        "--output-file",
        default="index.html",
        help="Expected HTML file name inside mounted /app dir.",
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

        ext = src.suffix or ".png"
        safe_name = f"{index:03d}_{src.stem}{ext}"
        dst = stage_dir / safe_name
        shutil.copy2(src, dst)

    return stage_dir


def build_prompt(output_file: str, design_doc: str) -> str:
    return f"""
Generate 3-4 unique pages based on the provided design file. Each page should be different but follow the general structure and principles outlined in the file.

Create the pages in HTML, CSS, and JavaScript.

Output the result as an index.html file in the specified directory /app/{output_file}.

This is a mock design, so the pages should be functional and structured according to the guidelines in the design document.

for images and icons dont use local stuff, use online images because local ones wont works 100%

Design document:
{design_doc.strip()}
""".strip()


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
                "event": "generate_design.failed",
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

    final_prompt = build_prompt(args.output_file, args.design_doc)

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
                "event": "generate_design.failed",
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

    output_path = stage_dir / args.output_file
    output_text = output_path.read_text(encoding="utf-8") if output_path.exists() else None

    result = {
        "ok": process.returncode == 0,
        "stage_dir": str(stage_dir),
        "output_file": str(output_path),
        "output_text": output_text,
        "stdout": process.stdout,
        "stderr": process.stderr,
        "returncode": process.returncode,
    }

    if args.job_id:
        callback_payload = {
            "event": "generate_design.completed" if result["ok"] else "generate_design.failed",
            "job_id": args.job_id,
            "error": None if result["ok"] else (result["stderr"] or "Generate-design agent failed"),
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
