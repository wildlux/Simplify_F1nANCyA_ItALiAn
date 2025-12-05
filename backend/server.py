#!/usr/bin/env python3
"""
ASSISTENTE AI BACKEND - Linux Optimized v4.0
Backend completo con FastAPI per Assistente AI
"""

import uvicorn
import requests
import json
import time
import logging
import asyncio
import psutil
import os
import sys
from fastapi import FastAPI, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import sqlite3
from contextlib import asynccontextmanager

# ================= CONFIGURAZIONE =================
VERSION = "4.0"
OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = os.getenv("AI_MODEL", "llama3.2:3b")

# Configurazione logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('../logs/backend.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# ================= MODELLI =================
class ChatMessage(BaseModel):
    text: str
    mode: str = "auto"
    conversation_id: Optional[str] = None
    stream: bool = True

class VoiceRequest(BaseModel):
    audio_data: str  # Base64 encoded audio
    language: str = "it-IT"

class ConversationRequest(BaseModel):
    name: str
    tags: List[str] = []

# ================= SISTEMA DATABASE =================
def init_db():
    """Inizializza database SQLite"""
    conn = sqlite3.connect('../data/conversations.db')
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS conversations (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversation_id TEXT,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (conversation_id) REFERENCES conversations (id)
        )
    ''')

    conn.commit()
    conn.close()

# ================= PROMPT TEMPLATES =================
SYSTEM_PROMPTS = {
    "finance": """Sei un esperto consulente finanziario e fiscale italiano.
Specializzato in:
- Tasse italiane (IRPEF, IVA, IRES)
- P.IVA e partita IVA
- Investimenti (azioni, obbligazioni, fondi)
- Pensioni e previdenza
- Mutui e prestiti
- Bilanci aziendali

Rispondi sempre in italiano, con esempi numerici concreti.
Avvisa se le informazioni potrebbero essere incomplete o obsolete.
Non fornire consigli finanziari vincolanti.

Formatta le risposte in modo chiaro:
• Usa punti elenco
• Evidenzia numeri importanti
• Cita articoli di legge quando rilevanti""",

    "math": """Sei un assistente matematico avanzato.
Specializzato in:
- Algebra e calcolo
- Geometria e trigonometria
- Analisi matematica
- Statistica e probabilità
- Equazioni differenziali
- Teoria dei grafi
- Matematica finanziaria

Per ogni calcolo:
1. Mostra i passaggi
2. Spiega il ragionamento
3. Fornisci la soluzione finale
4. Verifica con controllo

Per espressioni complesse:
- Usa notazione matematica corretta
- Formatta con LaTeX tra $$ per formule
- Includi grafici se richiesto

Esempio:
Per calcolare l'area del cerchio: $$A = \\pi r^2$$""",

    "general": """Sei un assistente AI intelligente, utile e cordiale.
Rispondi sempre in italiano chiaro e comprensibile.

Linee guida:
1. Sii preciso ma accessibile
2. Adatta il linguaggio all'utente
3. Se non sai qualcosa, ammettilo onestamente
4. Offri alternative quando possibile
5. Mantieni un tono professionale ma amichevole

Formatta le risposte per leggibilità:
- Paragrafi brevi
- Punti elenco quando appropriato
- Grassetto per concetti chiave
- Codice per esempi tecnici"""
}

# ================= UTILITIES =================
def detect_mode(text: str) -> str:
    """Rileva automaticamente la modalità dalla domanda"""
    text_lower = text.lower()

    math_keywords = ["calcola", "risolvi", "equazione", "formula", "derivata",
                    "integrale", "funzione", "grafico", "plot", "matematica",
                    "algebra", "geometria", "statistica", "probabilità",
                    "radice", "logaritmo", "seno", "coseno", "tangente",
                    "matrice", "vettore", "limite", "serie", "teorema"]

    finance_keywords = ["finanza", "investimento", "tasse", "fiscale", "iva",
                       "mutuo", "prestito", "pensione", "azione", "obbligazione",
                       "fondi", "borsa", "mercato", "rendimento", "interesse",
                       "tasso", "prestito", "debito", "credito", "bilancio"]

    if any(keyword in text_lower for keyword in math_keywords):
        return "math"
    elif any(keyword in text_lower for keyword in finance_keywords):
        return "finance"
    return "general"

async def call_ollama(prompt: str, stream: bool = False):
    """Chiama il modello Ollama con gestione errori"""
    payload = {
        "model": MODEL,
        "prompt": prompt,
        "stream": stream,
        "options": {
            "temperature": 0.7,
            "top_p": 0.9,
            "num_predict": 1000
        }
    }

    try:
        if stream:
            response = requests.post(OLLAMA_URL, json=payload, stream=True, timeout=60)
            response.raise_for_status()
            return response
        else:
            response = requests.post(OLLAMA_URL, json=payload, timeout=60)
            response.raise_for_status()
            return response.json().get("response", "⚠️ Nessuna risposta dal modello")
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Timeout modello AI")
    except requests.exceptions.RequestException as e:
        logger.error(f"Errore Ollama: {e}")
        raise HTTPException(status_code=503, detail=f"Errore modello AI: {str(e)}")

# ================= LIFECYCLE =================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestione ciclo vita applicazione"""
    # Startup
    logger.info(f"🚀 Avvio Assistente AI Backend v{VERSION}")
    logger.info(f"🧠 Modello: {MODEL}")
    init_db()

    yield

    # Shutdown
    logger.info("🛑 Arresto Assistente AI Backend")

# ================= APP FASTAPI =================
app = FastAPI(
    title="Assistente AI Backend",
    version=VERSION,
    description="Backend per Assistente AI con matematica e finanza",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware per logging
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time

    logger.info(f"{request.method} {request.url.path} - {response.status_code} - {process_time:.3f}s")

    return response

# ================= ENDPOINTS =================
@app.get("/")
async def root():
    """Endpoint root"""
    return {
        "app": "Assistente AI Backend",
        "version": VERSION,
        "status": "online",
        "model": MODEL,
        "endpoints": {
            "chat": "/api/chat",
            "chat_stream": "/api/chat/stream",
            "health": "/api/health",
            "system": "/api/system",
            "conversations": "/api/conversations"
        },
        "docs": "/docs"
    }

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    # Verifica Ollama
    ollama_status = "unknown"
    try:
        response = requests.get("http://localhost:11434/api/tags", timeout=5)
        ollama_status = "online" if response.status_code == 200 else "offline"
    except:
        ollama_status = "offline"

    return {
        "status": "healthy",
        "version": VERSION,
        "timestamp": datetime.now().isoformat(),
        "system": {
            "cpu_percent": psutil.cpu_percent(),
            "memory_percent": psutil.virtual_memory().percent,
            "disk_usage": psutil.disk_usage('/').percent
        },
        "services": {
            "ollama": ollama_status,
            "model": MODEL
        }
    }

@app.get("/api/system")
async def system_info():
    """Informazioni di sistema dettagliate"""
    return {
        "system": {
            "platform": os.uname().sysname,
            "release": os.uname().release,
            "machine": os.uname().machine,
            "python_version": sys.version
        },
        "process": {
            "pid": os.getpid(),
            "memory_mb": psutil.Process().memory_info().rss / 1024 / 1024
        },
        "ai": {
            "model": MODEL,
            "ollama_url": OLLAMA_URL
        }
    }

@app.post("/api/chat")
async def chat_completion(
    message: ChatMessage,
    api_key: str = Header(None, alias="api-key")
):
    """
    Endpoint chat principale con streaming
    """
    # API key semplice (per demo)
    valid_keys = ["demo_key_123", "admin_key_456", "test_key_789"]
    if not api_key or api_key not in valid_keys:
        raise HTTPException(
            status_code=401,
            detail="API Key non valida. Usa: demo_key_123"
        )

    # Determina modalità
    mode = message.mode if message.mode != "auto" else detect_mode(message.text)
    system_prompt = SYSTEM_PROMPTS.get(mode, SYSTEM_PROMPTS["general"])

    # Costruisci prompt finale
    full_prompt = f"{system_prompt}\n\nDomanda: {message.text}\n\nRisposta:"

    logger.info(f"Chat - Mode: {mode}, Length: {len(message.text)}")

    # Streaming response
    if message.stream:
        async def generate():
            try:
                response = await call_ollama(full_prompt, stream=True)

                for line in response.iter_lines():
                    if line:
                        line_text = line.decode('utf-8')
                        if line_text.startswith('data: '):
                            try:
                                json_data = json.loads(line_text[6:])
                                if 'response' in json_data:
                                    yield f"data: {json.dumps({'chunk': json_data['response'], 'mode': mode})}\n\n"
                                if json_data.get('done', False):
                                    yield "data: [DONE]\n\n"
                            except json.JSONDecodeError:
                                continue

            except Exception as e:
                logger.error(f"Stream error: {e}")
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
                yield "data: [DONE]\n\n"

        return StreamingResponse(
            generate(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"
            }
        )

    # Risposta normale (non streaming)
    else:
        try:
            response = await call_ollama(full_prompt, stream=False)
            return {
                "response": response,
                "mode": mode,
                "conversation_id": message.conversation_id,
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat/stream")
async def chat_stream(
    message: ChatMessage,
    api_key: str = Header(None, alias="api-key")
):
    """Endpoint solo streaming (compatibilità)"""
    return await chat_completion(message, api_key)

@app.get("/api/conversations")
async def list_conversations():
    """Lista conversazioni salvate"""
    conn = sqlite3.connect('../data/conversations.db')
    cursor = conn.cursor()

    cursor.execute('''
        SELECT id, name, created_at, updated_at
        FROM conversations
        ORDER BY updated_at DESC
    ''')

    conversations = []
    for row in cursor.fetchall():
        conversations.append({
            "id": row[0],
            "name": row[1],
            "created_at": row[2],
            "updated_at": row[3]
        })

    conn.close()
    return {"conversations": conversations}

@app.post("/api/conversations")
async def create_conversation(conv: ConversationRequest):
    """Crea nuova conversazione"""
    conn = sqlite3.connect('../data/conversations.db')
    cursor = conn.cursor()

    conv_id = f"conv_{int(time.time())}_{os.urandom(4).hex()}"

    cursor.execute('''
        INSERT INTO conversations (id, name)
        VALUES (?, ?)
    ''', (conv_id, conv.name))

    conn.commit()
    conn.close()

    return {"id": conv_id, "name": conv.name, "status": "created"}

# Mount file statici per sviluppo
app.mount("/static", StaticFiles(directory="../static"), name="static")

# ================= MAIN =================
if __name__ == "__main__":
    # Banner ASCII
    banner = f"""
    ╔{'═'*50}╗
    ║{'ASSISTENTE AI BACKEND':^50}║
    ║{'Versione ' + VERSION:^50}║
    ║{'Modello: ' + MODEL:^50}║
    ║{'Porta: 5000':^50}║
    ║{'URL: http://localhost:5000':^50}║
    ║{'Docs: http://localhost:5000/docs':^50}║
    ╚{'═'*50}╝
    """

    print(banner)
    logger.info(banner)

    # Avvia server
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=5000,
        log_level="info",
        access_log=True,
        reload=False
    )
