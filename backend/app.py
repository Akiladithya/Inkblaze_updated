"""
PDF Highlighter Backend — Flask
================================
Endpoints:
  POST /highlight-text   → upload PDF/DOCX, highlight top sentences, append MCQs
  POST /generate-mcqs    → upload PDF/DOCX, return raw MCQ text
  GET  /uploads/<path>   → serve generated PDFs

Dependencies:
  pip install flask flask-cors pymupdf python-docx nltk scikit-learn ollama
"""

import os
import json
import re
import uuid
import logging
from pathlib import Path

import fitz  # PyMuPDF
import nltk
import numpy as np
import requests
from docx import Document
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from sklearn.feature_extraction.text import TfidfVectorizer

# ── NLTK data ────────────────────────────────────────────────────────────────
for resource in ("punkt", "punkt_tab", "stopwords"):
    try:
        nltk.data.find(f"tokenizers/{resource}")
    except (LookupError, OSError):
        nltk.download(resource, quiet=True)

from nltk.tokenize import sent_tokenize

# ── App setup ────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")
log = logging.getLogger(__name__)

app = Flask(__name__)

# ── CORS Configuration ────────────────────────────────────────────────────────
# SECURITY FIX: Restrict origins to prevent unauthorized access
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173,http://localhost:8082").split(",")
CORS_ORIGINS = [origin.strip() for origin in CORS_ORIGINS]  # Strip whitespace
CORS(app,
    resources={r"/*": {"origins": CORS_ORIGINS}},
    allow_headers=["Content-Type", "Authorization"],
    expose_headers=["Content-Disposition"],
    max_age=3600,
    supports_credentials=False,
)

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# ── Security Configuration ─────────────────────────────────────────────────────
MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "50"))
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE_MB * 1024 * 1024
UPLOAD_TTL_HOURS = int(os.getenv("UPLOAD_TTL_HOURS", "24"))

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "mistral")

# Percentile threshold: keep sentences above this importance score
IMPORTANCE_PERCENTILE = int(os.getenv("IMPORTANCE_PERCENTILE", "70"))
# Highlight color in PDF (yellow)
HIGHLIGHT_COLOR = (1.0, 0.95, 0.2)


# ── Helpers ──────────────────────────────────────────────────────────────────

def allowed_file(filename: str) -> bool:
    return Path(filename).suffix.lower() in {".pdf", ".docx", ".doc"}


def extract_text_from_pdf(path: str) -> str:
    doc = fitz.open(path)
    return "\n".join(page.get_text() for page in doc)


def extract_text_from_docx(path: str) -> str:
    doc = Document(path)
    return "\n".join(p.text for p in doc.paragraphs if p.text.strip())


def extract_text(path: str) -> str:
    ext = Path(path).suffix.lower()
    if ext == ".pdf":
        return extract_text_from_pdf(path)
    elif ext in {".docx", ".doc"}:
        return extract_text_from_docx(path)
    raise ValueError(f"Unsupported file type: {ext}")


def score_sentences(sentences: list[str]) -> np.ndarray:
    """Return TF-IDF importance score per sentence."""
    if not sentences:
        return np.array([])
    vectorizer = TfidfVectorizer(stop_words="english")
    try:
        tfidf_matrix = vectorizer.fit_transform(sentences)
    except ValueError:
        return np.ones(len(sentences))
    return np.asarray(tfidf_matrix.sum(axis=1)).flatten()


def select_top_sentences(
    sentences: list[str], scores: np.ndarray, percentile: int = IMPORTANCE_PERCENTILE
) -> list[str]:
    if len(sentences) == 0:
        return []
    threshold = np.percentile(scores, percentile)
    return [s for s, sc in zip(sentences, scores) if sc >= threshold]


def highlight_pdf(input_path: str, important_sentences: list[str], output_path: str) -> None:
    """Highlight important sentences in the PDF using PyMuPDF."""
    doc = fitz.open(input_path)
    for page in doc:
        for sentence in important_sentences:
            # Search for exact sentence first; fall back to first 80 chars
            search_text = sentence[:80]
            hits = page.search_for(search_text)
            for rect in hits:
                annot = page.add_highlight_annot(rect)
                annot.set_colors(stroke=HIGHLIGHT_COLOR)
                annot.update()
    doc.save(output_path)
    doc.close()


