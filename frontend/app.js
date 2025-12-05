// Assistente AI - Frontend JavaScript
// Versione: 4.0

// ==================== CONFIGURAZIONE ====================
const API_URL = 'http://localhost:5003';
let apiKey = null;
let currentMode = 'auto';
let currentTheme = 'dark';
let isConnected = false;
let isListening = false;
let recognition = null;
let cancelController = null;
let currentModel = 'llama3.2:3b';
let prompts = {
    general: "Sei un assistente AI utile. Rispondi in italiano.",
    math: "Sei un assistente matematico. Mostra i calcoli.",
    finance: "Sei un consulente finanziario italiano. Rispondi in italiano."
};

async function loadModels() {
    try {
        const response = await fetch(`${API_URL}/api/models`);
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

    // Click outside modal or menu to close
    window.onclick = function(event) {
        const modal = document.getElementById('settingsModal');
        if (event.target == modal) {
            modal.style.display = 'none';
        }
        const menuBtn = document.getElementById('menuBtn');
        const dropdown = document.getElementById('menuDropdown');
        if (!menuBtn.contains(event.target) && !dropdown.contains(event.target)) {
            dropdown.style.display = 'none';
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

// ==================== CONNESSIONE BACKEND ====================
async function connectToBackend() {
    updateConnectionStatus('connecting', 'Connessione in corso...');

    try {
        const response = await fetch(`${API_URL}/api/health`);
        if (response.ok) {
            const data = await response.json();

            isConnected = true;
            updateConnectionStatus('online', 'Connesso');

            // Carica modelli
            await loadModels();

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

    // Format content for AI messages
    if (sender === 'ai') {
        content = formatResponse(content);
    }

    // Aggiungi pulsanti solo per messaggi AI
    const actionButtons = sender === 'ai' ? `
        <div class="message-actions">
            <button class="action-btn speak-btn" onclick="speakText(this)" title="Leggi ad alta voce">
                <i class="fas fa-volume-up"></i>
            </button>
            <button class="action-btn copy-btn" onclick="copyMessage(this)" title="Copia messaggio">
                <i class="fas fa-copy"></i>
            </button>
        </div>
    ` : '';

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

    // Aggiungi messaggio utente
    addMessage('user', text);
    userInput.value = '';

    // Mostra indicatore typing
    showTypingIndicator();

    // Crea controller per annullare
    cancelController = new AbortController();
    const signal = cancelController.signal;

    try {
        const response = await fetch(`${API_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
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
        cancelController = null;
        if (error.name === 'AbortError') {
            addMessage('ai', 'Richiesta annullata.');
        } else {
            addMessage('ai', `❌ Errore: ${error.message}`);
            console.error('Chat error:', error);
        }
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
            }

            return generate3DChart(mappedType, chartParams);
        }
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

    const testText = "Ciao! Questa è una prova della sintesi vocale. L'Assistente AI può ora leggere le risposte ad alta voce.";
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

function copyMessage(buttonElement) {
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

        showNotification('Messaggio copiato negli appunti!', 'success');
    }).catch(err => {
        console.error('Errore copia:', err);
        showNotification('Errore nella copia del messaggio', 'error');
    });
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
}

function savePrompts() {
    prompts.general = document.getElementById('generalPrompt').value;
    prompts.math = document.getElementById('mathPrompt').value;
    prompts.finance = document.getElementById('financePrompt').value;
    localStorage.setItem('prompts', JSON.stringify(prompts));
    closeSettings();
    showNotification('Prompt salvati', 'success');
}

function toggleMenu() {
    const dropdown = document.getElementById('menuDropdown');
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
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