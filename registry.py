"""
Mission Control — Module Registry v2
Charge les modules depuis modules/installed.json et monte leurs routes sur FastAPI.
"""

import json
import importlib.util
import sys
from pathlib import Path
from typing import Optional

from fastapi import FastAPI

# Chemins
_BASE = Path(__file__).parent.parent  # mission-control/
MODULES_DIR = _BASE / "modules"
INSTALLED_FILE = MODULES_DIR / "installed.json"


def _load_installed() -> list[dict]:
    """Lit modules/installed.json et retourne la liste des modules installés."""
    if not INSTALLED_FILE.exists():
        return []
    try:
        data = json.loads(INSTALLED_FILE.read_text())
        return data if isinstance(data, list) else data.get("modules", [])
    except Exception as e:
        print(f"[registry] Error reading installed.json: {e}")
        return []


def _load_manifest(module_dir: Path) -> Optional[dict]:
    """Charge le manifest.json d'un module."""
    manifest_path = module_dir / "manifest.json"
    if not manifest_path.exists():
        return None
    try:
        return json.loads(manifest_path.read_text())
    except Exception as e:
        print(f"[registry] Error reading manifest {manifest_path}: {e}")
        return None


def _import_routes(module_dir: Path, module_slug: str):
    """Import dynamique de backend/routes.py d'un module."""
    routes_path = module_dir / "backend" / "routes.py"
    if not routes_path.exists():
        return None
    try:
        spec = importlib.util.spec_from_file_location(
            f"mc_module_{module_slug.replace('/', '_')}.routes",
            str(routes_path),
        )
        mod = importlib.util.module_from_spec(spec)
        sys.modules[spec.name] = mod
        spec.loader.exec_module(mod)
        return mod
    except Exception as e:
        print(f"[registry] Error importing routes for {module_slug}: {e}")
        return None


def _run_migrations(module_dir: Path, module_slug: str) -> None:
    """Exécute les migrations SQL du module (backend/migrations/*.sql)."""
    from core_v2.db import execute_script
    migrations_dir = module_dir / "backend" / "migrations"
    if not migrations_dir.exists():
        return
    for sql_file in sorted(migrations_dir.glob("*.sql")):
        try:
            sql = sql_file.read_text()
            execute_script(sql)
            print(f"[registry] Migration applied: {module_slug} / {sql_file.name}")
        except Exception as e:
            print(f"[registry] Migration error {sql_file}: {e}")


def mount_modules(app: FastAPI) -> list[dict]:
    """
    Monte tous les modules installés sur l'app FastAPI.
    Retourne la liste des modules chargés avec leur manifest.
    """
    installed = _load_installed()
    loaded = []

    for entry in installed:
        slug = entry.get("slug", "")
        enabled = entry.get("enabled", True)

        if not slug or not enabled:
            continue

        # Résoudre le répertoire du module
        # Convention : modules/<slug_sans_slash>/  (ex: yzli/kanban → modules/yzli-kanban/)
        safe_name = slug.replace("/", "-")
        module_dir = MODULES_DIR / safe_name

        if not module_dir.exists():
            print(f"[registry] Module dir not found: {module_dir}")
            continue

        manifest = _load_manifest(module_dir)
        if not manifest:
            print(f"[registry] No manifest for {slug}, skipping")
            continue

        # Exécuter les migrations
        _run_migrations(module_dir, slug)

        # Monter les routes backend
        backend_conf = manifest.get("backend", {})
        mount_prefix = backend_conf.get("mount_prefix", f"/api/{safe_name}")

        routes_mod = _import_routes(module_dir, slug)
        if routes_mod and hasattr(routes_mod, "router"):
            app.include_router(routes_mod.router, prefix=mount_prefix)
            print(f"[registry] Mounted {slug} at {mount_prefix}")
        else:
            print(f"[registry] No router found for {slug}")

        loaded.append({
            "slug": slug,
            "name": manifest.get("name", slug),
            "version": manifest.get("version", "?"),
            "mount_prefix": mount_prefix,
            "nav_item": manifest.get("frontend", {}).get("nav_item"),
            "manifest": manifest,
        })

    return loaded


def get_installed_manifests() -> list[dict]:
    """Retourne les manifests de tous les modules installés (sans monter les routes)."""
    installed = _load_installed()
    result = []
    for entry in installed:
        slug = entry.get("slug", "")
        safe_name = slug.replace("/", "-")
        module_dir = MODULES_DIR / safe_name
        manifest = _load_manifest(module_dir)
        if manifest:
            result.append({**manifest, "_dir": str(module_dir)})
    return result
