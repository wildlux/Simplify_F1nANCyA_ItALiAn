#!/usr/bin/env python3
"""
ASSISTENTE AI BACKEND - Server HTTP Semplice
"""

import http.server
import socketserver
import json
import urllib.parse
import requests
from urllib.parse import parse_qs
import numpy as np
import base64
from io import BytesIO
import subprocess
import matplotlib
matplotlib.use('Agg')  # Backend per server senza display
import matplotlib.pyplot as plt
import matplotlib.colors as mcolors
from matplotlib import cm

# Import seaborn in modo sicuro (opzionale)
try:
    import seaborn as sns
    SEABORN_AVAILABLE = True
    print("✅ Seaborn disponibile per grafici 3D avanzati")
except ImportError:
    SEABORN_AVAILABLE = False
    print("⚠️ Seaborn non disponibile - uso solo matplotlib per grafici 3D")
import tempfile
import os
import sys
from io import StringIO
import contextlib
import ast
import re
import time

# 🔐 CARICAMENTO VARIABILI D'AMBIENTE SICURE
try:
    from dotenv import load_dotenv
    # Carica .env dalla directory root del progetto
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    env_path = os.path.join(project_root, '.env')
    load_dotenv(env_path)
    print("✅ Variabili d'ambiente caricate dal file .env")
except ImportError:
    print("⚠️ python-dotenv non installato - uso valori di default")
except Exception as e:
    print(f"⚠️ Errore caricamento .env: {e} - uso valori di default")

# 🔐 CARICAMENTO CONFIGURAZIONE DA VARIABILI D'AMBIENTE
OLLAMA_URL = os.getenv('OLLAMA_URL', 'http://localhost:11434/api/generate')
MODEL = os.getenv('OLLAMA_MODEL', 'llama3.2:3b')

# API Keys valide caricate dinamicamente
VALID_API_KEYS = {}
for key in ['DEMO', 'ADMIN', 'TEST']:
    api_key = os.getenv(f'API_KEY_{key}')
    if api_key:
        if key == 'DEMO':
            VALID_API_KEYS[api_key] = {
                "role": "demo",
                "permissions": ["chat", "charts"],
                "description": "Utente Demo"
            }
        elif key == 'ADMIN':
            VALID_API_KEYS[api_key] = {
                "role": "admin",
                "permissions": ["chat", "charts", "code", "admin"],
                "description": "Amministratore"
            }
        elif key == 'TEST':
            VALID_API_KEYS[api_key] = {
                "role": "test",
                "permissions": ["chat", "charts", "code"],
                "description": "Testing"
            }

# Fallback se non ci sono chiavi nel .env
if not VALID_API_KEYS:
    print("⚠️ Nessuna API key trovata nel .env - uso valori di default")
    VALID_API_KEYS = {
        "demo_key_123": {
            "role": "demo",
            "permissions": ["chat", "charts"],
            "description": "Utente Demo"
        },
        "admin_key_456": {
            "role": "admin",
            "permissions": ["chat", "charts", "code", "admin"],
            "description": "Amministratore"
        },
        "test_key_789": {
            "role": "test",
            "permissions": ["chat", "charts", "code"],
            "description": "Testing"
        }
    }

    # Cache intelligente per risposte frequenti
response_cache = {}
CACHE_MAX_SIZE = int(os.getenv('CACHE_MAX_SIZE', '100'))
CACHE_TTL = int(os.getenv('CACHE_TTL_SECONDS', '3600'))

def get_cache_key(text, mode, model):
    """Genera chiave cache unica"""
    import hashlib
    key_data = f"{text}|{mode}|{model}".encode()
    return hashlib.md5(key_data).hexdigest()

def get_cached_response(cache_key):
    """Recupera risposta dalla cache se valida"""
    if cache_key in response_cache:
        cached_item = response_cache[cache_key]
        if time.time() - cached_item['timestamp'] < CACHE_TTL:
            return cached_item['response']
        else:
            # Cache scaduta, rimuovi
            del response_cache[cache_key]
    return None

def set_cached_response(cache_key, response):
    """Salva risposta in cache"""
    # Gestisci dimensione massima cache
    if len(response_cache) >= CACHE_MAX_SIZE:
        # Rimuovi elemento più vecchio
        oldest_key = min(response_cache.keys(),
                        key=lambda k: response_cache[k]['timestamp'])
        del response_cache[oldest_key]

    response_cache[cache_key] = {
        'response': response,
        'timestamp': time.time()
    }

# Configurazione Ollama ottimizzata
OLLAMA_CONFIG = {
    "temperature": float(os.getenv('OLLAMA_TEMPERATURE', '0.7')),
    "top_p": float(os.getenv('OLLAMA_TOP_P', '0.9')),
    "top_k": int(os.getenv('OLLAMA_TOP_K', '40')),
    "num_predict": int(os.getenv('OLLAMA_NUM_PREDICT', '512')),
    "repeat_penalty": float(os.getenv('OLLAMA_REPEAT_PENALTY', '1.1')),
    "repeat_last_n": 64,
    "tfs_z": 1.0,
    "mirostat": 0,
    "mirostat_tau": 5.0,
    "mirostat_eta": 0.1,
    "num_ctx": int(os.getenv('OLLAMA_NUM_CTX', '2048')),
    "num_thread": int(os.getenv('OLLAMA_NUM_THREAD', '-1')),
    "num_gpu": int(os.getenv('OLLAMA_NUM_GPU', '-1'))
}



def verify_api_key(api_key):
    """Verifica se l'API key è valida e restituisce le informazioni"""
    if not api_key:
        return None

    return VALID_API_KEYS.get(api_key.strip())

