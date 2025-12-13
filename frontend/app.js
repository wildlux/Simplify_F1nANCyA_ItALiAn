// Assistente AI - Frontend JavaScript
// Versione: 4.0

const API_URL = 'http://localhost:54324';
=======
// ==================== CONFIGURAZIONE ====================
// Per accesso da cellulare, usa l'IP del computer invece di localhost
// const API_URL = 'http://localhost:54324';
const API_URL = 'http://192.168.1.165:54324';

// Rileva se è un dispositivo mobile
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const isAndroid = /Android/i.test(navigator.userAgent);

// Ottimizzazioni per Android
const API_URL = 'http://localhost:54324';
=======
if (isAndroid) {
    console.log('📱 Dispositivo Android rilevato - applico ottimizzazioni');
}====================
const API_URL = 'http://localhost:54324';====================
const API_URL = 'http://localhost:54324';
let apiKey = null;
let currentMode = 'auto';
let currentTheme = 'dark';
let isConnected = false;
let isListening = false;
let recognition = null;
let cancelController = null;
let currentModel = 'llama3.2:3b';
let chart3dEngine = localStorage.getItem('chart3dEngine') || 'seaborn';
let loadedChartData = null; // Dati caricati dal file

// 🚀 OTTIMIZZAZIONI PERFORMANCE
let requestQueue = [];
let isProcessingRequest = false;
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 500;
const MAX_RETRIES = 2;
const frontendCache = new Map();
const CACHE_SIZE = 50;
let prompts = {
    general: "Sei un assistente AI utile. Rispondi in italiano.",
    math: "Sei un assistente matematico. Mostra i calcoli.",
    finance: "Sei un consulente finanziario italiano. Rispondi in italiano.",
    develop: "Sei un assistente di programmazione esperto. Aiuta con Python, C++, JavaScript, Java e altri linguaggi. Fornisci codice ben commentato e spiegazioni chiare."
};

async function loadModels() {
    try {
        const response = await fetch(`${API_URL}/api/models`, {
            headers: {
                'X-API-Key': apiKey
            }
        });
        const data = await response.json();
        const select = document.getElementById('modelSelect');
        const currentValue = select.value; // Preserve current selection
        select.innerHTML = '';
        data.models.forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model + (model === data.recommended ? ' (consigliato)' : '');
            select.appendChild(option);
        });
        // Set to currentModel if exists, else recommended
        select.value = data.models.includes(currentModel) ? currentModel : data.recommended;
        updateModelStatus(select.value);
    } catch (e) {
        console.error('Error loading models:', e);
    }
}

// Elementi DOM
const chatContainer = document.getElementById('chatContainer');
const userInput = document.getElementById('userInput');
const connectionStatus = document.getElementById('connectionStatus');
const statusText = document.getElementById('statusText');
const userStatus = document.getElementById('userStatus');
const modelStatus = document.getElementById('modelStatus');

// ==================== INIZIALIZZAZIONE ====================
window.onload = function() {
    // Inizializza sintesi vocale
    initSpeech();

    // Carica preferenze
    loadPreferences();

    // Auto-connect se c'è API key
    if (apiKey) {
        document.getElementById('loginModal').style.display = 'none';
        connectToBackend();
    }

    // Click outside modal to close
    window.onclick = function(event) {
        const modal = document.getElementById('settingsModal');
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };

    // Setup event listeners
    setupEventListeners();

    // Focus input
    userInput.focus();
};

function loadPreferences() {
    const savedKey = localStorage.getItem('ai_api_key');
    const savedTheme = localStorage.getItem('ai_theme') || 'dark';
    const savedMode = localStorage.getItem('ai_mode') || 'auto';
    const savedModel = localStorage.getItem('ai_model') || 'llama3.2:3b';
    const savedSpeech = localStorage.getItem('speech_enabled') === 'true';
    const savedPrompts = localStorage.getItem('prompts');

    if (savedKey) {
        apiKey = savedKey;
        userStatus.textContent = 'Demo User';
    }

    currentTheme = savedTheme;
    currentMode = savedMode;
    currentModel = savedModel;
    speechEnabled = savedSpeech;

    if (savedPrompts) {
        try {
            prompts = JSON.parse(savedPrompts);
        } catch (e) {
            console.error('Error loading prompts:', e);
        }
    }

    document.getElementById('modeSelect').value = savedMode;
    updateCurrentMode(savedMode);
    document.getElementById('modelSelect').value = savedModel;

    // Applica preferenze sintesi vocale
    updateSpeechButton();

    // Carica conversazioni
    const savedConvs = localStorage.getItem('ai_conversations');
    if (savedConvs) {
        try {
            conversations = JSON.parse(savedConvs);
        } catch (e) {
            console.error('Error loading conversations:', e);
            conversations = [];
        }
    }
}

function setupEventListeners() {
    // Invio messaggio con Enter, Shift+Enter per andare a capo
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            // Invio normale: invia messaggio
            e.preventDefault();
            sendMessage();
        }
        // Shift+Enter: permette il comportamento predefinito (andare a capo)
        // Non serve preventDefault() qui perché vogliamo il comportamento naturale

        if (e.key === 'Escape' && isListening) {
            stopVoiceRecognition();
        }
    });

    // Scorrimento chat
    chatContainer.addEventListener('scroll', () => {
        // Potenziale caricamento messaggi precedenti
    });
}

async function connectToBackend() {
=======
// ==================== LEGGI API KEY DALL'URL ====================
function getApiKeyFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('api_key');
}

// Leggi API key dall'URL all'avvio
const urlApiKey = getApiKeyFromUrl();
if (urlApiKey) {
    apiKey = urlApiKey;
    localStorage.setItem('ai_api_key', urlApiKey);
    console.log('🔑 API Key trovata nell\'URL:', urlApiKey);
}

// ==================== CONNESSIONE BACKEND ====================
async function connectToBackend() {====================
async function connectToBackend() {
    updateConnectionStatus('connecting', 'Connessione in corso...');

    try {
        const response = await fetch(`${API_URL}/api/health`, {
            headers: {'X-API-Key': apiKey}
        });

        if (response.ok) {
            const data = await response.json();

            isConnected = true;
            updateConnectionStatus('online', 'Connesso');
            modelStatus.textContent = data.model || 'llama3.2:3b';

            // Carica modelli
            await loadModels();

            // Benvenuto
            setTimeout(() => {
                if (chatContainer.children.length === 0) {
                    showWelcomeMessage();
                }
            }, 500);
        } else {
            // Gestisci errori di autenticazione
            if (response.status === 401) {
                const errorData = await response.json().catch(() => ({}));
                console.error('🚫 Autenticazione fallita:', errorData);
                showNotification(`API Key non valida: ${errorData.message || 'Controlla la chiave inserita'}`, 'error');
                // Riapri modal di login
                document.getElementById('loginModal').style.display = 'flex';
                apiKey = null;
                localStorage.removeItem('ai_api_key');
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        }
    } catch (error) {
        console.error('❌ Errore connessione backend:', error);
        isConnected = false;
        updateConnectionStatus('offline', 'Errore connessione');
        showNotification(`Errore connessione: ${error.message}`, 'error');

        // Riapri modal di login in caso di errore grave
        if (error.message.includes('fetch')) {
            setTimeout(() => {
                document.getElementById('loginModal').style.display = 'flex';
            }, 2000);
        }
    }
}

function updateConnectionStatus(status, message) {
    connectionStatus.className = 'status-indicator';

    switch(status) {
        case 'online':
            connectionStatus.classList.add('status-online');
            break;
        case 'offline':
            connectionStatus.classList.add('status-offline');
            break;
        case 'connecting':
            connectionStatus.classList.add('status-connecting');
            break;
    }

    statusText.textContent = message;
}

// ==================== GESTIONE CHAT ====================
function showWelcomeMessage() {
    addMessage('ai', `
        <div style="margin-bottom: 1rem;">
            <h3 style="color: var(--primary); margin-bottom: 0.5rem;">
                <i class="fas fa-robot"></i> Benvenuto in Assistente AI!
            </h3>
            <p>Sono il tuo assistente virtuale specializzato in <strong>matematica</strong> e <strong>finanza</strong>.</p>
        </div>

        <div style="background: rgba(79, 70, 229, 0.1); padding: 1rem; border-radius: 8px; margin: 1rem 0;">
            <h4><i class="fas fa-lightbulb"></i> Cosa posso fare:</h4>
            <ul style="margin-left: 1.5rem; margin-top: 0.5rem;">
                <li><strong>Calcoli matematici</strong> complessi e spiegazioni</li>
                <li><strong>Consulenza finanziaria</strong> e fiscale</li>
                <li><strong>Grafici 2D e 3D</strong> e visualizzazioni dati</li>
                <li><strong>Analisi</strong> e risposte dettagliate</li>
                <li><strong>Input vocale</strong> (clicca 🎤 per parlare)</li>
                <li><strong>Sintesi vocale</strong> per ascoltare le risposte</li>
            </ul>
        </div>

        <div style="background: rgba(16, 185, 129, 0.1); padding: 1rem; border-radius: 8px; margin: 1rem 0;">
            <h4><i class="fas fa-keyboard"></i> Scorciatoie da tastiera:</h4>
            <ul style="margin-left: 1.5rem; margin-top: 0.5rem;">
                <li><strong>Enter</strong>: Invia messaggio</li>
                <li><strong>Shift+Enter</strong>: Vai a capo</li>
                <li><strong>Escape</strong>: Ferma input vocale (se attivo)</li>
            </ul>
            <p style="margin-top: 0.5rem; font-size: 0.9rem;">
                <strong>Per ogni risposta:</strong> usa <i class="fas fa-volume-up"></i> per ascoltare e <i class="fas fa-copy"></i> per copiare
            </p>
        </div>

        <div style="margin-top: 1.5rem;">
            <h4><i class="fas fa-bolt"></i> Prova queste domande:</h4>
            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem;">
                <button class="quick-btn" onclick="insertQuickText('Calcola l\\'area di un cerchio con raggio 5')">Calcolo base</button>
                <button class="quick-btn" onclick="insertQuickText('Spiega il sistema fiscale italiano')">Fisco</button>
                <button class="quick-btn" onclick="insertQuickText('Disegna il grafico di y=x^2')">Grafico</button>
                <button class="quick-btn" onclick="insertQuickText('Analizza questo investimento')">Investimenti</button>
            </div>
        </div>

        <p style="margin-top: 1.5rem; font-size: 0.9rem; color: var(--text-secondary);">
            <i class="fas fa-info-circle"></i> Usa i pulsanti rapidi o scrivi direttamente!
        </p>
    `);
}

function addMessage(sender, content, showTime = true) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;

    const timeStr = showTime ? new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '';

    // Charts are generated in AI responses only

    // Format content for AI messages (skip if already HTML)
    if (sender === 'ai' && !content.trim().startsWith('<')) {
        content = formatResponse(content);
    }

    // Aggiungi pulsanti per messaggi AI e User
    const actionButtons = sender === 'ai' ? `
        <div class="message-actions">
            <button class="action-btn speak-btn" onclick="speakText(this)" title="Leggi ad alta voce">
                <i class="fas fa-volume-up"></i>
            </button>
            <button class="action-btn copy-btn" onclick="copyMessage(this)" title="Copia messaggio">
                <i class="fas fa-copy"></i>
            </button>
            <button class="action-btn retry-btn" onclick="retryMessage(this)" title="Rifai domanda">
                <i class="fas fa-redo"></i>
            </button>
        </div>
    ` : `
        <div class="message-actions">
            <button class="action-btn edit-btn" onclick="editMessage(this)" title="Modifica messaggio">
                <i class="fas fa-edit"></i>
            </button>
        </div>
    `;

    messageDiv.innerHTML = `
        <div class="bubble">
            ${content}
            ${actionButtons}
            ${showTime ? `<span class="message-time">${timeStr}</span>` : ''}
        </div>
    `;

    chatContainer.appendChild(messageDiv);
    scrollToBottom();

    // Applica syntax highlighting ai nuovi messaggi
    setTimeout(highlightCode, 50);

    // Processa grafici Matplotlib
    setTimeout(processMatplotlibPlots, 100);
}

function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message ai';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `
        <div class="bubble">
            <div class="typing-indicator">
                <div class="typing-dots">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
                <span>Assistente sta scrivendo...</span>
                <button class="cancel-btn" onclick="cancelRequest()">Annulla</button>
            </div>
        </div>
    `;

    chatContainer.appendChild(typingDiv);
    scrollToBottom();
}

function hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.remove();
    }
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text || !apiKey || !isConnected) {
        showNotification('Non sei connesso al backend', 'error');
        return;
    }

    // Debouncing richieste
    const now = Date.now();
    if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
        showWarning('Rallenta! Attendi un momento tra le richieste');
        return;
    }
    lastRequestTime = now;

    // 🚀 OTTIMIZZAZIONE 2: CACHE FRONTEND
    const cacheKey = `${text}|${currentMode}|${currentModel}`;
    if (frontendCache.has(cacheKey)) {
        const cachedResponse = frontendCache.get(cacheKey);
        addMessage('user', text);
        userInput.value = '';
        addMessage('ai', '⚡ ' + cachedResponse + '\n\n*(risposta dalla cache)*');
        return;
    }

    // Aggiungi messaggio utente
    addMessage('user', text);
    userInput.value = '';

    // Controlla se è un comando di grafico 3D - gestisci localmente prima
    const chart3DHtml = await handleChart3DCommand(text);
    if (chart3DHtml) {
        // Mostra il grafico 3D generato localmente
        addMessage('ai', chart3DHtml + '\n\n🔍 Analizzo il grafico 3D per te...');

        // Poi manda all'AI per l'analisi
        await sendToAIForAnalysis(text, chart3DHtml);
        return;
    }

    // Gestione coda richieste
    if (isProcessingRequest) {
        requestQueue.push(text);
        showNotification('Richiesta in coda...', 'info');
        return;
    }
    isProcessingRequest = true;

    // Mostra indicatore typing
    showTypingIndicator();

    // Crea controller per annullare
    cancelController = new AbortController();
    const signal = cancelController.signal;

    let retryCount = 0;
    while (retryCount <= MAX_RETRIES) {
        try {
            const response = await fetch(`${API_URL}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': apiKey  // Best Practice: Header sicuro per API key
                },
                body: JSON.stringify({
                    text: text,
                    mode: currentMode,
                    model: currentModel,
                    prompts: prompts
                }),
                signal: signal
            });

            hideTypingIndicator();
            cancelController = null;

            if (!response.ok) {
                if (response.status === 429 && retryCount < MAX_RETRIES) {
                    // Rate limit - aspetta e riprova
                    retryCount++;
                    const waitTime = Math.pow(2, retryCount) * 1000; // Backoff esponenziale
                    showNotification(`Rate limit - Riprovo tra ${waitTime/1000}s...`, 'warning');
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    continue;
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            // Aggiungi risposta AI
            addMessage('ai', data.response);

            // Salva in cache
            if (frontendCache.size >= CACHE_SIZE) {
                const firstKey = frontendCache.keys().next().value;
                frontendCache.delete(firstKey);
            }
            frontendCache.set(cacheKey, data.response);

            // Post-processing risposta
            setTimeout(highlightCode, 100);
            if (speechEnabled && speechSynthesis) {
                console.log('🎵 Lettura risposta AI');
                speakText(data.response);
            }

            break; // Successo, esci dal loop di retry

        } catch (error) {
            if (retryCount < MAX_RETRIES && !error.name === 'AbortError') {
                retryCount++;
                const waitTime = Math.pow(2, retryCount) * 1000;
                showNotification(`Errore - Riprovo tra ${waitTime/1000}s... (${retryCount}/${MAX_RETRIES})`, 'warning');
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
            }

            hideTypingIndicator();
            cancelController = null;
            showNotification(`Errore dopo ${retryCount + 1} tentativi: ${error.message}`, 'error');
            addMessage('ai', `❌ Errore: ${error.message}`);
            break;
        }
    }

    isProcessingRequest = false;

    // 🚀 OTTIMIZZAZIONE 4: PROCESSA CODA RICHIESTE
    if (requestQueue.length > 0) {
        const nextRequest = requestQueue.shift();
        setTimeout(() => {
            userInput.value = nextRequest;
            sendMessage();
        }, MIN_REQUEST_INTERVAL);
    }
}

