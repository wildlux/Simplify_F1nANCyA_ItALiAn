#!/bin/bash
# Script di avvio Assistente AI - Versione Sicura

set -e  # Exit on error

# Colori
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Funzioni
log() { echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }
warning() { echo -e "${YELLOW}⚠${NC} $1"; }
error() { echo -e "${RED}✗${NC} $1"; }

# Banner
echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════════╗"
echo "║           ASSISTENTE AI - AVVIO SICURO           ║"
echo "║                  Versione 4.0                    ║"
echo "╚══════════════════════════════════════════════════╝"
echo -e "${NC}"

# Directory base
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$BASE_DIR"

# Primo avvio - collegamento desktop
if [ ! -f ".first_run" ]; then
    echo ""
    read -p "Vuoi creare un collegamento sul desktop? (s/n): " answer
    if [[ $answer =~ ^[sS]$ ]]; then
        DESKTOP_FILE="$HOME/Desktop/Assistente_AI.desktop"
        cat > "$DESKTOP_FILE" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=Assistente AI
Comment=Avvia l'Assistente AI
Exec=$BASE_DIR/start.sh
Icon=utilities-terminal
Terminal=true
Categories=Utility;
EOF
        chmod +x "$DESKTOP_FILE"
        success "Collegamento creato sul desktop"
    fi
    touch .first_run
    echo ""
fi

# Verifica dipendenze
log "Verifica dipendenze..."
if ! command -v python3 &> /dev/null; then
    error "Python3 non trovato"
    exit 1
fi

if ! command -v ollama &> /dev/null; then
    warning "Ollama non trovato - installalo da https://ollama.ai"
fi

success "Dipendenze OK"

# Controllo librerie TTS
if command -v speech-dispatcher &> /dev/null && command -v espeak-ng &> /dev/null && command -v mbrola &> /dev/null; then
    success "Librerie TTS installate (speech-dispatcher, espeak-ng, mbrola)"

    # Avvia speech-dispatcher se non attivo
    if ! pgrep -x "speech-dispatcher" > /dev/null; then
        log "Avvio speech-dispatcher..."
        speech-dispatcher &
        sleep 2
    fi

    # Test TTS
    if command -v spd-say &> /dev/null; then
        log "Test sintesi vocale..."
        spd-say -o espeak-ng -l it -r -50 -p 0 -i 100 "Assistente AI avviato con sintesi vocale italiana"
        success "TTS test completato"
    fi
else
    warning "Librerie TTS mancanti - installa: sudo apt install speech-dispatcher espeak-ng mbrola mbrola-it3 mbrola-en1"
fi

# Crea directory necessarie
mkdir -p logs data/conversations data/models static

# Avvia Ollama se necessario
log "Controllo Ollama..."
if ! pgrep -x "ollama" > /dev/null; then
    log "Avvio Ollama..."
    ollama serve > logs/ollama.log 2>&1 &
    OLLAMA_PID=$!
    sleep 5

    # Verifica che Ollama sia partito
    if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        error "Ollama non risponde - controlla logs/ollama.log"
        kill $OLLAMA_PID 2>/dev/null || true
        exit 1
    fi

    success "Ollama avviato"
else
    success "Ollama già in esecuzione"
fi

# Verifica modello
if ! ollama list 2>/dev/null | grep -q "llama3.2"; then
    warning "Modello llama3.2 non trovato"
    log "Scarico modello (circa 2GB)..."
    ollama pull llama3.2:3b
fi

# Avvia Backend
log "Avvio Backend..."
cd backend

# Crea ambiente virtuale se necessario
if [ ! -d "venv" ]; then
    log "Creo ambiente virtuale..."
    python3 -m venv venv
    source venv/bin/activate
    pip install --quiet -r requirements.txt
fi

source venv/bin/activate
pip install --quiet -r requirements.txt
python -c "import numpy, requests" || { echo "Errore: pacchetti Python non installati"; exit 1; }
python server.py > ../logs/backend.log 2>&1 &
BACKEND_PID=$!

cd ..
sleep 15

# Verifica Backend
if ! curl -s http://localhost:5003/api/health > /dev/null 2>&1; then
    error "Backend non risponde - controlla logs/backend.log"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

success "Backend avviato (porta 5003)"

# Avvia Frontend
log "Avvio Frontend..."
cd frontend
python3 -m http.server 8080 > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!

cd ..
sleep 2

# Verifica Frontend
if ! curl -s http://localhost:8080 > /dev/null 2>&1; then
    error "Frontend non risponde - controlla logs/frontend.log"
    kill $FRONTEND_PID 2>/dev/null || true
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

success "Frontend avviato (porta 8080)"

# Successo!
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         🎉 SISTEMA AVVIATO CON SUCCESSO!         ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}🌐 Frontend:${NC} http://localhost:8080"
echo -e "${GREEN}🔧 Backend:${NC}  http://localhost:5003"
echo -e "${GREEN}📚 API Docs:${NC} http://localhost:5003/docs"
echo ""
echo -e "${GREEN}🔑 API Key:${NC} demo_key_123"
echo -e "${YELLOW}🔊 TTS:${NC} Configura speech-dispatcher per voci italiane"
echo ""
echo -e "${YELLOW}💡 Suggerimenti:${NC}"
echo "  • Usa Chrome/Edge per il riconoscimento vocale"
echo "  • Premi Ctrl+C per fermare tutto"
echo "  • Controlla logs/ per eventuali errori"
echo ""
echo -e "${BLUE}📝 Logs disponibili in:${NC}"
echo "  • logs/backend.log"
echo "  • logs/frontend.log"
echo "  • logs/ollama.log (se avviato)"
echo ""

# Gestione chiusura
cleanup() {
    echo ""
    log "Arresto sistema..."
    kill $FRONTEND_PID 2>/dev/null || true
    kill $BACKEND_PID 2>/dev/null || true
    if [ ! -z "$OLLAMA_PID" ]; then
        kill $OLLAMA_PID 2>/dev/null || true
    fi
    success "Sistema arrestato"
    exit 0
}

trap cleanup INT TERM

# Mantieni in esecuzione
log "Sistema in esecuzione - premi Ctrl+C per fermare"
wait