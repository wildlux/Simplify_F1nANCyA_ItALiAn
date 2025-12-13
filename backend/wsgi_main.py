#!/usr/bin/env python3
"""WSGI application for Assistente AI - Compatibile con Gunicorn"""

import sys
import os
import json
from urllib.parse import urlparse, parse_qs
from io import BytesIO
import base64
import time
import subprocess
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.colors as mcolors
from matplotlib import cm

# Aggiungi la directory backend al path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Importa funzioni dalle utilitarie
from server_utils import (
    verify_api_key, check_permission, SYSTEM_PROMPTS, 
    get_available_models, detect_mode, call_ollama,
    generate_3d_surface_data, generate_3d_scatter_data, generate_3d_parametric_data,
    create_3d_chart_response, fetch_news, generate_matplotlib_plot,
    analyze_python_code, analyze_javascript_code,
    execute_python_safe, execute_javascript_node, execute_cpp_code,
    generate_seaborn_parametric_3d, generate_seaborn_scatter_3d, generate_seaborn_surface_3d,
    VALID_API_KEYS, MODEL
)

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

def get_request_data(environ):
    """Legge i dati POST dalla richiesta"""
    try:
        content_length = int(environ.get('CONTENT_LENGTH', 0))
        if content_length > 0:
            data = environ['wsgi.input'].read(content_length)
            return json.loads(data.decode('utf-8'))
    except Exception as e:
        print(f"Errore lettura dati POST: {e}")
    return {}

def send_response(start_response, status, headers, body):
    """Invia risposta WSGI"""
    start_response(status, headers)
    return [body.encode('utf-8')] if isinstance(body, str) else [body]

