#!/bin/bash
# Script dedicato per avviare il backend

echo "🔧 Avvio backend su porta 54321..."

# Uccidi eventuali processi esistenti
pkill -9 -f "test_server.py" 2>/dev/null

# Avvia il backend con ulimit illimitato
ulimit -s unlimited
ulimit -n 65535

cd ~/Desktop/Assistente_Finanziario_AI/assistente-ai-completo/backend/

while true; do
    echo "$(date) - Avvio test_server.py..."
    python3 test_server.py
    echo "$(date) - Backend terminato. Riavvio in 5 secondi..."
    sleep 5
done