def check_permission(api_key, permission):
    """Verifica se l'API key ha un determinato permesso"""
    key_info = verify_api_key(api_key)
    if not key_info:
        return False

    return permission in key_info["permissions"]

SYSTEM_PROMPTS = {
    "finance": """You are an Italian financial consultant. Think and reason in English for accuracy and precision, but always respond to the user in Italian.

Reasoning process (internal, in English):
- Analyze the financial question carefully
- Consider Italian financial regulations and tax laws
- Calculate numbers precisely
- Structure advice logically

Final response (in Italian):
- Provide clear, practical financial advice
- Use simple Italian language
- Include specific numbers and calculations
- Give actionable recommendations""",

    "math": """You are a mathematics assistant. Think and reason in English for mathematical precision, but respond to the user in Italian.

Reasoning process (internal, in English):
- Break down the mathematical problem step by step
- Use precise mathematical terminology
- Verify calculations carefully
- Consider multiple solution approaches

Final response (in Italian):
- Explain the solution clearly in Italian
- Show all calculation steps
- Use Italian mathematical terminology
- Provide the final answer prominently""",

    "develop": """You are an expert programming assistant. Think and reason in English for technical accuracy, but respond to the user in Italian.

Reasoning process (internal, in English):
- Analyze the programming problem thoroughly
- Consider best practices and design patterns
- Plan the solution architecture
- Identify potential issues and edge cases

Final response (in Italian):
- Provide well-commented code
- Explain the solution in clear Italian
- Include usage examples
- Mention important considerations""",

    "general": """You are a helpful AI assistant. Think and reason in English for clarity and accuracy, but always respond to the user in Italian.

Reasoning process (internal, in English):
- Understand the user's question completely
- Structure the response logically
- Consider the most helpful approach
- Ensure accuracy of information

Final response (in Italian):
- Be friendly and helpful
- Use clear, natural Italian
- Provide comprehensive but concise answers
- Ask clarifying questions if needed"""
}

def get_available_models():
    try:
        result = subprocess.run(['ollama', 'list'], capture_output=True, text=True, timeout=10)
        lines = result.stdout.strip().split('\n')
        models = []
        for line in lines[1:]:  # skip header
            if line.strip():
                parts = line.split()
                if parts:
                    models.append(parts[0])
        return models if models else ["llama3.2:3b"]
    except Exception as e:
        print(f"Error getting models: {e}")
        return ["llama3.2:3b"]  # fallback

def detect_mode(text: str) -> str:
    text_lower = text.lower()
    if any(k in text_lower for k in ["calcola", "matematica", "equazione"]):
        return "math"
    elif any(k in text_lower for k in ["finanza", "tasse", "investimento"]):
        return "finance"
    return "general"

# Funzioni per grafici 3D
def generate_3d_surface_data(func_str="x**2 + y**2", x_range=(-5, 5), y_range=(-5, 5), points=50):
    """Genera dati per una superficie 3D"""
    try:
        x = np.linspace(x_range[0], x_range[1], points)
        y = np.linspace(y_range[0], y_range[1], points)
        X, Y = np.meshgrid(x, y)

        # Valuta la funzione in modo sicuro
        safe_dict = {"x": X, "y": Y, "np": np, "sin": np.sin, "cos": np.cos, "tan": np.tan,
                    "exp": np.exp, "log": np.log, "sqrt": np.sqrt, "pi": np.pi, "e": np.e}
        Z = eval(func_str, {"__builtins__": {}}, safe_dict)

        return {
            "type": "surface",
            "x": x.tolist(),
            "y": y.tolist(),
            "z": Z.tolist(),
            "title": f"Superficie 3D: z = {func_str}"
        }
    except Exception as e:
        return {"error": f"Errore nella generazione della superficie: {str(e)}"}

def generate_3d_scatter_data(points=100, x_range=(-10, 10), y_range=(-10, 10), z_range=(-10, 10)):
    """Genera dati per uno scatter plot 3D con dati fissi per esempi"""
    # Usa dati fissi invece di random per esempi più prevedibili
    fixed_points = [
        (-5, -5, -5), (-3, -3, -3), (-1, -1, -1), (1, 1, 1), (3, 3, 3), (5, 5, 5),
        (-4, 2, 1), (-2, 4, -2), (0, 0, 0), (2, -4, 3), (4, -2, -1),
        (-3, 1, 4), (-1, 3, -3), (1, -3, 2), (3, -1, -4), (5, 5, 5)
    ]

    if points <= len(fixed_points):
        selected = fixed_points[:points]
    else:
        # Se servono più punti, aggiungi alcuni random
        selected = fixed_points[:]
        remaining = points - len(fixed_points)
        x_extra = np.random.uniform(x_range[0], x_range[1], remaining)
        y_extra = np.random.uniform(y_range[0], y_range[1], remaining)
        z_extra = np.random.uniform(z_range[0], z_range[1], remaining)
        for i in range(remaining):
            selected.append((x_extra[i], y_extra[i], z_extra[i]))

    x = [p[0] for p in selected]
    y = [p[1] for p in selected]
    z = [p[2] for p in selected]

    # Colori basati sulla coordinata Z
    z_array = np.array(z)
    colors = (z_array - z_array.min()) / (z_array.max() - z_array.min()) * 255

    return {
        "type": "scatter3d",
        "x": x,
        "y": y,
        "z": z,
        "colors": colors.tolist(),
        "title": f"Scatter 3D ({points} punti)"
    }

