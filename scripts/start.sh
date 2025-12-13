#!/bin/bash
echo "Avvio Assistente AI..."

# Avvia Ollama
ollama serve &
sleep 3

# Avvia backend
cd backend
python -m venv venv 2>/dev/null
source venv/bin/activate
pip install -r requirements.txt > /dev/null 2>&1
. ../venv/bin/activate && gunicorn --bind 0.0.0.0:54324 --workers 4 wsgi:application &
cd ..

# Avvia frontend
cd frontend
python -m http.server 8080 &
cd ..

echo "Sistema avviato"
echo "Frontend: http://localhost:8080"
echo "Backend: http://localhost:54324"
echo "API Key: demo_key_123"
wait