// ==================== RILEVAMENTO CODICE ====================
function detectCodeBlocks(text) {
    const lines = text.split('\n');
    const blocks = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        let language = null;
        let confidence = 0;

        // Python
        if (line.match(/^(import|from|def|class|if|for|while|try|with)\s/) ||
            line.match(/^\s*(def|class|if|for|while|try|with)/)) {
            language = 'python';
            confidence = 0.9;
        }
        // Bash
        else if (line.match(/^#!/) || line.match(/^(sudo|apt|yum|cd|ls|grep|awk|sed|curl|wget)/) ||
                 line.includes('bash') || line.includes('sh')) {
            language = 'bash';
            confidence = 0.8;
        }
        // HTML
        else if (line.match(/<\/?[a-zA-Z][^>]*>/) || line.includes('<html') || line.includes('<div')) {
            language = 'html';
            confidence = 0.8;
        }
        // CSS
        else if (line.match(/[a-zA-Z-]+\s*\{[^}]*\}/) || line.match(/\.[a-zA-Z-]+\s*\{/) ||
                 line.includes('color:') || line.includes('font-')) {
            language = 'css';
            confidence = 0.8;
        }
        // JavaScript
        else if (line.match(/(function|const|let|var|console\.|document\.)/) ||
                 line.includes('addEventListener') || line.includes('querySelector')) {
            language = 'javascript';
            confidence = 0.8;
        }
        // SQL
        else if (line.match(/\b(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|FROM|WHERE|JOIN)\b/i)) {
            language = 'sql';
            confidence = 0.8;
        }
        // JSON
        else if (line.match(/"[^"]*"\s*:/) || line.match(/^\s*[\{\[]/)) {
            language = 'json';
            confidence = 0.7;
        }

        if (language && confidence > 0.6) {
            // Trova fine blocco
            let endLine = i;
            for (let j = i + 1; j < lines.length; j++) {
                const nextLine = lines[j].trim();
                if (nextLine === '') {
                    endLine = j;
                    break;
                }
                // Se riga successiva non sembra codice, ferma
                if (!nextLine.match(/^\s*#/) &&
                    !nextLine.match(/[a-zA-Z_][a-zA-Z0-9_]*\s*[\(\{=]/) &&
                    !nextLine.match(/<\/?[a-zA-Z]/) &&
                    !nextLine.match(/[a-zA-Z-]+\s*:/) &&
                    !nextLine.match(/^\s*(def|class|if|for|while|try|with|import|from)/)) {
                    break;
                }
                endLine = j;
            }

            blocks.push({
                start: i,
                end: endLine + 1,
                language: language,
                code: lines.slice(i, endLine + 1).join('\n')
            });

            i = endLine; // Salta le righe processate
        }
    }

    return blocks;
}

// ==================== FORMATTAZIONE RISPOSTE ====================
function formatResponse(text) {
    // Converti `python ... in ```python\n...\n```
    text = text.replace(/`python (.*)/g, '```python\n$1\n```');

    // Detect and wrap code blocks automatically
    const lines = text.split('\n');
    let inCodeBlock = false;
    let codeBlock = [];
    let language = 'plaintext';
    let formattedText = '';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!inCodeBlock) {
            if (line.match(/^(def|class|import|from|if|elif|else|for|while|try|except|finally|with|return|print|pass|break|continue)/) ||
                line.match(/^\s*(def|class|import|from|if|elif|else|for|while|try|except|finally|with|return|print|pass|break|continue)/) ||
                line.match(/^[a-zA-Z_][a-zA-Z0-9_]*\s*\([^)]*\)\s*:/) || // function definitions
                line.match(/^\s*[a-zA-Z_][a-zA-Z0-9_]*\s*=\s/) || // assignments
                line.match(/^\s*#.*$/) // comments
                ) {
                inCodeBlock = true;
                language = 'python';
                codeBlock = [line];
            } else if (line.match(/^#!/) || line.match(/^(sudo|apt|yum|cd|ls|grep|awk|sed|curl|wget)/) ||
                      line.includes('bash') || line.includes('sh')) {
                inCodeBlock = true;
                language = 'bash';
                codeBlock = [line];
            } else if (line.match(/<\/?[a-zA-Z][^>]*>/) || line.includes('<html') || line.includes('<div')) {
                inCodeBlock = true;
                language = 'html';
                codeBlock = [line];
            } else if (line.match(/[a-zA-Z-]+\s*\{[^}]*\}/) || line.match(/\.[a-zA-Z-]+\s*\{/) ||
                      line.includes('color:') || line.includes('font-') || line.includes('background:')) {
                inCodeBlock = true;
                language = 'css';
                codeBlock = [line];
            } else if (line.match(/(function|const|let|var|console\.|document\.)/) ||
                      line.includes('addEventListener') || line.includes('querySelector')) {
                inCodeBlock = true;
                language = 'javascript';
                codeBlock = [line];
            } else if (line.match(/\b(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|FROM|WHERE|JOIN)\b/i)) {
                inCodeBlock = true;
                language = 'sql';
                codeBlock = [line];
            } else if (line.match(/"[^"]*"\s*:/) || line.match(/^\s*[\{\[]/)) {
                inCodeBlock = true;
                language = 'json';
                codeBlock = [line];
            } else {
                formattedText += line + '\n';
            }
        } else {
            if (line.trim() === '' && codeBlock.length > 0) {
                // End of block if empty line and we have code
                formattedText += `\`\`\`${language}\n${codeBlock.join('\n')}\n\`\`\`\n\n`;
                inCodeBlock = false;
                codeBlock = [];
                language = 'plaintext';
            } else {
                codeBlock.push(line);
            }
        }
    }

    if (inCodeBlock) {
        formattedText += `\`\`\`${language}\n${codeBlock.join('\n')}\n\`\`\`\n`;
    }

    text = formattedText;

    // Prima rileva blocchi di codice multi-linguaggio
    const codeBlocks = detectCodeBlocks(text);

    if (codeBlocks.length > 0) {
        // Sostituisci ogni blocco con ```language\ncode\n```
        let result = '';
        let lastEnd = 0;

        codeBlocks.forEach(block => {
            result += text.substring(lastEnd, block.start);
            result += `\n\`\`\`${block.language}\n${block.code}\n\`\`\`\n`;
            lastEnd = block.end;
        });

        result += text.substring(lastEnd);
        text = result;
    }

    // Escape HTML
    let formatted = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    // Markdown semplice
    formatted = formatted
        .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\\n/g, '<br>');

    // Gestisci blocchi di codice con syntax highlighting
    formatted = formatted.replace(/```(\w+)?\n?([\s\S]*?)```/g, (match, lang, code) => {
        let language = lang || detectLanguage(code.trim());
        const codeId = 'code-' + Math.random().toString(36).substr(2, 9);

        return `
            <div class="code-block">
                <div class="code-header">
                    <span class="code-language">${language}</span>
                    <button class="copy-btn" onclick="copyToClipboard('${codeId}')" title="Copia negli appunti">
                        <i class="fas fa-copy"></i> Copia
                    </button>
                </div>
                <pre class="code-content"><code id="${codeId}" class="language-${language}">${code.trim()}</code></pre>
            </div>
        `;
    });

    // Rileva e formatta espressioni matematiche
    formatted = formatted.replace(/\\$\\$([^$]+)\\$\\$/g, (match, expr) => {
        return `<div class="math-expression">${expr}</div>`;
    });

    // Rileva richieste di grafici e renderizzali
    const chartHtml = parseChartRequest(text);
    if (chartHtml) {
        formatted += chartHtml;
    }

    return formatted;
}

// ==================== COPIA NEGLI APPUNTI ====================
async function copyToClipboard(elementId) {
    const codeElement = document.getElementById(elementId);
    if (!codeElement) return;

    const text = codeElement.textContent || codeElement.innerText;

    try {
        await navigator.clipboard.writeText(text);
        showNotification('Codice copiato negli appunti!', 'success');

        // Animazione del pulsante
        const btn = event.target.closest('.copy-btn');
        if (btn) {
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i> Copiato!';
            btn.style.background = '#10b981';

            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.background = '';
            }, 2000);
        }
    } catch (err) {
        console.error('Errore copia:', err);
        // Fallback per browser più vecchi
        fallbackCopyTextToClipboard(text);
    }
}

function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;

    // Evita scrolling alla fine della pagina
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showNotification('Codice copiato negli appunti!', 'success');
        } else {
            showNotification('Errore nella copia', 'error');
        }
    } catch (err) {
        showNotification('Browser non supporta la copia automatica', 'warning');
    }

    document.body.removeChild(textArea);
}

