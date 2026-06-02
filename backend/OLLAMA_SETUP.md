# Ollama Setup Guide

## Overview
Ollama is a local LLM runtime used by PDF Highlighter to generate multiple-choice questions from document text.

## Installation

### Windows
1. Download Ollama from https://ollama.ai
2. Install and run the application
3. Ollama will start a local server on `http://localhost:11434`

### macOS
```bash
brew install ollama
ollama serve  # Start the server
```

### Linux
```bash
curl https://ollama.ai/install.sh | sh
ollama serve  # Start the server
```

### Docker (Recommended for Development)
```bash
docker run -d -p 11434:11434 ollama/ollama
```

## Download Models

The backend expects the `mistral` model by default. Download it:

```bash
ollama pull mistral
```

### Alternative Models (faster/lighter)
```bash
# Smaller, faster model
ollama pull neural-chat
ollama pull orca-mini

# Larger, more capable
ollama pull llama2
ollama pull neural-chat-7b
```

## Configuration

Set environment variables in `.env`:

```env
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=mistral
```

## Verify Installation

```bash
# Check if Ollama is running
python -c "import requests; print(requests.get('http://localhost:11434/api/tags').json())"

# Test model availability
python -c "import requests; print(requests.post('http://localhost:11434/api/generate', json={'model': 'mistral', 'prompt': 'Hello', 'stream': False}, timeout=60).json())"
```

## Fallback Behavior

If Ollama is unavailable, the backend automatically returns placeholder MCQs and continues operation without crashing.

## Performance Notes

- **Mistral**: ~5GB VRAM, good balance of speed and quality
- **Neural-Chat**: ~3GB VRAM, faster inference
- **Orca-Mini**: ~1GB VRAM, lightweight but less capable

## Troubleshooting

1. **"Ollama not reachable"**
   - Ensure Ollama is running: `ollama serve`
   - Check connection: `curl http://localhost:11434/api/tags`
   - Verify OLLAMA_URL in environment

2. **Model not found**
   - Download model: `ollama pull mistral`
   - List available: `ollama list`

3. **Out of memory**
   - Use a lighter model: `ollama pull orca-mini`
   - Run on GPU: Ollama automatically uses GPU if available
