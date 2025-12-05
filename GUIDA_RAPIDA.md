# 🚀 GUIDA RAPIDA - Assistente AI Senza Errori

## ✅ SISTEMA PRONTO

Il tuo Assistente AI è stato configurato per funzionare senza errori.
Tutti i test sono passati con successo!

## 🎯 COMANDI PRINCIPALI

### Avvio Sistema
```bash
cd assistente-ai-completo
./start.sh
```

### Verifica Stato
```bash
./status.sh
```

### Test Sistema
```bash
./test_system.sh
```

## 🌐 ACCESSO

- **Frontend**: http://localhost:8080
- **Backend**: http://localhost:5000
- **API Docs**: http://localhost:5000/docs
- **API Key**: demo_key_123

## 🎤 UTILIZZO

1. Apri http://localhost:8080
2. Inserisci API Key: `demo_key_123`
3. Clicca "Accedi"
4. Inizia a chattare!

### Funzionalità Disponibili:
- 💬 Chat con AI (matematica/finanza)
- 🎤 Riconoscimento vocale
- 🎨 Cambio tema
- 💾 Salvataggio conversazioni
- 📤 Esportazione chat

## 🔧 RISOLUZIONE PROBLEMI

### Se qualcosa non funziona:

1. **Verifica stato**:
   ```bash
   ./status.sh
   ```

2. **Controlla log**:
   ```bash
   tail -f logs/backend.log
   tail -f logs/frontend.log
   ```

3. **Riavvia sistema**:
   ```bash
   ./start.sh
   ```

### Errori Comuni:

- **Porta occupata**: Chiudi altri programmi che usano le porte 5000/8080
- **Microfono**: Usa Chrome/Edge e permetti accesso microfono
- **Ollama**: Assicurati che sia installato e funzionante

## 📊 MONITORAGGIO

Lo script `status.sh` mostra:
- Stato dei processi
- Porte aperte
- Endpoint funzionanti
- Uso risorse (CPU/RAM)

## 🛑 ARRESTO

Premi `Ctrl+C` nel terminale dove hai avviato `./start.sh`

## 💡 SUGGERIMENTI

- Usa Chrome o Edge per il riconoscimento vocale
- Le conversazioni vengono salvate automaticamente
- Puoi cambiare tema cliccando "Tema"
- Per aiuto, usa il pulsante "?" nell'interfaccia

## 🎉 PRONTO!

Il sistema è configurato per funzionare perfettamente.
Buon divertimento con il tuo Assistente AI! 🤖✨