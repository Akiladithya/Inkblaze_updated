"""
INNK Backend — Flask
=====================
POST /auth/register     → { name, email, password } → { token, user }
POST /auth/login        → { email, password }        → { token, user }
GET  /auth/me           → JWT → { user }
POST /highlight-text    → JWT + file → { highlighted_text, output_pdf_path, ... }
POST /generate-mcqs     → JWT + file → { mcqs }
GET  /history           → JWT → [ documents ]
GET  /history/<id>      → JWT → document
DELETE /history/<id>    → JWT → { ok }
GET  /uploads/<path>    → serve PDF
GET  /health            → status
"""

import os, re, uuid, logging, sqlite3, hashlib, hmac, base64, json
from pathlib import Path
from datetime import datetime, timedelta, timezone
from functools import wraps
from dotenv import load_dotenv

import fitz
import nltk
import numpy as np
from docx import Document
from flask import Flask, jsonify, request, send_from_directory, g
from flask_cors import CORS
from sklearn.feature_extraction.text import TfidfVectorizer

load_dotenv(Path(__file__).parent / ".env")

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

for resource in ("punkt", "punkt_tab", "stopwords"):
    try:
        nltk.data.find(f"tokenizers/{resource}")
    except (LookupError, OSError):
        nltk.download(resource, quiet=True)

from nltk.tokenize import sent_tokenize

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")
log = logging.getLogger(__name__)

app = Flask(__name__)

# ── CORS ──────────────────────────────────────────────────────────────────────
CORS_ORIGINS = [
    o.strip() for o in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://localhost:5173,http://localhost:8081,http://localhost:8082,http://localhost:19006"
    ).split(",")
]
# Support vercel.app preview and production deployments dynamically via regex matching
CORS_ORIGINS.append(r"https://.*\.vercel\.app")

CORS(app, resources={
    r"/*": {
        "origins": CORS_ORIGINS,
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Disposition"],
        "supports_credentials": False,
        "max_age": 3600,
    }
})

# ── Config ────────────────────────────────────────────────────────────────────
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "uploads"))
UPLOAD_DIR.mkdir(exist_ok=True)
app.config["MAX_CONTENT_LENGTH"] = int(os.getenv("MAX_FILE_SIZE_MB", "50")) * 1024 * 1024

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL   = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
USE_GEMINI     = GEMINI_AVAILABLE and bool(GEMINI_API_KEY)
if USE_GEMINI:
    genai.configure(api_key=GEMINI_API_KEY)
    log.info("Gemini configured — %s", GEMINI_MODEL)

IMPORTANCE_PERCENTILE = int(os.getenv("IMPORTANCE_PERCENTILE", "70"))
HIGHLIGHT_COLOR = (1.0, 0.95, 0.2)
JWT_SECRET      = os.getenv("JWT_SECRET", "change-me-in-production")
JWT_HOURS       = int(os.getenv("JWT_EXPIRY_HOURS", "720"))  # 30 days

# ── Database ──────────────────────────────────────────────────────────────────
DB_PATH = Path(os.getenv("DB_PATH", "innk.db"))

def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(str(DB_PATH), detect_types=sqlite3.PARSE_DECLTYPES)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA journal_mode=WAL")
        g.db.execute("PRAGMA foreign_keys=ON")
    return g.db

@app.teardown_appcontext
def close_db(exc):
    db = g.pop("db", None)
    if db: db.close()

def init_db():
    db = sqlite3.connect(str(DB_PATH))
    db.executescript("""
        PRAGMA journal_mode=WAL;
        PRAGMA foreign_keys=ON;
        CREATE TABLE IF NOT EXISTS users (
            id         TEXT PRIMARY KEY,
            name       TEXT NOT NULL,
            email      TEXT NOT NULL UNIQUE,
            password   TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS documents (
            id               TEXT PRIMARY KEY,
            user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            original_name    TEXT NOT NULL,
            pdf_path         TEXT NOT NULL,
            highlighted_text TEXT NOT NULL,
            sentence_count   INTEGER NOT NULL DEFAULT 0,
            total_sentences  INTEGER NOT NULL DEFAULT 0,
            created_at       TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_docs_user ON documents(user_id);
    """)
    db.commit()
    db.close()
    log.info("DB ready: %s", DB_PATH)

init_db()

# ── JWT ───────────────────────────────────────────────────────────────────────
def _b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

