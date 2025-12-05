# 🤖 Assistente AI - Progetto Completo

**Un assistente AI avanzato per matematica e finanza con riconoscimento vocale**

[![GitHub](https://img.shields.io/badge/GitHub-Repository-blue)](https://github.com/wildlux/Simplify_F1nANC-_ItALiAn)
[![Python](https://img.shields.io/badge/Python-3.8+-green)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Framework-red)](https://fastapi.tiangolo.com/)
[![Ollama](https://img.shields.io/badge/Ollama-AI-orange)](https://ollama.ai/)

## 📋 Descrizione

Questo progetto implementa un assistente AI completo specializzato in matematica e finanza italiana. Include:

- **Backend**: Server FastAPI con streaming, database SQLite, monitoraggio sistema
- **Frontend**: Interfaccia web moderna con temi multipli e riconoscimento vocale
- **AI**: Integrazione con Ollama per modelli locali (Llama 3.2)
- **Database**: Salvataggio conversazioni e gestione stato
- **Sicurezza**: Autenticazione API Key e CORS configurato

## 🚀 Installazione Rapida

### Prerequisiti
- Linux (Ubuntu/Debian/Arch/Fedora)
- Python 3.8+
- Ollama installato

### Comandi
```bash
# 1. Clona repository
git clone https://github.com/wildlux/Simplify_F1nANC-_ItALiAn.git
cd Simplify_F1nANC-_ItALiAn

# 2. Installa Ollama e modello
curl -fsSL https://ollama.ai/install.sh | sh
ollama pull llama3.2:3b

# 3. Installa dipendenze Python
cd backend
pip install -r requirements.txt
cd ..

# 4. Avvia sistema
./start.sh
```

## 🌐 Utilizzo

1. Apri browser: http://localhost:8080
2. Inserisci API Key: `demo_key_123`
3. Inizia a chattare!

### Funzionalità Disponibili
- 💬 Chat intelligente con AI
- 📐 Calcoli matematici avanzati
- 💰 Consulenza finanziaria italiana
- 🎤 Riconoscimento vocale
- 🎨 Temi personalizzabili (Dark/Light/Neon/Hacker)
- 💾 Salvataggio conversazioni
- 📤 Esportazione chat
- 🔄 Streaming risposte in tempo reale

## 📁 Struttura Progetto

```
assistente-ai-completo/
├── backend/           # Server FastAPI
│   ├── server.py     # API principale
│   └── requirements.txt
├── frontend/         # Interfaccia web
│   └── index.html    # UI completa
├── config/           # Configurazioni
├── scripts/          # Script di gestione
├── docs/             # Documentazione
├── data/             # Database e dati
├── logs/             # File di log
└── static/           # File statici
```

## 🔧 API Endpoints

- `GET /` - Informazioni sistema
- `GET /api/health` - Health check
- `POST /api/chat` - Chat con AI
- `GET /api/conversations` - Lista conversazioni
- `POST /api/conversations` - Crea conversazione

## 🎯 Caratteristiche Tecniche

### Backend
- **Framework**: FastAPI con async/await
- **Database**: SQLite con SQLAlchemy-style queries
- **Streaming**: Server-Sent Events per risposte real-time
- **Monitoraggio**: Metriche CPU/RAM/Disco
- **Logging**: Strutturato con livelli configurabili

### Frontend
- **HTML5/CSS3**: Design responsive moderno
- **JavaScript**: ES6+ con async/await
- **Web APIs**: Speech Recognition, Local Storage
- **Chart.js**: Grafici matematici
- **MathJax**: Rendering formule matematiche

### AI Integration
- **Ollama**: Modelli locali per privacy
- **Prompt Engineering**: Template specializzati per matematica/finanza
- **Context Management**: Conversazioni persistenti
- **Error Handling**: Fallback e retry logic

## 🛠️ Script Disponibili

- `start.sh` - Avvio completo sistema
- `status.sh` - Monitoraggio processi e porte
- `test_system.sh` - Verifica configurazione
- `create_project.sh` - Ricostruzione progetto

## 📊 Monitoraggio

```bash
# Stato sistema
./status.sh

# Log in tempo reale
tail -f logs/backend.log
tail -f logs/frontend.log

# Test API
curl http://localhost:5000/api/health
```

## 🔒 Sicurezza

- Autenticazione API Key
- CORS configurato per sicurezza
- Input sanitization
- Rate limiting (configurabile)
- No esposizione dati sensibili

## 🐛 Troubleshooting

### Problemi Comuni

**Backend non si avvia:**
```bash
# Verifica dipendenze
cd backend && pip list | grep fastapi

# Controlla log
tail -f ../logs/backend.log
```

**Frontend non carica:**
```bash
# Verifica porta
lsof -i :8080

# Test connessione
curl -I http://localhost:8080
```

**Ollama non risponde:**
```bash
# Stato servizio
systemctl status ollama

# Riavvia
sudo systemctl restart ollama
```

**Microfono non funziona:**
- Usa Chrome/Edge
- Permetti accesso microfono nelle impostazioni browser
- Verifica dispositivi audio: `arecord -l`

## 📈 Performance

- **CPU**: Ottimizzato per sistemi multi-core
- **RAM**: ~500MB per backend + modello AI
- **Disco**: ~2GB per modello AI + dati
- **Risposta**: <2 secondi per risposte normali

## 🤝 Contributi

Il progetto è open-source. Per contribuire:

1. Fork del repository
2. Crea branch feature: `git checkout -b feature/nome`
3. Commit changes: `git commit -m 'Aggiunta feature'`
4. Push: `git push origin feature/nome`
5. Crea Pull Request

## 📄 Licenza

MIT License - Vedi file LICENSE per dettagli.

## 👨‍💻 Autore

**wildlux** - [GitHub](https://github.com/wildlux)

## 🙏 Ringraziamenti

- [FastAPI](https://fastapi.tiangolo.com/) - Framework web moderno
- [Ollama](https://ollama.ai/) - AI locale
- [Chart.js](https://www.chartjs.org/) - Grafici
- [MathJax](https://www.mathjax.org/) - Formule matematiche

---

**⭐ Se ti piace il progetto, metti un star su GitHub!**