def generate_3d_parametric_data(func_x="cos(t)", func_y="sin(t)", func_z="t", t_range=(0, 4*np.pi), points=200):
    """Genera dati per una curva parametrica 3D"""
    try:
        t = np.linspace(t_range[0], t_range[1], points)

        safe_dict = {"t": t, "np": np, "sin": np.sin, "cos": np.cos, "tan": np.tan,
                    "exp": np.exp, "log": np.log, "sqrt": np.sqrt, "pi": np.pi, "e": np.e}
        x = eval(func_x, {"__builtins__": {}}, safe_dict)
        y = eval(func_y, {"__builtins__": {}}, safe_dict)
        z = eval(func_z, {"__builtins__": {}}, safe_dict)

        return {
            "type": "parametric3d",
            "x": x.tolist(),
            "y": y.tolist(),
            "z": z.tolist(),
            "title": f"Curva parametrica 3D: ({func_x}, {func_y}, {func_z})"
        }
    except Exception as e:
        return {"error": f"Errore nella generazione della curva parametrica: {str(e)}"}

def generate_matplotlib_plot(chart_data, chart_type='line'):
    """Genera un grafico con Matplotlib come in JupyterLab e lo restituisce come base64"""
    try:
        plt.figure(figsize=(10, 6))
        plt.style.use('default')  # Stile simile a Jupyter

        data = chart_data.get('datasets', [])
        labels = chart_data.get('labels', [])

        if chart_type == 'line':
            for dataset in data:
                if labels:
                    plt.plot(labels, dataset['data'], label=dataset.get('label', ''))
                else:
                    plt.plot(dataset['data'], label=dataset.get('label', ''))
        elif chart_type == 'bar':
            for i, dataset in enumerate(data):
                if labels:
                    x = labels
                else:
                    x = range(len(dataset['data']))
                plt.bar([xi + i*0.2 for xi in x], dataset['data'], width=0.2, label=dataset.get('label', ''))
        elif chart_type == 'scatter':
            for dataset in data:
                x = [p[0] for p in dataset['data']]
                y = [p[1] for p in dataset['data']]
                plt.scatter(x, y, label=dataset.get('label', ''))
        elif chart_type == 'pie':
            for dataset in data:
                plt.pie(dataset['data'], labels=labels, autopct='%1.1f%%')

        plt.title(chart_data.get('title', 'Grafico'))
        plt.legend()
        plt.grid(True, alpha=0.3)
        plt.tight_layout()

        # Salva come base64
        buffer = BytesIO()
        plt.savefig(buffer, format='png', dpi=100, bbox_inches='tight')
        buffer.seek(0)
        image_base64 = base64.b64encode(buffer.read()).decode('utf-8')
        plt.close()

        return f"data:image/png;base64,{image_base64}"

    except Exception as e:
        return f"Errore generazione grafico: {str(e)}"

def create_3d_chart_response(chart_type, params=None):
    """Crea una risposta JSON con dati per grafico 3D"""
    if params is None:
        params = {}

    if chart_type == "surface":
        data = generate_3d_surface_data(**params)
    elif chart_type in ["scatter", "scatter3d"]:
        data = generate_3d_scatter_data(**params)
    elif chart_type in ["parametric", "parametric3d"]:
        data = generate_3d_parametric_data(**params)
    else:
        return {"error": f"Tipo di grafico 3D non supportato: {chart_type}"}

    return {"chart3d": data}



def fetch_news(category_filter=None):
    """Recupera notizie da fonti italiane - economia e sport"""
    import feedparser
    import time
    from datetime import datetime

    news_sources = [
        # Fonti economiche
        {
            'name': 'Il Sole 24 Ore',
            'url': 'https://www.ilsole24ore.com/rss/italia.xml',
            'category': 'economia'
        },
        {
            'name': 'Repubblica Economia',
            'url': 'https://www.repubblica.it/rss/economia/rss2.0.xml',
            'category': 'economia'
        },
        {
            'name': 'Corriere Economia',
            'url': 'https://www.corriere.it/rss/economia.xml',
            'category': 'economia'
        },
        {
            'name': 'La Stampa Economia',
            'url': 'https://www.lastampa.it/rss/economia.xml',
            'category': 'economia'
        },
        {
            'name': 'Il Messaggero Economia',
            'url': 'https://www.ilmessaggero.it/rss/economia.xml',
            'category': 'economia'
        },
        {
            'name': 'Il Fatto Quotidiano Economia',
            'url': 'https://www.ilfattoquotidiano.it/rss/economia.xml',
            'category': 'economia'
        },
        # Fonti sportive
        {
            'name': 'La Gazzetta dello Sport',
            'url': 'https://www.gazzetta.it/rss/home.xml',
            'category': 'sport'
        },
        {
            'name': 'Corriere dello Sport',
            'url': 'https://www.corrieredellosport.it/rss/',
            'category': 'sport'
        },
        {
            'name': 'La Gazzetta dello Sport - Calciomercato',
            'url': 'https://www.gazzetta.it/rss/Calciomercato.xml',
            'category': 'sport'
        },
        # Fonti generaliste
        {
            'name': 'Google News Italia',
            'url': 'https://news.google.com/rss?hl=it&gl=IT&ceid=IT:it',
            'category': 'generale'
        },
        {
            'name': 'Yahoo News Italia',
            'url': 'https://it.news.yahoo.com/rss',
            'category': 'generale'
        }
    ]

    all_news = []

    for source in news_sources:
        # Filtra per categoria se specificato
        if category_filter and source['category'] not in category_filter:
            continue

        try:
            print(f"Fetching news from {source['name']}...")
            if feedparser is None:
                # Notizie fittizie se feedparser non disponibile
                news_list.append({
                    'title': f"Notizie {source['category']} - Installa feedparser per aggiornamenti reali",
                    'description': "Per ricevere notizie reali, installa feedparser: pip install feedparser",
                    'url': source['url'],
                    'published': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'source': source['name']
                })
                continue
            feed = feedparser.parse(source['url'])

            for entry in feed.entries[:5]:  # Max 5 per fonte
                # Estrai data
                published = entry.get('published_parsed')
                if published:
                    date_str = time.strftime('%Y-%m-%d %H:%M', published)
                else:
                    date_str = datetime.now().strftime('%Y-%m-%d %H:%M')

                # Estrai descrizione
                summary = entry.get('summary', '')
                if len(summary) > 200:
                    summary = summary[:200] + '...'

                news_item = {
                    'title': entry.title,
                    'link': entry.link,
                    'summary': summary,
                    'source': source['name'],
                    'date': date_str,
                    'category': source['category']
                }

                all_news.append(news_item)

        except Exception as e:
            print(f"Error fetching from {source['name']}: {e}")
            continue

    # Ordina per data (più recenti prima)
    all_news.sort(key=lambda x: x['date'], reverse=True)

    return all_news[:30]  # Max 30 notizie totali

