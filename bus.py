"""
Mission Control — Core EventBus v2
WebSocket broadcast pour tous les modules.
"""

import json
from datetime import datetime
from typing import Any
from fastapi import WebSocket


class EventBus:
    """Bus d'événements partagé — point central de communication entre modules."""

    def __init__(self):
        self._sockets: list[WebSocket] = []

    def connect(self, ws: WebSocket) -> None:
        if ws not in self._sockets:
            self._sockets.append(ws)

    def disconnect(self, ws: WebSocket) -> None:
        if ws in self._sockets:
            self._sockets.remove(ws)

    async def emit(self, event: str, data: Any, level: str = "info") -> None:
        payload = json.dumps({
            "event": event,
            "data": data,
            "level": level,
            "ts": datetime.now().isoformat(),
        })
        dead: list[WebSocket] = []
        for ws in self._sockets:
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self._sockets.remove(ws)

    @property
    def connection_count(self) -> int:
        return len(self._sockets)


# Singleton partagé — importé par core/main.py et tous les modules
bus = EventBus()
