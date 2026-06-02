# Kubernetes Deployment Guide

## Overview

Kubernetes manifests for deploying PDF Highlighter to Kubernetes clusters (EKS, GKE, AKS, self-hosted).

## Prerequisites

- Kubernetes 1.20+
- kubectl configured
- Docker images pushed to registry (GCR, ECR, Azure Container Registry, etc.)
- Persistent storage available (EBS, GCE Persistent Disks, Azure Disks, or NFS)

## Quick Start

### 1. Update Image Registry

```bash
# Edit deployment.yaml and replace:
# ghcr.io/your-org/pdf-highlighter/backend:latest
# with your registry URL

sed -i 's|ghcr.io/your-org|your-registry|g' k8s/deployment.yaml
```

### 2. Deploy

```bash
# Create namespace and deploy
kubectl apply -f k8s/deployment.yaml

# Check status
kubectl get pods -n pdf-highlighter
kubectl get svc -n pdf-highlighter
```

### 3. Verify Deployment

```bash
# Check deployment status
kubectl describe deployment backend -n pdf-highlighter

# View logs
kubectl logs -f deployment/backend -n pdf-highlighter

# Port forward to test
kubectl port-forward svc/backend 5000:5000 -n pdf-highlighter
curl http://localhost:5000/health
```

## Architecture

```
Ingress (HTTPS)
    ↓
Load Balancer
    ↓
Backend Service (Port 5000) → Backend Pods (3 replicas)
    ↓
Ollama Service (Port 11434) → Ollama Pod (1 replica)
    ↓
Persistent Volumes (EBS/GCE/AKS)
```

## Components

### Namespace
- Isolates resources: `pdf-highlighter`

### ConfigMap
- Environment variables
- Update `CORAL_ORIGINS` and `OLLAMA_MODEL` as needed

### Secret
- API_KEY for authentication
- Update before deployment

### PersistentVolumes
- `ollama-pv`: 20GB for models
- `uploads-pv`: 100GB for generated files

### Deployments
- **Backend**: 3 replicas with HPA (auto-scales 3-10)
- **Ollama**: 1 replica (stateful)

### Services
- Backend: LoadBalancer (external access)
- Ollama: ClusterIP (internal only)

### Ingress
- Routes HTTPS traffic to backend
- Requires `nginx-ingress-controller`
- Requires `cert-manager` for SSL certificates

## Configuration

### Change replica count

```bash
kubectl scale deployment backend --replicas=5 -n pdf-highlighter
```

### Update environment variables

```bash
kubectl set env deployment/backend \
  CORS_ORIGINS=https://newdomain.com \
  -n pdf-highlighter
```

### Update image

```bash
kubectl set image deployment/backend \
  backend=your-registry/backend:v2.0 \
  -n pdf-highlighter
```

## Monitoring

### View pod status
```bash
kubectl get pods -n pdf-highlighter
kubectl describe pod <pod-name> -n pdf-highlighter
```

### View logs
```bash
# Current pod
kubectl logs deployment/backend -n pdf-highlighter

# All pods
kubectl logs -f deployment/backend -n pdf-highlighter --all-containers=true

# Previous pod (if crashed)
kubectl logs <pod-name> -n pdf-highlighter --previous
```

### Resource usage
```bash
kubectl top pods -n pdf-highlighter
kubectl top nodes
```

## Scaling

### Manual scaling
```bash
kubectl scale deployment backend --replicas=5 -n pdf-highlighter
```

### Automatic scaling (HPA)
- Currently configured to scale 3-10 replicas
- Triggers at 70% CPU or 80% memory
- Can be modified in `deployment.yaml`

## Updates & Deployments

### Rolling update
```bash
kubectl set image deployment/backend \
  backend=your-registry/backend:v2.0 \
  -n pdf-highlighter
```

### Rollback
```bash
kubectl rollout undo deployment/backend -n pdf-highlighter
kubectl rollout history deployment/backend -n pdf-highlighter
```

## Networking

### Port forward for testing
```bash
kubectl port-forward svc/backend 5000:5000 -n pdf-highlighter
kubectl port-forward svc/ollama 11434:11434 -n pdf-highlighter
```

### Access via Ingress
```bash
# DNS resolves yourdomain.com to ingress IP
# HTTPS automatically enabled with cert-manager
curl https://yourdomain.com/api/health
```

## Storage

### Check persistent volumes
```bash
kubectl get pv
kubectl describe pv ollama-pv
```

### Backup data
```bash
# Backup uploads
kubectl exec -it deployment/backend -n pdf-highlighter -- \
  tar czf /tmp/backup.tar.gz /app/uploads

kubectl cp pdf-highlighter/backend:/tmp/backup.tar.gz ./backup.tar.gz
```

## Troubleshooting

### Pod won't start
```bash
kubectl describe pod <pod-name> -n pdf-highlighter
kubectl logs <pod-name> -n pdf-highlighter
```

### Connection issues
```bash
# Test connectivity
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -- \
  curl http://backend:5000/health -n pdf-highlighter
```

### Storage issues
```bash
# Check PVC status
kubectl get pvc -n pdf-highlighter
kubectl describe pvc uploads-pvc -n pdf-highlighter
```

## Production Checklist

- [ ] Update image registry in `deployment.yaml`
- [ ] Change API_KEY in `secret.yaml`
- [ ] Configure CORS_ORIGINS for your domain
- [ ] Set up persistent storage (EBS/GCE/AKS)
- [ ] Install nginx-ingress-controller
- [ ] Install cert-manager for HTTPS
- [ ] Configure domain DNS to point to ingress IP
- [ ] Set resource limits appropriately
- [ ] Configure backup strategy for volumes
- [ ] Set up monitoring (Prometheus/Grafana)
- [ ] Configure log aggregation (ELK/Loki)

## Cloud-Specific Setup

### AWS EKS
```bash
# Create cluster
eksctl create cluster --name pdf-highlighter --region us-east-1

# Add storage class
kubectl apply -f https://raw.githubusercontent.com/kubernetes-sigs/aws-ebs-csi-driver/master/deploy/kubernetes/base/crds.yaml
```

### Google GKE
```bash
# Create cluster
gcloud container clusters create pdf-highlighter

# Storage auto-configured
# Deploy Ingress: kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-gce/main/deploy/gce.yaml
```

### Azure AKS
```bash
# Create cluster
az aks create --resource-group myResourceGroup --name pdf-highlighter

# Deploy Ingress: helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
```

## Cost Optimization

1. Use spot instances for non-critical workloads
2. Configure resource requests/limits properly
3. Set up HPA for auto-scaling
4. Use private container registries
5. Consider managed services for databases

## Next Steps

1. ✅ Customize manifest files
2. ✅ Push images to registry
3. ✅ Deploy to Kubernetes
4. ✅ Configure Ingress and SSL
5. ✅ Set up monitoring
6. ✅ Configure backups