def call_ollama(prompt: str, model: str = MODEL, mode: str = "general"):
    """Chiama Ollama con ottimizzazioni per velocità"""

    # 🚀 OTTIMIZZAZIONE 1: CACHE INTELLIGENTE
    cache_key = get_cache_key(prompt, mode, model)
    cached_response = get_cached_response(cache_key)
    if cached_response:
        print(f"⚡ CACHE HIT - Risposta servita dalla cache")
        return cached_response

    # 🚀 OTTIMIZZAZIONE 2: CONFIGURAZIONE OTTIMIZZATA
    config = OLLAMA_CONFIG.copy()

    # Adatta configurazione al tipo di richiesta
    if mode == "math":
        # Matematica: precisione massima, velocità ridotta
        config.update({
            "temperature": 0.1,  # Più deterministico
            "num_predict": 1024,  # Risposte più lunghe per calcoli
            "top_p": 0.95
        })
    elif mode == "develop":
        # Sviluppo: creativo ma preciso
        config.update({
            "temperature": 0.3,
            "num_predict": 2048,  # Codice può essere lungo
            "top_p": 0.9
        })
    elif mode == "finance":
        # Finanza: preciso e professionale
        config.update({
            "temperature": 0.2,
            "num_predict": 1024,
            "top_p": 0.85
        })

    # 🚀 OTTIMIZZAZIONE 3: PROMPT OTTIMIZZATO
    # Rimuovi spazi extra e normalizza
    prompt = prompt.strip()
    if len(prompt) > 1000:
        # Per prompt molto lunghi, usa riassunto intelligente
        prompt = prompt[:800] + "... [testo troncato per velocità]"

    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        **config  # Applica configurazione ottimizzata
    }

    try:
        start_time = time.time()
        timeout = 30 if len(prompt) < 500 else 60

        response = requests.post(OLLAMA_URL, json=payload, timeout=timeout)
        response.raise_for_status()

        result = response.json().get("response", "Nessuna risposta")

        # Post-processing risposta
        if len(result.strip()) < 10:
            result = "Risposta troppo breve. Riprova con una domanda più dettagliata."
        elif len(result) > 4000:
            result = result[:4000] + "\n\n[risposta troncata per brevità]"

        print(f"⚡ Risposta generata in {time.time() - start_time:.2f}s")
        set_cached_response(cache_key, result)
        return result

    except requests.exceptions.Timeout:
        return "⏱️ Timeout: La risposta sta richiedendo troppo tempo. Prova a semplificare la domanda."
    except requests.exceptions.ConnectionError:
        return "🔌 Errore di connessione: Ollama non è raggiungibile. Verifica che sia in esecuzione."
    except Exception as e:
        error_msg = f"❌ Errore LLM: {str(e)}"
        print(f"Errore Ollama: {e}")
        return error_msg

