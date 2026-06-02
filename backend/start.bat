@echo off
REM PDF Highlighter Backend Start Script for Windows
REM Usage: backend/start.bat

echo.
echo =^> PDF Highlighter Backend Setup (Windows)
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.9+ from https://www.python.org/
    exit /b 1
)

REM Create virtualenv if not exists
if not exist venv (
    echo Creating Python virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo ERROR: Failed to create virtual environment
        exit /b 1
    )
)

REM Activate virtualenv
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo ERROR: Failed to activate virtual environment
    exit /b 1
)

REM Install/upgrade pip
echo Installing/upgrading pip...
python -m pip install --upgrade pip -q
if errorlevel 1 (
    echo ERROR: Failed to upgrade pip
    exit /b 1
)

REM Install dependencies
echo Installing Python dependencies...
pip install -r requirements.txt -q
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    echo Try running: pip install -r requirements.txt
    exit /b 1
)

REM Download NLTK data
echo Downloading NLTK data...
python -c "
import nltk
for pkg in ('punkt', 'punkt_tab', 'stopwords'):
    try:
        nltk.data.find(f'tokenizers/{pkg}')
        print(f'  {pkg} already present')
    except LookupError:
        nltk.download(pkg, quiet=True)
        print(f'  {pkg} downloaded')
"
if errorlevel 1 (
    echo WARNING: Failed to download NLTK data
    echo You may need to run: python -m nltk.downloader punkt punkt_tab stopwords
)

REM Check Gemini API key
echo.
echo Checking Gemini API key...
python -c "import os; from dotenv import load_dotenv; load_dotenv('.env'); key=os.getenv('GEMINI_API_KEY'); print('  Gemini API key: SET') if key else print('  WARNING: GEMINI_API_KEY not set in .env')"

REM Start Flask server
echo.
echo Starting Flask server on http://0.0.0.0:5000 ...
echo.
python app.py
