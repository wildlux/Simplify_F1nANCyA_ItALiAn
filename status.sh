#!/bin/bash
# Script di monitoraggio Assistente AI

echo "📊 MONITORAGGIO ASSISTENTE AI"
echo "=============================="

# Stato processi
echo ""
echo "🔄 Processi:"
if pgrep -f "ollama serve" > /dev/null; then
    echo "  ✅ Ollama: ATTIVO"
else
    echo "  ❌ Ollama: NON ATTIVO"
fi

if pgrep -f "server.py" > /dev/null; then
    echo "  ✅ Backend: ATTIVO (PID: $(pgrep -f "server.py"))"
else
    echo "  ❌ Backend: NON ATTIVO"
fi

if pgrep -f "http.server" > /dev/null; then
    echo "  ✅ Frontend: ATTIVO (PID: $(pgrep -f "http.server"))"
else
    echo "  ❌ Frontend: NON ATTIVO"
fi

# Stato porte
echo ""
echo "🔌 Porte:"
if lsof -i :11434 > /dev/null 2>&1; then
    echo "  ✅ Ollama (11434): APERTA"
else
    echo "  ❌ Ollama (11434): CHIUSA"
fi

if lsof -i :5000 > /dev/null 2>&1; then
    echo "  ✅ Backend (5000): APERTA"
else
    echo "  ❌ Backend (5000): CHIUSA"
fi

if lsof -i :8080 > /dev/null 2>&1; then
    echo "  ✅ Frontend (8080): APERTA"
else
    echo "  ❌ Frontend (8080): CHIUSA"
fi

# Test endpoints
echo ""
echo "🌐 Endpoint:"
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "  ✅ Ollama API: OK"
else
    echo "  ❌ Ollama API: KO"
fi

if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "  ✅ Backend API: OK"
else
    echo "  ❌ Backend API: KO"
fi

if curl -s http://localhost:8080 > /dev/null 2>&1; then
    echo "  ✅ Frontend: OK"
else
    echo "  ❌ Frontend: KO"
fi

# Uso risorse
echo ""
echo "💾 Risorse:"
echo "  CPU: $(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1"%"}')"
echo "  RAM: $(free | grep Mem | awk '{printf "%.1f%%", $3/$2 * 100.0}')"
echo "  Disco: $(df / | tail -1 | awk '{printf "%.1f%%", $3/$2 * 100.0}')"

echo ""
echo "📝 Per avviare: ./start.sh"
echo "🛑 Per fermare: Ctrl+C nel terminale di avvio"