// ==================== RILEVAMENTO LINGUAGGIO ====================
function detectLanguage(code) {
    const patterns = {
        python: /\b(def|class|import|from|if __name__|print)\b/,
        javascript: /\b(function|const|let|var|console\.|document\.|window\.)\b/,
        bash: /\b(echo|cd|ls|grep|awk|sed|curl|wget|sudo|apt|yum|pacman)\b/,
        sql: /\b(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|FROM|WHERE|JOIN)\b/i,
        css: /(\{[^}]*\}|\.[a-zA-Z-]+\s*\{|#[a-zA-Z-]+\s*\{)/,
        html: /<\/?[a-zA-Z][^>]*>/,
        json: /"[^"]*"\s*:/,
        java: /\b(public|private|class|import|System\.|String|void)\b/,
        cpp: /\b(#include|cout|cin|std::|namespace)\b/,
        php: /<\?php|\$[a-zA-Z_]/,
        ruby: /\b(def|end|class|puts|require)\b/,
        go: /\b(func|package|import|fmt\.|main)\b/
    };

    for (const [lang, pattern] of Object.entries(patterns)) {
        if (pattern.test(code)) {
            return lang;
        }
    }

    return 'plaintext';
}

// ==================== RENDERING GRAFICI ====================
function renderChart(chartData, chartType = 'line') {
    // Usa Matplotlib come in JupyterLab
    const plotId = 'plot-' + Math.random().toString(36).substr(2, 9);
    return `<div class="matplotlib-plot" id="${plotId}" data-type="${chartType}" data-data='${JSON.stringify(chartData)}' style="text-align: center; margin: 1rem 0;">
        <div style="padding: 2rem; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface);">
            <i class="fas fa-chart-line"></i> Generazione grafico...
        </div>
    </div>`;
}

// ==================== PARSING RICHIESTE GRAFICI ====================
function parseChartRequest(text) {
    // Salta se la risposta contiene già codice
    if (text.includes('```') || text.includes('`python') || text.includes('`javascript') ||
        text.includes('`bash') || text.includes('`html') || text.includes('`css') ||
        text.includes('`sql') || text.includes('`json')) {
        return null;
    }
    // Cerca pattern per richieste di grafici 3D
    const chart3dPatterns = [
        /crea un grafico 3d (superficie|surface|scatter|parametrica|parametric).*?(?:con|di)?(?:.*?funzione:?)?(.+)?/i,
        /disegna un grafico 3d (superficie|surface|scatter|parametrica|parametric).*?(?:con|di)?(?:.*?funzione:?)?(.+)?/i,
        /mostra un grafico 3d (superficie|surface|scatter|parametrica|parametric).*?(?:con|di)?(?:.*?funzione:?)?(.+)?/i,
        /grafico 3d (superficie|surface|scatter|parametrica|parametric).*?(?:con|di)?(?:.*?funzione:?)?(.+)?/i
    ];

    for (const pattern of chart3dPatterns) {
        const match = text.match(pattern);
        if (match) {
            const chartType = match[1].toLowerCase();
            const params = match[2] ? match[2].trim() : '';

            let typeMap = {
                'superficie': 'surface',
                'surface': 'surface',
                'scatter': 'scatter',
                'parametrica': 'parametric',
                'parametric': 'parametric'
            };

            const mappedType = typeMap[chartType] || 'surface';

            // Estrai parametri dalla stringa se presente
            let chartParams = {};
            if (params) {
                // Prova a estrarre funzione per superficie
                const funcMatch = params.match(/z?\s*=\s*([^,]+)/i);
                if (funcMatch && mappedType === 'surface') {
                    chartParams.func_str = funcMatch[1].trim();
                }
                // Per parametrico, estrai x=, y=, z=
                if (mappedType === 'parametric') {
                    const xMatch = params.match(/x\s*=\s*([^,]+)/i);
                    const yMatch = params.match(/y\s*=\s*([^,]+)/i);
                    const zMatch = params.match(/z\s*=\s*([^,]+)/i);
                    if (xMatch) chartParams.func_x = xMatch[1].trim();
                    if (yMatch) chartParams.func_y = yMatch[1].trim();
                    if (zMatch) chartParams.func_z = zMatch[1].trim();
                }
            }

            return generate3DChart(mappedType, chartParams);
        }
    }

    // Pattern per grafici 2D semplici (y = f(x))
    const simpleFuncPattern = /grafico di y\s*=\s*([^\s,]+)/i;
    const match = text.match(simpleFuncPattern);
    if (match) {
        const func = match[1].trim();
        const data = generateFunctionData(func);
        if (data) return renderChart(data, 'line');
    }

    // Pattern per "creami un grafico" - default cartesiano
    const simpleChartPattern = /creami un grafico/i;
    if (simpleChartPattern.test(text)) {
        // Default a grafico cartesiano (linea) con dati di esempio
        const defaultData = {
            labels: ['Punto 1', 'Punto 2', 'Punto 3', 'Punto 4', 'Punto 5'],
            datasets: [{
                label: 'Valori',
                data: [10, 25, 15, 30, 20],
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.1,
                fill: false
            }]
        };
        return renderChart(defaultData, 'line');
    }

    // Cerca pattern per richieste di grafici 2D
    const chartPatterns = [
        /crea un grafico (linee|barre|torta|dispersione|scatter).*?con dati:?(.+)/i,
        /disegna un grafico (linee|barre|torta|dispersione|scatter).*?con:?(.+)/i,
        /mostra un grafico (linee|barre|torta|dispersione|scatter).*?dei dati:?(.+)/i,
        /grafico (linee|barre|torta|dispersione|scatter).*?:(.+)/i
    ];

    for (const pattern of chartPatterns) {
        const match = text.match(pattern);
        if (match) {
            const chartType = match[1].toLowerCase();
            const dataText = match[2];

            try {
                // Prova a parsare i dati come JSON
                const chartData = JSON.parse(dataText.trim());

                // Mappa i tipi di grafico
                const typeMap = {
                    'linee': 'line',
                    'barre': 'bar',
                    'torta': 'pie',
                    'dispersione': 'scatter',
                    'scatter': 'scatter'
                };

                const mappedType = typeMap[chartType] || 'line';

                return renderChart(chartData, mappedType);
            } catch (e) {
                console.log('Impossibile parsare dati grafico:', e);
            }
        }
    }

    return null;
}

// ==================== GENERAZIONE DATI FUNZIONE ====================
function generateFunctionData(func) {
    try {
        // Crea array di x da -10 a 10
        const xValues = [];
        const yValues = [];
        for (let i = -20; i <= 20; i++) {
            const x = i * 0.5; // Passo 0.5
            xValues.push(x);

            // Valuta la funzione in modo sicuro
            let y = 0;
            try {
                // Sostituisci x con il valore
                const expression = func.replace(/x/g, `(${x})`);
                // Usa eval con funzioni matematiche
                y = eval(expression.replace(/sin\(/g, 'Math.sin(')
                                   .replace(/cos\(/g, 'Math.cos(')
                                   .replace(/tan\(/g, 'Math.tan(')
                                   .replace(/sqrt\(/g, 'Math.sqrt(')
                                   .replace(/exp\(/g, 'Math.exp(')
                                   .replace(/log\(/g, 'Math.log(')
                                   .replace(/\^/g, '**'));
            } catch (e) {
                console.log('Errore valutazione funzione:', e);
                return null;
            }
            yValues.push(y);
        }

        return {
            labels: xValues.map(x => x.toFixed(1)),
            datasets: [{
                label: `y = ${func}`,
                data: yValues,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.1,
                fill: false
            }]
        };
    } catch (e) {
        console.log('Errore generazione dati funzione:', e);
        return null;
    }
}

// ==================== STAMPA GRAFICI ====================
function printChart(buttonElement) {
    const chartContainer = buttonElement.closest('.chart-container');
    if (chartContainer) {
        // Crea una finestra di stampa temporanea
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Grafico - Assistente AI</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .chart-container { border: 1px solid #ccc; padding: 10px; margin: 10px 0; }
                        canvas { max-width: 100%; height: auto; }
                    </style>
                </head>
                <body>
                    <h2>Grafico generato da Assistente AI</h2>
                    ${chartContainer.innerHTML}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }
}

// ==================== GENERAZIONE GRAFICI AUTOMATICA ====================
function generateSampleChart(type = 'line') {
    const sampleData = {
        labels: ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno'],
        datasets: [{
            label: 'Vendite 2024',
            data: [12, 19, 3, 5, 2, 3],
            backgroundColor: [
                'rgba(255, 99, 132, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)',
                'rgba(75, 192, 192, 0.2)',
                'rgba(153, 102, 255, 0.2)',
                'rgba(255, 159, 64, 0.2)'
            ],
            borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)'
            ],
            borderWidth: 1
        }]
    };

    return renderChart(sampleData, type);
}

// ==================== GRAFICI 3D ====================
function render3DChart(chartData) {
    const chartId = 'chart3d-' + Math.random().toString(36).substr(2, 9);
    const containerHtml = `<div id="${chartId}" class="chart3d-container" style="width: 100%; height: 400px; margin: 1rem 0; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface);"></div>`;

    // Crea il grafico 3D dopo un breve delay
    setTimeout(() => {
        const container = document.getElementById(chartId);
        if (!container) return;

        // Inizializza Three.js
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setClearColor(0xffffff, 1);
        container.appendChild(renderer.domElement);

        // Aggiungi luci
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        scene.add(directionalLight);

        // Aggiungi controlli orbitali
        const controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;

        // Crea geometria basata sul tipo
        if (chartData.type === 'surface') {
            create3DSurface(scene, chartData);
        } else if (chartData.type === 'scatter3d') {
            create3DScatter(scene, chartData);
        } else if (chartData.type === 'parametric3d') {
            create3DParametric(scene, chartData);
        }

        // Posiziona camera
        camera.position.set(5, 5, 5);
        controls.update();

        // Aggiungi griglia
        const gridHelper = new THREE.GridHelper(10, 10);
        scene.add(gridHelper);

        // Aggiungi assi
        const axesHelper = new THREE.AxesHelper(5);
        scene.add(axesHelper);

        // Funzione di animazione
        function animate() {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        }
        animate();

        // Gestisci resize
        window.addEventListener('resize', () => {
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        });

    }, 100);

    return `<div class="chart-container" style="margin: 1rem 0; padding: 1rem; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface);">
        <h4 style="margin-bottom: 0.5rem;">${chartData.title || 'Grafico 3D'}</h4>
        ${containerHtml}
        <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.5rem;">
            Usa il mouse per ruotare, zoomare e spostare la vista 3D
        </p>
        <div style="margin-top: 0.5rem; text-align: center;">
            <button class="btn btn-secondary" onclick="printChart(this)" style="font-size: 0.8rem; padding: 0.3rem 0.6rem;">
                <i class="fas fa-print"></i> Stampa
            </button>
        </div>
    </div>`;
}

function create3DSurface(scene, data) {
    const geometry = new THREE.PlaneGeometry(10, 10, data.x.length - 1, data.y.length - 1);
    const vertices = geometry.attributes.position.array;

    // Modifica i vertici Z basandosi sui dati
    for (let i = 0; i < data.z.length; i++) {
        for (let j = 0; j < data.z[i].length; j++) {
            const vertexIndex = (i * data.z[i].length + j) * 3 + 2;
            if (vertexIndex < vertices.length) {
                vertices[vertexIndex] = data.z[i][j] * 0.1; // Scala per visibilità
            }
        }
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();

    const material = new THREE.MeshLambertMaterial({
        color: 0x4CAF50,
        side: THREE.DoubleSide,
        wireframe: false
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Aggiungi wireframe
    const wireframeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true });
    const wireframeMesh = new THREE.Mesh(geometry, wireframeMaterial);
    scene.add(wireframeMesh);
}

function create3DScatter(scene, data) {
    const points = [];
    for (let i = 0; i < data.x.length; i++) {
        points.push(new THREE.Vector3(data.x[i], data.y[i], data.z[i]));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.PointsMaterial({
        color: 0xff0000,
        size: 0.1,
        vertexColors: false
    });
    const pointCloud = new THREE.Points(geometry, material);
    scene.add(pointCloud);
}

function create3DParametric(scene, data) {
    const points = [];
    for (let i = 0; i < data.x.length; i++) {
        points.push(new THREE.Vector3(data.x[i], data.y[i], data.z[i]));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: 0x0000ff, linewidth: 2 });
    const line = new THREE.Line(geometry, material);
    scene.add(line);
}

async function generate3DChart(type = 'surface', customParams = {}) {
    try {
        // Parametri predefiniti per tipo
        let defaultParams = {};
        if (type === 'surface') {
            defaultParams = {
                func_str: customParams.func_str || 'x**2 + y**2',
                x_range: [-3, 3],
                y_range: [-3, 3],
                points: 30
            };
        } else if (type === 'scatter') {
            defaultParams = {
                points: 200
            };
        } else if (type === 'parametric') {
            defaultParams = {
                func_x: 'cos(t)',
                func_y: 'sin(t)',
                func_z: 't/2',
                t_range: [0, 4*3.14159],
                points: 200
            };
        }

        // Unisci parametri personalizzati con quelli predefiniti
        const params = { ...defaultParams, ...customParams };

        const response = await fetch(`${API_URL}/api/chart3d`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: type,
                params: params
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
            return `<div class="error-message">Errore nel grafico 3D: ${data.error}</div>`;
        }

        return render3DChart(data.chart3d);

    } catch (error) {
        console.error('Errore generazione grafico 3D:', error);
        return `<div class="error-message">Errore nella generazione del grafico 3D: ${error.message}</div>`;
    }
}

// ==================== PROCESSA GRAFICI MATPLOTLIB ====================
async function processMatplotlibPlots() {
    const plots = document.querySelectorAll('.matplotlib-plot');
    for (const plot of plots) {
        if (plot.dataset.processed) continue;

        const plotType = plot.dataset.type;
        const plotData = JSON.parse(plot.dataset.data || '{}');

        try {
            const response = await fetch(`${API_URL}/api/matplotlib`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: plotType, data: plotData })
            });

            if (response.ok) {
                const result = await response.json();
                plot.innerHTML = `
                    <img src="${result.image}" alt="Grafico ${plotType}" style="max-width: 100%; height: auto; border: 1px solid var(--border); border-radius: var(--radius);">
                    <div style="margin-top: 0.5rem; text-align: center;">
                        <button class="btn btn-secondary" onclick="printMatplotlibChart('${result.image}')" style="font-size: 0.8rem; padding: 0.3rem 0.6rem;">
                            <i class="fas fa-print"></i> Stampa
                        </button>
                    </div>
                `;
            } else {
                plot.innerHTML = '<div style="color: var(--danger);">Errore caricamento grafico</div>';
            }
        } catch (e) {
            plot.innerHTML = '<div style="color: var(--danger);">Errore caricamento grafico</div>';
        }

        plot.dataset.processed = 'true';
    }
}

// ==================== STAMPA GRAFICI MATPLOTLIB ====================
function printMatplotlibChart(imageSrc) {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Grafico - Assistente AI</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    img { max-width: 100%; height: auto; }
                </style>
            </head>
            <body>
                <h2>Grafico generato con Matplotlib</h2>
                <img src="${imageSrc}" alt="Grafico">
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// ==================== HIGHLIGHT CODICE ====================
function highlightCode() {
    // Applica Prism.js highlighting a tutti i blocchi di codice
    if (typeof Prism !== 'undefined') {
        Prism.highlightAll();
    }
}

// ==================== INPUT VOCALE ====================
function toggleVoice() {
    if (!isListening) {
        startVoiceRecognition();
    } else {
        stopVoiceRecognition();
    }
}

function startVoiceRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showNotification('Riconoscimento vocale non supportato nel tuo browser', 'error');
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();

    recognition.lang = 'it-IT';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
        isListening = true;
        document.getElementById('voiceIcon').innerHTML = '<i class="fas fa-microphone-slash"></i>';
        document.getElementById('voiceText').textContent = 'Ascoltando...';
        showNotification('🎤 Ascoltando... parla ora', 'info');
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        userInput.value = transcript;
        showNotification(`📝 Trascritto: "${transcript}"`, 'success');

        // Auto-invia dopo 1 secondo
        setTimeout(() => {
            sendMessage();
        }, 1000);
    };

    recognition.onerror = (event) => {
        console.error('Voice recognition error:', event.error);
        let errorMsg = 'Errore riconoscimento vocale';
        if (event.error === 'network') {
            errorMsg += ': Controlla connessione internet';
        } else {
            errorMsg += `: ${event.error}`;
        }
        showNotification(errorMsg, 'error');
        stopVoiceRecognition();
    };

    recognition.onend = () => {
        stopVoiceRecognition();
    };

    recognition.start();
}

function stopVoiceRecognition() {
    // Since we use timeout, stop is not needed, but reset UI
    isListening = false;
    document.getElementById('voiceIcon').innerHTML = '<i class="fas fa-microphone"></i>';
    document.getElementById('voiceText').textContent = 'Voce';
}

// ==================== TEXT-TO-SPEECH ====================
let speechEnabled = false;
let speechSynthesis = null;

function initSpeech() {
    if ('speechSynthesis' in window) {
        speechSynthesis = window.speechSynthesis;
        console.log('✅ Text-to-Speech supportato');

        // Log voci quando caricate
        speechSynthesis.onvoiceschanged = () => {
            const voices = speechSynthesis.getVoices();
            console.log('Voci disponibili:', voices.map(v => `${v.lang}: ${v.name}`));
            if (voices.length === 0) {
                console.warn('Nessuna voce TTS trovata - uso default');
                showNotification('Voci TTS non caricate. Riavvia Chrome e speech-dispatcher per abilitarle', 'info');
            }
        };

        // Abilita automaticamente la sintesi vocale per una migliore UX
        speechEnabled = localStorage.getItem('speech_enabled') !== 'false'; // Default true
        updateSpeechButton();
    } else {
        console.warn('⚠️ Text-to-Speech non supportato in questo browser');
        speechEnabled = false;
        // Disabilita il pulsante se non supportato
        const speechBtn = document.getElementById('speechBtn');
        if (speechBtn) {
            speechBtn.disabled = true;
            speechBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
            speechBtn.title = 'Sintesi vocale non supportata';
        }
    }
}

function updateSpeechButton() {
    const speechBtn = document.getElementById('speechBtn');
    const speechToggleBtn = document.getElementById('speechToggleBtn');

    if (speechEnabled) {
        if (speechBtn) {
            speechBtn.innerHTML = '<i class="fas fa-volume-up"></i> Abilitata';
            speechBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        }
        if (speechToggleBtn) {
            speechToggleBtn.innerHTML = '<i class="fas fa-volume-up"></i> Muto';
        }
    } else {
        if (speechBtn) {
            speechBtn.innerHTML = '<i class="fas fa-volume-mute"></i> Disabilitata';
            speechBtn.style.background = '';
        }
        if (speechToggleBtn) {
            speechToggleBtn.innerHTML = '<i class="fas fa-volume-up"></i> Leggi';
        }
    }
}

function toggleSpeech() {
    speechEnabled = !speechEnabled;
    updateSpeechButton();

    if (speechEnabled) {
        showNotification('Lettura vocale attivata', 'success');
    } else {
        stopSpeech();
        showNotification('Lettura vocale disattivata', 'info');
    }

    localStorage.setItem('speech_enabled', speechEnabled);
}

function speakText(text, lang = 'it-IT') {
    if (!speechEnabled || !speechSynthesis) return;

    // Ferma eventuali letture in corso
    stopSpeech();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9;  // Velocità leggermente più lenta per chiarezza
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Seleziona una voce italiana se disponibile
    const voices = speechSynthesis.getVoices();
    if (voices.length > 0) {
        const italianVoice = voices.find(voice => voice.lang.startsWith('it'));
        if (italianVoice) {
            utterance.voice = italianVoice;
            console.log('🎵 Voce italiana selezionata:', italianVoice.name);
        } else {
            console.log('⚠️ Nessuna voce italiana trovata, provo con inglese');
            utterance.lang = 'en-US';
            const englishVoice = voices.find(voice => voice.lang.startsWith('en'));
            if (englishVoice) {
                utterance.voice = englishVoice;
                console.log('🎵 Voce inglese selezionata:', englishVoice.name);
            } else {
                console.log('⚠️ Nessuna voce inglese trovata, uso predefinita');
            }
        }
    } else {
        console.log('⚠️ Nessuna voce disponibile, uso predefinita italiana');
        utterance.lang = 'it-IT';
    }

    // Gestisci gli eventi
    utterance.onstart = () => {
        console.log('🎵 Lettura vocale iniziata');
        // Aggiungi classe per animazione
        const speechBtn = document.getElementById('speechBtn');
        if (speechBtn) {
            speechBtn.classList.add('speaking');
        }
    };

    utterance.onend = () => {
        console.log('🎵 Lettura vocale completata');
        // Rimuovi classe animazione
        const speechBtn = document.getElementById('speechBtn');
        if (speechBtn) {
            speechBtn.classList.remove('speaking');
        }
    };

    utterance.onerror = (event) => {
        console.error('❌ Errore lettura vocale:', event.error);
        // Rimuovi classe animazione in caso di errore
        const speechBtn = document.getElementById('speechBtn');
        if (speechBtn) {
            speechBtn.classList.remove('speaking');
        }
    };

    speechSynthesis.speak(utterance);
}

function stopSpeech() {
    if (speechSynthesis) {
        speechSynthesis.cancel();
    }
}

function testSpeech() {
    if (!speechSynthesis) {
        showNotification('Sintesi vocale non supportata in questo browser', 'error');
        return;
    }

    const testText = "TEST";
    speakText(testText);
    showNotification('Test sintesi vocale avviato', 'info');
}

// ==================== AZIONI MESSAGGI ====================
function speakText(buttonElement) {
    if (!speechSynthesis) {
        showNotification('Sintesi vocale non supportata', 'error');
        return;
    }

    // Assicurati che buttonElement sia il button
    if (buttonElement.tagName !== 'BUTTON') {
        buttonElement = buttonElement.parentElement;
    }
    if (!buttonElement || buttonElement.tagName !== 'BUTTON') return;

    // Trova il contenuto del messaggio
    const bubble = buttonElement.parentElement.parentElement;
    const messageContent = bubble.querySelector('.message-content') ||
                          bubble.querySelector('.typing-indicator') ||
                          bubble;

    // Estrai solo il testo, escludendo HTML e pulsanti
    let textToSpeak = '';

    // Rimuovi gli elementi dei pulsanti e timestamp dal testo da leggere
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = messageContent.innerHTML;

    // Rimuovi i pulsanti e timestamp
    const actionsToRemove = tempDiv.querySelectorAll('.message-actions, .message-time');
    actionsToRemove.forEach(el => el.remove());

    // Estrai testo pulito
    textToSpeak = tempDiv.textContent || tempDiv.innerText || '';

    // Rimuovi caratteri speciali e emoji, sostituisci newlines con spazi
    textToSpeak = textToSpeak.replace(/[^\w\sàèéìòùÀÈÉÌÒÙ.,!?-]/g, '').replace(/\n/g, ' ').trim();

    if (!textToSpeak) {
        showNotification('Nessun testo da leggere', 'warning');
        return;
    }

    // Ferma eventuali sintesi in corso
    stopSpeech();

    // Crea e avvia la sintesi
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'it-IT'; // Italiano
    utterance.rate = 0.9; // Velocità leggermente ridotta
    utterance.pitch = 1; // Tono normale
    utterance.volume = 0.8; // Volume leggermente ridotto

    // Gestisci gli eventi
    utterance.onstart = () => {
        buttonElement.innerHTML = '<i class="fas fa-stop"></i>';
        buttonElement.title = 'Ferma lettura';
        buttonElement.onclick = () => stopSpeechFromButton(buttonElement);
    };

    utterance.onend = () => {
        buttonElement.innerHTML = '<i class="fas fa-volume-up"></i>';
        buttonElement.title = 'Leggi ad alta voce';
        buttonElement.onclick = () => speakText(buttonElement);
    };

    utterance.onerror = (event) => {
        console.error('Errore sintesi vocale:', event);
        buttonElement.innerHTML = '<i class="fas fa-volume-up"></i>';
        buttonElement.title = 'Leggi ad alta voce';
        buttonElement.onclick = () => speakText(buttonElement);
        showNotification('Errore nella sintesi vocale', 'error');
    };

    speechSynthesis.speak(utterance);
}

function stopSpeechFromButton(buttonElement) {
    stopSpeech();
    buttonElement.innerHTML = '<i class="fas fa-volume-up"></i>';
    buttonElement.title = 'Leggi ad alta voce';
    buttonElement.onclick = () => speakText(buttonElement);
}



function retryMessage(buttonElement) {
    // Trova il messaggio AI corrente
    const aiMessageDiv = buttonElement.closest('.message.ai');
    if (!aiMessageDiv) {
        showNotification('Errore: messaggio AI non trovato', 'error');
        return;
    }

    // Trova il messaggio utente precedente
    const allMessages = document.querySelectorAll('.message');
    let userMessageText = null;

    for (let i = 0; i < allMessages.length; i++) {
        if (allMessages[i] === aiMessageDiv) {
            // Il messaggio precedente dovrebbe essere quello dell'utente
            if (i > 0 && allMessages[i - 1].classList.contains('user')) {
                const userMessageContent = allMessages[i - 1].querySelector('.message-content');
                if (userMessageContent) {
                    userMessageText = userMessageContent.innerText ||
                                    userMessageContent.textContent ||
                                    userMessageContent.innerHTML.replace(/<[^>]*>/g, '');
                    break;
                }
            }
        }
    }

    if (!userMessageText || userMessageText.trim() === '') {
        showNotification('Nessun messaggio utente trovato da ripetere', 'warning');
        return;
    }

    // Rimuovi il messaggio AI corrente (opzionale, o lascialo per confronto)
    aiMessageDiv.remove();

    // Inserisci il testo nel campo input e invia
    userInput.value = userMessageText.trim();
    sendMessage();

    showNotification('Domanda ripetuta all\'AI', 'info');
}

function copyMessage(buttonElement) {
    if (!buttonElement || buttonElement.tagName !== 'BUTTON') return;

    // Trova il contenuto del messaggio
    const bubble = buttonElement.parentElement.parentElement;
    const messageContent = bubble.querySelector('.message-content') ||
                          bubble.querySelector('.typing-indicator') ||
                          bubble;

    // Estrai solo il testo, escludendo HTML e pulsanti
    let textToCopy = '';

    // Rimuovi gli elementi dei pulsanti e timestamp dal testo da copiare
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = messageContent.innerHTML;

    // Rimuovi i pulsanti e timestamp
    const actionsToRemove = tempDiv.querySelectorAll('.message-actions, .message-time');
    actionsToRemove.forEach(el => el.remove());

    // Estrai testo pulito
    textToCopy = tempDiv.textContent || tempDiv.innerText || '';

    if (!textToCopy.trim()) {
        showNotification('Nessun testo da copiare', 'warning');
        return;
    }

    // Copia negli appunti
    navigator.clipboard.writeText(textToCopy.trim()).then(() => {
        // Feedback visivo
        const originalIcon = buttonElement.innerHTML;
        buttonElement.innerHTML = '<i class="fas fa-check"></i>';
        buttonElement.style.color = 'var(--success)';

        setTimeout(() => {
            buttonElement.innerHTML = originalIcon;
            buttonElement.style.color = '';
        }, 1000);

        showSuccess('Messaggio copiato negli appunti!');
    }).catch(err => {
        console.error('Errore copia:', err);
        showNotification('Errore nella copia del messaggio', 'error');
    });
}

// ==================== MODIFICA MESSAGGI ====================
function editMessage(buttonElement) {
    // Trova il contenuto del messaggio
    const bubble = buttonElement.parentElement.parentElement;
    const messageContent = bubble.querySelector('.bubble');

    // Estrai testo pulito
    let textToEdit = messageContent.textContent || messageContent.innerText || '';

    // Rimuovi timestamp se presente
    textToEdit = textToEdit.replace(/\d{1,2}:\d{2}/, '').trim();

    // Inserisci nel campo input
    userInput.value = textToEdit;
    userInput.focus();
    userInput.select(); // Seleziona tutto per facilitare la modifica

    // Scorri al campo input
    userInput.scrollIntoView({ behavior: 'smooth' });

    showNotification('Messaggio caricato nel campo input per modifica', 'info');
}

// ==================== MODAL NOTIZIE ====================
function showNewsModal() {
    document.getElementById('newsModal').style.display = 'flex';
}

function closeNewsModal() {
    document.getElementById('newsModal').style.display = 'none';
}

// ==================== CARICAMENTO NOTIZIE ====================
async function loadNews(category = 'economia') {
    // Aggiorna pulsanti attivi
    document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
    if (category === 'economia') document.getElementById('btnEconomia').classList.add('active');
    else if (category === 'sport') document.getElementById('btnSport').classList.add('active');
    else if (category === 'generale') document.getElementById('btnGenerale').classList.add('active');
    else if (category === 'all') document.getElementById('btnAll').classList.add('active');

    const newsContent = document.getElementById('newsContent');
    newsContent.innerHTML = '<div style="text-align: center;"><i class="fas fa-spinner fa-spin"></i> Caricamento notizie...</div>';

    try {
        const response = await fetch(`${API_URL}/api/news/${category}`, {
            headers: {
                'X-API-Key': apiKey
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        displayNews(data.news, category);
    } catch (error) {
        newsContent.innerHTML = `<div class="error-message">Errore nel caricamento delle notizie: ${error.message}</div>`;
    }
}

// Mantieni compatibilità con la vecchia funzione
async function loadFinancialNews() {
    return loadNews('economia');
}

function displayNews(news, category = 'economia') {
    const newsContent = document.getElementById('newsContent');

    if (!news || news.length === 0) {
        newsContent.innerHTML = '<p>Nessuna notizia disponibile al momento.</p>';
        return;
    }

    const categoryEmoji = {
        'economia': '📰',
        'sport': '⚽',
        'generale': '🌍',
        'all': '📄'
    };

    let html = `<div class="news-header">
        <h3>${categoryEmoji[category] || '📰'} Notizie ${category.charAt(0).toUpperCase() + category.slice(1)} - ${news.length} articoli</h3>
    </div>`;

    html += '<div class="news-list">';
    news.forEach(item => {
        const categoryIcon = item.category === 'economia' ? '💰' : item.category === 'sport' ? '⚽' : item.category === 'generale' ? '🌍' : '📰';
        html += `
            <div class="news-item">
                <h4><a href="${item.link}" target="_blank">${item.title}</a> <span class="category-badge">${categoryIcon}</span></h4>
                <p class="news-meta">${item.source} - ${item.date}</p>
                <p class="news-summary">${item.summary || 'Nessun riassunto disponibile'}</p>
            </div>
        `;
    });
    html += '</div>';

    newsContent.innerHTML = html;
}

// ==================== TOGGLE AZIONI RAPIDE ====================
function toggleQuickActions() {
    const quickActions = document.querySelectorAll('.quick-actions .quick-btn:not(.always-visible)');
    const toggleBtn = document.getElementById('toggleActionsBtn');
    const isHidden = quickActions[0] && quickActions[0].style.display === 'none';

    quickActions.forEach(btn => {
        btn.style.display = isHidden ? 'inline-block' : 'none';
    });

    if (toggleBtn) {
        toggleBtn.innerHTML = isHidden ?
            '<i class="fas fa-eye-slash"></i> Nascondi' :
            '<i class="fas fa-eye"></i> Mostra';
    }
}

// ==================== UTILITIES ====================
function showNotification(message, type = 'info') {
    const existing = document.querySelectorAll('.notification');
    existing.forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;

    const icons = {'success': '✓', 'error': '✗', 'warning': '⚠', 'info': 'ℹ'};
    notification.innerHTML = `
        <span class="notification-icon">${icons[type] || 'ℹ'}</span>
        <span class="notification-message">${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;

    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Helper per notifiche comuni
function showSuccess(message) { showNotification(message, 'success'); }
function showError(message) { showNotification(message, 'error'); }
function showWarning(message) { showNotification(message, 'warning'); }

function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function changeMode(mode) {
    currentMode = mode;
    localStorage.setItem('ai_mode', mode);
    updateCurrentMode(mode);
    const modeNames = {
        'auto': 'Auto',
        'math': 'Matematica',
        'finance': 'Finanza',
        'develop': 'Sviluppo'
    };
    showNotification(`Modalità cambiata: ${modeNames[mode]}`, 'success');

    // Messaggio specifico per modalità matematica
    if (mode === 'math') {
        setTimeout(() => {
            showNotification('Scrivi una semplice espressione matematica con un uguale all\'inizio per calcolare', 'info');
        }, 1000);
    }
}

function changeModel(model) {
    currentModel = model;
    localStorage.setItem('ai_model', model);
    updateModelStatus(model);
    showNotification(`Modello cambiato: ${model}`, 'success');
}

function updateModelStatus(model) {
    const modelStatus = document.getElementById('modelStatus');
    modelStatus.textContent = model;
}

function updateCurrentMode(mode) {
    const modeNames = {
        'auto': 'Auto',
        'math': 'Matematica',
        'finance': 'Finanza',
        'develop': 'Sviluppo'
    };
    document.getElementById('currentMode').textContent = `Modalità: ${modeNames[mode]}`;
}

function insertQuickText(text) {
    userInput.value = text;
    userInput.focus();
}

function newChat() {
    if (chatContainer.children.length > 0) {
        // Salva la conversazione corrente prima di cancellarla
        const messages = document.querySelectorAll('.message');
        if (messages.length > 0) {
            const conversation = {
                id: 'conv_' + Date.now(),
                timestamp: new Date().toISOString(),
                messages: [],
                mode: currentMode
            };

            messages.forEach(msg => {
                const isUser = msg.classList.contains('user');
                const content = msg.querySelector('.bubble').textContent.trim();
                conversation.messages.push({
                    sender: isUser ? 'user' : 'ai',
                    content: content,
                    time: msg.querySelector('.message-time') ? msg.querySelector('.message-time').textContent : ''
                });
            });

            conversations.unshift(conversation);
            if (conversations.length > 50) {
                conversations = conversations.slice(0, 50);
            }
            localStorage.setItem('ai_conversations', JSON.stringify(conversations));
        }

        if (confirm('Vuoi iniziare una nuova conversazione? La conversazione corrente sarà salvata.')) {
            chatContainer.innerHTML = '';
            showNotification('Nuova conversazione iniziata - precedente salvata', 'success');
            showWelcomeMessage();
        }
    } else {
        showNotification('Nessuna conversazione da salvare', 'info');
    }
}

function clearChat() {
    if (confirm('Pulire tutta la conversazione?')) {
        chatContainer.innerHTML = '';
        showNotification('Chat pulita', 'success');
    }
}

function exportChat() {
    const messages = document.querySelectorAll('.message');
    let exportText = '=== Conversazione Assistente AI ===\\n\\n';

    messages.forEach(msg => {
        const isUser = msg.classList.contains('user');
        const content = msg.querySelector('.bubble').textContent;
        exportText += isUser ? '[TU]: ' : '[AI]: ';
        exportText += content + '\\n\\n';
    });

    const blob = new Blob([exportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversazione-ai-${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    showNotification('Conversazione esportata!', 'success');
}

function saveConversation(userMsg, aiMsg) {
    const conversation = {
        id: 'conv_' + Date.now(),
        timestamp: new Date().toISOString(),
        user: userMsg,
        ai: aiMsg,
        mode: currentMode
    };

    conversations.unshift(conversation);
    if (conversations.length > 50) {
        conversations = conversations.slice(0, 50);
    }

    localStorage.setItem('ai_conversations', JSON.stringify(conversations));
}

function toggleTheme() {
    const themes = ['dark', 'light', 'neon', 'hacker', 'purple', 'orange', 'solar-dark', 'pink', 'military-light', 'military-dark', 'red-muted', 'venom-green', 'venom-orange', 'venom-blue', 'venom-red'];
    const currentIndex = themes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    currentTheme = themes[nextIndex];

    localStorage.setItem('ai_theme', currentTheme);

    // Applica tema (semplice)
    document.body.className = `theme-${currentTheme}`;
    showNotification(`Tema cambiato: ${currentTheme}`, 'info');
}

function changeTheme(value) {
    if (value === 'random') {
        randomTheme();
    } else {
        currentTheme = value;
        localStorage.setItem('ai_theme', currentTheme);
        document.body.className = `theme-${currentTheme}`;
        showNotification(`Tema: ${currentTheme}`, 'info');
    }
}

function randomTheme() {
    const themes = ['dark', 'light', 'neon', 'hacker', 'purple', 'orange', 'solar-dark', 'pink', 'military-light', 'military-dark', 'red-muted', 'venom-green', 'venom-orange', 'venom-blue', 'venom-red'];
    let newTheme;
    do {
        newTheme = themes[Math.floor(Math.random() * themes.length)];
    } while (newTheme === currentTheme); // Evita di scegliere lo stesso tema

    currentTheme = newTheme;
    localStorage.setItem('ai_theme', currentTheme);
    document.body.className = `theme-${currentTheme}`;
    showNotification(`Tema casuale: ${currentTheme}`, 'info');
}

// ==================== LOGIN ====================
function login() {
    const key = document.getElementById('apiKey').value.trim();
    if (key) {
        apiKey = key;
        localStorage.setItem('ai_api_key', key);
        document.getElementById('loginModal').style.display = 'none';
        userStatus.textContent = 'Demo User';
        connectToBackend();
        showNotification('Accesso effettuato!', 'success');
    } else {
        showNotification('Inserisci una API Key', 'error');
    }
}

function useDemoKey() {
    document.getElementById('apiKey').value = 'demo_key_123';
    login();
}

function cancelRequest() {
    if (cancelController) {
        cancelController.abort();
    }
}

function showSettings() {
    document.getElementById('settingsModal').style.display = 'flex';
    document.getElementById('generalPrompt').value = prompts.general;
    document.getElementById('mathPrompt').value = prompts.math;
    document.getElementById('financePrompt').value = prompts.finance;
    document.getElementById('developPrompt').value = prompts.develop;
    document.getElementById('chart3dEngine').value = chart3dEngine;
}

function savePrompts() {
    prompts.general = document.getElementById('generalPrompt').value;
    prompts.math = document.getElementById('mathPrompt').value;
    prompts.finance = document.getElementById('financePrompt').value;
    prompts.develop = document.getElementById('developPrompt').value;

    // Salva motore grafici 3D
    chart3dEngine = document.getElementById('chart3dEngine').value;
    localStorage.setItem('chart3dEngine', chart3dEngine);

    localStorage.setItem('prompts', JSON.stringify(prompts));
    closeSettings();
    showNotification('Impostazioni salvate', 'success');
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const isOpen = sidebar.classList.contains('open');

    if (isOpen) {
        sidebar.classList.remove('open');
        overlay.style.display = 'none';
    } else {
        sidebar.classList.add('open');
        overlay.style.display = 'block';
    }
}

function closeSettings() {
    document.getElementById('settingsModal').style.display = 'none';
}

function logout() {
    if (confirm('Vuoi davvero effettuare il logout? Verrai disconnesso e la conversazione verrà pulita.')) {
        apiKey = null;
        localStorage.removeItem('ai_api_key');
        localStorage.removeItem('ai_conversations');
        document.getElementById('loginModal').style.display = 'flex';
        userStatus.textContent = 'Non connesso';
        isConnected = false;
        updateConnectionStatus('offline', 'Disconnesso');

        // Pulisci la chat
        chatContainer.innerHTML = '';

        showNotification('Logout effettuato - sessione pulita', 'info');
    }
}

function showChartMenu() {
    document.getElementById('chartModal').style.display = 'block';
    showLineChart(); // Mostra il primo grafico per default
}

function closeChartModal() {
    document.getElementById('chartModal').style.display = 'none';
}

// ============================================
// GESTIONE COMANDI GRAFICI 3D LOCALI
// ============================================

async function handleChart3DCommand(text) {
    const lowerText = text.toLowerCase();

    // Riconosci tutti i tipi di comandi grafici 3D
    const chart3DPatterns = [
        /grafico 3d/i,
        /3d grafico/i,
        /scatter 3d/i,
        /superficie 3d/i,
        /surface 3d/i,
        /parametric.*3d/i,
        /3d.*parametric/i
    ];

    const is3DCommand = chart3DPatterns.some(pattern => pattern.test(lowerText));

    if (is3DCommand) {
        // Riconosci il tipo specifico di grafico 3D
        if (lowerText.includes('parametric') || lowerText.includes('parametrica')) {
            return await generateParametric3DChart(text);
        } else if (lowerText.includes('superficie') || lowerText.includes('surface')) {
            return await generateSurface3DChart(text);
        } else if (lowerText.includes('scatter') || lowerText.includes('dispersione')) {
            return await generateScatter3DChart(text);
        } else {
            // Default: grafico parametrico
            return await generateParametric3DChart(text);
        }
    }

    return null; // Non è un comando grafico 3D
}

async function generateParametric3DChart(text) {
    try {
        // Estrai le funzioni parametriche dal testo
        const funcMatch = text.match(/x\s*=\s*([^,]+),\s*y\s*=\s*([^,]+),\s*z\s*=\s*([^)\s]+)/i);
        let func_x = 'cos(t)', func_y = 'sin(t)', func_z = 't';

        if (funcMatch) {
            func_x = funcMatch[1].trim();
            func_y = funcMatch[2].trim();
            func_z = funcMatch[3].trim();
        }

        // Genera dati parametrici
        const t_range = [0, 4 * Math.PI];
        const points = 200;
        const t = [];
        const x = [], y = [], z = [];

        for (let i = 0; i < points; i++) {
            const t_val = t_range[0] + (t_range[1] - t_range[0]) * i / (points - 1);
            t.push(t_val);

            // Valuta le funzioni in modo sicuro
            try {
                const x_val = evaluateMathFunction(func_x, t_val);
                const y_val = evaluateMathFunction(func_y, t_val);
                const z_val = evaluateMathFunction(func_z, t_val);

                x.push(x_val);
                y.push(y_val);
                z.push(z_val);
            } catch (e) {
                // Se fallisce, genera dati casuali
                x.push(Math.cos(t_val));
                y.push(Math.sin(t_val));
                z.push(t_val);
            }
        }

        // Scegli il motore di rendering basato sulle impostazioni
        if (chart3dEngine === 'plotly') {
            return await generateParametric3DPlotly(func_x, func_y, func_z, x, y, z);
        } else if (chart3dEngine === 'matplotlib') {
            return await generateParametric3DMatplotlib(func_x, func_y, func_z, x, y, z);
        } else if (chart3dEngine === 'seaborn') {
            // Seaborn non disponibile, usa matplotlib come fallback
            showWarning('Seaborn non disponibile, uso Matplotlib');
            return await generateParametric3DMatplotlib(func_x, func_y, func_z, x, y, z);
        }

    } catch (error) {
        console.error('Errore generazione grafico parametrico:', error);
        return `<div style="color: var(--danger); padding: 1rem; border: 1px solid var(--danger); border-radius: var(--radius);">
            ❌ Errore nella generazione del grafico parametrico: ${error.message}
            <br><br>
            <strong>Suggerimento:</strong> Prova con funzioni come "x=cos(t), y=sin(t), z=t"
        </div>`;
    }
}

async function generateParametric3DPlotly(func_x, func_y, func_z, x, y, z) {
    const chartId = 'parametric-chart-' + Math.random().toString(36).substr(2, 9);
    const chartHtml = `
        <div style="margin: 1rem 0; padding: 1rem; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface);">
            <h4 style="margin-bottom: 0.5rem; color: var(--primary);">🎯 Grafico 3D Parametrico (Plotly)</h4>
            <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1rem;">
                <strong>Funzioni:</strong> x = ${func_x}, y = ${func_y}, z = ${func_z}
                <br><strong>Motore:</strong> Plotly (Interattivo, WebGL)
            </div>
            <div id="${chartId}" style="width: 100%; height: 400px;"></div>
        </div>
    `;

    setTimeout(() => {
        const trace = {
            x: x,
            y: y,
            z: z,
            mode: 'lines',
            type: 'scatter3d',
            line: {
                color: z,
                colorscale: 'Viridis',
                width: 4
            },
            name: `Parametric: (${func_x}, ${func_y}, ${func_z})`
        };

        const layout = {
            title: `Curva parametrica 3D: x=${func_x}, y=${func_y}, z=${func_z}`,
            scene: {
                xaxis: {title: 'X'},
                yaxis: {title: 'Y'},
                zaxis: {title: 'Z'},
                camera: {
                    eye: {x: 1.5, y: 1.5, z: 1.5}
                }
            },
            plot_bgcolor: 'rgba(15, 23, 42, 0.5)',
            paper_bgcolor: 'rgba(30, 41, 59, 0.8)',
            font: {color: '#f8fafc'}
        };

        Plotly.newPlot(chartId, [trace], layout, {responsive: true});
    }, 100);

    return chartHtml;
}

async function generateParametric3DMatplotlib(func_x, func_y, func_z, x, y, z) {
    try {
        const response = await fetch(`${API_URL}/api/chart3d`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey
            },
            body: JSON.stringify({
                type: 'parametric3d',
                func_x: func_x,
                func_y: func_y,
                func_z: func_z,
                points: 200
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        return `<div style="margin: 1rem 0; padding: 1rem; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface);">
            <h4 style="margin-bottom: 0.5rem; color: var(--primary);">📊 Grafico 3D Parametrico (Matplotlib)</h4>
            <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1rem;">
                <strong>Funzioni:</strong> x = ${func_x}, y = ${func_y}, z = ${func_z}
                <br><strong>Motore:</strong> Matplotlib (Classico, veloce)
            </div>
            ${render3DChart(data)}
        </div>`;

    } catch (error) {
        console.error('Errore Matplotlib 3D:', error);
        return `<div style="color: var(--danger); padding: 1rem; border: 1px solid var(--danger); border-radius: var(--radius);">
            ❌ Errore Matplotlib 3D: ${error.message}
        </div>`;
    }
}

async function generateParametric3DSeaborn(func_x, func_y, func_z, x, y, z) {
    try {
        // Per Seaborn, usiamo il backend Matplotlib con styling Seaborn
            const response = await fetch(`${API_URL}/api/matplotlib`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': apiKey
                },
            body: JSON.stringify({
                type: 'parametric3d_seaborn',
                func_x: func_x,
                func_y: func_y,
                func_z: func_z,
                points: 200
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        return `<div style="margin: 1rem 0; padding: 1rem; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface);">
            <h4 style="margin-bottom: 0.5rem; color: var(--primary);">🎨 Grafico 3D Parametrico (Seaborn)</h4>
            <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1rem;">
                <strong>Funzioni:</strong> x = ${func_x}, y = ${func_y}, z = ${func_z}
                <br><strong>Motore:</strong> Seaborn (Statistico, elegante)
            </div>
            <img src="${data.image}" alt="Grafico 3D Parametrico Seaborn" style="max-width: 100%; height: auto; border: 1px solid var(--border); border-radius: var(--radius);">
        </div>`;

    } catch (error) {
        console.error('Errore Seaborn 3D:', error);
        return `<div style="color: var(--danger); padding: 1rem; border: 1px solid var(--danger); border-radius: var(--radius);">
            ❌ Errore Seaborn 3D: ${error.message}
        </div>`;
    }
}

async function generateGeneralChart(text) {
    // Per ora, reindirizza al sistema esistente di parsing grafici
    const chartHtml = parseChartRequest(text);
    if (chartHtml) {
        return chartHtml;
    }

        // Se non riconosce il formato, genera un grafico di esempio
        const chartId = 'general-chart-' + Math.random().toString(36).substr(2, 9);
        const generalChartHtml = `
            <div style="margin: 1rem 0; padding: 1rem; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface);">
                <h4 style="margin-bottom: 0.5rem; color: var(--primary);">📊 Grafico Generato</h4>
                <div id="${chartId}" style="width: 100%; height: 300px;"></div>
            </div>
        `;

    setTimeout(() => {
        // Genera dati casuali per dimostrare
        const x = Array.from({length: 10}, (_, i) => i + 1);
        const y = Array.from({length: 10}, () => Math.random() * 100);

        const trace = {
            x: x,
            y: y,
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Dati generati',
            line: {color: '#60a5fa', width: 3}
        };

        const layout = {
            title: 'Grafico di esempio',
            xaxis: {title: 'X'},
            yaxis: {title: 'Y'},
            plot_bgcolor: 'rgba(15, 23, 42, 0.5)',
            paper_bgcolor: 'rgba(30, 41, 59, 0.8)',
            font: {color: '#f8fafc'}
        };

        Plotly.newPlot(chartId, [trace], layout, {responsive: true});
    }, 100);

    return generalChartHtml;
}

async function generateSurface3DChart(text) {
    try {
        // Per ora usa dati di esempio per superficie 3D
        const chartId = 'surface-chart-' + Math.random().toString(36).substr(2, 9);

        if (chart3dEngine === 'plotly') {
            const chartHtml = `
                <div style="margin: 1rem 0; padding: 1rem; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface);">
                    <h4 style="margin-bottom: 0.5rem; color: var(--primary);">🌊 Superficie 3D (Plotly)</h4>
                    <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1rem;">
                        <strong>Motore:</strong> Plotly (Interattivo, WebGL)
                    </div>
                    <div id="${chartId}" style="width: 100%; height: 400px;"></div>
                </div>
            `;

            setTimeout(() => {
                // Genera dati per superficie
                const x = [], y = [], z = [];
                const size = 25;

                for (let i = 0; i < size; i++) {
                    x.push(i - size/2);
                    const row = [];
                    for (let j = 0; j < size; j++) {
                        if (i === 0) y.push(j - size/2);
                        row.push(Math.sin(i/3) * Math.cos(j/3) + Math.random() * 0.1);
                    }
                    z.push(row);
                }

                const trace = {
                    x: x,
                    y: y,
                    z: z,
                    type: 'surface',
                    colorscale: 'Viridis'
                };

                const layout = {
                    title: 'Superficie 3D Interattiva',
                    scene: {
                        xaxis: {title: 'X'},
                        yaxis: {title: 'Y'},
                        zaxis: {title: 'Z'}
                    },
                    plot_bgcolor: 'rgba(15, 23, 42, 0.5)',
                    paper_bgcolor: 'rgba(30, 41, 59, 0.8)',
                    font: {color: '#f8fafc'}
                };

                Plotly.newPlot(chartId, [trace], layout, {responsive: true});
            }, 100);

            return chartHtml;

        } else if (chart3dEngine === 'matplotlib') {
            // Usa il backend esistente
            const response = await fetch(`${API_URL}/api/chart3d`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({type: 'surface'})
            });

            if (response.ok) {
                const data = await response.json();
                return `<div style="margin: 1rem 0; padding: 1rem; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface);">
                    <h4 style="margin-bottom: 0.5rem; color: var(--primary);">📊 Superficie 3D (Matplotlib)</h4>
                    <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1rem;">
                        <strong>Motore:</strong> Matplotlib (Classico, veloce)
                    </div>
                    ${render3DChart(data)}
                </div>`;
            }

        } else if (chart3dEngine === 'seaborn') {
            // Seaborn non disponibile, usa matplotlib come fallback
            showWarning('Seaborn non disponibile, uso Matplotlib');
            const response = await fetch(`${API_URL}/api/chart3d`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': apiKey
                },
                body: JSON.stringify({type: 'surface'})
            });

            if (response.ok) {
                const data = await response.json();
                return `<div style="margin: 1rem 0; padding: 1rem; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface);">
                    <h4 style="margin-bottom: 0.5rem; color: var(--primary);">📊 Superficie 3D (Matplotlib)</h4>
                    <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1rem;">
                        <strong>Motore:</strong> Matplotlib (Classico, veloce - Seaborn non disponibile)
                    </div>
                    ${render3DChart(data)}
                </div>`;
            }
        }

    } catch (error) {
        console.error('Errore generazione superficie 3D:', error);
        return `<div style="color: var(--danger); padding: 1rem; border: 1px solid var(--danger); border-radius: var(--radius);">
            ❌ Errore nella generazione della superficie 3D: ${error.message}
        </div>`;
    }
}

async function generateScatter3DChart(text) {
    try {
        // Genera dati casuali per scatter 3D
        const points = 100;
        const x = [], y = [], z = [];

        for (let i = 0; i < points; i++) {
            x.push((Math.random() - 0.5) * 10);
            y.push((Math.random() - 0.5) * 10);
            z.push((Math.random() - 0.5) * 10);
        }

        const chartId = 'scatter-chart-' + Math.random().toString(36).substr(2, 9);

        if (chart3dEngine === 'plotly') {
            const chartHtml = `
                <div style="margin: 1rem 0; padding: 1rem; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface);">
                    <h4 style="margin-bottom: 0.5rem; color: var(--primary);">🎲 Scatter 3D (Plotly)</h4>
                    <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1rem;">
                        <strong>Motore:</strong> Plotly (${points} punti)
                    </div>
                    <div id="${chartId}" style="width: 100%; height: 400px;"></div>
                </div>
            `;

            setTimeout(() => {
                const trace = {
                    x: x,
                    y: y,
                    z: z,
                    mode: 'markers',
                    type: 'scatter3d',
                    marker: {
                        size: 6,
                        color: z,
                        colorscale: 'Viridis',
                        showscale: true
                    }
                };

                const layout = {
                    title: `Scatter 3D - ${points} punti`,
                    scene: {
                        xaxis: {title: 'X'},
                        yaxis: {title: 'Y'},
                        zaxis: {title: 'Z'}
                    },
                    plot_bgcolor: 'rgba(15, 23, 42, 0.5)',
                    paper_bgcolor: 'rgba(30, 41, 59, 0.8)',
                    font: {color: '#f8fafc'}
                };

                Plotly.newPlot(chartId, [trace], layout, {responsive: true});
            }, 100);

            return chartHtml;

        } else if (chart3dEngine === 'matplotlib') {
            const response = await fetch(`${API_URL}/api/chart3d`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': apiKey
                },
                body: JSON.stringify({
                    type: 'parametric3d',
                    func_x: func_x,
                    func_y: func_y,
                    func_z: func_z,
                    points: 200
                })
            });

            if (response.ok) {
                const data = await response.json();
                return `<div style="margin: 1rem 0; padding: 1rem; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface);">
                    <h4 style="margin-bottom: 0.5rem; color: var(--primary);">📊 Scatter 3D (Matplotlib)</h4>
                    <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1rem;">
                        <strong>Motore:</strong> Matplotlib (${points} punti)
                    </div>
                    ${render3DChart(data)}
                </div>`;
            }

        } else if (chart3dEngine === 'seaborn') {
            // Seaborn non disponibile, usa matplotlib come fallback
            showWarning('Seaborn non disponibile, uso Matplotlib');
            const response = await fetch(`${API_URL}/api/chart3d`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': apiKey
                },
                body: JSON.stringify({type: 'scatter3d', points: points})
            });

            if (response.ok) {
                const data = await response.json();
                return `<div style="margin: 1rem 0; padding: 1rem; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface);">
                    <h4 style="margin-bottom: 0.5rem; color: var(--primary);">📊 Scatter 3D (Matplotlib)</h4>
                    <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1rem;">
                        <strong>Motore:</strong> Matplotlib (${points} punti - Seaborn non disponibile)
                    </div>
                    ${render3DChart(data)}
                </div>`;
            }
        }

    } catch (error) {
        console.error('Errore generazione scatter 3D:', error);
        return `<div style="color: var(--danger); padding: 1rem; border: 1px solid var(--danger); border-radius: var(--radius);">
            ❌ Errore nella generazione dello scatter 3D: ${error.message}
        </div>`;
    }
}

function evaluateMathFunction(funcStr, t) {
    // Funzione sicura per valutare espressioni matematiche
    const safeEval = (expr) => {
        // Sostituisci le funzioni matematiche
        expr = expr.replace(/sin\(/g, 'Math.sin(');
        expr = expr.replace(/cos\(/g, 'Math.cos(');
        expr = expr.replace(/tan\(/g, 'Math.tan(');
        expr = expr.replace(/sqrt\(/g, 'Math.sqrt(');
        expr = expr.replace(/exp\(/g, 'Math.exp(');
        expr = expr.replace(/log\(/g, 'Math.log(');
        expr = expr.replace(/pi/g, 'Math.PI');
        expr = expr.replace(/e/g, 'Math.E');

        // Crea una funzione sicura
        const func = new Function('t', `return ${expr};`);
        return func(t);
    };

    return safeEval(funcStr);
}

async function sendToAIForAnalysis(originalText, chartHtml) {
    // Mostra indicatore typing
    showTypingIndicator();

    try {
        const analysisPrompt = `Ho appena generato un grafico basato sulla tua richiesta: "${originalText}"

Il grafico è stato creato con successo. Ora analizzalo e fornisci:
1. Una descrizione di cosa rappresenta il grafico
2. Osservazioni sui dati/pattern visibili
3. Suggerimenti per miglioramenti o variazioni
4. Interpretazione del significato dei dati

Rispondi in italiano e sii dettagliato ma conciso.`;

        const response = await fetch(`${API_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: analysisPrompt,
                mode: 'finance', // Usa modalità finance per analisi grafici
                model: currentModel,
                prompts: prompts
            })
        });

        hideTypingIndicator();

        if (response.ok) {
            const data = await response.json();
            addMessage('ai', `🔍 **Analisi del Grafico**\n\n${data.response}`);
        } else {
            addMessage('ai', '❌ Errore nell\'analisi del grafico da parte dell\'AI.');
        }

    } catch (error) {
        hideTypingIndicator();
        console.error('Errore analisi AI:', error);
        addMessage('ai', '❌ Errore nella comunicazione con l\'AI per l\'analisi.');
    }
}

// Dati di esempio per grafici finanziari
const dates = Array.from({length: 24}, (_, i) => {
    const date = new Date(2023, i, 1);
    return date.toLocaleDateString('it-IT', {year: 'numeric', month: 'short'});
});

const entrate = [45000, 48000, 52000, 55000, 58000, 62000, 65000, 68000, 72000, 75000, 78000, 82000,
                 85000, 88000, 92000, 95000, 98000, 102000, 105000, 108000, 112000, 115000, 118000, 122000];

const uscite = [30000, 32000, 34000, 36000, 38000, 40000, 42000, 44000, 46000, 48000, 50000, 52000,
                54000, 56000, 58000, 60000, 62000, 64000, 66000, 68000, 70000, 72000, 74000, 76000];

const profitto = entrate.map((e, i) => e - uscite[i]);

// ==================== CARICAMENTO DATI ====================
function loadDataFromFile() {
    const fileInput = document.getElementById('dataFile');
    const file = fileInput.files[0];

    if (!file) {
        showNotification('Nessun file selezionato', 'warning');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            let data;

            if (file.name.endsWith('.csv')) {
                data = parseCSV(content);
            } else if (file.name.endsWith('.json')) {
                data = JSON.parse(content);
            } else {
                throw new Error('Formato file non supportato. Usa CSV o JSON.');
            }

            loadedChartData = data;
            showNotification(`Dati caricati da ${file.name}!`, 'success');
        } catch (error) {
            showNotification(`Errore nel caricamento dei dati: ${error.message}`, 'error');
            loadedChartData = null;
        }
    };

    reader.readAsText(file);
}

function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
        throw new Error('Il file CSV deve avere almeno una riga di intestazioni e una di dati');
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row = {};
        headers.forEach((header, index) => {
            const value = values[index];
            // Prova a convertire in numero se possibile
            const numValue = parseFloat(value);
            row[header] = isNaN(numValue) ? value : numValue;
        });
        data.push(row);
    }

    return { headers, data };
}