class AIHandler(http.server.BaseHTTPRequestHandler):
    def send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, Authorization')

    def _extract_api_key(self):
        """Estrae API key dagli header o parametri URL (Best Practice: Sicurezza)"""
        # Priorità: X-API-Key > Authorization Bearer > Parametro URL (per compatibilità mobile)
        if 'X-API-Key' in self.headers:
            return self.headers['X-API-Key'].strip()
        elif 'Authorization' in self.headers:
            auth_header = self.headers['Authorization']
            if auth_header.startswith('Bearer '):
                return auth_header[7:].strip()
        else:
            # Supporto per API key come parametro URL (utile per cellulari)
            try:
                parsed_url = urllib.parse.urlparse(self.path)
                query_params = urllib.parse.parse_qs(parsed_url.query)
                print(f"DEBUG: Parsed URL path: {self.path}")
                print(f"DEBUG: Query params: {query_params}")
                if 'api_key' in query_params:
                    api_key_from_url = query_params['api_key'][0].strip()
                    print(f"DEBUG: API key from URL: {api_key_from_url}")
                    return api_key_from_url
                else:
                    print("DEBUG: No api_key found in URL parameters")
            except Exception as e:
                print(f"Errore parsing URL per API key: {e}")
                import traceback
                traceback.print_exc()
        return None

    def _send_auth_error(self, message):
        """Invia errore di autenticazione (Best Practice: UX)"""
        self.send_response(401)
        self.send_header('Content-Type', 'application/json')
        self.send_cors_headers()
        self.end_headers()
        response = {
            "error": "Autenticazione fallita",
            "message": message,
            "valid_keys": list(VALID_API_KEYS.keys())
        }
        self.wfile.write(json.dumps(response).encode())

    def do_GET(self):
        print(f"GET request: {self.path}")
        
        # Verifica API Key per tutti gli endpoint (Best Practice: Sicurezza)
        api_key = self._extract_api_key()
        if not api_key:
            self._send_auth_error("API Key richiesta")
            return
            
        key_info = verify_api_key(api_key)
        if not key_info:
            self._send_auth_error("API Key non valida")
            return
        
        # Log dell'accesso per audit (Best Practice: Logging)
        print(f"[AUTH] Accesso consentito per key: {key_info['role']} - IP: {self.client_address[0]}")
        
        if self.path == "/":
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_cors_headers()
            self.end_headers()
            response = {
                "message": "Assistente AI Backend",
                "status": "online",
                "keyboard_shortcuts": {
                    "send_message": "Premi Enter per inviare il messaggio",
                    "new_line": "Premi Shift+Enter per andare a capo",
                    "voice_input": "Clicca sull'icona 🎤 per input vocale",
                    "copy_message": "Clicca sull'icona 📋 per copiare le risposte",
                    "speak_message": "Clicca sull'icona 🔊 per ascoltare le risposte"
                }
            }
            self.wfile.write(json.dumps(response).encode())
        elif self.path == "/api/health":
            print("Health check")
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_cors_headers()
            self.end_headers()
            response = {"status": "healthy", "model": MODEL}
            self.wfile.write(json.dumps(response).encode())
        elif self.path == "/api/models":
            models = get_available_models()
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_cors_headers()
            self.end_headers()
            response = {"models": models, "recommended": "llama3.2:3b"}
            self.wfile.write(json.dumps(response).encode())
        elif self.path == "/api/code/languages":
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_cors_headers()
            self.end_headers()
            response = {
                'languages': [
                    {
                        'name': 'Python',
                        'value': 'python',
                        'execution': True,
                        'analysis': True
                    },
                    {
                        'name': 'JavaScript',
                        'value': 'javascript',
                        'execution': True,
                        'analysis': True
                    },
                    {
                        'name': 'C++',
                        'value': 'cpp',
                        'execution': True,
                        'analysis': False
                    },
                    {
                        'name': 'TypeScript',
                        'value': 'typescript',
                        'execution': False,
                        'analysis': True
                    }
                ]
            }
            self.wfile.write(json.dumps(response).encode())
        elif self.path == "/docs":
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.send_cors_headers()
            self.end_headers()
            docs_html = """
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Documentation - Assistente AI</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #333; }
        h2 { color: #555; border-bottom: 2px solid #4f46e5; padding-bottom: 5px; }
        .endpoint { background: #f8f9fa; padding: 15px; margin: 10px 0; border-left: 4px solid #4f46e5; }
        .method { font-weight: bold; color: #4f46e5; }
        code { background: #e9ecef; padding: 2px 4px; border-radius: 3px; }
        pre { background: #f8f9fa; padding: 10px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📚 API Documentation - Assistente AI</h1>
        <p>Documentazione degli endpoint API disponibili.</p>
        <h2>Endpoint Disponibili</h2>
        <div class="endpoint">
            <div class="method">GET /</div>
            <p>Informazioni di base sull'assistente AI.</p>
        </div>
        <div class="endpoint">
            <div class="method">GET /api/health</div>
            <p>Controllo dello stato del backend.</p>
        </div>
        <div class="endpoint">
            <div class="method">GET /api/models</div>
            <p>Lista dei modelli Ollama disponibili.</p>
        </div>
        <div class="endpoint">
            <div class="method">POST /api/chat</div>
            <p>Invia un messaggio e ottieni una risposta dall'AI.</p>
        </div>
        <div class="endpoint">
            <div class="method">POST /api/chart3d</div>
            <p>Genera grafici 3D.</p>
        </div>
    </div>
</body>
</html>
"""
            self.wfile.write(docs_html.encode())
        else:
            self.send_response(404)
            self.send_cors_headers()
            self.end_headers()

    def do_POST(self):
        try:
            # Verifica API Key per tutti gli endpoint (Best Practice: Sicurezza)
            api_key = self._extract_api_key()
            if not api_key:
                self._send_auth_error("API Key richiesta")
                return

            key_info = verify_api_key(api_key)
            if not key_info:
                self._send_auth_error("API Key non valida")
                return

            # Log dell'accesso per audit (Best Practice: Logging)
            print(f"[AUTH] Accesso consentito per key: {key_info['role']} - IP: {self.client_address[0]}")

            if self.path == "/api/chat":
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode())

                text = data.get("text", "")
                mode = data.get("mode", "auto")
                model = data.get("model", MODEL)
                custom_prompts = data.get("prompts", SYSTEM_PROMPTS)

                if mode == "auto":
                    mode = detect_mode(text)

                system_prompt = custom_prompts.get(mode, custom_prompts["general"])
                full_prompt = f"{system_prompt}\n\n{text}\n\nRisposta:"

                response_text = call_ollama(full_prompt, model)

                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_cors_headers()
                self.end_headers()

                response = {"response": response_text, "mode": mode}
                self.wfile.write(json.dumps(response).encode())

            elif self.path == "/api/matplotlib":
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode())

                chart_type = data.get("type", "line")

                if chart_type == "parametric3d_seaborn":
                    # Gestisci grafico parametrico 3D con Seaborn
                    func_x = data.get("func_x", "cos(t)")
                    func_y = data.get("func_y", "sin(t)")
                    func_z = data.get("func_z", "t")
                    points = data.get("points", 200)

                    image_url = generate_seaborn_parametric_3d(func_x, func_y, func_z, points)
                elif chart_type == "scatter3d_seaborn":
                    # Gestisci scatter 3D con Seaborn (se disponibile)
                    points = data.get("points", 100)
                    if SEABORN_AVAILABLE:
                        image_url = generate_seaborn_scatter_3d(points)
                    else:
                        image_url = generate_matplotlib_plot({"error": "Seaborn non disponibile"}, "line")
                elif chart_type == "surface3d_seaborn":
                    # Gestisci superficie 3D con Seaborn (se disponibile)
                    if SEABORN_AVAILABLE:
                        image_url = generate_seaborn_surface_3d()
                    else:
                        image_url = generate_matplotlib_plot({"error": "Seaborn non disponibile"}, "line")
                else:
                    chart_data = data.get("data", {})
                    image_url = generate_matplotlib_plot(chart_data, chart_type)

                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_cors_headers()
                self.end_headers()

                response = {"image": image_url}
                self.wfile.write(json.dumps(response).encode())

            elif self.path == "/api/chart3d":
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode())

                chart_type = data.get("type", "surface")
                params = data.get("params", {})

                chart_data = create_3d_chart_response(chart_type, params)

                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_cors_headers()
                self.end_headers()

                self.wfile.write(json.dumps(chart_data).encode())

            elif self.path == "/api/code/analyze":
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode())

                code = data.get("code", "")
                language = data.get("language", "python")

                try:
                    if language == 'python':
                        analysis = analyze_python_code(code)
                    elif language in ['javascript', 'typescript']:
                        analysis = analyze_javascript_code(code)
                    else:
                        analysis = {'error': f'Analisi {language} non supportata'}

                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.send_cors_headers()
                    self.end_headers()

                    response = {
                        'success': True,
                        'language': language,
                        'analysis': analysis
                    }
                    self.wfile.write(json.dumps(response).encode())

                except Exception as e:
                    self.send_response(500)
                    self.send_cors_headers()
                    self.end_headers()
                    response = {'success': False, 'error': str(e)}
                    self.wfile.write(json.dumps(response).encode())

            elif self.path == "/api/code/execute":
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode())

                code = data.get("code", "")
                language = data.get("language", "python")
                timeout = min(data.get("timeout", 5), 10)  # Max 10 secondi

                try:
                    if language == 'python':
                        success, output, errors, exec_time = execute_python_safe(code, timeout)
                        analysis = analyze_python_code(code) if success else None
                    elif language == 'javascript':
                        success, output, errors, exec_time = execute_javascript_node(code, timeout)
                        analysis = analyze_javascript_code(code) if success else None
                    elif language == 'cpp':
                        success, output, errors, exec_time = execute_cpp_code(code, timeout)
                        analysis = None
                    else:
                        raise Exception(f"Linguaggio {language} non supportato")

                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.send_cors_headers()
                    self.end_headers()

                    response = {
                        'success': success,
                        'output': output,
                        'errors': errors,
                        'execution_time': exec_time,
                        'analysis': analysis
                    }
                    self.wfile.write(json.dumps(response).encode())

                except Exception as e:
                    self.send_response(500)
                    self.send_cors_headers()
                    self.end_headers()
                    response = {'success': False, 'error': str(e)}
                    self.wfile.write(json.dumps(response).encode())

            elif self.path.startswith("/api/news/"):
                try:
                    # Estrai categoria dal path: /api/news/economia, /api/news/sport, /api/news/all
                    path_parts = self.path.split('/')
                    category = path_parts[-1] if len(path_parts) > 3 else 'all'

                    if category == 'all':
                        category_filter = None
                    elif category == 'economia':
                        category_filter = ['economia']
                    elif category == 'sport':
                        category_filter = ['sport']
                    elif category == 'generale':
                        category_filter = ['generale']
                    else:
                        category_filter = [category]

                    news = fetch_news(category_filter)
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.send_cors_headers()
                    self.end_headers()
                    response = {'news': news}
                    self.wfile.write(json.dumps(response).encode())
                except Exception as e:
                    self.send_response(500)
                    self.send_cors_headers()
                    self.end_headers()
                    response = {'error': f'Errore nel recupero notizie: {str(e)}'}
                    self.wfile.write(json.dumps(response).encode())

            else:
                self.send_response(404)
                self.send_cors_headers()
                self.end_headers()
        except Exception as e:
            print(f"Error in do_POST: {e}")
            import traceback
            traceback.print_exc()
            self.send_response(500)
            self.send_cors_headers()
            self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()

