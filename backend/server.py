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

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "llama3.2:3b"

SYSTEM_PROMPTS = {
    "finance": "Sei un consulente finanziario italiano. Rispondi in italiano.",
    "math": "Sei un assistente matematico. Mostra i calcoli.",
    "general": "Sei un assistente AI utile. Rispondi in italiano."
}

def detect_mode(text: str) -> str:
    text_lower = text.lower()
    if any(k in text_lower for k in ["calcola", "matematica", "equazione"]):
        return "math"
    elif any(k in text_lower for k in ["finanza", "tasse", "investimento"]):
        return "finance"
    return "general"

def call_ollama(prompt: str):
    payload = {"model": MODEL, "prompt": prompt, "stream": False}
    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=30)
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
        if self.path == "/":
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_cors_headers()
            self.end_headers()
            response = {"message": "Assistente AI Backend", "status": "online"}
            self.wfile.write(json.dumps(response).encode())

        elif self.path == "/api/health":
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_cors_headers()
            self.end_headers()
            response = {"status": "healthy", "model": MODEL}
            self.wfile.write(json.dumps(response).encode())

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

            if mode == "auto":
                mode = detect_mode(text)

            system_prompt = SYSTEM_PROMPTS.get(mode, SYSTEM_PROMPTS["general"])
            full_prompt = f"{system_prompt}\n\n{text}\n\nRisposta:"

            response_text = call_ollama(full_prompt)

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_cors_headers()
            self.end_headers()

            response = {"response": response_text, "mode": mode}
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.send_cors_headers()
            self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()

def run_server():
    with socketserver.TCPServer(("", 5001), AIHandler) as httpd:
        print("🚀 Assistente AI Backend avviato su porta 5001")
        print("🌐 Frontend: http://localhost:8080")
        httpd.serve_forever()

if __name__ == "__main__":
    run_server()