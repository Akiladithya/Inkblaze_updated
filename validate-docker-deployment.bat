@echo off
REM Docker Deployment Validation Script (Windows)
REM Tests the containerized PDF Highlighter with Gemini API integration

setlocal enabledelayedexpansion

echo.
echo ========================================
echo Docker Deployment Validation - Windows
echo ========================================
echo.

REM Check Docker
echo Checking Docker installation...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker not installed
    exit /b 1
)
for /f "tokens=*" %%i in ('docker --version') do set DOCKER_VERSION=%%i
echo [OK] %DOCKER_VERSION%

REM Check Docker Compose
echo Checking Docker Compose...
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker Compose not installed
    exit /b 1
)
for /f "tokens=*" %%i in ('docker-compose --version') do set COMPOSE_VERSION=%%i
echo [OK] %COMPOSE_VERSION%

echo.
echo Stopping previous containers...
docker-compose down >nul 2>&1

echo.
echo Building Docker images...
docker-compose build --no-cache backend >nul 2>&1
if errorlevel 1 (
    echo ERROR: Failed to build backend image
    exit /b 1
)
echo [OK] Backend image built

echo.
echo Starting Docker containers...
docker-compose -f docker-compose.dev.yml up -d
if errorlevel 1 (
    echo ERROR: Failed to start containers
    exit /b 1
)

echo [OK] Containers starting...
echo.
echo Waiting for services to be healthy (30 seconds)...
timeout /t 5 /nobreak

echo.
echo Checking service health...

REM Check Ollama
curl -f http://localhost:11434/api/tags >nul 2>&1
if errorlevel 1 (
    echo [WARN] Ollama not responding
) else (
    echo [OK] Ollama running (http://localhost:11434)
)

REM Check Backend
curl -f http://localhost:5000/health >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Backend not responding
) else (
    echo [OK] Backend running (http://localhost:5000)
)

echo.
echo Verifying Gemini API configuration...

docker-compose exec -T backend powershell -Command "if ($env:GEMINI_API_KEY) { Write-Host '[OK] GEMINI_API_KEY configured' } else { Write-Host '[WARN] GEMINI_API_KEY not set' }"

docker-compose exec -T backend powershell -Command "if ($env:USE_GEMINI -eq 'true') { Write-Host '[OK] Gemini API enabled' } else { Write-Host '[WARN] Gemini API disabled' }"

echo.
echo Container Status:
docker-compose ps

echo.
echo ========================================
echo Deployment Validation Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Start frontend: npm start
echo 2. Open browser: http://localhost:8082
echo 3. Upload a PDF to test MCQ generation
echo 4. Check logs: docker-compose logs -f backend
echo.
echo For more info:
echo   View logs: docker-compose logs -f backend
echo   Shell access: docker-compose exec backend bash
echo   Stop services: docker-compose down
echo.
pause