# ============================================
# CODE ANALYSIS FUNCTIONS
# ============================================

def analyze_python_code(code: str) -> dict:
    """Analizza codice Python e restituisce metriche"""
    try:
        tree = ast.parse(code)

        functions = []
        classes = []
        imports = []

        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                functions.append({
                    'name': node.name,
                    'line': node.lineno,
                    'args': [arg.arg for arg in node.args.args]
                })
            elif isinstance(node, ast.ClassDef):
                classes.append({
                    'name': node.name,
                    'line': node.lineno,
                    'methods': [m.name for m in node.body if isinstance(m, ast.FunctionDef)]
                })
            elif isinstance(node, (ast.Import, ast.ImportFrom)):
                if isinstance(node, ast.Import):
                    imports.extend([alias.name for alias in node.names])
                else:
                    imports.append(node.module if node.module else "relative")

        lines = code.split('\n')
        comments = len([l for l in lines if l.strip().startswith('#')])

        return {
            'functions': functions,
            'classes': classes,
            'imports': list(set(imports)),
            'lines': len(lines),
            'comments': comments,
            'complexity': calculate_complexity(tree)
        }
    except Exception as e:
        return {'error': str(e)}

def calculate_complexity(tree) -> int:
    """Calcola complessità ciclomatica"""
    complexity = 1
    for node in ast.walk(tree):
        if isinstance(node, (ast.If, ast.For, ast.While, ast.ExceptHandler)):
            complexity += 1
        elif isinstance(node, ast.BoolOp):
            complexity += len(node.values) - 1
    return complexity

