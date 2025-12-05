# 🤖 Assistente AI - Edizione Completa

Un assistente AI avanzato per Linux, progettato per offrire un'interfaccia intuitiva e sicura per interazioni con modelli di linguaggio locali. Supporta chat intelligente, sintesi vocale, riconoscimento audio, generazione grafici e esecuzione codice sicura, tutto in un ambiente offline-first.

## ✨ Caratteristiche Principali

- **Chat AI Avanzata**: Conversazioni con modelli Ollama (Llama 3.2, Qwen, ecc.) in modalità auto, matematica o finanza.
- **Sintesi Vocale (TTS)**: Lettura risposte con supporto italiano via speech-dispatcher.
- **Riconoscimento Vocale**: Input audio con trascrizione automatica.
- **Generazione Grafici**: Creazione di grafici 2D/3D interattivi (Matplotlib, Plotly, Chart.js).
- **Esecuzione Codice Sicura**: Sandboxing per Python, JavaScript e C++ con timeout e isolamento.
- **Notizie in Tempo Reale**: Feed RSS da fonti italiane (economia, sport).
- **Interfaccia Web Moderna**: UI responsive con temi scuri/chiari, syntax highlighting e notifiche.
- **Sicurezza Integrata**: API Key, logging audit, CORS, sandboxing esecuzione.

## 🏗️ Architettura

### Backend (Python)
- **Tecnologia**: Server HTTP leggero basato su `http.server` e `socketserver`.
- **Endpoint REST**:
  - `/api/chat`: Interazioni AI con supporto modalità.
  - `/api/transcribe`: Trascrizione audio offline/online.
  - `/api/matplotlib` / `/api/chart3d`: Generazione grafici dinamici.
  - `/api/code/execute`: Esecuzione codice sicura.
  - `/api/news`: Aggregazione notizie RSS.
- **Sicurezza**: Autenticazione API Key, logging completo, protezione injection.

### Frontend (Web)
- **Tecnologia**: HTML5/CSS3/JavaScript con librerie moderne (Chart.js, Three.js, Prism).
- **Funzionalità**: Chat dinamica, controlli vocali, visualizzazioni interattive.
- **Responsive**: Ottimizzato per desktop e mobile.

### Infrastruttura
- **AI**: Integrazione Ollama per modelli locali/offline.
- **TTS/STT**: Speech-dispatcher per sintesi offline, Web Speech API per riconoscimento.
- **Deployment**: Script automatizzato per avvio locale.

## 📦 Installazione

### Prerequisiti
- **Sistema Operativo**: Linux (Ubuntu/Debian raccomandato).
- **Python**: 3.8+ con pip.
- **Ollama**: Per modelli AI (https://ollama.ai).
- **Dipendenze Sistema**:
  ```bash
  sudo apt update
  sudo apt install python3 python3-pip speech-dispatcher espeak-ng mbrola
  ```

### Passi di Installazione
1. **Clona il Repository**:
   ```bash
   git clone https://github.com/wildlux/Simplify_F1nANCyA_ItALiAn.git
   cd Simplify_F1nANCyA_ItALiAn
   ```

2. **Installa Dipendenze Python**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configura Ollama**:
   ```bash
   ollama pull llama3.2:3b  # Modello consigliato
   ```

4. **Avvia il Sistema**:
   ```bash
   ./start.sh
   ```

5. **Accedi**:
   - Frontend: http://localhost:8080
   - API Docs: http://localhost:5008/docs (se disponibile)

## 🚀 Uso

### Guida per Principianti

Se sei nuovo, segui questi passi per iniziare:

1. **Avvia il Sistema**:
   - Apri un terminale nella cartella del progetto.
   - Esegui: `./start.sh`
   - Attendi che si avviino backend (porta 5008) e frontend (porta 8080).

2. **Accedi al Frontend**:
   - Apri il browser e vai su `http://localhost:8080`.
   - Nella schermata di login, usa la chiave demo: `demo_key_123` (o configura la tua in `.env`).

3. **Prima Chat**:
   - Nella barra in basso, scrivi: "Ciao, come stai?" e premi Invio.
   - L'AI risponderà automaticamente in modalità "Auto".
   - Cambia modalità (Auto/Matematica/Finanza) dal pulsante in alto.

4. **Usa la Voce**:
   - Abilita microfono nel browser (clicca sull'icona lucchetto nella barra URL).
   - Clicca "Voce" accanto a "Invia" per registrare.
   - Parla chiaramente; la trascrizione apparirà automaticamente.

5. **Ascolta Risposte**:
   - Dopo una risposta, clicca "Ascolta la tua voce!" per TTS.
   - Assicurati che speech-dispatcher sia attivo (vedi installazione).

6. **Prova Funzioni Avanzate**:
   - **Grafici**: Scrivi "Crea un grafico di y=x^2" per visualizzazioni.
   - **Codice**: Prova "print('Hello World')" per esecuzione sicura.
   - **Notizie**: Clicca su "Economia" o "Sport" nella sidebar per feed RSS.

7. **Personalizza**:
   - Cambia modello AI dal menu a tendina (es. Llama 3.2).
   - Esplora la sidebar per temi, esportazione chat e aiuto.

### Avvio Rapido
```bash
./start.sh
```
Inserisci API Key: `demo_key_123` (configurabile in `.env`).

### Funzionalità Principali
- **Chat**: Scrivi messaggi o usa voce; seleziona modalità (auto/matematica/finanza).
- **Voce**: Clicca "Voce" per registrare, trascrive automaticamente.
- **TTS**: Clicca "Ascolta la tua voce!" per lettura risposte.
- **Grafici**: Usa comandi come "Crea un grafico di y=x^2".
- **Codice**: Esegui snippet sicuri (es. `print("Hello")`).
- **Notizie**: Seleziona categoria per feed aggiornati.

### Configurazione Avanzata
- **Variabili Ambiente** (`.env`):
  - `API_KEY`: Chiave di accesso.
  - `SERVER_PORT`: Porta backend (default 5008).
- **Modelli AI**: Cambia in interfaccia o via Ollama.

## 🔒 Sicurezza

- **Autenticazione**: API Key obbligatoria per tutti gli endpoint.
- **Sandboxing**: Esecuzione codice isolata con timeout (10s max).
- **Logging**: Audit completo con IP e timestamp.
- **CORS**: Accesso controllato da origini autorizzate.
- **Offline-First**: Dati locali, no invio esterno senza consenso.
- **Misure Implementate**: API Key, logging audit, sandboxing esecuzione, CORS.

## 🤝 Contributi

Contributi benvenuti! Segui questi passi:
1. Fork il repository.
2. Crea un branch per la feature (`git checkout -b feature/nuova-funzione`).
3. Commit changes (`git commit -m "Aggiunta nuova funzione"`).
4. Push e apri Pull Request.

### Linee Guida
- Segui PEP8 per Python.
- Aggiungi test per nuove funzionalità.
- Documenta API e codice.

## 📄 Licenza

Questo progetto è distribuito sotto licenza MIT. Vedi `LICENSE` per dettagli.

## 📞 Supporto

- **Issues**: Segnala problemi su GitHub.
- **Documentazione**: Vedi `docs/` per guide dettagliate.
- **Versione**: 4.0 - Aggiornamenti regolari.

---

*Progettato per efficienza, sicurezza e usabilità. Sviluppato con ❤️ per la comunità AI.*