// ==================== GRAFICI ====================

// 1. GRAFICO A LINEE TEMPORALI
function showLineChart() {
    let traces = [];
    let layout = {};

    if (loadedChartData && loadedChartData.data) {
        // Usa dati caricati
        const data = loadedChartData.data;
        const headers = loadedChartData.headers;

        // Trova colonne numeriche
        const numericColumns = headers.filter(header => {
            return data.some(row => typeof row[header] === 'number');
        });

        if (numericColumns.length < 1) {
            showNotification('Nessuna colonna numerica trovata nei dati', 'error');
            return;
        }

        // Usa la prima colonna come X se è data o stringa, altrimenti usa indici
        let xData;
        const firstCol = headers[0];
        if (data.some(row => isNaN(row[firstCol]))) {
            xData = data.map(row => row[firstCol]);
        } else {
            xData = data.map((_, i) => i + 1);
        }

        // Crea trace per ogni colonna numerica
        numericColumns.forEach((col, index) => {
            const colors = ['#2ecc71', '#e74c3c', '#3498db', '#f39c12', '#9b59b6'];
            traces.push({
                x: xData,
                y: data.map(row => row[col]),
                type: 'scatter',
                mode: 'lines+markers',
                name: col,
                line: {color: colors[index % colors.length], width: 3},
                marker: {size: 8}
            });
        });

        layout = {
            title: 'Grafico a Linee - Dati Caricati',
            xaxis: {title: headers[0]},
            yaxis: {title: 'Valori'},
            hovermode: 'x unified',
            plot_bgcolor: 'rgba(15, 23, 42, 0.5)',
            paper_bgcolor: 'rgba(30, 41, 59, 0.8)',
            font: {color: '#f8fafc'}
        };
    } else {
        // Usa dati di esempio
        const trace1 = {
            x: dates,
            y: entrate,
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Entrate',
            line: {color: '#2ecc71', width: 3},
            marker: {size: 8}
        };

        const trace2 = {
            x: dates,
            y: uscite,
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Uscite',
            line: {color: '#e74c3c', width: 3},
            marker: {size: 8}
        };

        const trace3 = {
            x: dates,
            y: profitto,
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Profitto',
            line: {color: '#3498db', width: 3},
            marker: {size: 8}
        };

        traces = [trace1, trace2, trace3];
        layout = {
            title: 'Analisi Finanziaria Mensile',
            xaxis: {title: 'Periodo'},
            yaxis: {title: 'Importo (€)'},
            hovermode: 'x unified',
            plot_bgcolor: 'rgba(15, 23, 42, 0.5)',
            paper_bgcolor: 'rgba(30, 41, 59, 0.8)',
            font: {color: '#f8fafc'}
        };
    }

    Plotly.newPlot('chart', traces, layout, {responsive: true});

    document.getElementById('chartTitle').textContent = '📈 Grafico a Linee Temporali';
    document.getElementById('codeExample').textContent = `const trace = {
    x: dates,
    y: values,
    type: 'scatter',
    mode: 'lines+markers',
    name: 'Serie Dati',
    line: {color: '#2ecc71', width: 3}
};

Plotly.newPlot('chart', [trace], layout);`;
}

