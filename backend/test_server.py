#!/usr/bin/env python3
"""Server di test minimale"""

import http.server
import socketserver
import json
import urllib.parse

# API Keys valide
VALID_API_KEYS = {
    "demo_key_123": {"role": "demo", "permissions": ["chat", "charts"]},
    "admin_key_456": {"role": "admin", "permissions": ["chat", "charts", "code", "admin"]},
    "test_key_789": {"role": "test", "permissions": ["chat", "charts", "code"]}
}

def verify_api_key(api_key):
    """Verifica API key"""
    if not api_key:
        return None
    return VALID_API_KEYS.get(api_key.strip())

class TestHandler(http.server.BaseHTTPRequestHandler):
    def _extract_api_key(self):
        """Estrae API key da header o URL"""
        print(f"DEBUG: Path completo: {self.path}")
        print(f"DEBUG: Query string: {self.path.split('?')[1] if '?' in self.path else 'Nessuna'}")
        
        # Header
        if 'X-API-Key' in self.headers:
            key = self.headers['X-API-Key'].strip()
            print(f"DEBUG: API Key da header: {key}")
            return key
        elif 'Authorization' in self.headers:
            auth_header = self.headers['Authorization']
            if auth_header.startswith('Bearer '):
                key = auth_header[7:].strip()
                print(f"DEBUG: API Key da Authorization: {key}")
                return key
        else:
            # Parametro URL
            try:
                parsed_url = urllib.parse.urlparse(self.path)
                query_params = urllib.parse.parse_qs(parsed_url.query)
                print(f"DEBUG: Query params: {query_params}")
                if 'api_key' in query_params:
                    key = query_params['api_key'][0].strip()
                    print(f"DEBUG: API Key da URL: {key}")
                    return key
                else:
                    print("DEBUG: Nessuna api_key trovata nei parametri URL")
            except Exception as e:
                print(f"Errore parsing URL: {e}")
                import traceback
                traceback.print_exc()
        return None

    def _send_cors_headers(self):
        """Invia header CORS per tutte le risposte - Migliorato per CORB"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, Authorization, Cache-Control')
        self.send_header('Access-Control-Allow-Credentials', 'true')
        self.send_header('Access-Control-Max-Age', '86400')
        self.send_header('Access-Control-Expose-Headers', 'Content-Type, Content-Length')
        self.send_header('Content-Security-Policy', "default-src 'self';")
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'DENY')
        self.send_header('Vary', 'Origin')

    def do_OPTIONS(self):
        """Gestione preflight CORS"""
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self):
        print(f"GET request: {self.path}")
        
        # Verifica API Key
        api_key = self._extract_api_key()
        print(f"API Key extracted: {api_key}")
        
        if not api_key:
            self.send_response(401)
            self.send_header('Content-Type', 'application/json')
            self._send_cors_headers()
            self.end_headers()
            response = {"error": "API Key richiesta", "valid_keys": list(VALID_API_KEYS.keys())}
            self.wfile.write(json.dumps(response).encode())
            return
            
        key_info = verify_api_key(api_key)
        if not key_info:
            self.send_response(401)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            response = {"error": "API Key non valida", "valid_keys": list(VALID_API_KEYS.keys())}
            self.wfile.write(json.dumps(response).encode())
            return
        
        # Route handling
        if self.path.startswith('/api/health'):
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self._send_cors_headers()
            self.end_headers()
            response = {"status": "healthy", "model": "test-model", "key_info": key_info}
            self.wfile.write(json.dumps(response).encode())
        elif self.path == '/':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self._send_cors_headers()
            self.end_headers()
            response = {"message": "Test server", "api_key_used": api_key}
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self._send_cors_headers()
            self.end_headers()

def run_test_server():
    host = '0.0.0.0'
    port = 54324  # Porta modificata temporaneamente
    
    print(f"Starting test server on {host}:{port}")
    httpd = socketserver.ThreadingTCPServer((host, port), TestHandler)
    print(f"🚀 Test server avviato su {host}:{port}")
    httpd.serve_forever()

if __name__ == "__main__":
    run_test_server()