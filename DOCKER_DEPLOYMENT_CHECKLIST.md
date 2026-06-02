# Docker Containerization - Deployment Checklist

## 📋 Pre-Deployment Setup Checklist

### Prerequisites ✓
- [ ] Docker Desktop installed
- [ ] Docker Compose installed
- [ ] At least 8GB RAM available
- [ ] At least 50GB disk space available
- [ ] Git configured
- [ ] Node.js 18+ installed (for frontend)
- [ ] Python 3.9+ installed (for backend testing)

---

## 🚀 Phase 1: Development Setup (Day 1)

### A. Environment Setup
- [ ] Navigate to project directory: `cd /path/to/INNK`
- [ ] Verify Docker installation: `docker --version && docker-compose --version`
- [ ] Copy environment file: `cp .env.docker .env.dev`
- [ ] Review environment variables in `.env.dev`

### B. Start Services
- [ ] Start development stack: `docker-compose -f docker-compose.dev.yml up -d`
- [ ] Wait for services to be healthy (30-60 seconds)
- [ ] Verify running containers: `docker-compose ps`
- [ ] Check backend logs: `docker-compose logs -f backend`

### C. Download ML Models
- [ ] Pull Mistral model: `docker-compose exec ollama ollama pull mistral`
- [ ] Wait for download (5-15 minutes, shows progress)
- [ ] Verify model downloaded: `docker-compose exec ollama ollama list`

### D. Test Backend
- [ ] Health check: `curl http://localhost:5000/health`
- [ ] Verify response: Should return `{"status": "ok", ...}`
- [ ] Test API with sample request: See API test commands below

### E. Start Frontend
- [ ] Open new terminal
- [ ] Navigate to project: `cd /path/to/INNK`
- [ ] Install dependencies: `npm install` (if not already done)
- [ ] Start frontend: `npm start`
- [ ] Wait for Metro bundler (shows "Web Bundled X ms")

### F. Verify Full Stack
- [ ] Open browser: http://localhost:8082
- [ ] Frontend loads successfully
- [ ] No console errors (open DevTools F12)
- [ ] Backend status shows healthy

---

## 🧪 Phase 2: Testing (Day 2)

### A. API Testing
```bash
# Health check
curl http://localhost:5000/health

# Upload and highlight PDF
curl -X POST http://localhost:5000/highlight-text \
  -H "Content-Type: multipart/form-data" \
  -F "file=@sample.pdf" \
  -F "num_highlights=5"

# Generate MCQs
curl -X POST http://localhost:5000/generate-mcqs \
  -F "file=@sample.pdf"
```

### B. Manual Testing
- [ ] Upload small PDF (< 10MB) from web interface
- [ ] Verify file appears in uploads directory
- [ ] Wait for processing to complete
- [ ] Verify highlighted PDF is generated
- [ ] Verify MCQs are generated
- [ ] Download generated PDF
- [ ] Open downloaded PDF - verify highlights

### C. Test with Different File Types
- [ ] Test with PDF file ✓
- [ ] Test with DOCX file ✓
- [ ] Test with large PDF (20MB+) - watch for timeout ✓
- [ ] Test with invalid file - verify error handling ✓

### D. Monitor Container Logs
- [ ] Check backend logs: `docker-compose logs --tail=100 backend`
- [ ] Check Ollama logs: `docker-compose logs --tail=100 ollama`
- [ ] Look for errors: Search for "ERROR" in logs
- [ ] Verify health checks passing: Look for health check success

### E. Check Resource Usage
- [ ] View resource stats: `docker stats`
- [ ] Backend memory usage: Should be 200-500MB
- [ ] Ollama memory usage: Should be 4-6GB when generating
- [ ] CPU usage: Should be reasonable, not maxed out

---

## 📦 Phase 3: Production Setup (Week 2)

### A. Configuration
- [ ] Create production `.env` file: `cp .env.docker .env`
- [ ] Update `FLASK_ENV=production`
- [ ] Update `CORS_ORIGINS=https://yourdomain.com` (or your domain)
- [ ] Generate strong API key: `openssl rand -hex 32`
- [ ] Set `API_KEY` in `.env`
- [ ] Set `MAX_FILE_SIZE_MB` to desired limit (50-100MB typical)

