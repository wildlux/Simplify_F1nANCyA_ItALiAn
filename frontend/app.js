// Assistente AI - Frontend JavaScript
// Versione: 4.0

// ==================== CONFIGURAZIONE ====================
const API_URL = 'http://localhost:5002';
let apiKey = null;
let currentMode = 'auto';
let currentTheme = 'dark';
let isConnected = false;
let isListening = false;
let recognition = null;

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

    // Setup event listeners
    setupEventListeners();

    // Focus input
    userInput.focus();
};

function loadPreferences() {
    const savedKey = localStorage.getItem('ai_api_key');
    const savedTheme = localStorage.getItem('ai_theme') || 'dark';
    const savedMode = localStorage.getItem('ai_mode') || 'auto';
    const savedSpeech = localStorage.getItem('speech_enabled') === 'true';

    if (savedKey) {
        apiKey = savedKey;
        userStatus.textContent = 'Demo User';
    }

    currentTheme = savedTheme;
    currentMode = savedMode;
    speechEnabled = savedSpeech;

    document.getElementById('modeSelect').value = savedMode;
    updateCurrentMode(savedMode);

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
    // Invio messaggio con Ctrl+Enter
    userInput.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
        if (e.key === 'Escape' && isListening) {
            stopVoiceRecognition();
        }
    });

    // Scorrimento chat
    chatContainer.addEventListener('scroll', () => {
        // Potenziale caricamento messaggi precedenti
    });
}

