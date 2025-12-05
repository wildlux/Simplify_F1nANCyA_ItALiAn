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
python server.py &
cd ..

# Avvia frontend
cd frontend
python -m http.server 8080 &
cd ..

echo "Sistema avviato"
echo "Frontend: http://localhost:8080"
echo "Backend: http://localhost:5000"
echo "API Key: demo_key_123"
wait