def analyze_javascript_code(code: str) -> dict:
    """Analizza codice JavaScript (parsing semplice)"""
    functions = re.findall(r'function\s+(\w+)\s*\(|const\s+(\w+)\s*=\s*\(.*?\)\s*=>', code)
    classes = re.findall(r'class\s+(\w+)', code)
    imports = re.findall(r'^import\s+.+$', code, re.MULTILINE)

    lines = code.split('\n')
    comments = len([l for l in lines if l.strip().startswith('//')])

    return {
        'functions': [f[0] or f[1] for f in functions],
        'classes': classes,
        'imports': imports,
        'lines': len(lines),
        'comments': comments
    }

# ============================================
# CODE EXECUTION FUNCTIONS
# ============================================

def execute_python_safe(code: str, timeout: int = 5) -> tuple:
    """Esegue Python in modo sicuro con timeout"""
    start_time = time.time()

    # Cattura output
    output_buffer = StringIO()
    error_buffer = StringIO()

    try:
        # Ambiente limitato
        safe_globals = {
            '__builtins__': {
                'print': print,
                'range': range,
                'len': len,
                'str': str,
                'int': int,
                'float': float,
                'list': list,
                'dict': dict,
                'sum': sum,
                'max': max,
                'min': min,
                'abs': abs,
                'round': round,
                'sorted': sorted,
                'enumerate': enumerate,
                'zip': zip,
                'map': map,
                'filter': filter,
            }
        }

        # Esegui con cattura output
        with contextlib.redirect_stdout(output_buffer), contextlib.redirect_stderr(error_buffer):
            exec(code, safe_globals)

        execution_time = time.time() - start_time
        return True, output_buffer.getvalue(), error_buffer.getvalue(), execution_time

    except Exception as e:
        execution_time = time.time() - start_time
        return False, output_buffer.getvalue(), str(e), execution_time

def execute_javascript_node(code: str, timeout: int = 5) -> tuple:
    """Esegue JavaScript con Node.js"""
    start_time = time.time()
    temp_file = None

    try:
        # Crea file temporaneo
        with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False) as f:
            f.write(code)
            temp_file = f.name

        # Esegui con Node.js
        result = subprocess.run(
            ['node', temp_file],
            capture_output=True,
            text=True,
            timeout=timeout
        )

        execution_time = time.time() - start_time

        # Pulisci
        os.unlink(temp_file)

        return result.returncode == 0, result.stdout, result.stderr, execution_time

    except subprocess.TimeoutExpired:
        if temp_file and os.path.exists(temp_file):
            os.unlink(temp_file)
        return False, "", "Timeout: esecuzione troppo lunga", timeout
    except FileNotFoundError:
        return False, "", "Node.js non installato", 0
    except Exception as e:
        if temp_file and os.path.exists(temp_file):
            os.unlink(temp_file)
        return False, "", str(e), 0

def execute_cpp_code(code: str, timeout: int = 10) -> tuple:
    """Compila ed esegue C++"""
    start_time = time.time()

    try:
        # Crea file sorgente
        with tempfile.NamedTemporaryFile(mode='w', suffix='.cpp', delete=False) as f:
            f.write(code)
            source_file = f.name

        # Nome eseguibile
        exe_file = source_file.replace('.cpp', '')

        # Compila
        compile_result = subprocess.run(
            ['g++', source_file, '-o', exe_file, '-std=c++17'],
            capture_output=True,
            text=True,
            timeout=timeout
        )

        if compile_result.returncode != 0:
            os.unlink(source_file)
            return False, "", f"Errore compilazione:\n{compile_result.stderr}", time.time() - start_time

        # Esegui
        run_result = subprocess.run(
            [exe_file],
            capture_output=True,
            text=True,
            timeout=timeout
        )

        execution_time = time.time() - start_time

        # Pulisci
        os.unlink(source_file)
        if os.path.exists(exe_file):
            os.unlink(exe_file)

        return run_result.returncode == 0, run_result.stdout, run_result.stderr, execution_time

    except subprocess.TimeoutExpired:
        return False, "", "Timeout: esecuzione troppo lunga", timeout
    except FileNotFoundError:
        return False, "", "g++ non installato", 0
    except Exception as e:
        return False, "", str(e), 0

def generate_seaborn_parametric_3d(func_x, func_y, func_z, points=200):
    """Genera grafico parametrico 3D con Seaborn styling"""
    try:
        import seaborn as sns
        sns.set_style("darkgrid")
        sns.set_palette("husl")

        # Genera dati parametrici
        t = np.linspace(0, 4*np.pi, points)

        # Valuta funzioni in modo sicuro
        safe_dict = {"t": t, "np": np, "sin": np.sin, "cos": np.cos, "tan": np.tan,
                    "exp": np.exp, "log": np.log, "sqrt": np.sqrt, "pi": np.pi, "e": np.e}

        try:
            x = eval(func_x, {"__builtins__": {}}, safe_dict)
            y = eval(func_y, {"__builtins__": {}}, safe_dict)
            z = eval(func_z, {"__builtins__": {}}, safe_dict)
        except Exception as e:
            # Fallback a spirale
            x = np.cos(t)
            y = np.sin(t)
            z = t

        # Crea figura 3D con Seaborn-like styling
        fig = plt.figure(figsize=(12, 8))
        ax = fig.add_subplot(111, projection='3d')

        # Colori basati su Z con Seaborn palette
        norm = mcolors.Normalize(vmin=z.min(), vmax=z.max())
        cmap = cm.get_cmap('viridis')

        # Plot della curva
        scatter = ax.scatter(x, y, z, c=z, cmap=cmap, s=20, alpha=0.8)
        ax.plot(x, y, z, color='navy', alpha=0.6, linewidth=2)

        # Migliora l'aspetto
        ax.set_xlabel('X', fontsize=12, fontweight='bold')
        ax.set_ylabel('Y', fontsize=12, fontweight='bold')
        ax.set_zlabel('Z', fontsize=12, fontweight='bold')
        ax.set_title(f'Curva Parametrica 3D\nx={func_x}, y={func_y}, z={func_z}',
                    fontsize=14, fontweight='bold', pad=20)

        # Colorbar
        cbar = plt.colorbar(scatter, ax=ax, shrink=0.8, aspect=20)
        cbar.set_label('Valore Z', fontsize=10, fontweight='bold')

        # Migliora la vista
        ax.view_init(elev=20, azim=45)

        # Salva come base64
        buffer = BytesIO()
        plt.savefig(buffer, format='png', dpi=150, bbox_inches='tight',
                   facecolor='#f8f9fa', edgecolor='none')
        buffer.seek(0)
        image_base64 = base64.b64encode(buffer.getvalue()).decode()
        plt.close(fig)

        return f"data:image/png;base64,{image_base64}"

    except Exception as e:
        print(f"Errore generazione Seaborn 3D: {e}")
        return generate_matplotlib_plot({"error": str(e)}, "line")