def append_mcqs_to_pdf(pdf_path: str, mcq_text: str) -> None:
    """Append a new page with MCQs to an existing PDF."""
    doc = fitz.open(pdf_path)
    page = doc.new_page()

    # Title
    page.insert_text(
        (50, 50),
        "Multiple Choice Questions",
        fontsize=18,
        fontname="helv",
        color=(0.1, 0.15, 0.3),
    )

    # Divider
    page.draw_line((50, 72), (545, 72), color=(0.6, 0.6, 0.6), width=0.8)

    # MCQ body
    y = 90
    for line in mcq_text.splitlines():
        line = line.strip()
        if not line:
            y += 8
            continue
        # Bold question lines that start with a number
        is_question = bool(re.match(r"^\d+[\.\)]\s", line))
        page.insert_text(
            (50, y),
            line,
            fontsize=10 if is_question else 9,
            fontname="helv" if not is_question else "hebo",
            color=(0.05, 0.1, 0.25) if is_question else (0.2, 0.2, 0.2),
        )
        y += 15
        if y > page.rect.height - 50:
            # Overflow: add another page
            page = doc.new_page()
            y = 50

    doc.save(pdf_path, incremental=True, encryption=fitz.PDF_ENCRYPT_KEEP)
    doc.close()


def generate_mcqs_via_ollama(text: str, num_questions: int = 5) -> str:
    """Call local Ollama (Mistral) to generate MCQs."""
    prompt = (
        f"Generate exactly {num_questions} multiple-choice questions based on the "
        f"following text. For each question provide 4 answer options (A, B, C, D) "
        f"and clearly indicate the correct answer.\n\n"
        f"Text:\n{text[:4000]}\n\n"
        f"Output format:\n"
        f"1. <Question>\n   A) ...\n   B) ...\n   C) ...\n   D) ...\n   Answer: <letter>\n\n"
        f"Generate {num_questions} questions now:"
    )

    try:
        resp = requests.post(
            f"{OLLAMA_URL}/api/generate",
            json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": False},
            timeout=120,
        )
        resp.raise_for_status()
        return resp.json().get("response", "").strip()
    except requests.exceptions.ConnectionError:
        log.warning("Ollama not reachable — returning placeholder MCQs")
        return _placeholder_mcqs(num_questions)
    except Exception as exc:
        log.error("Ollama error: %s", exc)
        return _placeholder_mcqs(num_questions)


def _placeholder_mcqs(num_questions: int) -> str:
    """Fallback MCQs when Ollama is unavailable."""
    lines = ["[Ollama unavailable — sample MCQs shown]\n"]
    for i in range(1, num_questions + 1):
        lines += [
            f"{i}. Sample question {i} about the document?",
            "   A) Option A",
            "   B) Option B",
            "   C) Option C",
            "   D) Option D",
            "   Answer: A\n",
        ]
    return "\n".join(lines)


def save_upload(file) -> str:
    ext = Path(file.filename).suffix.lower()
    filename = f"{uuid.uuid4().hex}{ext}"
    path = str(UPLOAD_DIR / filename)
    file.save(path)
    return path


# ── Routes ───────────────────────────────────────────────────────────────────

@app.route("/highlight-text", methods=["POST"])
def highlight_text():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    if not file.filename or not allowed_file(file.filename):
        return jsonify({"error": "Only PDF and DOCX files are supported"}), 400
    
    # SECURITY FIX: Check file size before processing
    if file.content_length and file.content_length > app.config['MAX_CONTENT_LENGTH']:
        return jsonify({
            "error": f"File exceeds {MAX_FILE_SIZE_MB}MB limit"
        }), 413

    try:
        input_path = save_upload(file)
        log.info("Saved upload: %s", input_path)

        # 1. Extract text
        raw_text = extract_text(input_path)
        if not raw_text.strip():
            return jsonify({"error": "Could not extract text from file"}), 422

        # 2. Tokenise sentences
        sentences = [s.strip() for s in sent_tokenize(raw_text) if len(s.strip()) > 20]
        log.info("Tokenised %d sentences", len(sentences))

        # 3. Score with TF-IDF
        scores = score_sentences(sentences)

        # 4. Select top sentences
        top_sentences = select_top_sentences(sentences, scores)
        log.info("Selected %d important sentences", len(top_sentences))

        # 5. Convert DOCX → PDF if needed, then highlight
        if Path(input_path).suffix.lower() != ".pdf":
            tmp_pdf_path = input_path.replace(Path(input_path).suffix, "_converted.pdf")
            _create_text_pdf(raw_text, tmp_pdf_path)
            work_path = tmp_pdf_path
        else:
            work_path = input_path

        output_path = str(UPLOAD_DIR / "highlighted_with_mcqs.pdf")
        highlight_pdf(work_path, top_sentences, output_path)

        # 6. Generate MCQs
        num_q = validate_num_questions(request.form)
        mcq_text = generate_mcqs_via_ollama(raw_text, num_q)

        # 7. Append MCQs as final page
        append_mcqs_to_pdf(output_path, mcq_text)
        log.info("Done. Output: %s", output_path)

        highlighted_text = "\n\n".join(top_sentences)

        return jsonify(
            {
                "highlighted_text": highlighted_text,
                "output_pdf_path": "uploads/highlighted_with_mcqs.pdf",
                "sentence_count": len(top_sentences),
                "total_sentences": len(sentences),
            }
        )

    except ValueError as e:
        log.warning("Validation error: %s", e)
        return jsonify({"error": str(e)}), 400
    except Exception as exc:
        log.exception("Error processing file")
        # Don't expose full stack trace in production
        return jsonify({"error": "Processing failed. Please try again."}), 500


