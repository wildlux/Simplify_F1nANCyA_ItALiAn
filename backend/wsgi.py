#!/usr/bin/env python3
"""WSGI application for Gunicorn"""

import sys
import os

# Aggiungi la directory backend al path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from test_server import TestHandler

def application(environ, start_response):
    """WSGI application"""
    # Crea un handler per la richiesta
    handler = TestHandler()
    handler.setup(environ, start_response)
    
    # Simula la richiesta
    handler.do_GET()
    
    return []

if __name__ == "__main__":
    print("WSGI application ready")