// ==================== CONNESSIONE BACKEND ====================
async function connectToBackend() {
    updateConnectionStatus('connecting', 'Connessione in corso...');

    try {
        const response = await fetch(`${API_URL}/api/health`);
        if (response.ok) {
            const data = await response.json();

            isConnected = true;
            updateConnectionStatus('online', 'Connesso');
            modelStatus.textContent = data.system?.model || 'llama3.2:3b';

            // Benvenuto
            setTimeout(() => {
                if (chatContainer.children.length === 0) {
                    showWelcomeMessage();
                }
            }, 500);

        } else {
            updateConnectionStatus('offline', 'Backend non raggiungibile');
        }
    } catch (error) {
        updateConnectionStatus('offline', 'Errore di connessione');
        console.error('Connection error:', error);

        // Retry dopo 5 secondi
        setTimeout(connectToBackend, 5000);
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
                <li><strong>Grafici</strong> e visualizzazioni dati</li>
                <li><strong>Analisi</strong> e risposte dettagliate</li>
                <li><strong>Input vocale</strong> (clicca 🎤 per parlare)</li>
            </ul>
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

    messageDiv.innerHTML = `
        <div class="bubble">
            ${content}
            ${showTime ? `<span class="message-time">${timeStr}</span>` : ''}
        </div>
    `;

    chatContainer.appendChild(messageDiv);
    scrollToBottom();

    // Applica syntax highlighting ai nuovi messaggi
    setTimeout(highlightCode, 50);
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

    // Aggiungi messaggio utente
    addMessage('user', text);
    userInput.value = '';

    // Mostra indicatore typing
    showTypingIndicator();

    try {
        const response = await fetch(`${API_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: text,
                mode: currentMode
            })
        });

        hideTypingIndicator();

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

                const data = await response.json();

                // Aggiungi risposta AI
                addMessage('ai', data.response);

                // Applica syntax highlighting ai blocchi di codice
                setTimeout(highlightCode, 100);

                // Leggi ad alta voce la risposta (se abilitato)
                if (speechEnabled && speechSynthesis) {
                    console.log('🎵 Leggendo risposta AI:', data.response.substring(0, 50) + '...');
                    speakText(data.response);
                } else {
                    console.log('🔇 Sintesi vocale disabilitata o non supportata');
                }

    } catch (error) {
        hideTypingIndicator();
        addMessage('ai', `❌ Errore: ${error.message}`);
        console.error('Chat error:', error);
    }
}

// ==================== FORMATTAZIONE RISPOSTE ====================
function formatResponse(text) {
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
    const chartId = 'chart-' + Math.random().toString(36).substr(2, 9);
    const canvasHtml = `<canvas id="${chartId}" style="max-width: 100%; height: 300px;"></canvas>`;

    // Crea il grafico dopo un breve delay per assicurarsi che il DOM sia aggiornato
    setTimeout(() => {
        const ctx = document.getElementById(chartId);
        if (!ctx) return;

        let config = {};

        switch(chartType.toLowerCase()) {
            case 'bar':
                config = {
                    type: 'bar',
                    data: chartData,
                    options: {
                        responsive: true,
                        plugins: {
                            legend: { position: 'top' },
                            title: { display: true, text: chartData.title || 'Grafico a Barre' }
                        },
                        scales: {
                            y: { beginAtZero: true }
                        }
                    }
                };
                break;

            case 'pie':
            case 'doughnut':
                config = {
                    type: chartType,
                    data: chartData,
                    options: {
                        responsive: true,
                        plugins: {
                            legend: { position: 'right' },
                            title: { display: true, text: chartData.title || 'Grafico a Torta' }
                        }
                    }
                };
                break;

            case 'scatter':
                config = {
                    type: 'scatter',
                    data: chartData,
                    options: {
                        responsive: true,
                        plugins: {
                            legend: { position: 'top' },
                            title: { display: true, text: chartData.title || 'Grafico a Dispersione' }
                        },
                        scales: {
                            x: { type: 'linear', position: 'bottom' }
                        }
                    }
                };
                break;

            default: // line
                config = {
                    type: 'line',
                    data: chartData,
                    options: {
                        responsive: true,
                        plugins: {
                            legend: { position: 'top' },
                            title: { display: true, text: chartData.title || 'Grafico Lineare' }
                        },
                        scales: {
                            y: { beginAtZero: true }
                        }
                    }
                };
        }

        new Chart(ctx, config);
    }, 100);

    return `<div class="chart-container" style="margin: 1rem 0; padding: 1rem; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface);">
        ${canvasHtml}
    </div>`;
}

// ==================== PARSING RICHIESTE GRAFICI ====================
function parseChartRequest(text) {
    // Cerca pattern per richieste di grafici nel testo
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
        showNotification(`Errore riconoscimento vocale: ${event.error}`, 'error');
        stopVoiceRecognition();
    };

    recognition.onend = () => {
        stopVoiceRecognition();
    };

    recognition.start();
}

function stopVoiceRecognition() {
    if (recognition) {
        recognition.stop();
    }
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
            speechBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
            speechBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        }
        if (speechToggleBtn) {
            speechToggleBtn.innerHTML = '<i class="fas fa-volume-up"></i> Muto';
        }
    } else {
        if (speechBtn) {
            speechBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
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

    const testText = "Ciao! Questa è una prova della sintesi vocale. L'Assistente AI può ora leggere le risposte ad alta voce.";
    speakText(testText);
    showNotification('Test sintesi vocale avviato', 'info');
}

// ==================== UTILITIES ====================
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = 'notification';

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'warning') icon = '⚠️';

    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.8rem;">
            <span style="font-size: 1.2rem;">${icon}</span>
            <span>${message}</span>
        </div>
    `;

    document.body.appendChild(notification);

    // Rimuovi dopo 5 secondi
    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function changeMode(mode) {
    currentMode = mode;
    localStorage.setItem('ai_mode', mode);
    updateCurrentMode(mode);
    showNotification(`Modalità cambiata: ${mode}`, 'success');
}

function updateCurrentMode(mode) {
    const modeNames = {
        'auto': 'Auto',
        'math': 'Matematica',
        'finance': 'Finanza'
    };
    document.getElementById('currentMode').textContent = `Modalità: ${modeNames[mode]}`;
}

function insertQuickText(text) {
    userInput.value = text;
    userInput.focus();
}

function newChat() {
    if (chatContainer.children.length > 0) {
        if (confirm('Vuoi iniziare una nuova conversazione? La conversazione corrente sarà persa.')) {
            chatContainer.innerHTML = '';
            showNotification('Nuova conversazione iniziata', 'success');
            showWelcomeMessage();
        }
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
    const themes = ['dark', 'light', 'neon', 'hacker'];
    const currentIndex = themes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    currentTheme = themes[nextIndex];

    localStorage.setItem('ai_theme', currentTheme);

    // Applica tema (semplice)
    document.body.className = `theme-${currentTheme}`;
    showNotification(`Tema cambiato: ${currentTheme}`, 'info');
}

// ==================== LOGIN ====================
function login() {
    const key = document.getElementById('apiKey').value.trim();
    if (key) {
        apiKey = key;
        localStorage.setItem('ai_api_key', key);
        document.getElementById('loginModal').style.display = 'none';
        userStatus.textContent = 'Connesso';
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
    addMessage('ai', `
        <h3><i class="fas fa-chart-bar"></i> Generatore Grafici</h3>

        <div style="margin: 1rem 0;">
            <h4>Grafici Disponibili:</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.5rem; margin-top: 0.5rem;">
                <button class="quick-btn" onclick="generateChart('line')" style="width: 100%;">
                    <i class="fas fa-chart-line"></i> Linee
                </button>
                <button class="quick-btn" onclick="generateChart('bar')" style="width: 100%;">
                    <i class="fas fa-chart-bar"></i> Barre
                </button>
                <button class="quick-btn" onclick="generateChart('pie')" style="width: 100%;">
                    <i class="fas fa-chart-pie"></i> Torta
                </button>
                <button class="quick-btn" onclick="generateChart('scatter')" style="width: 100%;">
                    <i class="fas fa-braille"></i> Dispersione
                </button>
            </div>
        </div>

        <div style="margin: 1rem 0;">
            <h4>Come Richiedere Grafici:</h4>
            <p>Puoi chiedere all'AI di creare grafici dicendo:</p>
            <ul>
                <li><code>"Crea un grafico a linee con dati: {...}"</code></li>
                <li><code>"Mostra un grafico a barre dei dati: {...}"</code></li>
                <li><code>"Disegna un grafico a torta con: {...}"</code></li>
            </ul>
        </div>

        <div style="background: rgba(16, 185, 129, 0.1); padding: 1rem; border-radius: 8px; margin: 1rem 0;">
            <h4><i class="fas fa-lightbulb"></i> Esempio:</h4>
            <p><code>"Crea un grafico a linee con dati: {"labels": ["Gen", "Feb", "Mar"], "datasets": [{"label": "Vendite", "data": [10, 20, 30]}]}"</code></p>
        </div>
    `);
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
                <li><strong>Ctrl+Enter</strong>: Invia messaggio</li>
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