### B. Image Building
- [ ] Build backend image: `docker build -t pdf-highlighter-backend:v1.0 -f Dockerfile .`
- [ ] Build frontend image: `docker build -t pdf-highlighter-frontend:v1.0 -f Dockerfile.frontend .`
- [ ] Verify images created: `docker images | grep pdf-highlighter`

### C. Production Start
- [ ] Stop development services: `docker-compose down`
- [ ] Start production services: `docker-compose -f docker-compose.prod.yml up -d`
- [ ] Wait for services to be healthy: 60 seconds
- [ ] Verify all services running: `docker-compose ps`

### D. Production Testing
- [ ] Test health endpoint: `curl http://localhost:5000/health`
- [ ] Test with API key: Add `Authorization: Bearer <API_KEY>` header
- [ ] Upload test PDF: Verify complete flow works
- [ ] Monitor logs: `docker-compose logs -f backend`
- [ ] Check performance: `docker stats`

### E. Data Backup
- [ ] Backup uploaded files: 
  ```bash
  docker run --rm -v pdf-highlighter_uploads_volume:/data \
    -v $(pwd):/backup \
    busybox tar czf /backup/uploads.tar.gz -C /data .
  ```
- [ ] Backup Ollama models:
  ```bash
  docker run --rm -v pdf-highlighter_ollama_data:/data \
    -v $(pwd):/backup \
    busybox tar czf /backup/ollama.tar.gz -C /data .
  ```

---

## 🌐 Phase 4: Cloud Deployment (Week 3)

### A. Docker Registry Setup
- [ ] Choose registry (Docker Hub, GitHub Container Registry, ECR, GCR, etc.)
- [ ] Create account/repository
- [ ] Authenticate locally:
  ```bash
  docker login [registry-url]
  # or
  aws ecr get-login-password | docker login --username AWS --password-stdin [account].dkr.ecr.[region].amazonaws.com
  ```

### B. Tag and Push Images
- [ ] Tag backend image: `docker tag pdf-highlighter-backend:v1.0 registry/backend:v1.0`
- [ ] Tag frontend image: `docker tag pdf-highlighter-frontend:v1.0 registry/frontend:v1.0`
- [ ] Push backend: `docker push registry/backend:v1.0`
- [ ] Push frontend: `docker push registry/frontend:v1.0`
- [ ] Verify in registry: Check your registry console

### C. Kubernetes Deployment (If using K8s)
- [ ] Setup Kubernetes cluster (EKS, GKE, AKS, or self-hosted)
- [ ] Install kubectl and configure access
- [ ] Update image references in `k8s/deployment.yaml`
- [ ] Apply manifests: `kubectl apply -f k8s/deployment.yaml`
- [ ] Verify deployment: `kubectl get pods -n pdf-highlighter`
- [ ] View logs: `kubectl logs -f deployment/backend -n pdf-highlighter`

### D. Ingress & SSL Setup (K8s)
- [ ] Install Nginx Ingress Controller
- [ ] Install cert-manager for SSL
- [ ] Configure domain DNS
- [ ] Apply ingress manifest
- [ ] Verify HTTPS: `curl https://yourdomain.com/health`

---

## 🔐 Security Checklist

### Before Going Live
- [ ] Change default API key in `.env`
- [ ] Update CORS origins for your domain
- [ ] Configure SSL/TLS certificates
- [ ] Enable authentication if needed
- [ ] Review and audit security in `backend/app.py`
- [ ] Scan images for vulnerabilities: `docker scan pdf-highlighter-backend`
- [ ] Set up firewall rules
- [ ] Enable rate limiting (optional, add in nginx.conf)
- [ ] Remove debug mode from production
- [ ] Configure log aggregation

### After Deployment
- [ ] Monitor logs for errors
- [ ] Check security scanning results
- [ ] Test authentication/authorization flow
- [ ] Verify SSL certificate validity
- [ ] Test backup and restore procedures

