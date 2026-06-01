# Minikube deployment

## Prerequisites

- [Minikube](https://minikube.sigs.k8s.io/docs/start/) installed and running
- [kubectl](https://kubernetes.io/docs/tasks/tools/) configured
- Docker available locally

## Build images inside Minikube's Docker daemon

```bash
eval $(minikube docker-env)
docker build -t task-manager-app:latest .
docker build -t task-manager-frontend:latest ./frontend
```

## Deploy

```bash
kubectl apply -f k8s/namespace.yml
kubectl apply -f k8s/ -n task-manager
```

## Enable Ingress and expose cluster

```bash
minikube addons enable ingress
minikube tunnel
```

## Access

| Service  | URL                                      |
|----------|------------------------------------------|
| Frontend | http://localhost/                        |
| App API  | http://localhost/api/actuator/health     |
| Grafana  | http://localhost/grafana/                |
| Kibana   | http://localhost/kibana/                 |

## Useful commands

```bash
# Watch all pods come up
kubectl get pods -n task-manager -w

# Check logs for the Spring Boot app
kubectl logs -n task-manager -l app=app -f

# Describe a failing pod
kubectl describe pod -n task-manager <pod-name>

# Delete everything and redeploy
kubectl delete namespace task-manager
kubectl apply -f k8s/namespace.yml
kubectl apply -f k8s/ -n task-manager
```

## Notes

- `imagePullPolicy: Never` is set on `app` and `frontend` — images must be built inside Minikube's Docker daemon (see step above).
- Elasticsearch requires `vm.max_map_count=262144`; the init container sets this automatically (requires a privileged init container).
- Grafana is configured with `GF_SERVER_SERVE_FROM_SUB_PATH=true` so it works behind the `/grafana/` prefix.
- Kibana is configured with `SERVER_BASEPATH=/kibana` and `SERVER_REWRITEBASEPATH=true` for the same reason.