// 2. GRAFICO A BARRE
function showBarChart() {
    const categorie = ['Stipendi', 'Affitti', 'Forniture', 'Marketing', 'Utilities'];

    const trace1 = {
        x: categorie,
        y: [45000, 30000, 15000, 20000, 10000],
        type: 'bar',
        name: 'Q1 2024',
        marker: {color: '#667eea'}
    };

    const trace2 = {
        x: categorie,
        y: [48000, 30000, 16000, 22000, 12000],
        type: 'bar',
        name: 'Q2 2024',
        marker: {color: '#764ba2'}
    };

    const trace3 = {
        x: categorie,
        y: [50000, 32000, 17000, 25000, 13000],
        type: 'bar',
        name: 'Q3 2024',
        marker: {color: '#f093fb'}
    };

    const layout = {
        title: 'Confronto Spese Trimestrali',
        xaxis: {title: 'Categoria'},
        yaxis: {title: 'Spesa (€)'},
        barmode: 'group',
        plot_bgcolor: 'rgba(15, 23, 42, 0.5)',
        paper_bgcolor: 'rgba(30, 41, 59, 0.8)',
        font: {color: '#f8fafc'}
    };

    Plotly.newPlot('chart', [trace1, trace2, trace3], layout, {responsive: true});

    document.getElementById('chartTitle').textContent = '📊 Grafico a Barre Comparazione';
    document.getElementById('codeExample').textContent = `const trace = {
    x: categories,
    y: values,
    type: 'bar',
    name: 'Periodo',
    marker: {color: '#667eea'}
};

const layout = {
    barmode: 'group' // 'stack' per barre impilate
};

Plotly.newPlot('chart', [trace], layout);`;
}

