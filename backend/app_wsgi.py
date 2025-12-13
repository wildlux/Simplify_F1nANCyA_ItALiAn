#!/usr/bin/env python3
"""Applicazione WSGI per Assistente AI - Compatibile con Gunicorn"""

import json
from urllib.parse import urlparse, parse_qs

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

def extract_api_key(environ):
    """Estrae API key da header o URL"""
    # Header
    if 'HTTP_X_API_KEY' in environ:
        return environ['HTTP_X_API_KEY'].strip()
    elif 'HTTP_AUTHORIZATION' in environ:
        auth_header = environ['HTTP_AUTHORIZATION']
        if auth_header.startswith('Bearer '):
            return auth_header[7:].strip()
    else:
        # Parametro URL
        try:
            query_string = environ.get('QUERY_STRING', '')
            query_params = parse_qs(query_string)
            if 'api_key' in query_params:
                return query_params['api_key'][0].strip()
        except Exception as e:
            print(f"Errore parsing URL: {e}")
    return None

def application(environ, start_response):
    """Applicazione WSGI"""
    
    # Estrai API key
    api_key = extract_api_key(environ)
    
    # Verifica API key
    if not api_key:
        response = {"error": "API Key richiesta", "valid_keys": list(VALID_API_KEYS.keys())}
        status = '401 Unauthorized'
        headers = [('Content-Type', 'application/json')]
        start_response(status, headers)
        return [json.dumps(response).encode()]
    
    key_info = verify_api_key(api_key)
    if not key_info:
        response = {"error": "API Key non valida", "valid_keys": list(VALID_API_KEYS.keys())}
        status = '401 Unauthorized'
        headers = [('Content-Type', 'application/json')]
        start_response(status, headers)
        return [json.dumps(response).encode()]
    
    # Route handling
    path = environ.get('PATH_INFO', '/')
    
    if path.startswith('/api/health'):
        response = {
            "status": "healthy",
            "model": "test-model-wsgi",
            "key_info": key_info
        }
        status = '200 OK'
        headers = [('Content-Type', 'application/json')]
        start_response(status, headers)
        return [json.dumps(response).encode()]
    else:
        response = {"error": "Endpoint non trovato"}
        status = '404 Not Found'
        headers = [('Content-Type', 'application/json')]
        start_response(status, headers)
        return [json.dumps(response).encode()]

if __name__ == '__main__':
    # Per test locale
    from wsgiref.simple_server import make_server
    httpd = make_server('0.0.0.0', 54321, application)
    print("Avvio server WSGI su 0.0.0.0:54321...")
    httpd.serve_forever()