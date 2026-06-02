# Gemini API Integration - Setup Guide

## Overview

PDF Highlighter now supports **Google Gemini API** for MCQ generation, with automatic fallback to Ollama if Gemini is unavailable.

### How It Works
```
Upload PDF
   ↓
Extract Text
   ↓
Highlight Top Sentences (TF-IDF)
   ↓
Generate MCQs:
   ├─ Try Gemini API (primary) ✨ FASTER, CLOUD-BASED
   └─ Fallback to Ollama (local) ✓ Offline capability
   ↓
Append to PDF
   ↓
Return Result
```

---

## Prerequisites

- Google Account
- Gemini API Key (free tier available)
- API enabled in Google Cloud Console
- Python 3.9+
- Google generativeai package: `pip install google-generativeai`

---

## Step 1: Get Gemini API Key

### Option A: Quick Setup (Recommended for Development)

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Get API Key"
3. Create new API key (or use existing)
4. Copy the key
5. Set as environment variable

### Option B: Google Cloud Setup (Recommended for Production)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project
3. Enable "Google Generative AI API"
4. Go to Credentials → Create API Key
5. Copy the key

---

## Step 2: Configure Environment Variables

### Development (Local)

Create `.env` file in project root:
```env
GEMINI_API_KEY=<YOUR_GEMINI_API_KEY>
GEMINI_MODEL=gemini-pro
USE_GEMINI=true
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=mistral
```

### Docker Development

```bash
export GEMINI_API_KEY="your-api-key"
docker-compose -f docker-compose.dev.yml up -d
```

### Production (Docker Compose)

Update `.env` file:
```env
FLASK_ENV=production
GEMINI_API_KEY=your-production-key
GEMINI_MODEL=gemini-pro
USE_GEMINI=true
CORS_ORIGINS=https://yourdomain.com
```

Then start:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## Step 3: Install Dependencies

```bash
# Install google-generativeai
pip install google-generativeai==0.3.0

# Or update all dependencies
pip install -r backend/requirements.txt
```

---

## Step 4: Start the Application

### Using Docker (Recommended)

```bash
# Development
docker-compose -f docker-compose.dev.yml up -d
npm start  # In separate terminal

# Production
docker-compose -f docker-compose.prod.yml up -d
```

### Local Development (Without Docker)

```bash
cd backend
pip install -r requirements.txt
python app.py
```

---

## Testing the Integration

### Test Gemini Connection

```bash
# Python
python -c "
import google.generativeai as genai
genai.configure(api_key='YOUR_API_KEY')
model = genai.GenerativeModel('gemini-pro')
response = model.generate_content('Generate 2 MCQs about Python programming')
print(response.text)
"
```

### Test with API

```bash
# Upload a PDF and generate MCQs
curl -X POST http://localhost:5000/generate-mcqs \
  -F "file=@sample.pdf" \
  -F "num_questions=3"
```

### Check Logs

```bash
# Docker
docker-compose logs -f backend

# Look for: "Generated 3 MCQs via Gemini API" ✓
# Or: "Gemini failed, falling back to Ollama" ⚠️
```

---

## Feature Comparison

### Gemini API vs Ollama

| Feature | Gemini | Ollama |
|---------|--------|--------|
| **Speed** | ⚡ Very Fast (2-5s) | 🐢 Medium (10-30s) |
| **Quality** | 🌟 Excellent | ✓ Good |
| **Cost** | 💰 Free (100 calls/min) | 🆓 Free (local) |
| **Internet** | 🌐 Required | ❌ Offline |
| **Setup** | ⚙️ 2 minutes | ⚙️ 10 minutes |
| **Models** | 🔄 Always updated | 📦 Downloaded locally |
| **Privacy** | ⚠️ Cloud-based | 🔒 Local |

---

## Configuration Options

### Environment Variables

```env
# Enable/Disable Gemini
USE_GEMINI=true|false                    # Default: true

# API Configuration
GEMINI_API_KEY=your-api-key              # Required if USE_GEMINI=true
GEMINI_MODEL=gemini-pro|gemini-pro-vision  # Default: gemini-pro

# Fallback Configuration
OLLAMA_URL=http://localhost:11434        # Fallback LLM
OLLAMA_MODEL=mistral|neural-chat|orca-mini
```

### Supported Models

**Gemini Models:**
- `gemini-pro` - Recommended for general tasks
- `gemini-pro-vision` - For image analysis (future support)

**Ollama Models** (fallback):
- `mistral` - 5GB, good quality
- `neural-chat` - 3GB, faster
- `orca-mini` - 1GB, lightweight

---

## API Endpoints

### POST /highlight-text
- Upload PDF/DOCX
- Extract & highlight text
- Generate MCQs via Gemini or Ollama
- Return highlighted PDF with MCQs

**Request:**
```bash
curl -X POST http://localhost:5000/highlight-text \
  -F "file=@document.pdf" \
  -F "num_highlights=5" \
  -F "num_questions=3"
```

**Response:**
```json
{
  "highlighted_text": "Important sentence 1...",
  "mcqs": "1. Question?...",
  "output_pdf_path": "uploads/highlighted_with_mcqs.pdf"
}
```

