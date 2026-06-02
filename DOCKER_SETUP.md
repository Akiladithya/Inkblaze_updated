# Docker Setup Guide - PDF Highlighter

## Overview

This guide covers containerizing the PDF Highlighter application using Docker and Docker Compose for development, testing, and production environments.

## Architecture

```
┌─────────────────────────────────────────────┐
│         Docker Network                      │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐  ┌──────────────┐        │
│  │  Frontend    │  │   Backend    │        │
│  │  (Node.js)   │  │   (Flask)    │        │
│  │  Port 8082   │  │   Port 5000  │        │
│  └──────────────┘  └──────────────┘        │
│         ▲                  ▲                │
│         └──────────┬───────┘                │
│                    │                       │
│         ┌──────────▼──────────┐            │
│         │  Ollama (LLM)       │            │
│         │  Port 11434         │            │
│         └─────────────────────┘            │
│                                             │
│  Volumes:                                   │
│  - ollama_data (model storage)              │
│  - uploads_volume (generated files)         │
│                                             │
└─────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites
- Docker Desktop installed
- Docker Compose installed
- 8GB RAM minimum (4GB for Ollama, 2GB for backend, 2GB for other services)

### 1. Development Setup (Recommended for learning/testing)

```bash
# Start all services
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Access services
# Backend API: http://localhost:5000
# Ollama: http://localhost:11434

# Run frontend locally (recommended)
npm start  # In separate terminal
```

### 2. Production Setup

```bash
# Create .env file with production settings
cp .env.docker .env

# Edit .env with your production values
nano .env

# Start all services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Access via Nginx
# https://yourdomain.com
```

### 3. Standard Development (No Frontend Containerization)

```bash
# Start backend and Ollama only
docker-compose up -d ollama backend

# Frontend runs locally with hot reload
npm start

# This is the recommended approach for development
```

## Service Details

### Backend Service (Flask API)

**Image:** Built from `Dockerfile`  
**Port:** 5000  
**Environment:**
- `FLASK_ENV`: production/development
- `OLLAMA_URL`: http://ollama:11434 (internal to Docker network)
- `CORS_ORIGINS`: Comma-separated allowed origins
- `API_KEY`: Secret key for API authentication
- `MAX_FILE_SIZE_MB`: Maximum upload size

**Volumes:**
- `/app/uploads` → `uploads_volume` (persistent file storage)

**Health Check:**
- Endpoint: `GET /health`
- Interval: 30s (dev), 60s (prod)

### Ollama Service (LLM)

**Image:** `ollama/ollama:latest`  
**Port:** 11434  
**Volume:** `ollama_data` (stores 5-10GB of model files)

**Available Models:**
```bash
# Pull models in the running container
docker-compose exec ollama ollama pull mistral
docker-compose exec ollama ollama pull neural-chat
docker-compose exec ollama ollama pull orca-mini
```

**Memory Requirements:**
- Mistral: ~5GB
- Neural-Chat: ~3GB
- Orca-Mini: ~1GB

### Frontend Service (Optional Containerization)

**Image:** Built from `Dockerfile.frontend`  
**Port:** 8082  

**Note:** For development, it's better to run `npm start` locally for hot reload.

## Common Commands

### Start Services

```bash
# Development environment
docker-compose -f docker-compose.dev.yml up -d

# Production environment
docker-compose -f docker-compose.prod.yml up -d

# Specific service only
docker-compose up -d backend
docker-compose up -d ollama

# With verbose output
docker-compose up -d --verbose
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f ollama

# Last 50 lines
docker-compose logs --tail=50 backend

# Follow backend service
docker-compose logs -f backend
```

### Execute Commands in Container

```bash
# Run bash in backend container
docker-compose exec backend bash

# Run Python command
docker-compose exec backend python -c "import sys; print(sys.version)"

# Download Ollama model
docker-compose exec ollama ollama pull mistral

# Check Ollama models
docker-compose exec ollama ollama list
```

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes data!)
docker-compose down -v

# Stop specific service
docker-compose stop backend
```

### Rebuild Images

```bash
# Rebuild all images
docker-compose build --no-cache

# Rebuild specific image
docker-compose build --no-cache backend

# Build and start
docker-compose up -d --build
```

### View Running Containers

```bash
# List running containers
docker-compose ps

# Show detailed info
docker ps -a

# Show container resources
docker stats
```

## Environment Configuration

### Development (.env.docker)

```env
FLASK_ENV=development
OLLAMA_URL=http://ollama:11434
OLLAMA_MODEL=mistral
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:8082
MAX_FILE_SIZE_MB=50
```

### Production (.env)

