"""
Mission Control — Core v2 (coquille vide)
Le core ne fait rien par lui-même. Il fournit :
- Un runtime FastAPI + WebSocket
- Un registry de modules (montage dynamique)
- Les endpoints core : /api/health, /api/modules, /ws/events

Démarrer : uvicorn core_v2.main:app --host 0.0.0.0 --port 8889 --reload
(port 8889 pour co-exister avec le monolithe sur 8888)
"""

import json
import sys
from pathlib import Path
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from fastapi.requests import Request

# Ajouter le parent de core-v2 au sys.path pour les imports inter-modules
_ROOT = Path(__file__).parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))
# Aussi ajouter core-v2 lui-même sous l'alias core_v2
_CORE = Path(__file__).parent
if str(_CORE.parent) not in sys.path:
    sys.path.insert(0, str(_CORE.parent))

from core_v2.bus import bus
from core_v2.db import q, log_db
from core_v2.config import BASE_DIR, MODULES_DIR

# ─── App ──────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Mission Control",
    version="2.0.0-modular",
    description="Core modulaire — les vues sont des modules indépendants",
)

# Fichiers statiques core (partagés entre modules)
_STATIC = _CORE / "static"
_STATIC.mkdir(exist_ok=True)
app.mount("/static/core", StaticFiles(directory=str(_STATIC)), name="static-core")

templates = Jinja2Templates(directory=str(_CORE / "templates"))

# ─── Registry — monter les modules ────────────────────────────────────────────

_loaded_modules: list[dict] = []

try:
    from core_v2.registry import mount_modules
    _loaded_modules = mount_modules(app)
    print(f"[core] {len(_loaded_modules)} module(s) chargé(s)")
except Exception as e:
    print(f"[core] Registry error: {e}")

# Servir les fichiers statiques de chaque module
for _mod in _loaded_modules:
    _slug = _mod["slug"]
    _safe = _slug.replace("/", "-")
    _frontend_dir = MODULES_DIR / _safe / "frontend"
    if _frontend_dir.exists():
        try:
            app.mount(
                f"/static/modules/{_safe}",
                StaticFiles(directory=str(_frontend_dir)),
                name=f"static-module-{_safe}",
            )
        except Exception:
            pass

# ─── Core endpoints ───────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "version": "2.0.0-modular",
        "modules": len(_loaded_modules),
        "ws_connections": bus.connection_count,
    }


@app.get("/api/modules")
def list_modules():
    """Liste les modules installés et chargés."""
    return {
        "count": len(_loaded_modules),
        "modules": [
            {
                "slug": m["slug"],
                "name": m["name"],
                "version": m["version"],
                "mount_prefix": m["mount_prefix"],
                "nav_item": m.get("nav_item"),
            }
            for m in _loaded_modules
        ],
    }


@app.get("/api/nav")
def nav_items():
    """Retourne les items de navigation pour la sidebar (générés depuis les modules)."""
    items = []
    for m in _loaded_modules:
        nav = m.get("nav_item")
        if nav:
            items.append({**nav, "module": m["slug"]})
    # Trier par sort_order
    items.sort(key=lambda x: x.get("sort_order", 99))
    return items


# ─── WebSocket live feed ──────────────────────────────────────────────────────

@app.websocket("/ws/events")
async def ws_events(websocket: WebSocket):
    await websocket.accept()
    bus.connect(websocket)
    # Envoyer les 50 derniers logs au connect
    try:
        logs = q("SELECT * FROM agent_logs ORDER BY logged_at DESC LIMIT 50")
        for log in reversed(logs):
            try:
                await websocket.send_text(json.dumps({
                    "event": "log",
                    "data": dict(log),
                    "level": log["level"],
                    "ts": log["logged_at"],
                }))
            except Exception:
                break
    except Exception:
        pass
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        bus.disconnect(websocket)


# ─── Shell HTML (coquille vide) ───────────────────────────────────────────────

@app.get("/", response_class=HTMLResponse)
async def shell(request: Request):
    """Retourne le shell HTML minimal — la sidebar est construite dynamiquement."""
    return templates.TemplateResponse("shell.html", {
        "request": request,
        "modules": _loaded_modules,
        "nav_items": [m.get("nav_item") for m in _loaded_modules if m.get("nav_item")],
    })


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("core_v2.main:app", host="0.0.0.0", port=8889, reload=True)