@app.route("/generate-mcqs", methods=["POST"])
def generate_mcqs():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    if not file.filename or not allowed_file(file.filename):
        return jsonify({"error": "Only PDF and DOCX files are supported"}), 400

    # SECURITY FIX: Check file size before processing
    if file.content_length and file.content_length > app.config['MAX_CONTENT_LENGTH']:
        return jsonify({
            "error": f"File exceeds {MAX_FILE_SIZE_MB}MB limit"
        }), 413

    try:
        input_path = save_upload(file)
        raw_text = extract_text(input_path)

        if not raw_text.strip():
            return jsonify({"error": "Could not extract text from file"}), 422

        # SECURITY FIX: Validate num_questions
        num_q = validate_num_questions(request.form)
        mcq_text = generate_mcqs_via_ollama(raw_text, num_q)

        return jsonify({"mcqs": mcq_text})

    except ValueError as e:
        log.warning("Validation error: %s", e)
        return jsonify({"error": str(e)}), 400
    except Exception as exc:
        log.exception("Error generating MCQs")
        return jsonify({"error": "MCQ generation failed. Please try again."}), 500


@app.route("/uploads/<path:filename>", methods=["GET"])
def serve_upload(filename):
    """Serve generated PDFs with security validation."""
    # SECURITY FIX: Prevent path traversal attacks
    if ".." in filename or filename.startswith("/"):
        log.warning(f"Path traversal attempt detected: {filename}")
        return jsonify({"error": "Invalid file path"}), 403
    
    # Verify file exists in upload directory
    try:
        file_path = (Path(UPLOAD_DIR) / filename).resolve()
        upload_dir_resolved = Path(UPLOAD_DIR).resolve()
        
        # Ensure resolved path is within upload directory
        if not str(file_path).startswith(str(upload_dir_resolved)):
            log.warning(f"Access denied for file outside upload dir: {filename}")
            return jsonify({"error": "Access denied"}), 403
        
        if not file_path.exists():
            return jsonify({"error": "File not found"}), 404
            
    except (ValueError, OSError) as e:
        log.error(f"Path validation error: {e}")
        return jsonify({"error": "Invalid path"}), 403
    
    return send_from_directory(UPLOAD_DIR, filename)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model": OLLAMA_MODEL})


# ── DOCX fallback: create basic PDF ──────────────────────────────────────────

def _create_text_pdf(text: str, output_path: str) -> None:
    doc = fitz.open()
    page = doc.new_page()
    y = 50
    for line in text.splitlines():
        if y > page.rect.height - 50:
            page = doc.new_page()
            y = 50
        page.insert_text((50, y), line[:120], fontsize=10)
        y += 14
    doc.save(output_path)
    doc.close()


# ── Security Headers ──────────────────────────────────────────────────────────
@app.after_request
def set_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    return response


# ── Input Validation ───────────────────────────────────────────────────────────
def validate_num_questions(request_form, default=5, max_val=20):
    """Extract and validate num_questions parameter."""
    try:
        num_q = int(request_form.get("num_questions", default))
        if not (1 <= num_q <= max_val):
            raise ValueError(f"num_questions must be between 1 and {max_val}")
        return num_q
    except (ValueError, TypeError) as e:
        raise ValueError(f"Invalid num_questions: {str(e)}")


# ── Entry ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    # SECURITY FIX: Use environment variable for debug mode
    debug_mode = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    app.run(host="0.0.0.0", port=int(os.getenv("SERVER_PORT", 5000)), debug=debug_mode)
