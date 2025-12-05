# 🚀 Assistente AI - Configurazione Sicura

## 🔐 Configurazione Ambiente (.env)

Questo progetto usa **python-dotenv** per gestire in sicurezza le chiavi API e le configurazioni sensibili.

### 📋 Prerequisiti

```bash
# Installa le dipendenze
pip install -r backend/requirements.txt
```

### ⚙️ Setup Configurazione

1. **Copia il file di esempio:**
```bash
cp .env.example .env
```

2. **Modifica il file `.env`** con i tuoi valori:
```bash
# Modifica questi valori!
API_KEY_DEMO=your_demo_key_here
API_KEY_ADMIN=your_admin_key_here
API_KEY_TEST=your_test_key_here

# Adatta altre configurazioni se necessario
OLLAMA_MODEL=llama3.2:3b  # o il modello che preferisci
```

3. **Avvia il server:**
```bash
./start.sh
```

### 🔑 API Keys Disponibili

Dopo la configurazione, puoi accedere con:

- **Demo**: `demo_key_123` - Accesso limitato (chat + grafici)
- **Admin**: `admin_key_456` - Accesso completo (tutto)
- **Test**: `test_key_789` - Accesso per testing (chat + grafici + code)

### 🛡️ Sicurezza

- ✅ **Chiavi API** memorizzate in `.env` (non committate su Git)
- ✅ **Variabili d'ambiente** caricate automaticamente
- ✅ **Fallback sicuri** se `.env` non esiste
- ✅ **Logging sicuro** senza esporre chiavi

### 📊 Variabili Configurabili

| Variabile | Default | Descrizione |
|-----------|---------|-------------|
| `API_KEY_DEMO` | demo_key_123 | Chiave per utenti demo |
| `API_KEY_ADMIN` | admin_key_456 | Chiave amministratore |
| `API_KEY_TEST` | test_key_789 | Chiave per testing |
| `OLLAMA_MODEL` | llama3.2:3b | Modello LLM da usare |
| `CACHE_MAX_SIZE` | 100 | Dimensione massima cache |
| `DEFAULT_CHART_3D_ENGINE` | seaborn | Motore grafici 3D |

### 🚀 Ottimizzazioni LLM

Il sistema è ottimizzato per velocità:

- **Cache intelligente** per risposte frequenti
- **Configurazione Ollama** ottimizzata per performance
- **Debouncing** richieste frontend
- **Retry automatico** in caso di errori
- **Timeout adattivi** basati sulla complessità

### 🔧 Troubleshooting

**Errore "python-dotenv non trovato":**
```bash
pip install python-dotenv
```

**API keys non funzionano:**
- Verifica che `.env` sia nella directory root
- Controlla che le variabili siano corrette
- Riavvia il server dopo modifiche

**Modello Ollama non risponde:**
- Verifica che Ollama sia in esecuzione
- Controlla `OLLAMA_URL` nel `.env`

---

## 📁 Struttura File Sicura

```
assistente-ai-completo/
├── .env                    # 🔴 NON committare (contiene chiavi)
├── .env.example           # ✅ Template configurazione
├── .gitignore             # ✅ Esclude .env da Git
├── backend/
│   ├── server.py         # ✅ Carica .env automaticamente
│   └── requirements.txt  # ✅ Include python-dotenv
└── README.md             # ✅ Questa guida
```

**Ricorda**: Il file `.env` contiene informazioni sensibili e NON deve essere committato su Git!