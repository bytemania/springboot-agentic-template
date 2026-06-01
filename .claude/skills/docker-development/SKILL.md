---
name: docker-development
description: >
  Manage the full local Docker Compose stack for this project (app, frontend, postgres,
  prometheus, grafana, otel-collector, elasticsearch, logstash, kibana).
  Also covers Minikube deployment. Use when starting/stopping the stack, checking logs,
  rebuilding images, or troubleshooting containers.
---

# Docker Development Skill

## Stack overview

| Service         | Local URL                        | Purpose                        |
|-----------------|----------------------------------|--------------------------------|
| app             | http://localhost:8080            | Spring Boot API                |
| frontend        | http://localhost:3000            | React UI                       |
| prometheus      | http://localhost:9090            | Metrics scrape                 |
| grafana         | http://localhost:3001            | Dashboards (admin/admin)       |
| elasticsearch   | http://localhost:9200            | Log storage                    |
| kibana          | http://localhost:5601            | Log search UI                  |
| postgres        | localhost:5432                   | taskdb / taskuser / taskpass   |
| otel-collector  | localhost:4317 (grpc) 4318 (http)| Trace ingest                   |

## Common commands

```bash
# Build and start everything
./gradlew clean build -x test
docker compose up --build -d

# Start without rebuilding
docker compose up -d

# Stop everything
docker compose down

# Stop and wipe volumes (clean slate)
docker compose down -v

# Follow logs for a specific service
docker compose logs -f app
docker compose logs -f logstash
docker compose logs -f elasticsearch

# Rebuild only the Spring Boot image
./gradlew clean build -x test && docker compose build app && docker compose up -d app

# Rebuild only the frontend image
docker compose build frontend && docker compose up -d frontend
```

## Verifying the stack is healthy

```bash
# All services
docker compose ps

# API health
curl -s http://localhost:8080/actuator/health | jq .

# Prometheus metrics
curl -s http://localhost:8080/actuator/prometheus | grep jvm_memory

# Elasticsearch cluster health
curl -s http://localhost:9200/_cluster/health | jq .

# Check logs are flowing into Elasticsearch
curl -s "http://localhost:9200/task-manager-*/_count" | jq .
```

## Kibana — first-time setup

1. Open http://localhost:5601
2. Go to Stack Management → Index Patterns
3. Create index pattern: `task-manager-*`, time field: `@timestamp`
4. Go to Discover to search logs

## Grafana — first-time setup

1. Open http://localhost:3001 (admin / admin)
2. Prometheus datasource is auto-provisioned
3. Elasticsearch datasource is auto-provisioned
4. Import or build a dashboard using the `task-manager` job metrics

## Minikube deployment

```bash
eval $(minikube docker-env)
./gradlew clean build -x test
docker build -t task-manager-app:latest .
docker build -t task-manager-frontend:latest ./frontend

kubectl apply -f k8s/namespace.yml
kubectl apply -f k8s/ -n task-manager

minikube addons enable ingress
minikube tunnel
```

Access via http://localhost/ after tunnel is running.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| app exits on start | Check DB_URL env; ensure db service is healthy first |
| No logs in Kibana | Check logstash logs: docker compose logs logstash |
| Grafana shows no data | Verify prometheus scrape: http://localhost:9090/targets |
| Port conflict | Change host port in docker-compose.yml left-side of the mapping |