// 3. GRAFICO A TORTA
function showPieChart() {
    const trace = {
        values: [80000, 50000, 40000, 25000, 20000],
        labels: ['Operativi', 'Marketing', 'Amministrativi', 'R&D', 'Altro'],
        type: 'pie',
        marker: {
            colors: ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b']
        },
        textinfo: 'label+percent',
        textposition: 'outside',
        automargin: true
    };

    const layout = {
        title: 'Distribuzione Budget Annuale',
        showlegend: true,
        plot_bgcolor: 'rgba(15, 23, 42, 0.5)',
        paper_bgcolor: 'rgba(30, 41, 59, 0.8)',
        font: {color: '#f8fafc'}
    };

    Plotly.newPlot('chart', [trace], layout, {responsive: true});

    document.getElementById('chartTitle').textContent = '🥧 Grafico a Torta Distribuzione';
    document.getElementById('codeExample').textContent = `const trace = {
    values: [80, 50, 40, 25, 20],
    labels: ['Cat1', 'Cat2', 'Cat3', 'Cat4', 'Cat5'],
    type: 'pie',
    textinfo: 'label+percent'
};

Plotly.newPlot('chart', [trace], layout);`;
}

// 4. SCATTER 3D
function showScatter3D() {
    const n = 100;
    const x = Array.from({length: n}, () => Math.random() * 100000);
    const y = Array.from({length: n}, () => Math.random() * 50000);
    const z = Array.from({length: n}, () => Math.random() * 50);

    const trace = {
        x: x,
        y: y,
        z: z,
        mode: 'markers',
        marker: {
            size: 8,
            color: z,
            colorscale: 'Viridis',
            showscale: true,
            colorbar: {title: 'Dipendenti'}
        },
        type: 'scatter3d',
        text: x.map((v, i) => `Fatturato: €${v.toFixed(0)}<br>Costi: €${y[i].toFixed(0)}<br>Dipendenti: ${z[i].toFixed(0)}`),
        hoverinfo: 'text'
    };

    const layout = {
        title: 'Analisi 3D: Fatturato vs Costi vs Dipendenti',
        scene: {
            xaxis: {title: 'Fatturato (€)'},
            yaxis: {title: 'Costi (€)'},
            zaxis: {title: 'N. Dipendenti'}
        },
        plot_bgcolor: 'rgba(15, 23, 42, 0.5)',
        paper_bgcolor: 'rgba(30, 41, 59, 0.8)',
        font: {color: '#f8fafc'}
    };

    Plotly.newPlot('chart', [trace], layout, {responsive: true});

    document.getElementById('chartTitle').textContent = '🎲 Scatter 3D Interattivo';
    document.getElementById('codeExample').textContent = `const trace = {
    x: xValues,
    y: yValues,
    z: zValues,
    mode: 'markers',
    marker: {
        size: 8,
        color: zValues,
        colorscale: 'Viridis'
    },
    type: 'scatter3d'
};

Plotly.newPlot('chart', [trace], layout);`;
}

