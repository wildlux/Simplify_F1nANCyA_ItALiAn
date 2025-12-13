#!/bin/bash
# Script di avvio semplificato per Assistente AI - Versione Test

echo "🚀 Avvio Assistente AI - Versione Test"
echo "======================================"

# Directory base
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$BASE_DIR"

# Uccidi eventuali processi esistenti
echo "🔧 Pulizia processi esistenti..."
pkill -f "test_server.py" 2>/dev/null
pkill -f "http.server.*8080" 2>/dev/null
sleep 1

# Crea directory necessarie
mkdir -p logs data/conversations

# Avvia Backend (server di test sulla porta 7777)
echo "🔧 Avvio backend di test..."
cd backend
nohup python3 test_server.py > ../logs/test_backend.log 2>&1 &
BACKEND_PID=$!
cd ..
sleep 3

# Verifica Backend
if curl -s "http://localhost:7777/api/health?api_key=demo_key_123" > /dev/null 2>&1; then
    echo "✅ Backend avviato correttamente sulla porta 7777"
else
    echo "❌ Backend non risponde - controlla logs/test_backend.log"
    echo "📊 Ultime 20 righe del log:"
    tail -20 logs/test_backend.log 2>/dev/null || echo "Nessun log trovato"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

# Avvia Frontend
echo "🌐 Avvio frontend..."
cd frontend
nohup python3 -m http.server 8080 --bind 0.0.0.0 > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
sleep 2

# Verifica Frontend
if curl -s "http://localhost:8080" > /dev/null 2>&1; then
    echo "✅ Frontend avviato correttamente sulla porta 8080"
else
    echo "❌ Frontend non risponde - controlla logs/frontend.log"
    kill $FRONTEND_PID 2>/dev/null || true
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

echo ""
echo "🎉 SISTEMA AVVIATO CON SUCCESSO!"
echo "================================"
echo "🌐 Frontend: http://localhost:8080"
echo "🔧 Backend:  http://localhost:7777"
echo "🔑 API Key:  demo_key_123"
echo ""
echo "Per accedere dal cellulare:"
echo "1. Connetti il cellulare alla stessa rete WiFi"
echo "2. Apri il browser e vai a: http://192.168.1.165:8080"
echo "3. Clicca sul pulsante 'Demo' (verde)"
echo ""
echo "Premi Ctrl+C per fermare il sistema"

# Mantieni in esecuzione
wait