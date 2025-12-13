#!/bin/bash
# Script per configurare l'accesso mobile bypassando il firewall

echo "📱 Configurazione accesso mobile"
echo "================================"

# Trova l'indirizzo IP del computer
IP_ADDRESS=$(hostname -I | awk '{print $1}')
echo "🌐 Indirizzo IP del computer: $IP_ADDRESS"

# Verifica che i servizi siano in esecuzione
echo "🔍 Verifica servizi..."
if curl -s "http://localhost:8080" > /dev/null 2>&1; then
    echo "✅ Frontend: OK (porta 8080)"
else
    echo "❌ Frontend non risponde - avvio..."
    cd frontend
    nohup python3 -m http.server 8080 --bind 0.0.0.0 > ../logs/frontend.log 2>&1 &
    cd ..
    sleep 2
fi

if curl -s "http://localhost:7777/api/health?api_key=demo_key_123" > /dev/null 2>&1; then
    echo "✅ Backend: OK (porta 7777)"
else
    echo "❌ Backend non risponde - avvio..."
    cd backend
    nohup python3 test_server.py > ../logs/test_backend.log 2>&1 &
    cd ..
    sleep 3
fi

echo ""
echo "📋 Istruzioni per il cellulare:"
echo "================================"
echo "1. Connetti il cellulare alla stessa rete WiFi"
echo "2. Apri Chrome (non Safari) e vai a:"
echo "   http://$IP_ADDRESS:8080"
echo "3. Clicca sul pulsante 'Demo' (verde)"
echo ""
echo "💡 Se non funziona:"
echo "- Crea un hotspot dal cellulare"
echo "- Connetti il computer al cellulare"
echo "- Trova il nuovo IP del computer (di solito 192.168.43.x)"
echo "- Usa quel nuovo IP nel browser del cellulare"
echo ""
echo "🔧 Per trovare il nuovo IP dopo aver creato l'hotspot:"
echo "   hostname -I"

echo ""
echo "🎯 Test connessione:"
echo "- Frontend: curl http://$IP_ADDRESS:8080"
echo "- Backend: curl http://$IP_ADDRESS:7777/api/health?api_key=demo_key_123"