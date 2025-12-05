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

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "llama3.2:3b"

SYSTEM_PROMPTS = {
    "finance": "Sei un consulente finanziario italiano. Rispondi in italiano.",
    "math": "Sei un assistente matematico. Mostra i calcoli.",
    "general": "Sei un assistente AI utile. Rispondi in italiano."
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
    """Genera dati per uno scatter plot 3D"""
    x = np.random.uniform(x_range[0], x_range[1], points)
    y = np.random.uniform(y_range[0], y_range[1], points)
    z = np.random.uniform(z_range[0], z_range[1], points)

    # Colori basati sulla coordinata Z
    colors = (z - z.min()) / (z.max() - z.min()) * 255

    return {
        "type": "scatter3d",
        "x": x.tolist(),
        "y": y.tolist(),
        "z": z.tolist(),
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

def create_3d_chart_response(chart_type, params=None):
    """Crea una risposta JSON con dati per grafico 3D"""
    if params is None:
        params = {}

    if chart_type == "surface":
        data = generate_3d_surface_data(**params)
    elif chart_type == "scatter":
        data = generate_3d_scatter_data(**params)
    elif chart_type == "parametric":
        data = generate_3d_parametric_data(**params)
    else:
        return {"error": f"Tipo di grafico 3D non supportato: {chart_type}"}

    return {"chart3d": data}

def call_ollama(prompt: str, model: str = MODEL):
    payload = {"model": model, "prompt": prompt, "stream": False}
    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=60)
        response.raise_for_status()
        return response.json().get("response", "Nessuna risposta")
    except Exception as e:
        return f"Errore: {str(e)}"

class AIHandler(http.server.BaseHTTPRequestHandler):
    def send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def do_GET(self):
        print(f"GET request: {self.path}")
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

        else:
            self.send_response(404)
            self.send_cors_headers()
            self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()

def run_server():
    try:
        with socketserver.TCPServer(("127.0.0.1", 5003), AIHandler) as httpd:
            print("🚀 Assistente AI Backend avviato su porta 5003")
            print("🌐 Frontend: http://localhost:8080")
            httpd.serve_forever()
    except Exception as e:
        print(f"Errore avvio server: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    run_server()