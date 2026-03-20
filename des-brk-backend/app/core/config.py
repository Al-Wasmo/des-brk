import os
from pathlib import Path


class Settings:
    def __init__(self) -> None:
        self.project_root = Path(__file__).resolve().parents[2]
        self.workspace_root = self.project_root.parent
        self.database_url = os.getenv("DATABASE_URL", "sqlite:///./des_brk.db")
        microservice_dir = os.getenv("MICROSERVICE_DIR", "../des-brk-micro")
        self.microservice_dir = (self.project_root / microservice_dir).resolve()
        self.search_script_name = os.getenv("SEARCH_SCRIPT_NAME", "scrape-designs/scrape-content.py")
        self.script_timeout_seconds = int(os.getenv("SCRIPT_TIMEOUT_SECONDS", "240"))

        self.reverse_design_script_name = os.getenv(
            "REVERSE_DESIGN_SCRIPT_NAME",
            "reverse-designs/agent-reverse-design.py",
        )
        self.reverse_design_timeout_seconds = int(os.getenv("REVERSE_DESIGN_TIMEOUT_SECONDS", "900"))
        self.reverse_design_callback_host = os.getenv("REVERSE_DESIGN_CALLBACK_HOST", "127.0.0.1")
        self.reverse_design_callback_port = int(os.getenv("REVERSE_DESIGN_CALLBACK_PORT", "8765"))

        self.generate_design_script_name = os.getenv(
            "GENERATE_DESIGN_SCRIPT_NAME",
            "generate-designs/agent-generate-design.py",
        )
        self.generate_design_timeout_seconds = int(os.getenv("GENERATE_DESIGN_TIMEOUT_SECONDS", "900"))
        self.generate_design_callback_host = os.getenv("GENERATE_DESIGN_CALLBACK_HOST", "127.0.0.1")
        self.generate_design_callback_port = int(os.getenv("GENERATE_DESIGN_CALLBACK_PORT", "8766"))


settings = Settings()