def _unb64(s: str) -> bytes:
    pad = (4 - len(s) % 4) % 4
    return base64.urlsafe_b64decode(s + "=" * pad)

def make_token(user_id: str) -> str:
    h = _b64(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    p = _b64(json.dumps({
        "sub": user_id,
        "exp": (datetime.now(timezone.utc) + timedelta(hours=JWT_HOURS)).isoformat()
    }).encode())
    s = _b64(hmac.new(JWT_SECRET.encode(), f"{h}.{p}".encode(), hashlib.sha256).digest())
    return f"{h}.{p}.{s}"

def decode_token(token: str):
    try:
        h, p, s = token.split(".")
        expected = _b64(hmac.new(JWT_SECRET.encode(), f"{h}.{p}".encode(), hashlib.sha256).digest())
        if not hmac.compare_digest(s, expected):
            return None
        data = json.loads(_unb64(p))
        if datetime.fromisoformat(data["exp"]) < datetime.now(timezone.utc):
            return None
        return data["sub"]
    except Exception:
        return None

def require_auth(f):
    @wraps(f)
    def inner(*args, **kwargs):
        token   = request.headers.get("Authorization", "").removeprefix("Bearer ").strip()
        user_id = decode_token(token)
        if not user_id:
            return jsonify({"error": "Unauthorised"}), 401
        user = get_db().execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone()
        if not user:
            return jsonify({"error": "User not found"}), 401
        g.current_user = dict(user)
        return f(*args, **kwargs)
    return inner

# ── Password ──────────────────────────────────────────────────────────────────
def hash_pw(pw: str) -> str:
    salt = os.urandom(16)
    dk   = hashlib.pbkdf2_hmac("sha256", pw.encode(), salt, 260_000)
    return base64.b64encode(salt + dk).decode()

def check_pw(pw: str, stored: str) -> bool:
    raw       = base64.b64decode(stored)
    salt, dk  = raw[:16], raw[16:]
    return hmac.compare_digest(dk, hashlib.pbkdf2_hmac("sha256", pw.encode(), salt, 260_000))

# ── Auth routes ───────────────────────────────────────────────────────────────
@app.route("/auth/register", methods=["POST"])
def register():
    d     = request.get_json(silent=True) or {}
    name  = (d.get("name")     or "").strip()
    email = (d.get("email")    or "").strip().lower()
    pw    = (d.get("password") or "")
    if not name or not email or not pw:
        return jsonify({"error": "Name, email and password are required"}), 400
    if len(pw) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400
    if "@" not in email:
        return jsonify({"error": "Invalid email address"}), 400
    db = get_db()
    if db.execute("SELECT id FROM users WHERE email=?", (email,)).fetchone():
        return jsonify({"error": "An account with this email already exists"}), 409
    uid = uuid.uuid4().hex
    db.execute("INSERT INTO users VALUES (?,?,?,?,?)",
               (uid, name, email, hash_pw(pw), datetime.now(timezone.utc).isoformat()))
    db.commit()
    log.info("Registered: %s", email)
    return jsonify({"token": make_token(uid), "user": {"id": uid, "name": name, "email": email}}), 201

@app.route("/auth/login", methods=["POST"])
def login():
    d     = request.get_json(silent=True) or {}
    email = (d.get("email")    or "").strip().lower()
    pw    = (d.get("password") or "")
    if not email or not pw:
        return jsonify({"error": "Email and password are required"}), 400
    user = get_db().execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
    if not user or not check_pw(pw, user["password"]):
        return jsonify({"error": "Invalid email or password"}), 401
    log.info("Login: %s", email)
    return jsonify({
        "token": make_token(user["id"]),
        "user":  {"id": user["id"], "name": user["name"], "email": user["email"]}
    })

@app.route("/auth/me", methods=["GET"])
@require_auth
def me():
    u = g.current_user
    return jsonify({"id": u["id"], "name": u["name"], "email": u["email"], "created_at": u["created_at"]})

# ── History ───────────────────────────────────────────────────────────────────
@app.route("/history", methods=["GET"])
@require_auth
def get_history():
    rows = get_db().execute(
        "SELECT id, original_name, sentence_count, total_sentences, pdf_path, created_at "
        "FROM documents WHERE user_id=? ORDER BY created_at DESC LIMIT 100",
        (g.current_user["id"],)
    ).fetchall()
    return jsonify([dict(r) for r in rows])

@app.route("/history/<doc_id>", methods=["GET"])
@require_auth
def get_history_item(doc_id):
    row = get_db().execute(
        "SELECT * FROM documents WHERE id=? AND user_id=?",
        (doc_id, g.current_user["id"])
    ).fetchone()
    if not row: return jsonify({"error": "Not found"}), 404
    return jsonify(dict(row))

@app.route("/history/<doc_id>", methods=["DELETE"])
@require_auth
def delete_history_item(doc_id):
    db  = get_db()
    row = db.execute("SELECT pdf_path FROM documents WHERE id=? AND user_id=?",
                     (doc_id, g.current_user["id"])).fetchone()
    if not row: return jsonify({"error": "Not found"}), 404
    try:
        p = Path(row["pdf_path"])
        if p.exists(): p.unlink()
    except OSError:
        pass
    db.execute("DELETE FROM documents WHERE id=?", (doc_id,))
    db.commit()
    return jsonify({"ok": True})

# ── PDF helpers ───────────────────────────────────────────────────────────────
def allowed_file(fn):
    return Path(fn).suffix.lower() in {".pdf", ".docx", ".doc"}

def extract_text(path):
    ext = Path(path).suffix.lower()
    if ext == ".pdf":
        doc = fitz.open(path)
        return "\n".join(p.get_text() for p in doc)
    doc = Document(path)
    return "\n".join(p.text for p in doc.paragraphs if p.text.strip())

def score_sentences(sentences):
    if not sentences: return np.array([])
    try:
        return np.asarray(
            TfidfVectorizer(stop_words="english").fit_transform(sentences).sum(axis=1)
        ).flatten()
    except ValueError:
        return np.ones(len(sentences))

def select_top(sentences, scores):
    if not len(sentences): return []
    threshold = np.percentile(scores, IMPORTANCE_PERCENTILE)
    return [s for s, sc in zip(sentences, scores) if sc >= threshold]

def highlight_pdf(input_path, important, output_path):
    doc = fitz.open(input_path)
    for page in doc:
        for sentence in important:
            words = sentence.split()
            if not words: continue
            for n in (12, 8, 5):
                hits = page.search_for(" ".join(words[:n]), quads=False)
                if hits:
                    for rect in hits:
                        a = page.add_highlight_annot(rect)
                        a.set_colors(stroke=HIGHLIGHT_COLOR)
                        a.update()
                    break
    doc.save(output_path)
    doc.close()

def append_mcqs(pdf_path, mcq_text):
    doc  = fitz.open(pdf_path)
    page = doc.new_page()
    page.insert_text((50, 50), "Multiple Choice Questions",
                     fontsize=18, fontname="helv", color=(0.1, 0.15, 0.3))
    page.draw_line((50, 72), (545, 72), color=(0.6, 0.6, 0.6), width=0.8)
    y = 90
    for line in mcq_text.splitlines():
        line = line.strip()
        if not line:
            y += 8
            continue
        is_q = bool(re.match(r"^\d+[\.\)]\s", line))
        page.insert_text((50, y), line,
                         fontsize=10 if is_q else 9, fontname="helv",
                         color=(0.05, 0.1, 0.25) if is_q else (0.2, 0.2, 0.2))
        y += 15
        if y > page.rect.height - 50:
            page = doc.new_page()
            y = 50
    tmp = pdf_path + ".tmp"
    doc.save(tmp)
    doc.close()
    os.replace(tmp, pdf_path)

def gen_mcqs(text, n=5):
    if not USE_GEMINI:
        return _placeholder(n)
    prompt = (
        f"Generate exactly {n} multiple-choice questions from the text below. "
        f"Each question must have 4 options (A-D) and indicate the correct answer.\n\n"
        f"Text:\n{text[:4000]}\n\n"
        f"Format:\n1. <Question>\n   A) ...\n   B) ...\n   C) ...\n   D) ...\n   Answer: <letter>\n\n"
        f"Generate {n} questions:"
    )
    try:
        return genai.GenerativeModel(GEMINI_MODEL).generate_content(prompt).text.strip()
    except Exception as e:
        log.error("Gemini error: %s", e)
        return _placeholder(n)

def _placeholder(n):
    lines = ["[Gemini unavailable — sample MCQs]\n"]
    for i in range(1, n + 1):
        lines += [f"{i}. Sample question {i}?",
                  "   A) Option A", "   B) Option B",
                  "   C) Option C", "   D) Option D", "   Answer: A\n"]
    return "\n".join(lines)

def _text_pdf(text, out):
    doc = fitz.open()
    page = doc.new_page()
    y = 50
    for line in text.splitlines():
        if y > page.rect.height - 50:
            page = doc.new_page()
            y = 50
        page.insert_text((50, y), line[:120], fontsize=10)
        y += 14
    doc.save(out)
    doc.close()

def validate_n(form, default=5, mx=20):
    try:
        n = int(form.get("num_questions", default))
        if not (1 <= n <= mx): raise ValueError()
        return n
    except (ValueError, TypeError):
        raise ValueError("num_questions must be 1–20")

# ── Processing routes ─────────────────────────────────────────────────────────
@app.route("/highlight-text", methods=["POST"])
@require_auth
def highlight_text():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400
    file = request.files["file"]
    if not file.filename or not allowed_file(file.filename):
        return jsonify({"error": "Only PDF and DOCX files are supported"}), 400
    try:
        ext     = Path(file.filename).suffix.lower()
        uid     = uuid.uuid4().hex
        in_path = str(UPLOAD_DIR / f"{uid}{ext}")
        file.save(in_path)

        raw = extract_text(in_path)
        if not raw.strip():
            return jsonify({"error": "Could not extract text"}), 422

        sentences = [s.strip() for s in sent_tokenize(raw) if len(s.strip()) > 20]
        top       = select_top(sentences, score_sentences(sentences))

        work = in_path
        if ext != ".pdf":
            work = in_path.replace(ext, "_converted.pdf")
            _text_pdf(raw, work)

        out_name = f"{uid}_highlighted.pdf"
        out_path = str(UPLOAD_DIR / out_name)
        highlight_pdf(work, top, out_path)
        append_mcqs(out_path, gen_mcqs(raw, validate_n(request.form)))

        highlighted_text = "\n\n".join(top)
        doc_id = uuid.uuid4().hex
        db = get_db()
        db.execute(
            "INSERT INTO documents VALUES (?,?,?,?,?,?,?,?)",
            (doc_id, g.current_user["id"], file.filename, out_path,
             highlighted_text, len(top), len(sentences),
             datetime.now(timezone.utc).isoformat())
        )
        db.commit()

        return jsonify({
            "id":               doc_id,
            "highlighted_text": highlighted_text,
            "output_pdf_path":  f"uploads/{out_name}",
            "sentence_count":   len(top),
            "total_sentences":  len(sentences),
        })
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        log.exception("Processing error: %s", e)
        return jsonify({"error": f"Processing failed: {e}"}), 500

@app.route("/generate-mcqs", methods=["POST"])
@require_auth
def generate_mcqs_route():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400
    file = request.files["file"]
    if not file.filename or not allowed_file(file.filename):
        return jsonify({"error": "Only PDF and DOCX files are supported"}), 400
    try:
        ext     = Path(file.filename).suffix.lower()
        in_path = str(UPLOAD_DIR / f"{uuid.uuid4().hex}{ext}")
        file.save(in_path)
        raw = extract_text(in_path)
        if not raw.strip():
            return jsonify({"error": "Could not extract text"}), 422
        return jsonify({"mcqs": gen_mcqs(raw, validate_n(request.form))})
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        log.exception("MCQ error: %s", e)
        return jsonify({"error": f"MCQ generation failed: {e}"}), 500

@app.route("/uploads/<path:filename>")
def serve_upload(filename):
    if ".." in filename or filename.startswith("/"):
        return jsonify({"error": "Invalid path"}), 403
    try:
        fp = (UPLOAD_DIR / filename).resolve()
        if not str(fp).startswith(str(UPLOAD_DIR.resolve())):
            return jsonify({"error": "Access denied"}), 403
        if not fp.exists():
            return jsonify({"error": "Not found"}), 404
    except OSError:
        return jsonify({"error": "Invalid path"}), 403
    return send_from_directory(UPLOAD_DIR, filename)

@app.route("/health")
def health():
    return jsonify({"status": "ok", "model": GEMINI_MODEL, "gemini_ready": USE_GEMINI})

@app.after_request
def security_headers(r):
    r.headers["X-Content-Type-Options"] = "nosniff"
    r.headers["X-XSS-Protection"]       = "1; mode=block"
    return r

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.getenv("SERVER_PORT", 5000)),
        debug=os.getenv("FLASK_DEBUG", "false").lower() == "true"
    )
