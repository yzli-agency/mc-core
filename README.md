# Mission Control — Core v2 (Modulaire)

> **Co-existence garantie** — ce core tourne sur le port **8889**  
> Le monolithe continue sur son port habituel **8888**

## Démarrer le core-v2

```bash
cd /Users/claude/.openclaw/workspace/mission-control

# Depuis le dossier parent de core-v2
uvicorn core_v2.main:app --host 0.0.0.0 --port 8889 --reload
```

## Structure

```
mission-control/
├── core-v2/              ← Core modulaire (coquille vide)
│   ├── main.py           ← FastAPI app + montage dynamique des modules
│   ├── registry.py       ← Chargeur de modules depuis installed.json
│   ├── bus.py            ← EventBus WebSocket partagé
│   ├── db.py             ← Connexion SQLite partagée
│   ├── config.py         ← Config runtime (chemins, tokens)
│   └── templates/
│       └── shell.html    ← Shell HTML minimal (sans aucune vue par défaut)
│
└── modules/              ← Tous les modules installables
    ├── installed.json    ← Liste des modules actifs
    ├── yzli-auth/        ← Module yzli/auth
    ├── yzli-clients/     ← Module yzli/clients
    ├── yzli-agents/      ← Module yzli/agents
    ├── yzli-kanban/      ← Module yzli/kanban
    ├── yzli-pipeline/    ← Module yzli/pipeline
    └── yzli-cells/       ← Module yzli/cells
```

## Endpoints core (toujours disponibles)

```
GET  /api/health     ← Statut + nb de modules chargés
GET  /api/modules    ← Modules installés et actifs
GET  /api/nav        ← Nav items pour la sidebar
WS   /ws/events      ← Bus d'événements live
GET  /               ← Shell HTML
```

## Installer/désactiver un module

Modifier `modules/installed.json` :

```json
[
  { "slug": "yzli/kanban", "version": "1.0.0", "enabled": true }
]
```

Mettre `"enabled": false` pour désactiver sans supprimer.

## Ajouter un nouveau module

1. Créer `modules/mon-module/` avec la structure standard
2. Écrire `manifest.json` (voir ARCHITECTURE.md)
3. Ajouter l'entrée dans `installed.json`
4. Redémarrer le core-v2

## Migration depuis le monolithe

Le monolithe (`core/app/server.py`) continue de fonctionner normalement sur le port 8888.  
Le core-v2 est un **miroir modulaire** qui coexiste. Une fois tous les modules validés,  
migrer les clients du monolithe vers le core-v2 (changer le port).

**Phase de transition :**  
`Monolithe :8888` → test → `Core-v2 :8889` → validation → inverser les ports
