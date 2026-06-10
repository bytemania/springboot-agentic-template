---
name: infra-notes
description: Port map, env vars, service dependencies, and Docker memory requirements
metadata:
  type: project
---

## Port map

| Service | Host port | Container port | Notes |
|---|---|---|---|
| Spring Boot API | 8080 | 8080 | health: `/actuator/health` |
| React UI (Nginx) | 3000 | 80 | proxies `/api` → app:8080 |
| Grafana | 3001 | 3000 | admin/admin |
| Prometheus | 9090 | 9090 | scrapes app:8080/actuator/prometheus |
| PostgreSQL | 5432 | 5432 | taskdb / taskuser / taskpass |
| Elasticsearch | 9200 | 9200 | single-node, no auth |
| Kibana | 5601 | 5601 | requires Elasticsearch healthy |
| Logstash | 5044 | 5044 | Beats input |
| Logstash syslog | 5001 | 5000 | **host 5001** (macOS AirPlay uses 5000) |
| OTEL Collector gRPC | 4317 | 4317 | |
| OTEL Collector HTTP | 4318 | 4318 | |

## Required environment variables (`.env`)

```
GITHUB_TOKEN=github_pat_...   # repo + pull_requests:write scope — used by GitHub MCP server
```

Database credentials are hardcoded in `docker-compose.yml` (taskuser/taskpass/taskdb).
Not secrets for local dev, but should be env-var-driven for production.

## Docker Compose service start order

```
db (healthy) → app (healthy) → frontend
elasticsearch (healthy) → logstash
elasticsearch (healthy) → kibana
prometheus, grafana, otel-collector — no dependencies, start immediately
```

## Docker memory requirements

| Mode | Minimum RAM |
|---|---|
| Core only (app + db + grafana + prometheus) | 2 GB |
| Full stack with ELK | 6 GB |
| Minikube full stack | 6 GB (`--memory=6144`) |

Set in Docker Desktop → Settings → Resources → Memory.

## Run without ELK (low memory mode)

```bash
docker compose -f docker-compose.yml -f docker-compose.no-elk.yml up --build -d
```

`docker-compose.no-elk.yml` moves elasticsearch, logstash, kibana to the `elk` profile so they are skipped.

## Prometheus scrape config

- Job name: `task-manager-app`
- Target: `app:8080`
- Path: `/actuator/prometheus`
- Interval: 15s
- Rules directory: `/etc/prometheus/rules/` (mounted from `observability/prometheus/rules/`)

## Grafana provisioning

- Datasources: `observability/grafana/provisioning/datasources/datasources.yml`
  - Prometheus (default, uid: `Prometheus`)
  - Elasticsearch (uid: `Elasticsearch`)
- Dashboard provider: `observability/grafana/provisioning/dashboards/dashboards.yml`
  - Scans `/var/lib/grafana/dashboards` (mounted from `observability/dashboards/`)
  - Auto-reloads every 30s

## MCP server

- Server: `github` (defined in `.mcp.json`)
- Image: `ghcr.io/github/github-mcp-server` (Docker)
- Auth: `GITHUB_PERSONAL_ACCESS_TOKEN` from `$GITHUB_TOKEN` in `.env`
- Required scopes: `repo`, `pull_requests:write`
