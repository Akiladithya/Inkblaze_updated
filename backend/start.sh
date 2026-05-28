#!/usr/bin/env bash
# backend/start.sh — one-shot backend bootstrap
set -e

echo "==> PDF Highlighter Backend Setup"
echo ""

# Create virtualenv if not exists
if [ ! -d "venv" ]; then
  echo "Creating Python virtual environment..."
  python3 -m venv venv
fi

# Activate
source venv/bin/activate

# Install deps
echo "Installing Python dependencies..."
pip install --upgrade pip -q
pip install -r requirements.txt -q

# NLTK data
echo "Downloading NLTK data..."
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

# Check Ollama
echo ""
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
  echo "✓ Ollama is running"
else
  echo "⚠  Ollama not detected at localhost:11434"
  echo "   Install from https://ollama.ai and run: ollama pull mistral"
fi

echo ""
echo "Starting Flask server on http://0.0.0.0:5000 ..."
echo ""
FLASK_ENV=development python app.py
