# 🚀 GUIDA RAPIDA - Assistente AI Completo

## 📦 INSTALLAZIONE

### Prerequisiti di Sistema
Assicurati di avere installato:

- **Ubuntu/Debian Linux** (consigliato)
- **Python 3.8+**
- **Connessione internet**

### Installazione Dipendenze
```bash
# Aggiorna sistema
sudo apt update && sudo apt upgrade -y

# Installa Python e pip
sudo apt install -y python3 python3-pip python3-venv

# Installa Ollama (AI engine)
curl -fsSL https://ollama.ai/install.sh | sh

# Installa librerie TTS (sintesi vocale)
sudo apt install -y speech-dispatcher espeak-ng mbrola mbrola-it3 mbrola-en1 speech-dispatcher-espeak-ng

# Scarica modello AI consigliato
ollama pull llama3.2:3b
```

### Verifica Installazione
```bash
# Test Python
python3 --version

# Test Ollama
ollama list

# Test TTS
espeak-ng -v it "Test sintesi vocale italiana"
```

## ✅ AVVIO SISTEMA

### Primo Avvio
```bash
cd assistente-ai-completo
./start.sh
```

Lo script:
- ✅ Verifica tutte le dipendenze
- ✅ Avvia Ollama automaticamente
- ✅ Crea ambiente virtuale Python
- ✅ Installa pacchetti richiesti
- ✅ Avvia backend e frontend
- ✅ Testa sintesi vocale

### Accesso
- **Frontend**: http://localhost:8080
- **Backend**: http://localhost:5003
- **API Docs**: http://localhost:5003/docs
- **API Key**: demo_key_123

## 🎯 UTILIZZO

1. Apri http://localhost:8080 in Chrome/Edge
2. Inserisci API Key: `demo_key_123`
3. Clicca "Accedi"
4. Inizia a chattare con l'AI!

### Funzionalità Disponibili:
- 🤖 **Chat AI**: Conversazione intelligente con specializzazione matematica/finanziaria
- 🎤 **Input Vocale**: Parla per scrivere messaggi
- 🔊 **Sintesi Vocale**: Ascolta le risposte AI (italiano)
- 📊 **Grafici 2D/3D**: Generazione automatica di visualizzazioni
- 🎨 **Temi**: Dark, Light, Neon, Hacker
- 💾 **Salvataggio**: Conversazioni automatiche
- 📤 **Esportazione**: Scarica chat in TXT
- ⚙️ **Personalizzazione**: Modifica prompt e modelli AI
- 🛑 **Controllo**: Annulla richieste in corso

## 🔧 RISOLUZIONE PROBLEMI

### Verifica Stato Sistema
```bash
# Stato processi
./status.sh

# Log backend
tail -f logs/backend.log

# Log frontend
tail -f logs/frontend.log

# Riavvio completo
./start.sh
```

### Errori Comuni e Soluzioni

#### ❌ Backend non risponde
```bash
# Controlla porta 5003
netstat -tlnp | grep 5003

# Uccidi processi bloccanti
sudo lsof -ti:5003 | xargs kill -9

# Riavvia
./start.sh
```

#### 🔊 TTS non funziona
```bash
# Riavvia speech-dispatcher
sudo systemctl restart speech-dispatcher

# Test vocale
spd-say -o espeak-ng -l it "Test italiano"

# Riavvia Chrome
```

#### 🎤 Microfono non funziona
- Usa Chrome o Edge
- Vai su `chrome://settings/content/microphone`
- Permetti accesso a localhost:8080

#### 🤖 Ollama non funziona
```bash
# Verifica servizio
ollama serve &

# Lista modelli
ollama list

# Scarica modello
ollama pull llama3.2:3b
```

#### 📊 Grafici non appaiono
- Aggiorna pagina (F5)
- Controlla console browser (F12)
- Assicurati Three.js sia caricato

## 📊 MONITORAGGIO

Lo script `status.sh` monitora:
- ✅ Stato processi (backend/frontend/Ollama)
- 🌐 Porte aperte (5003/8080/11434)
- 🔗 Endpoint API funzionanti
- 💻 Uso risorse (CPU/RAM)
- 🎤 Stato TTS

## 🛑 ARRESTO SISTEMA

```bash
# Nel terminale di avvio, premi Ctrl+C
# Oppure:
pkill -f "python.*server.py"
pkill -f "ollama serve"
```

## 💡 SUGGERIMENTI AVANZATI

### Ottimizzazioni
- **Modelli AI**: Cambia modello nel menu per prestazioni diverse
- **Prompt Personalizzati**: Modifica prompt tramite Menu > Impostazioni Prompt
- **Temi**: Prova temi diversi per comfort visivo
- **Scorciatoie**: Usa Enter per inviare, Shift+Enter per andare a capo

### Sicurezza
- L'app funziona solo localmente (localhost)
- Nessun dato inviato a server esterni
- Conversazioni salvate solo sul tuo PC

### Performance
- Chiudi altri programmi pesanti durante l'uso
- Modello llama3.2:3b è ottimizzato per velocità
- TTS usa risorse minime

## 🎉 PRONTO ALL'USO!

Il tuo Assistente AI è completamente configurato e pronto.
Seguendo questa guida, non dovresti incontrare problemi.

**Buon divertimento con il tuo AI personale! 🤖✨**

---

*Per aggiornamenti o supporto: controlla i log e usa i comandi di troubleshooting sopra.*