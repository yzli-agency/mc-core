"""
Mission Control — Core DB v2
Connexion SQLite partagée. Chaque module peut réutiliser ces helpers.
"""

import sqlite3
from pathlib import Path
from typing import Any, Optional

# La DB maîtresse est dans memory/sqlite/master.db
# Les modules peuvent avoir leurs propres tables dans cette DB (migrations/)
_BASE = Path(__file__).parent.parent  # mission-control/
DB_PATH = _BASE / "memory" / "sqlite" / "master.db"


def get_conn() -> sqlite3.Connection:
    """Retourne une connexion SQLite avec row_factory activé."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def q(sql: str, params: tuple = (), *, one: bool = False) -> Any:
    """SELECT — retourne un dict ou une liste de dicts."""
    conn = get_conn()
    cur = conn.execute(sql, params)
    if one:
        row = cur.fetchone()
        conn.close()
        return dict(row) if row else None
    rows = cur.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def run(sql: str, params: tuple = ()) -> int:
    """INSERT / UPDATE / DELETE — retourne lastrowid."""
    conn = get_conn()
    cur = conn.execute(sql, params)
    conn.commit()
    lid = cur.lastrowid
    conn.close()
    return lid


def execute_script(sql_script: str) -> None:
    """Exécute un bloc SQL multi-statements (migrations)."""
    conn = get_conn()
    conn.executescript(sql_script)
    conn.commit()
    conn.close()


def log_db(agent: str, message: str, level: str = "info", context: Optional[str] = None) -> None:
    """Insère un log dans agent_logs (table core)."""
    try:
        run(
            "INSERT INTO agent_logs (agent, level, message, context) VALUES (?,?,?,?)",
            (agent, level, message, context),
        )
    except Exception:
        pass  # Silently fail if table not yet created