// 5. SUPERFICIE 3D
function showSurface3D() {
    const size = 30;
    const x = Array.from({length: size}, (_, i) => i * 10000);
    const y = Array.from({length: size}, (_, i) => i * 5000);

    const z = [];
    for (let i = 0; i < size; i++) {
        const row = [];
        for (let j = 0; j < size; j++) {
            row.push(x[j] - y[i] - (x[j] * 0.15));
        }
        z.push(row);
    }

    const trace = {
        x: x,
        y: y,
        z: z,
        type: 'surface',
        colorscale: 'Viridis',
        colorbar: {title: 'Profitto (€)'}
    };

    const layout = {
        title: 'Superficie Profitto: Scenari Fatturato-Costi',
        scene: {
            xaxis: {title: 'Fatturato (€)'},
            yaxis: {title: 'Costi (€)'},
            zaxis: {title: 'Profitto Netto (€)'}
        },
        plot_bgcolor: 'rgba(15, 23, 42, 0.5)',
        paper_bgcolor: 'rgba(30, 41, 59, 0.8)',
        font: {color: '#f8fafc'}
    };

    Plotly.newPlot('chart', [trace], layout, {responsive: true});

    document.getElementById('chartTitle').textContent = '🌊 Superficie 3D Analisi Scenari';
    document.getElementById('codeExample').textContent = `const trace = {
    x: xArray,
    y: yArray,
    z: zMatrix, // Array 2D
    type: 'surface',
    colorscale: 'Viridis'
};

Plotly.newPlot('chart', [trace], layout);`;
}