def generate_seaborn_scatter_3d(points=100):
    """Genera scatter 3D con Seaborn styling"""
    try:
        import seaborn as sns
        from matplotlib import cm
        sns.set_style("darkgrid")
        sns.set_palette("husl")

        # Genera dati casuali
        x = np.random.normal(0, 2, points)
        y = np.random.normal(0, 2, points)
        z = np.random.normal(0, 2, points)

        # Crea figura 3D
        fig = plt.figure(figsize=(12, 8))
        ax = fig.add_subplot(111, projection='3d')

        # Scatter plot con colori basati su Z
        scatter = ax.scatter(x, y, z, c=z, cmap='viridis', s=50, alpha=0.8, edgecolors='black', linewidth=0.5)

        # Migliora l'aspetto
        ax.set_xlabel('X', fontsize=12, fontweight='bold')
        ax.set_ylabel('Y', fontsize=12, fontweight='bold')
        ax.set_zlabel('Z', fontsize=12, fontweight='bold')
        ax.set_title(f'Scatter 3D - {points} punti\n(Styling Seaborn)', fontsize=14, fontweight='bold', pad=20)

        # Colorbar
        cbar = plt.colorbar(scatter, ax=ax, shrink=0.8, aspect=20)
        cbar.set_label('Valore Z', fontsize=10, fontweight='bold')

        # Migliora la vista
        ax.view_init(elev=20, azim=45)

        # Salva come base64
        buffer = BytesIO()
        plt.savefig(buffer, format='png', dpi=150, bbox_inches='tight',
                   facecolor='#f8f9fa', edgecolor='none')
        buffer.seek(0)
        image_base64 = base64.b64encode(buffer.getvalue()).decode()
        plt.close(fig)

        return f"data:image/png;base64,{image_base64}"

    except Exception as e:
        print(f"Errore generazione Seaborn scatter 3D: {e}")
        return generate_matplotlib_plot({"error": str(e)}, "line")

def generate_seaborn_surface_3d():
    """Genera superficie 3D con Seaborn styling"""
    try:
        import seaborn as sns
        sns.set_style("darkgrid")

        # Crea dati per superficie
        x = np.linspace(-5, 5, 30)
        y = np.linspace(-5, 5, 30)
        X, Y = np.meshgrid(x, y)
        Z = np.sin(np.sqrt(X**2 + Y**2)) * np.exp(-0.1 * (X**2 + Y**2))

        # Crea figura 3D
        fig = plt.figure(figsize=(12, 8))
        ax = fig.add_subplot(111, projection='3d')

        # Surface plot
        surf = ax.plot_surface(X, Y, Z, cmap='viridis', alpha=0.8, linewidth=0, antialiased=True)

        # Migliora l'aspetto
        ax.set_xlabel('X', fontsize=12, fontweight='bold')
        ax.set_ylabel('Y', fontsize=12, fontweight='bold')
        ax.set_zlabel('Z', fontsize=12, fontweight='bold')
        ax.set_title('Superficie 3D\nf(x,y) = sin(√(x²+y²)) × e^(-0.1×(x²+y²))', fontsize=14, fontweight='bold', pad=20)

        # Colorbar
        cbar = plt.colorbar(surf, ax=ax, shrink=0.8, aspect=20)
        cbar.set_label('Valore Z', fontsize=10, fontweight='bold')

        # Migliora la vista
        ax.view_init(elev=30, azim=45)

        # Salva come base64
        buffer = BytesIO()
        plt.savefig(buffer, format='png', dpi=150, bbox_inches='tight',
                   facecolor='#f8f9fa', edgecolor='none')
        buffer.seek(0)
        image_base64 = base64.b64encode(buffer.getvalue()).decode()
        plt.close(fig)

        return f"data:image/png;base64,{image_base64}"

    except Exception as e:
        print(f"Errore generazione Seaborn surface 3D: {e}")
        return generate_matplotlib_plot({"error": str(e)}, "line")

def run_server():
    try:
        host = os.getenv('SERVER_HOST', '0.0.0.0')
        port = int(os.getenv('SERVER_PORT', '5008'))

        print(f"Starting server on {host}:{port}")
        print("Creating TCPServer...")
        httpd = socketserver.ThreadingTCPServer((host, port), AIHandler)
        print("TCPServer created")
        print(f"🚀 Assistente AI Backend avviato su {host}:{port}")
        print("🌐 Frontend: http://localhost:8080")
        print(f"🔐 API Keys caricate: {len(VALID_API_KEYS)}")
        print(f"⚡ Cache abilitata: {os.getenv('ENABLE_CACHE', 'true')}")
        print("Calling serve_forever...")
        httpd.serve_forever()
    except Exception as e:
        print(f"Errore avvio server: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    run_server()