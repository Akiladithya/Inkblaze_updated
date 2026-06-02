# PDF Highlighter - Docker Quick Reference

## 🚀 Get Started in 2 Minutes

### 1. Start All Services (Development)
```bash
docker-compose -f docker-compose.dev.yml up -d
npm start  # In another terminal
```

### 2. Access the App
- **Frontend:** http://localhost:8082
- **Backend API:** http://localhost:5000
- **Ollama:** http://localhost:11434

### 3. Download ML Model
```bash
docker-compose exec ollama ollama pull mistral
```

---

## 📋 Essential Commands

| Task | Command |
|------|---------|
| **Start services** | `docker-compose up -d` |
| **Stop services** | `docker-compose down` |
| **View logs** | `docker-compose logs -f backend` |
| **Run bash** | `docker-compose exec backend bash` |
| **Pull model** | `docker-compose exec ollama ollama pull mistral` |
| **Rebuild image** | `docker-compose build --no-cache backend` |
| **Full cleanup** | `docker-compose down -v` |

---

## 🔧 Common Tasks

### Download Ollama Models
```bash
# Download Mistral (5GB, recommended)
docker-compose exec ollama ollama pull mistral

# Download lighter model (3GB)
docker-compose exec ollama ollama pull neural-chat

# List downloaded models
docker-compose exec ollama ollama list
```

### Test API
```bash
# Health check
curl http://localhost:5000/health

# Test backend accessibility
curl -X GET http://localhost:5000/health
```

### View Logs
```bash
# All services
docker-compose logs -f

# Only backend
docker-compose logs -f backend

# Only Ollama
docker-compose logs -f ollama

# Last 50 lines
docker-compose logs --tail=50
```

### Execute Commands
```bash
# Python in backend
docker-compose exec backend python -c "print('Hello')"

# List files
docker-compose exec backend ls -la /app/uploads

# Test Python imports
docker-compose exec backend python -c "import nltk; print(nltk.__version__)"
```

---

## 🐳 Docker Compose Variants

### Development (Hot Reload)
```bash
docker-compose -f docker-compose.dev.yml up -d
```

### Production (Optimized)
```bash
cp .env.docker .env
docker-compose -f docker-compose.prod.yml up -d
```

### Standard (Both Frontend & Backend)
```bash
docker-compose up -d
```

---

## 📊 Monitor Services

```bash
# Check status
docker-compose ps

# View resource usage
docker stats

# Inspect network
docker network inspect pdf-highlighter-network
```

---

## 🔐 Environment Variables

Create `.env` file:
```env
FLASK_ENV=production
OLLAMA_MODEL=mistral
API_KEY=change-this-in-production
CORS_ORIGINS=https://yourdomain.com
```

---

## ✅ Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 5000 in use | Kill process: `lsof -i :5000 \| kill -9 <PID>` |
| Out of memory | Restart Docker or use lighter model |
| Ollama connection error | Check: `docker-compose logs ollama` |
| Frontend can't reach backend | Verify CORS: `docker-compose logs backend` |

---

## 📚 Full Documentation

See [DOCKER_SETUP.md](DOCKER_SETUP.md) for complete guide.

---

## 🎯 Next Steps

1. ✅ Run `docker-compose up -d`
2. ✅ Download model: `docker-compose exec ollama ollama pull mistral`
3. ✅ Test API: `curl http://localhost:5000/health`
4. ✅ Open http://localhost:8082 in browser
5. ✅ Upload a PDF and test!

---

**Happy containerizing! 🚀**
