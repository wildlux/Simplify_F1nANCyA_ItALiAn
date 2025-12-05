#!/bin/bash
# Script per creare l'intero progetto Assistente AI

echo "🚀 Creazione progetto Assistente AI..."

# Crea struttura directory
mkdir -p backend frontend config docs logs scripts data/conversations data/models static

# Backend files
cat > backend/server.py << 'EOL'
#!/usr/bin/env python3
import uvicorn
import requests
import json
import time
import logging
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "llama3.2:3b"

class ChatMessage(BaseModel):
    text: str
    mode: str = "auto"
    conversation_id: Optional[str] = None
    stream: bool = True

SYSTEM_PROMPTS = {
    "finance": "Sei un esperto consulente finanziario italiano.",
    "math": "Sei un assistente matematico.",
    "general": "Sei un assistente AI utile."
}

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"]))

@app.post("/api/chat")
async def chat(message: ChatMessage, api_key: str = Header(None, alias="api-key")):
    if not api_key or api_key not in ["demo_key_123", "admin_key_456"]:
        raise HTTPException(401, "API Key non valida")
    
    mode = message.mode if message.mode != "auto" else "general"
    sys_prompt = SYSTEM_PROMPTS.get(mode, SYSTEM_PROMPTS["general"])
    full_prompt = f"{sys_prompt}\n\nUtente: {message.text}\n\nAssistente:"
    
    if message.stream:
        def generate():
            try:
                response = requests.post(OLLAMA_URL, json={
                    "model": MODEL,
                    "prompt": full_prompt,
                    "stream": True
                }, stream=True, timeout=60)
                for line in response.iter_lines():
                    if line:
                        data = line.decode('utf-8')
                        if data.startswith('data: '):
                            try:
                                json_data = json.loads(data[6:])
                                if 'response' in json_data:
                                    yield f"data: {json.dumps({'chunk': json_data['response']})}\n\n"
                            except:
                                continue
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
        return StreamingResponse(generate(), media_type="text/event-stream")
    else:
        response = requests.post(OLLAMA_URL, json={
            "model": MODEL,
            "prompt": full_prompt,
            "stream": False
        }, timeout=60)
        return {"response": response.json().get("response", "Nessuna risposta")}

@app.get("/api/health")
async def health():
    return {"status": "healthy", "model": MODEL}

app.mount("/", StaticFiles(directory="../frontend", html=True), name="frontend")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000)
EOL

cat > backend/requirements.txt << 'EOL'
fastapi==0.104.1
uvicorn[standard]==0.24.0
requests==2.31.0
pydantic==2.5.0
EOL

# Frontend files
cat > frontend/index.html << 'EOL'
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Assistente AI</title>
    <style>
        body { font-family: monospace; background: #0f172a; color: #f1f5f9; }
        .header { background: #1e293b; padding: 1rem; border-bottom: 3px solid #4f46e5; }
        .controls { display: flex; gap: 1rem; }
        .btn { background: #334155; color: white; border: none; padding: 0.5rem 1rem; border-radius: 5px; cursor: pointer; }
        #chat { padding: 1rem; height: 70vh; overflow-y: auto; }
        .message { margin-bottom: 1rem; }
        .user { text-align: right; }
        .user .bubble { background: #4f46e5; color: white; display: inline-block; padding: 0.5rem 1rem; border-radius: 15px; }
        .ai .bubble { background: #334155; display: inline-block; padding: 0.5rem 1rem; border-radius: 15px; }
        .input-area { padding: 1rem; background: #1e293b; }
        #userInput { width: 70%; padding: 0.5rem; background: #0f172a; color: white; border: 1px solid #4f46e5; }
    </style>
</head>
<body>
    <div class="header">
        <div class="controls">
            <select id="mode">
                <option value="auto">Auto</option>
                <option value="math">Matematica</option>
                <option value="finance">Finanza</option>
            </select>
            <button class="btn" onclick="sendMessage()">Invia</button>
            <button class="btn" onclick="toggleVoice()" id="voiceBtn">🎤</button>
        </div>
    </div>
    
    <div id="chat"></div>
    
    <div class="input-area">
        <input type="text" id="userInput" placeholder="Scrivi qui..." onkeypress="if(event.key=='Enter') sendMessage()">
    </div>
    
    <script>
        let apiKey = "demo_key_123";
        
        function addMessage(text, isUser) {
            const chat = document.getElementById('chat');
            const msg = document.createElement('div');
            msg.className = `message ${isUser ? 'user' : 'ai'}`;
            msg.innerHTML = `<div class="bubble">${text}</div>`;
            chat.appendChild(msg);
            chat.scrollTop = chat.scrollHeight;
        }
        
        async function sendMessage() {
            const input = document.getElementById('userInput');
            const text = input.value.trim();
            if (!text) return;
            
            addMessage(text, true);
            input.value = '';
            
            const mode = document.getElementById('mode').value;
            
            try {
                const response = await fetch('http://localhost:5000/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'api-key': apiKey
                    },
                    body: JSON.stringify({ text, mode, stream: true })
                });
                
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let aiMessage = '';
                const aiMsgDiv = document.createElement('div');
                aiMsgDiv.className = 'message ai';
                aiMsgDiv.innerHTML = '<div class="bubble" id="streamingMsg"></div>';
                document.getElementById('chat').appendChild(aiMsgDiv);
                const bubble = document.getElementById('streamingMsg');
                
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n');
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.substring(6);
                            if (data === '[DONE]') break;
                            try {
                                const parsed = JSON.parse(data);
                                if (parsed.chunk) {
                                    aiMessage += parsed.chunk;
                                    bubble.textContent = aiMessage;
                                }
                            } catch (e) {}
                        }
                    }
                    document.getElementById('chat').scrollTop = document.getElementById('chat').scrollHeight;
                }
            } catch (error) {
                addMessage('Errore: ' + error.message, false);
            }
        }
        
        function toggleVoice() {
            if (!('webkitSpeechRecognition' in window)) {
                alert('Riconoscimento vocale non supportato');
                return;
            }
            const recognition = new webkitSpeechRecognition();
            recognition.lang = 'it-IT';
            recognition.onresult = (event) => {
                document.getElementById('userInput').value = event.results[0][0].transcript;
                sendMessage();
            };
            recognition.start();
        }
    </script>
</body>
</html>
EOL

# Config files
cat > config/config.json << 'EOL'
{
    "version": "1.0",
    "model": "llama3.2:3b",
    "api_keys": ["demo_key_123", "admin_key_456"]
}
EOL

# Scripts
cat > scripts/start.sh << 'EOL'
#!/bin/bash
echo "Avvio Assistente AI..."

# Avvia Ollama
ollama serve &
sleep 3

# Avvia backend
cd backend
python -m venv venv 2>/dev/null
source venv/bin/activate
pip install -r requirements.txt > /dev/null 2>&1
python server.py &
cd ..

# Avvia frontend
cd frontend
python -m http.server 8080 &
cd ..

echo "Sistema avviato"
echo "Frontend: http://localhost:8080"
echo "Backend: http://localhost:5000"
echo "API Key: demo_key_123"
wait
EOL
chmod +x scripts/start.sh

# Docs
cat > docs/README.md << 'EOL'
# Assistente AI

## Installazione
1. Installa Ollama: https://ollama.ai
2. Scarica modello: ollama pull llama3.2:3b
3. Avvia: ./scripts/start.sh
4. Apri: http://localhost:8080

## Uso
API Key: demo_key_123
EOL

echo "✅ Progetto creato!"
echo "Per avviare: ./scripts/start.sh"
echo "Frontend: http://localhost:8080"