### POST /generate-mcqs
- Upload PDF/DOCX
- Generate MCQs only

**Request:**
```bash
curl -X POST http://localhost:5000/generate-mcqs \
  -F "file=@document.pdf" \
  -F "num_questions=3"
```

**Response:**
```json
{
  "mcqs": "1. Generated question?...",
  "source": "gemini" | "ollama" | "placeholder"
}
```

### GET /health
- Check service status

**Response:**
```json
{
  "status": "ok",
  "model": "gemini-pro",
  "ollama_available": true
}
```

---

## Troubleshooting

### ❌ "GEMINI_API_KEY not found"
**Solution:**
```bash
export GEMINI_API_KEY="your-api-key"
# or set in .env file
```

### ❌ "Gemini API connection error"
**Solution:**
- Verify internet connection
- Check API key validity
- Verify API is enabled in Google Cloud
- Check rate limits (100 calls/min free tier)

### ❌ "Invalid API key"
**Solution:**
- Copy API key correctly (no spaces)
- Verify key is still valid
- Create new key if expired

### ❌ "Google generativeai not installed"
**Solution:**
```bash
pip install google-generativeai==0.3.0
docker-compose build --no-cache backend
```

### ❌ Authorization error
**Solution:**
- Enable "Google Generative AI API" in Cloud Console
- Check API quota
- Verify project access

---

## Performance Optimization

### Tips for Better Performance

1. **Use Gemini for Production**
   - Much faster than local Ollama
   - No resource overhead on server
   - Better MCQ quality

2. **Cache Results**
   - Store generated MCQs
   - Reuse for similar documents

3. **Batch Processing**
   - Process multiple files in parallel
   - Submit multiple API calls

4. **Optimize Text Length**
   - Limit to 6000 chars for better results
   - Top sentences only

---

## Security & Privacy

### Best Practices

1. **API Key Management**
   - Never commit API keys to Git
   - Use environment variables
   - Rotate keys periodically
   - Use `.gitignore` for `.env`

2. **Data Privacy**
   - Gemini processes data in Google Cloud
   - Review Google's privacy policy
   - Consider for sensitive documents
   - Alternative: Use Ollama (local only)

3. **Rate Limiting**
   - Free tier: 100 calls/minute
   - Paid tier: Higher limits
   - Implement queuing for high volume

4. **Network Security**
   - Use HTTPS in production
   - Set CORS origins correctly
   - Enable API authentication

---

## Deployment Checklist

### Before Production

- [ ] API key obtained and verified
- [ ] `.env` configured with secure key
- [ ] Google Generative AI API enabled
- [ ] `google-generativeai` package installed
- [ ] Docker image built with dependencies
- [ ] Tested Gemini connection
- [ ] Tested fallback to Ollama
- [ ] Verified CORS configuration
- [ ] Rate limiting configured (if needed)
- [ ] Backup API key stored securely

### Deployment Steps

```bash
# 1. Setup environment
cp .env.docker .env
nano .env  # Set GEMINI_API_KEY

# 2. Build and start
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# 3. Verify
docker-compose logs -f backend
curl http://localhost:5000/health

# 4. Test
curl -X POST http://localhost:5000/generate-mcqs \
  -F "file=@test.pdf"
```

---

## Monitoring & Logging

### View Logs

```bash
# All backend logs
docker-compose logs -f backend

# Only Gemini-related logs
docker-compose logs -f backend | grep -i gemini

# Only errors
docker-compose logs backend | grep ERROR
```

### Log Entries

```
✓ Gemini API configured
✓ Generated 3 MCQs via Gemini API
⚠ Gemini failed, falling back to Ollama
⚠ Gemini API key not provided
❌ Gemini API error: <error message>
```

---

## Cost Analysis

### Free Tier (Recommended for Development)
- **Rate limit**: 100 calls/minute
- **Cost**: $0/month
- **Suitable for**: Development, small deployments

### Paid Tier (Production)
- **Rate limit**: Based on billing
- **Cost**: $0.50 per million input tokens, $1.50 per million output tokens
- **Suitable for**: High-volume production deployments

### Example Costs
- 100 PDFs/day: ~$1-5/month
- 1000 PDFs/day: ~$10-50/month
- 10000 PDFs/day: ~$100-500/month

---

## FAQ

**Q: Can I use both Gemini and Ollama?**
A: Yes! System tries Gemini first, falls back to Ollama if Gemini fails or API key missing.

**Q: Do I need to pay for Gemini?**
A: No, free tier includes 100 calls/minute. Pay only for heavy usage.

**Q: What if Gemini API is down?**
A: System automatically falls back to Ollama (if available).

**Q: Can I use this offline?**
A: Yes, disable Gemini (`USE_GEMINI=false`) to use Ollama only.

**Q: Is my data sent to Google?**
A: Yes, document text is sent to Gemini API. Use Ollama for sensitive data.

---

## Support & Resources

- [Google Generative AI API](https://ai.google.dev/)
- [Gemini Documentation](https://ai.google.dev/docs)
- [API Pricing](https://ai.google.dev/pricing)
- [Rate Limits](https://ai.google.dev/docs/quotas)

---

**Setup Complete! Your application now uses Google Gemini for faster MCQ generation.** 🚀
