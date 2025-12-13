#!/bin/bash

# 🚀 Assistente AI - Launcher Stabile
# Avvia backend con Gunicorn (versione stabile) e frontend

# Configurazione
BASE_DIR="$HOME/Desktop/Assistente_Finanziario_AI/assistente-ai-completo"
BACKEND_PORT=54324
FRONTEND_PORT=8080

# Funzione per mostrare il logo
echo ""
echo "██╗    ██╗██╗██╗     ██████╗ ██╗     ██╗   ██╗██╗  ██╗"
echo "██║    ██║██║██║     ██╔══██╗██║     ██║   ██║╚██╗██╔╝"
echo "██║ █╗ ██║██║██║     ██║  ██║██║     ██║   ██║ ╚███╔╝"
echo "██║███╗██║██║██║     ██║  ██║██║     ██║   ██║ ██╔██╗"
echo "╚███╔███╔╝██║███████╗██████╔╝███████╗╚██████╔╝██╔╝ ██╗"
echo " ╚══╝╚══╝ ╚═╝╚══════╝╚═════╝ ╚══════╝ ╚═════╝ ╚═╝  ╚═╝"
echo ""
echo "🎯 Assistente AI - Sistema di Avvio (Stabile)"
echo "=============================================="
echo ""

# Crea directory logs
mkdir -p "$BASE_DIR/logs"

# Ferma processi esistenti
echo "🛑 Pulizia processi esistenti..."
pkill -f "http.server $FRONTEND_PORT" 2>/dev/null
pkill gunicorn 2>/dev/null
pkill -f "python3.*backend" 2>/dev/null

# Pulisci porte
fuser -k $BACKEND_PORT/tcp 2>/dev/null
fuser -k $FRONTEND_PORT/tcp 2>/dev/null

sleep 2

echo "✅ Pulizia completata"
echo ""

# BACKEND - Usa Gunicorn (versione stabile)
echo "🚀 Avvio backend con Gunicorn (versione stabile)..."
cd "$BASE_DIR/backend"
nohup ./start_stable.sh > "$BASE_DIR/logs/backend.log" 2>&1 &
BACKEND_PID=$!
echo "📋 Backend PID: $BACKEND_PID"

# Aspetta che il backend sia pronto
echo "🕒 Attesa avvio backend..."
sleep 5

# Test backend
echo "🧪 Test backend..."
if curl -s http://localhost:$BACKEND_PORT/api/health -H "X-API-Key: demo_key_123" > /dev/null; then
    echo "✅ Backend OK - Stabile e pronto"
else
    echo "❌ Backend NON risponde"
    exit 1
fi

echo ""

# FRONTEND
echo "🌐 Avvio frontend..."
cd "$BASE_DIR/static_frontend"
nohup python3 -u -m http.server $FRONTEND_PORT --bind 0.0.0.0 > "$BASE_DIR/logs/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "📋 Frontend PID: $FRONTEND_PID"

# Aspetta frontend
sleep 2

# Test frontend
echo "🧪 Test frontend..."
if curl -s http://localhost:$FRONTEND_PORT > /dev/null; then
    echo "✅ Frontend OK"
else
    echo "❌ Frontend NON risponde"
fi

echo ""
echo "🎉 SISTEMA AVVIATO CON SUCCESSO!"
echo "========================================"
echo "📊 Backend:   http://localhost:$BACKEND_PORT"
echo "🌐 Frontend:  http://localhost:$FRONTEND_PORT/login.html"
echo "🔐 API Key:   demo_key_123 (per test)"
echo ""
echo "📋 Comandi utili:"
echo "  • Logs backend:   tail -f $BASE_DIR/logs/gunicorn.log"
echo "  • Logs frontend:  tail -f $BASE_DIR/logs/frontend.log"
echo "  • Accesso:        curl http://localhost:$BACKEND_PORT/api/health -H 'X-API-Key: demo_key_123'"
echo ""
echo "🔥 Configurazione Gunicorn (Stabile):"
echo "  • Workers:        1 (ridotta per memoria)"
echo "  • Threads:        2 per worker"
echo "  • Timeout:        120 secondi"
echo "  • Max richieste:   1000 per worker"
echo "  • Graceful timeout: 30 secondi"
echo ""
echo "🎯 Sistema in esecuzione. Premi Ctrl+C per fermare."

# Aspetta segnale di interruzione
trap './stop.sh' INT
wait

exit 0