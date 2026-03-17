"""
Mission Control — Runtime Config v2
Centralise la configuration : chemins, tokens, URLs.
"""

import json
from pathlib import Path

_HOME = Path.home()
_BASE = Path(__file__).parent.parent  # mission-control/


def load_openclaw() -> dict:
    """Lit ~/.openclaw/openclaw.json."""
    cfg_path = _HOME / ".openclaw" / "openclaw.json"
    try:
        return json.loads(cfg_path.read_text())
    except Exception:
        return {}


def oc_gateway() -> tuple[str, str]:
    """Retourne (url, token) du gateway OpenClaw."""
    cfg = load_openclaw()
    port = cfg.get("gateway", {}).get("port", 18789)
    token = cfg.get("gateway", {}).get("auth", {}).get("token", "")
    return f"http://localhost:{port}", token


def discord_token() -> str:
    cfg = load_openclaw()
    return cfg.get("channels", {}).get("discord", {}).get("token", "")


# Valeurs calculées (utilisées comme constantes dans les modules)
_oc = oc_gateway()
OC_URL = _oc[0]
OC_TOKEN = _oc[1]

# Chemins principaux
BASE_DIR = _BASE
CLIENTS_DIR = _BASE / "clients"
MODULES_DIR = _BASE / "modules"
SCRIPTS_DIR = _BASE / "scripts"
MEMORY_DIR = _BASE / "memory"

# Discord channels
DISCORD_GUILD = "1482881306651132015"
DISCORD_MC_CHANNEL = "1483084587096866948"
DISCORD_ALERTS = "1483084590376685650"
DISCORD_LOGS = "1483084593560289414"
