#!/bin/bash
# Script di avvio definitivo per Assistente AI

# Funzione per la pulizia
trap cleanup SIGINT SIGTERM

cleanup() {
    echo ""
    echo "🔧 Pulizia in corso..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "👋 Arrivederci!"
    exit 0
}

echo "🚀 Assistente AI - Avvio Definitivo"
echo "=================================="

# Directory base
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$BASE_DIR"

# Crea directory per i log
mkdir -p logs

# Uccidi tutti i processi esistenti
echo "🔧 Pulizia processi esistenti..."
pkill -9 -f "test_server.py" 2>/dev/null
pkill -9 -f "http.server" 2>/dev/null
pkill -9 -f "python3.*server" 2>/dev/null
sleep 1

# Avvia Backend
echo "🔧 Avvio backend (porta 54321)..."
cd backend
nohup . ../venv/bin/activate && gunicorn --bind 0.0.0.0:54324 --workers 4 wsgi:application > "$BASE_DIR/logs/test_backend.log" 2>&1 &
BACKEND_PID=$!
cd ..

# Attendi che il backend sia pronto
sleep 3

# Verifica Backend
if curl -s "http://localhost:54324/api/health?api_key=demo_key_123" > /dev/null 2>&1; then
    echo "✅ Backend avviato (PID: $BACKEND_PID)"
else
    echo "❌ Backend non risponde"
    echo "📊 Log backend:"
    tail -20 "$BASE_DIR/logs/test_backend.log"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Avvia Frontend
echo "🌐 Avvio frontend (porta 8080)..."
cd frontend
nohup python3 -m http.server 8080 --bind 0.0.0.0 > "$BASE_DIR/logs/frontend.log" 2>&1 &
FRONTEND_PID=$!
cd ..

# Attendi che il frontend sia pronto
sleep 2

# Verifica Frontend
if curl -s "http://localhost:8080" > /dev/null 2>&1; then
    echo "✅ Frontend avviato (PID: $FRONTEND_PID)"
else
    echo "❌ Frontend non risponde"
    echo "📊 Log frontend:"
    tail -20 "$BASE_DIR/logs/frontend.log"
    kill $FRONTEND_PID 2>/dev/null
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo ""
echo "🎉 SISTEMA AVVIATO CON SUCCESSO!"
echo "================================"
echo "🌐 Frontend: http://localhost:8080"
echo "🔧 Backend:  http://localhost:54324"
echo "🔑 API Key:  demo_key_123"
echo ""
echo "Per accedere da cellulare Android:"
echo "1. Connetti il cellulare alla stessa rete WiFi"
echo "2. Apri Chrome e vai a: http://$(hostname -I | awk '{print $1}'):8080"
echo "3. Clicca sul pulsante 'Demo' (verde)"
echo ""
echo "Premi Ctrl+C per fermare il sistema"
echo ""
echo "📊 Log disponibili in:"
echo "  - $BASE_DIR/logs/test_backend.log"
echo "  - $BASE_DIR/logs/frontend.log"

# Mantieni in esecuzione
wait