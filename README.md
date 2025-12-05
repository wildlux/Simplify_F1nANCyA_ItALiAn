# 🤖 Assistente AI - Linux Edition

**Un assistente AI completo con riconoscimento vocale, matematica e finanza**

## 🚀 Installazione Rapida

### Prerequisiti
- Linux (Ubuntu 20.04+, Debian 11+, Arch, Fedora 34+)
- Python 3.8+
- 4GB RAM (8GB raccomandati)
- 5GB spazio disco

### 1. Installa Ollama
```bash
curl -fsSL https://ollama.ai/install.sh | sh
ollama pull llama3.2:3b
```

### 2. Installa Dipendenze
```bash
cd assistente-ai-completo/backend
pip install -r requirements.txt
```

### 3. Avvia il Sistema
```bash
cd assistente-ai-completo
./start.sh
```

### 4. Apri nel Browser
- Frontend: http://localhost:8080
- API Key: `demo_key_123`

## 🎯 Funzionalità

✅ **Modalità Auto/Math/Finance** - Rilevamento automatico del tipo di domanda
✅ **Riconoscimento Vocale** - Parla invece di scrivere (Chrome/Edge)
✅ **Streaming Risposte** - Risposte in tempo reale come ChatGPT
✅ **Database Conversazioni** - Salvataggio automatico delle chat
✅ **API REST Completa** - Endpoint per integrazioni
✅ **Interfaccia Moderna** - Design responsive e temi multipli
✅ **Sistema di Autenticazione** - API Keys per sicurezza
✅ **Monitoraggio Sistema** - Metriche di performance
✅ **Logging Strutturato** - Debug e troubleshooting

## 📁 Struttura Progetto

```
assistente-ai-completo/
├── backend/           # Server FastAPI
│   ├── server.py     # Backend principale
│   ├── requirements.txt
│   └── .env          # Configurazione
├── frontend/         # Interfaccia web
│   └── index.html    # UI completa
├── config/           # Configurazioni
│   └── config.json   # Config principale
├── scripts/          # Script di gestione
│   ├── start.sh      # Avvio principale
│   └── create_project.sh # Script creazione
├── docs/             # Documentazione
├── logs/             # File di log
├── data/             # Database e dati
└── static/           # File statici
```

## 🌐 Accesso

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:5000
- **API Docs**: http://localhost:5000/docs
- **Health Check**: http://localhost:5000/api/health

## 🔑 Credenziali

API Keys predefinite:
- `demo_key_123` - Utente dimostrazione
- `admin_key_456` - Amministratore
- `test_key_789` - Testing

## 🎤 Funzionalità Voce

### Requisiti
```bash
# Ubuntu/Debian
sudo apt install alsa-utils pulseaudio

# Arch
sudo pacman -S alsa-utils pulseaudio

# Fedora
sudo dnf install alsa-utils pulseaudio
```

### Configurazione
1. Usa Chrome/Chromium per il miglior supporto
2. Permetti accesso microfono quando richiesto
3. Clicca sull'icona 🎤 nell'interfaccia
4. Parla normalmente in italiano

## ⚡ Performance Tuning

### Ottimizza Ollama
```bash
# Modifica ~/.ollama/config.json
{
  "num_parallel": 4,
  "num_gpu_layers": 20,
  "main_gpu": 0,
  "use_mlock": true
}
```

### Ottimizza Python
```bash
export OMP_NUM_THREADS=4
export MKL_NUM_THREADS=4
export PYTHONUNBUFFERED=1
```

## 📊 Monitoraggio

```bash
# Stato sistema
./start.sh status

# Uso risorse
htop

# Log in tempo reale
tail -f logs/*.log

# Metriche backend
curl http://localhost:5000/api/health | jq .
```

## 🔧 Troubleshooting

### Ollama non si avvia
```bash
# Controlla se è in esecuzione
systemctl status ollama

# Riavvia
sudo systemctl restart ollama

# Log dettagliati
journalctl -u ollama -f
```

### Backend non risponde
```bash
# Controlla porta
sudo netstat -tlnp | grep :5000

# Verifica dipendenze
cd backend
pip list | grep fastapi

# Log errori
tail -f ../logs/backend.log
```

### Microfono non funziona
```bash
# Test hardware
arecord -l

# Test registrazione
arecord --duration=5 --format=cd test.wav
aplay test.wav

# Controlla permessi
ls -la /dev/snd/
```

## 🚀 Deployment in Produzione

### Nginx Reverse Proxy
```nginx
# /etc/nginx/sites-available/assistente-ai
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Systemd Services
```bash
# /etc/systemd/system/assistente-ai.service
[Unit]
Description=Assistente AI Service
After=network.target ollama.service

[Service]
Type=simple
User=ai-user
WorkingDirectory=/opt/assistente-ai
Environment="PATH=/opt/assistente-ai/venv/bin"
ExecStart=/opt/assistente-ai/venv/bin/python server.py
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

## 🧪 Test Rapidi

```bash
# Test Ollama
curl http://localhost:11434/api/tags

# Test Backend
curl http://localhost:5000/api/health

# Test Frontend
curl -I http://localhost:8080
```

## 📄 Licenza

MIT License - Libero uso, modifica e distribuzione.

Creato specificamente per Linux 🐧
Ottimizzato per prestazioni e semplicità

---

**Versione**: 4.0
**Data**: 2024-12-05
**Supporto**: Ubuntu 20.04+, Debian 11+, Arch, Fedora 34+