// 6. CANDLESTICK (Grafico Finanziario)
function showCandlestick() {
    const dates = Array.from({length: 30}, (_, i) => {
        const date = new Date(2024, 0, i + 1);
        return date.toISOString().split('T')[0];
    });

    const open = Array.from({length: 30}, () => 100 + Math.random() * 20);
    const close = open.map(o => o + (Math.random() - 0.5) * 10);
    const high = open.map((o, i) => Math.max(o, close[i]) + Math.random() * 5);
    const low = open.map((o, i) => Math.min(o, close[i]) - Math.random() * 5);

    const trace = {
        x: dates,
        close: close,
        high: high,
        low: low,
        open: open,
        type: 'candlestick',
        increasing: {line: {color: '#2ecc71'}},
        decreasing: {line: {color: '#e74c3c'}}
    };

    const layout = {
        title: 'Analisi Candlestick - Azioni',
        xaxis: {
            title: 'Data',
            rangeslider: {visible: false}
        },
        yaxis: {title: 'Prezzo (€)'},
        plot_bgcolor: 'rgba(15, 23, 42, 0.5)',
        paper_bgcolor: 'rgba(30, 41, 59, 0.8)',
        font: {color: '#f8fafc'}
    };

    Plotly.newPlot('chart', [trace], layout, {responsive: true});

    document.getElementById('chartTitle').textContent = '💹 Candlestick Finanza';
    document.getElementById('codeExample').textContent = `const trace = {
    x: dates,
    open: openPrices,
    high: highPrices,
    low: lowPrices,
    close: closePrices,
    type: 'candlestick',
    increasing: {line: {color: '#2ecc71'}},
    decreasing: {line: {color: '#e74c3c'}}
};

Plotly.newPlot('chart', [trace], layout);`;
}

// 7. HEATMAP
function showHeatmap() {
    const mesi = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
    const anni = ['2021', '2022', '2023', '2024'];

    const z = [
        [45, 48, 52, 55, 58, 62, 65, 68, 72, 75, 78, 82],
        [48, 52, 56, 60, 64, 68, 72, 76, 80, 84, 88, 92],
        [52, 56, 61, 66, 71, 76, 81, 86, 91, 96, 101, 106],
        [56, 61, 67, 73, 79, 85, 91, 97, 103, 109, 115, 122]
    ];

    const trace = {
        x: mesi,
        y: anni,
        z: z,
        type: 'heatmap',
        colorscale: 'YlOrRd',
        colorbar: {title: 'Vendite (k€)'}
    };

    const layout = {
        title: 'Heatmap Vendite Mensili per Anno',
        xaxis: {title: 'Mese'},
        yaxis: {title: 'Anno'},
        plot_bgcolor: 'rgba(15, 23, 42, 0.5)',
        paper_bgcolor: 'rgba(30, 41, 59, 0.8)',
        font: {color: '#f8fafc'}
    };

    Plotly.newPlot('chart', [trace], layout, {responsive: true});

    document.getElementById('chartTitle').textContent = '🔥 Heatmap Correlazioni';
    document.getElementById('codeExample').textContent = `const trace = {
    x: xLabels,
    y: yLabels,
    z: dataMatrix, // Array 2D
    type: 'heatmap',
    colorscale: 'YlOrRd'
};

Plotly.newPlot('chart', [trace], layout);`;
}

// 8. GRAFICO MULTI-ASSE
function showMultiAxis() {
    const trace1 = {
        x: dates.slice(0, 12),
        y: entrate.slice(0, 12),
        type: 'scatter',
        name: 'Fatturato',
        yaxis: 'y',
        line: {color: '#667eea', width: 3}
    };

    const trace2 = {
        x: dates.slice(0, 12),
        y: Array.from({length: 12}, (_, i) => 50 + i * 2),
        type: 'scatter',
        name: 'Dipendenti',
        yaxis: 'y2',
        line: {color: '#f093fb', width: 3}
    };

    const layout = {
        title: 'Fatturato vs Dipendenti (Multi-Asse)',
        xaxis: {title: 'Periodo'},
        yaxis: {
            title: 'Fatturato (€)',
            titlefont: {color: '#667eea'},
            tickfont: {color: '#667eea'}
        },
        yaxis2: {
            title: 'N. Dipendenti',
            titlefont: {color: '#f093fb'},
            tickfont: {color: '#f093fb'},
            overlaying: 'y',
            side: 'right'
        },
        plot_bgcolor: 'rgba(15, 23, 42, 0.5)',
        paper_bgcolor: 'rgba(30, 41, 59, 0.8)',
        font: {color: '#f8fafc'}
    };

    Plotly.newPlot('chart', [trace1, trace2], layout, {responsive: true});

    document.getElementById('chartTitle').textContent = '📉 Grafico Multi-Asse';
    document.getElementById('codeExample').textContent = `const trace2 = {
    x: dates,
    y: values,
    yaxis: 'y2', // Secondo asse
    name: 'Serie 2'
};

const layout = {
    yaxis2: {
        overlaying: 'y',
        side: 'right'
    }
};

Plotly.newPlot('chart', [trace1, trace2], layout);`;
}

function generateChart(type) {
    const chartHtml = generateSampleChart(type);
    addMessage('ai', `
        <h4>Grafico di Esempio - ${type.charAt(0).toUpperCase() + type.slice(1)}</h4>
        ${chartHtml}
        <p style="margin-top: 1rem; font-size: 0.9rem; color: var(--text-secondary);">
            Questo è un grafico generato automaticamente. Puoi chiedere all'AI di creare grafici personalizzati con i tuoi dati!
        </p>
    `);
}

function showHelp() {
    addMessage('ai', `
        <h3><i class="fas fa-question-circle"></i> Guida Assistente AI</h3>

        <div style="margin: 1rem 0;">
            <h4>Modalità:</h4>
            <ul>
                <li><strong>Auto</strong>: Rileva automaticamente matematica/finanza</li>
                <li><strong>Matematica</strong>: Calcoli, equazioni, grafici</li>
                <li><strong>Finanza</strong>: Tasse, investimenti, analisi</li>
            </ul>
        </div>

        <div style="margin: 1rem 0;">
            <h4>Comandi rapidi:</h4>
            <ul>
                <li><strong>Enter</strong>: Invia messaggio</li>
                <li><strong>Shift+Enter</strong>: Vai a capo</li>
                <li><strong>🎤</strong>: Input vocale</li>
                <li><strong>🔊</strong>: Sintesi vocale (lettura risposte)</li>
                <li><strong>📊</strong>: Generatore grafici</li>
                <li><strong>Esc</strong>: Interrompi ascolto</li>
            </ul>
        </div>

        <div style="margin: 1rem 0;">
            <h4>Funzionalità Speciali:</h4>
            <ul>
                <li><strong>Codice</strong>: Syntax highlighting con pulsante copia</li>
                <li><strong>Grafici</strong>: Rendering automatico di grafici</li>
                <li><strong>Voce</strong>: Lettura risposte e input vocale</li>
                <li><strong>Temi</strong>: Dark, Light, Neon, Hacker</li>
            </ul>
        </div>

        <div style="margin: 1rem 0;">
            <h4>Sintesi Vocale:</h4>
            <ul>
                <li>Clicca <strong>🔊</strong> per abilitare/disabilitare</li>
                <li>Le risposte AI vengono lette automaticamente</li>
                <li>Usa <strong>"Test Voce"</strong> per provare</li>
                <li>Supportata in Chrome, Edge, Safari</li>
            </ul>
        </div>

        <div style="background: rgba(59, 130, 246, 0.1); padding: 1rem; border-radius: 8px;">
            <h4><i class="fas fa-terminal"></i> Supporto tecnico:</h4>
            <p>Per problemi:</p>
            <pre style="margin: 0.5rem 0;"><code># Verifica Ollama
ollama serve

# Verifica backend
curl http://localhost:5001/api/health

# Logs
tail -f logs/*.log</code></pre>
        </div>
    `);
}

// Hotkey globale per logout (Ctrl+L)
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        logout();
    }
});