```env
FLASK_ENV=production
OLLAMA_URL=http://ollama:11434
OLLAMA_MODEL=mistral
CORS_ORIGINS=https://yourdomain.com
API_KEY=your-secret-key-change-this
MAX_FILE_SIZE_MB=50
OLLAMA_DATA_PATH=/data/ollama
UPLOADS_PATH=/data/uploads
```

## Data Persistence

### Volumes

```bash
# List all volumes
docker volume ls

# Inspect a volume
docker volume inspect pdf-highlighter_ollama_data

# Backup Ollama models
docker run --rm -v pdf-highlighter_ollama_data:/data \
  -v $(pwd)/backup:/backup \
  busybox tar czf /backup/ollama.tar.gz -C /data .

# Restore Ollama models
docker run --rm -v pdf-highlighter_ollama_data:/data \
  -v $(pwd)/backup:/backup \
  busybox tar xzf /backup/ollama.tar.gz -C /data
```

## Networking

Services communicate via Docker network `pdf-highlighter-network`:

```
Backend URL from Frontend: http://backend:5000
Ollama URL from Backend: http://ollama:11434
```

## Debugging

### Check Container Health

```bash
# View health status
docker-compose ps

# Check logs for errors
docker-compose logs --tail=100 backend

# Execute health check manually
docker-compose exec backend curl http://localhost:5000/health
```

### Common Issues

**1. Port Already in Use**
```bash
# Find what's using the port
netstat -ano | findstr :5000

# Change port in docker-compose.yml
ports:
  - "5001:5000"  # Use 5001 instead
```

**2. Out of Memory**
```bash
# Reduce Ollama model
docker-compose exec ollama ollama pull orca-mini

# Close other applications
```

**3. Network Timeout**
```bash
# Verify network
docker network ls
docker network inspect pdf-highlighter-network

# Restart services
docker-compose restart
```

**4. Volume Permissions**
```bash
# Fix volume ownership
docker run --rm -v uploads_volume:/data \
  busybox chown -R 1000:1000 /data
```

## Performance Optimization

### Resource Limits

The `docker-compose.prod.yml` includes resource limits:
```yaml
deploy:
  resources:
    limits:
      cpus: '4'
      memory: 8G
```

Adjust based on your hardware.

### Caching and Optimization

1. **Build Cache**
   ```bash
   docker-compose build --no-cache  # Bypass cache
   ```

2. **Layer Caching**
   - Dependencies installed early in Dockerfile
   - Application code copied last (leverages cache)

3. **Multi-stage Builds**
   - Can be added to reduce final image size

## Deployment

### Docker Hub Upload

```bash
# Build image with tag
docker build -t username/pdf-highlighter-backend:latest .

# Push to Docker Hub
docker login
docker push username/pdf-highlighter-backend:latest

# Deploy from image
docker run -p 5000:5000 username/pdf-highlighter-backend:latest
```

### Docker Swarm/Kubernetes

See `kubernetes/` directory for K8s manifests (if included).

## Monitoring and Logging

### View Container Metrics

```bash
# Real-time stats
docker stats

# Historical logs
docker-compose logs --tail=500 backend | grep ERROR
```

### Set up Logging Driver

Can be configured in `docker-compose.yml`:
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

## Security Considerations

1. **API Keys**
   - Change `API_KEY` in production `.env`
   - Never commit `.env` to version control

2. **HTTPS/SSL**
   - Configure Nginx with real SSL certificates
   - Update `nginx.conf` with your domain

3. **CORS**
   - Restrict to your domain in production
   - Update `CORS_ORIGINS` in `.env`

4. **Image Security**
   ```bash
   # Scan images for vulnerabilities
   docker scan pdf-highlighter-backend
   ```

## Troubleshooting Guide

| Issue | Solution |
|-------|----------|
| Container won't start | `docker-compose logs backend` |
| Port in use | Change `ports:` in docker-compose.yml |
| Out of memory | Reduce Ollama model or increase Docker memory |
| Network error | Check `docker network inspect` |
| File permissions | Use `docker exec` to fix ownership |
| Slow startup | Increase `start_period` in healthcheck |

## Cleanup

```bash
# Remove stopped containers
docker container prune

# Remove unused volumes
docker volume prune

# Remove unused images
docker image prune

# Full cleanup (WARNING: removes all!)
docker system prune -a --volumes
```

## Next Steps

1. ✅ Test locally with `docker-compose up`
2. ✅ Download Ollama models
3. ✅ Test API endpoints
4. ✅ Configure production environment
5. ✅ Set up monitoring/logging
6. ✅ Deploy to cloud provider

## Support

For issues or questions:
- Check logs: `docker-compose logs -f`
- Verify network: `docker network inspect pdf-highlighter-network`
- Test health: `curl http://localhost:5000/health`
