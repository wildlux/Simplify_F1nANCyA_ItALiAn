#!/bin/bash
# Test script per verificare che tutto funzioni correttamente

echo "🧪 TEST SISTEMA ASSISTENTE AI"
echo "=============================="

# Test 1: Verifica struttura directory
echo ""
echo "1. Verifica struttura directory..."
if [ -d "backend" ] && [ -d "frontend" ] && [ -d "config" ]; then
    echo "✅ Struttura directory OK"
else
    echo "❌ Struttura directory incompleta"
    exit 1
fi

# Test 2: Verifica file backend
echo ""
echo "2. Verifica file backend..."
if [ -f "backend/server.py" ] && [ -f "backend/requirements.txt" ]; then
    echo "✅ File backend presenti"
else
    echo "❌ File backend mancanti"
    exit 1
fi

# Test 3: Verifica file frontend
echo ""
echo "3. Verifica file frontend..."
if [ -f "frontend/index.html" ]; then
    echo "✅ File frontend presenti"
else
    echo "❌ File frontend mancanti"
    exit 1
fi

# Test 4: Verifica dipendenze Python
echo ""
echo "4. Verifica dipendenze Python..."
cd backend
python3 -c "
try:
    import fastapi, uvicorn, requests, pydantic, psutil
    print('✅ Dipendenze Python OK')
except ImportError as e:
    print(f'❌ Dipendenza mancante: {e}')
    exit(1)
"
if [ $? -ne 0 ]; then
    echo "❌ Errore dipendenze Python"
    exit 1
fi
cd ..

# Test 5: Verifica import backend
echo ""
echo "5. Verifica import backend..."
cd backend
python3 -c "import server; print('✅ Backend import OK')" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Backend import OK"
else
    echo "❌ Errore import backend"
    exit 1
fi
cd ..

# Test 6: Verifica Ollama (se disponibile)
echo ""
echo "6. Verifica Ollama..."
if command -v ollama &> /dev/null; then
    echo "✅ Ollama installato"
    if ollama list 2>/dev/null | grep -q "llama3.2"; then
        echo "✅ Modello llama3.2 disponibile"
    else
        echo "⚠️  Modello llama3.2 non trovato (scaricalo con: ollama pull llama3.2:3b)"
    fi
else
    echo "⚠️  Ollama non installato (installalo da: https://ollama.ai)"
fi

# Test 7: Verifica porte libere
echo ""
echo "7. Verifica porte..."
if lsof -i :5000 >/dev/null 2>&1; then
    echo "⚠️  Porta 5000 già in uso"
else
    echo "✅ Porta 5000 libera"
fi

if lsof -i :8080 >/dev/null 2>&1; then
    echo "⚠️  Porta 8080 già in uso"
else
    echo "✅ Porta 8080 libera"
fi

echo ""
echo "🎉 TUTTI I TEST SUPERATI!"
echo ""
echo "Il sistema è pronto per l'uso."
echo "Avvia con: ./start.sh"
echo ""
echo "Frontend: http://localhost:8080"
echo "Backend: http://localhost:5000"
echo "API Key: demo_key_123"