---

## 📊 Monitoring & Maintenance

### Daily
- [ ] Check container status: `docker-compose ps`
- [ ] Review error logs: `docker-compose logs backend`
- [ ] Monitor disk space: `df -h`

### Weekly
- [ ] Check resource usage trends: `docker stats`
- [ ] Review performance logs: `docker-compose logs --tail=500 backend`
- [ ] Backup critical data
- [ ] Update if security patches available

### Monthly
- [ ] Review and rotate API keys
- [ ] Update base images: `docker pull ollama/ollama:latest`
- [ ] Clean up unused images/volumes: `docker system prune`
- [ ] Capacity planning (do we need more resources?)

---

## 🆘 Troubleshooting During Deployment

### Container Won't Start
```bash
# Check logs
docker-compose logs backend

# Common fixes
docker-compose down -v           # Remove volumes
docker-compose up -d --build     # Rebuild and start
```

### Port Already in Use
```bash
# Find process using port
netstat -ano | findstr :5000     # Windows
lsof -i :5000                    # Mac/Linux

# Change port in docker-compose.yml
ports:
  - "5001:5000"  # Use different port
```

### Memory Issues
```bash
# Increase Docker memory limit
# Docker Desktop → Settings → Resources → Memory (set to 12GB+)

# Or reduce Ollama model
docker-compose exec ollama ollama pull orca-mini
```

### Connection Refused
```bash
# Verify services are running
docker-compose ps

# Check network
docker network ls
docker network inspect pdf-highlighter-network

# Restart services
docker-compose restart
```

---

## ✅ Sign-Off Checklist

### Before Production
- [ ] All tests passing
- [ ] Security audit completed
- [ ] Performance acceptable (< 5s response time)
- [ ] Backup strategy in place
- [ ] Monitoring setup complete
- [ ] Team trained on operations
- [ ] Documentation updated

### Go-Live
- [ ] Choose deployment window
- [ ] Notify team/users if applicable
- [ ] Deploy to production
- [ ] Verify all services responding
- [ ] Monitor closely for 24 hours
- [ ] Be ready to rollback if issues

---

## 📞 Quick Command Reference

```bash
# Start/Stop
docker-compose up -d               # Start
docker-compose down                # Stop
docker-compose restart             # Restart

# Monitoring
docker-compose ps                  # Status
docker-compose logs -f             # Logs
docker stats                       # Resource usage

# Management
docker-compose exec backend bash   # Shell access
docker-compose build --no-cache    # Rebuild images
docker-compose pull                # Pull latest images

# Models
docker-compose exec ollama ollama pull mistral
docker-compose exec ollama ollama list

# Cleanup
docker-compose down -v             # Remove everything
docker system prune -a             # Full cleanup

# Using Makefile (easiest)
make dev                          # Start dev
make prod                         # Start prod
make ollama-pull                  # Pull model
make logs                         # View logs
make help                         # All commands
```

---

## 📞 Support Resources

- **Quick Reference**: See `DOCKER_QUICK_REFERENCE.md`
- **Full Guide**: See `DOCKER_SETUP.md`
- **Ollama Setup**: See `backend/OLLAMA_SETUP.md`
- **Kubernetes**: See `k8s/README.md`
- **Issues**: Check Docker logs with `docker-compose logs`
- **Makefile**: Run `make help` for all available commands

---

## 🎓 Training Topics

Team members should understand:
- [ ] Docker basics (containers, images, volumes)
- [ ] Docker Compose for multi-service orchestration
- [ ] How to view logs and debug issues
- [ ] How to restart services
- [ ] How to backup and restore data
- [ ] How to scale services (replicas)
- [ ] Security best practices
- [ ] Monitoring and alerting
- [ ] Deployment procedures

---

**Status**: Ready for execution  
**Estimated Total Time**: 3-5 weeks (development + testing + deployment)  
**Difficulty**: Intermediate (Docker/Container knowledge helpful)

**Good luck! 🚀**