def application(environ, start_response):
    """Applicazione WSGI principale"""

    method = environ.get('REQUEST_METHOD', 'GET')

    # Gestisci richieste OPTIONS per CORS
    if method == 'OPTIONS':
        status = '200 OK'
        headers = [
            ('Access-Control-Allow-Origin', '*'),
            ('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'),
            ('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, Authorization'),
        ]
        return send_response(start_response, status, headers, '')

    # Estrai API key
    api_key = extract_api_key(environ)

    # Verifica API key
    if not api_key:
        response = {"error": "API Key richiesta", "valid_keys": list(VALID_API_KEYS.keys())}
        status = '401 Unauthorized'
        headers = [
            ('Content-Type', 'application/json'),
            ('Access-Control-Allow-Origin', '*'),
            ('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'),
            ('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, Authorization')
        ]
        return send_response(start_response, status, headers, json.dumps(response))
    
    key_info = verify_api_key(api_key)
    if not key_info:
        response = {"error": "API Key non valida", "valid_keys": list(VALID_API_KEYS.keys())}
        status = '401 Unauthorized'
        headers = [
            ('Content-Type', 'application/json'),
            ('Access-Control-Allow-Origin', '*'),
            ('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'),
            ('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, Authorization')
        ]
        return send_response(start_response, status, headers, json.dumps(response))
    
    # Route handling
    path = environ.get('PATH_INFO', '/')
    method = environ.get('REQUEST_METHOD', 'GET')
    
    # CORS preflight
    if method == 'OPTIONS':
        status = '200 OK'
        headers = [
            ('Content-Type', 'text/plain'),
            ('Access-Control-Allow-Origin', '*'),
            ('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'),
            ('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, Authorization'),
            ('Access-Control-Max-Age', '86400')
        ]
        return send_response(start_response, status, headers, '')
    
    # Route GET
    if method == 'GET':
        if path == '/':
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
            status = '200 OK'
            headers = [
                ('Content-Type', 'application/json'),
                ('Access-Control-Allow-Origin', '*')
            ]
            return send_response(start_response, status, headers, json.dumps(response))
        
        elif path == '/api/health':
            response = {"status": "healthy", "model": MODEL}
            status = '200 OK'
            headers = [
                ('Content-Type', 'application/json'),
                ('Access-Control-Allow-Origin', '*')
            ]
            return send_response(start_response, status, headers, json.dumps(response))
        
        elif path == '/api/models':
            models = get_available_models()
            response = {"models": models, "recommended": "llama3.2:1b"}
            status = '200 OK'
            headers = [
                ('Content-Type', 'application/json'),
                ('Access-Control-Allow-Origin', '*')
            ]
            return send_response(start_response, status, headers, json.dumps(response))
        
        elif path == '/api/code/languages':
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
            status = '200 OK'
            headers = [
                ('Content-Type', 'application/json'),
                ('Access-Control-Allow-Origin', '*')
            ]
            return send_response(start_response, status, headers, json.dumps(response))
        
        elif path == '/docs':
            docs_html = """<!DOCTYPE html>
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
            status = '200 OK'
            headers = [
                ('Content-Type', 'text/html'),
                ('Access-Control-Allow-Origin', '*')
            ]
            return send_response(start_response, status, headers, docs_html)
        
        else:
            response = {"error": "Endpoint non trovato"}
            status = '404 Not Found'
            headers = [
                ('Content-Type', 'application/json'),
                ('Access-Control-Allow-Origin', '*')
            ]
            return send_response(start_response, status, headers, json.dumps(response))
    
    # Route POST
    elif method == 'POST':
        if path == '/api/chat':
            data = get_request_data(environ)
            text = data.get("text", "")
            mode = data.get("mode", "auto")
            model = data.get("model", MODEL)
            custom_prompts = data.get("prompts", SYSTEM_PROMPTS)
            
            if mode == "auto":
                mode = detect_mode(text)
            
            system_prompt = custom_prompts.get(mode, custom_prompts["general"])
            full_prompt = f"{system_prompt}\n\n{text}\n\nRisposta:"
            
            response_text = call_ollama(full_prompt, model)
            
            response = {"response": response_text, "mode": mode}
            status = '200 OK'
            headers = [
                ('Content-Type', 'application/json'),
                ('Access-Control-Allow-Origin', '*')
            ]
            return send_response(start_response, status, headers, json.dumps(response))
        
        elif path == '/api/matplotlib':
            data = get_request_data(environ)
            chart_type = data.get("type", "line")
            
            if chart_type == "parametric3d_seaborn":
                func_x = data.get("func_x", "cos(t)")
                func_y = data.get("func_y", "sin(t)")
                func_z = data.get("func_z", "t")
                points = data.get("points", 200)
                image_url = generate_seaborn_parametric_3d(func_x, func_y, func_z, points)
            elif chart_type == "scatter3d_seaborn":
                points = data.get("points", 100)
                try:
                    image_url = generate_seaborn_scatter_3d(points)
                except:
                    image_url = generate_matplotlib_plot({"error": "Seaborn non disponibile"}, "line")
            elif chart_type == "surface3d_seaborn":
                try:
                    image_url = generate_seaborn_surface_3d()
                except:
                    image_url = generate_matplotlib_plot({"error": "Seaborn non disponibile"}, "line")
            else:
                chart_data = data.get("data", {})
                image_url = generate_matplotlib_plot(chart_data, chart_type)
            
            response = {"image": image_url}
            status = '200 OK'
            headers = [
                ('Content-Type', 'application/json'),
                ('Access-Control-Allow-Origin', '*')
            ]
            return send_response(start_response, status, headers, json.dumps(response))
        
        elif path == '/api/chart3d':
            data = get_request_data(environ)
            chart_type = data.get("type", "surface")
            params = data.get("params", {})
            chart_data = create_3d_chart_response(chart_type, params)
            
            status = '200 OK'
            headers = [
                ('Content-Type', 'application/json'),
                ('Access-Control-Allow-Origin', '*')
            ]
            return send_response(start_response, status, headers, json.dumps(chart_data))
        
        elif path == '/api/code/analyze':
            data = get_request_data(environ)
            code = data.get("code", "")
            language = data.get("language", "python")
            
            try:
                if language == 'python':
                    analysis = analyze_python_code(code)
                elif language in ['javascript', 'typescript']:
                    analysis = analyze_javascript_code(code)
                else:
                    analysis = {'error': f'Analisi {language} non supportata'}
                
                response = {
                    'success': True,
                    'language': language,
                    'analysis': analysis
                }
                status = '200 OK'
            except Exception as e:
                response = {'success': False, 'error': str(e)}
                status = '500 Internal Server Error'
            
            headers = [
                ('Content-Type', 'application/json'),
                ('Access-Control-Allow-Origin', '*')
            ]
            return send_response(start_response, status, headers, json.dumps(response))
        
        elif path == '/api/code/execute':
            data = get_request_data(environ)
            code = data.get("code", "")
            language = data.get("language", "python")
            timeout = min(data.get("timeout", 5), 10)
            
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
                
                response = {
                    'success': success,
                    'output': output,
                    'errors': errors,
                    'execution_time': exec_time,
                    'analysis': analysis
                }
                status = '200 OK'
            except Exception as e:
                response = {'success': False, 'error': str(e)}
                status = '500 Internal Server Error'
            
            headers = [
                ('Content-Type', 'application/json'),
                ('Access-Control-Allow-Origin', '*')
            ]
            return send_response(start_response, status, headers, json.dumps(response))
        
        elif path.startswith('/api/news/'):
            try:
                path_parts = path.split('/')
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
                response = {'news': news}
                status = '200 OK'
            except Exception as e:
                response = {'error': f'Errore nel recupero notizie: {str(e)}'}
                status = '500 Internal Server Error'
            
            headers = [
                ('Content-Type', 'application/json'),
                ('Access-Control-Allow-Origin', '*')
            ]
            return send_response(start_response, status, headers, json.dumps(response))
        
        else:
            response = {"error": "Endpoint non trovato"}
            status = '404 Not Found'
            headers = [
                ('Content-Type', 'application/json'),
                ('Access-Control-Allow-Origin', '*')
            ]
            return send_response(start_response, status, headers, json.dumps(response))
    
    else:
        response = {"error": "Metodo non supportato"}
        status = '405 Method Not Allowed'
        headers = [
            ('Content-Type', 'application/json'),
            ('Access-Control-Allow-Origin', '*')
        ]
        return send_response(start_response, status, headers, json.dumps(response))

if __name__ == '__main__':
    # Per test locale
    from wsgiref.simple_server import make_server
    httpd = make_server('0.0.0.0', 54321, application)
    print("Avvio server WSGI su 0.0.0.0:54321...")
    httpd.serve_forever()