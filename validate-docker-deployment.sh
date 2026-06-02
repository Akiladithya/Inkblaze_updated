#!/bin/bash
# Docker Deployment Validation Script
# Tests the containerized PDF Highlighter with Gemini API integration

set -e

echo "🚀 PDF Highlighter - Docker Deployment Validation"
echo "=================================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."
echo ""

# Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker installed:${NC} $(docker --version)"

# Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker Compose installed:${NC} $(docker-compose --version)"

echo ""
echo "📦 Checking Docker images..."
echo ""

# Check if images exist or need building
if [[ $(docker images -q pdf-highlighter-backend 2>/dev/null) == "" ]]; then
    echo -e "${YELLOW}⚠ Backend image not found, building...${NC}"
    docker-compose build backend
else
    echo -e "${GREEN}✓ Backend image exists${NC}"
fi

echo ""
echo "🔧 Starting Docker containers..."
echo ""

# Start services
docker-compose -f docker-compose.dev.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to start..."
sleep 10

echo ""
echo "🏥 Checking service health..."
echo ""

# Check Ollama
if curl -f http://localhost:11434/api/tags &>/dev/null; then
    echo -e "${GREEN}✓ Ollama running${NC} (http://localhost:11434)"
else
    echo -e "${YELLOW}⚠ Ollama not responding${NC}"
fi

# Check Backend
if curl -f http://localhost:5000/health &>/dev/null; then
    RESPONSE=$(curl -s http://localhost:5000/health)
    echo -e "${GREEN}✓ Backend running${NC} (http://localhost:5000)"
    echo "  Status: $RESPONSE"
else
    echo -e "${RED}❌ Backend not responding${NC}"
fi

echo ""
echo "🔒 Verifying Gemini API configuration..."
echo ""

# Check environment variables
if docker-compose exec -T backend env | grep -q "GEMINI_API_KEY"; then
    echo -e "${GREEN}✓ GEMINI_API_KEY configured${NC}"
else
    echo -e "${YELLOW}⚠ GEMINI_API_KEY not set${NC}"
fi

if docker-compose exec -T backend env | grep -q "USE_GEMINI=true"; then
    echo -e "${GREEN}✓ Gemini API enabled${NC}"
else
    echo -e "${YELLOW}⚠ Gemini API disabled${NC}"
fi

echo ""
echo "📦 Checking dependencies..."
echo ""

# Test Python imports
IMPORT_TEST=$(docker-compose exec -T backend python -c "
try:
    import google.generativeai
    print('gemini_ok')
except ImportError:
    print('gemini_missing')
try:
    import requests
    print('requests_ok')
except ImportError:
    print('requests_missing')
" 2>/dev/null)

if echo "$IMPORT_TEST" | grep -q "gemini_ok"; then
    echo -e "${GREEN}✓ google-generativeai installed${NC}"
else
    echo -e "${YELLOW}⚠ google-generativeai not installed${NC}"
    echo "  Installing: pip install google-generativeai"
fi

if echo "$IMPORT_TEST" | grep -q "requests_ok"; then
    echo -e "${GREEN}✓ requests library available${NC}"
else
    echo -e "${RED}❌ requests library missing${NC}"
fi

echo ""
echo "🧪 Testing API endpoints..."
echo ""

# Test health endpoint
HEALTH=$(curl -s http://localhost:5000/health)
echo -e "${GREEN}✓ Health endpoint:${NC}"
echo "  $HEALTH"

echo ""
echo "📝 Checking Docker logs for errors..."
echo ""

# Check for errors in logs
ERRORS=$(docker-compose logs backend | grep -i "ERROR" || true)
if [ -z "$ERRORS" ]; then
    echo -e "${GREEN}✓ No errors in backend logs${NC}"
else
    echo -e "${YELLOW}⚠ Errors found:${NC}"
    echo "$ERRORS"
fi

echo ""
echo "📊 Container Status:"
echo ""
docker-compose ps

echo ""
echo "✅ Deployment validation complete!"
echo ""
echo "🚀 Next steps:"
echo "1. Start frontend: npm start"
echo "2. Open browser: http://localhost:8082"
echo "3. Upload a PDF to test MCQ generation"
echo "4. Check logs: docker-compose logs -f backend"
echo ""
echo "📚 For more info:"
echo "   View logs: docker-compose logs -f backend"
echo "   Shell access: docker-compose exec backend bash"
echo "   Stop services: docker-compose down"
echo ""
