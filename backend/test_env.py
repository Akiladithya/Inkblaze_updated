import sys
import os
sys.stdout.reconfigure(encoding='utf-8')

from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

api_key = os.getenv("GEMINI_API_KEY")
model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

print(f"GEMINI_API_KEY loaded: {bool(api_key)}")
if api_key:
    print(f"API Key preview: {api_key[:10]}...")

print("\nAll env vars:")
for key in ['GEMINI_API_KEY', 'GEMINI_MODEL', 'FLASK_ENV', 'CORS_ORIGINS']:
    val = os.getenv(key)
    print(f"  {key}: {'[SET]' if key == 'GEMINI_API_KEY' and val else val}")

if not api_key:
    print("\nERROR: GEMINI_API_KEY not set")
    sys.exit(1)

import google.generativeai as genai
genai.configure(api_key=api_key)

# List available models
print("\nAvailable generateContent models:")
available = []
for m in genai.list_models():
    if "generateContent" in m.supported_generation_methods:
        print(f"  - {m.name}")
        available.append(m.name)

# Test with configured model
full_model_name = model_name if "/" in model_name else f"models/{model_name}"
if full_model_name not in available:
    # Pick first available flash/pro model
    preferred = next((n for n in available if "flash" in n or "pro" in n), available[0] if available else None)
    print(f"\nWARNING: '{model_name}' not available. Use: {preferred}")
    print(f"Update GEMINI_MODEL in .env to: {preferred.replace('models/', '')}")
else:
    try:
        model = genai.GenerativeModel(model_name)
        response = model.generate_content("Reply with exactly: API OK")
        print(f"\nOK Gemini API working: {response.text.strip()}")
    except Exception as e:
        print(f"\nERROR Gemini API call failed: {e}")
