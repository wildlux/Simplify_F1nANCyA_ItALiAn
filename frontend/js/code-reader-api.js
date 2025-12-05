// frontend/js/code-reader-api.js
// Aggiungi questo al tuo progetto frontend per integrare il code reader

class CodeReaderAPI {
    constructor(baseURL = 'http://localhost:5000') {
        this.baseURL = baseURL;
        this.apiKey = localStorage.getItem('api_key') || 'demo_key_123';
    }

    /**
     * Analizza codice senza eseguirlo
     */
    async analyzeCode(code, language) {
        try {
            const response = await fetch(`${this.baseURL}/api/code/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': this.apiKey
                },
                body: JSON.stringify({ code, language })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Errore analisi codice:', error);
            throw error;
        }
    }

    /**
     * Esegue codice sul backend
     */
    async executeCode(code, language, timeout = 5) {
        try {
            const response = await fetch(`${this.baseURL}/api/code/execute`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': this.apiKey
                },
                body: JSON.stringify({ code, language, timeout })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Errore esecuzione codice:', error);
            throw error;
        }
    }

    /**
     * Ottiene linguaggi supportati
     */
    async getSupportedLanguages() {
        try {
            const response = await fetch(`${this.baseURL}/api/code/languages`, {
                headers: {
                    'X-API-Key': this.apiKey
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Errore recupero linguaggi:', error);
            throw error;
        }
    }

    /**
     * Carica file e legge contenuto
     */
    async loadFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                const content = e.target.result;
                const extension = file.name.split('.').pop().toLowerCase();
                const language = this.detectLanguage(extension);

                resolve({
                    content,
                    language,
                    filename: file.name,
                    size: file.size
                });
            };

            reader.onerror = (error) => reject(error);
            reader.readAsText(file);
        });
    }

    /**
     * Rileva linguaggio da estensione
     */
    detectLanguage(extension) {
        const languageMap = {
            'py': 'python',
            'js': 'javascript',
            'jsx': 'javascript',
            'ts': 'typescript',
            'tsx': 'typescript',
            'cpp': 'cpp',
            'cc': 'cpp',
            'cxx': 'cpp',
            'c': 'cpp',
            'h': 'cpp',
            'hpp': 'cpp',
            'java': 'java',
            'html': 'html',
            'css': 'css',
            'scss': 'scss',
            'json': 'json',
            'xml': 'xml',
            'sql': 'sql',
            'php': 'php',
            'rb': 'ruby',
            'go': 'go',
            'rs': 'rust',
            'kt': 'kotlin',
            'swift': 'swift'
        };

        return languageMap[extension] || 'plaintext';
    }

    /**
     * Formatta output per visualizzazione
     */
    formatOutput(output, type = 'info') {
        const colors = {
            success: '#4ec9b0',
            error: '#f48771',
            warning: '#ce9178',
            info: '#d4d4d4'
        };

        return `<span style="color: ${colors[type]}">${this.escapeHtml(output)}</span>`;
    }

    /**
     * Escape HTML per sicurezza
     */
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    /**
     * Genera statistiche codice
     */
    generateStats(code) {
        const lines = code.split('\n');
        const nonEmptyLines = lines.filter(l => l.trim().length > 0);
        const commentLines = lines.filter(l => {
            const trimmed = l.trim();
            return trimmed.startsWith('//') ||
                   trimmed.startsWith('#') ||
                   trimmed.startsWith('/*') ||
                   trimmed.startsWith('*');
        });

        return {
            totalLines: lines.length,
            codeLines: nonEmptyLines.length,
            commentLines: commentLines.length,
            emptyLines: lines.length - nonEmptyLines.length,
            characters: code.length,
            words: code.split(/\s+/).filter(w => w.length > 0).length
        };
    }
}

// ============================================
// INTEGRAZIONE CON UI ESISTENTE
// ============================================

/**
 * Esempio di integrazione nel tuo index.html
 */
function initializeCodeReader() {
    const codeReader = new CodeReaderAPI();

    // Aggiungi pulsante "Analizza Codice" alla tua UI
    const analyzeButton = document.createElement('button');
    analyzeButton.textContent = '🔍 Analizza Codice';
    analyzeButton.className = 'btn-code-analyze';
    analyzeButton.onclick = async () => {
        const code = getUserCode(); // La tua funzione per ottenere il codice
        const language = getCurrentLanguage(); // La tua funzione per il linguaggio

        try {
            const result = await codeReader.analyzeCode(code, language);
            displayAnalysisResults(result);
        } catch (error) {
            console.error('Errore:', error);
            alert('Errore durante l\'analisi del codice');
        }
    };

    // Aggiungi pulsante "Esegui Codice"
    const executeButton = document.createElement('button');
    executeButton.textContent = '▶️ Esegui';
    executeButton.className = 'btn-code-execute';
    executeButton.onclick = async () => {
        const code = getUserCode();
        const language = getCurrentLanguage();

        try {
            const result = await codeReader.executeCode(code, language);
            displayOutput(result.output, 'success');
        } catch (error) {
            console.error('Errore:', error);
            alert('Errore durante l\'esecuzione del codice');
        }
    };

    // Aggiungi gestione file upload
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.py,.js,.cpp,.java,.html,.css,.json';
    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const result = await codeReader.loadFile(file);
                setUserCode(result.content);
                setCurrentLanguage(result.language);
                displayFileInfo(result);
            } catch (error) {
                console.error('Errore caricamento file:', error);
                alert('Errore durante il caricamento del file');
            }
        }
    };

    return codeReader;
}

// ============================================
// FUNZIONI HELPER PER VISUALIZZAZIONE
// ============================================

function displayAnalysisResults(result) {
    if (!result.analysis) return;

    const analysis = result.analysis;

    console.log('📊 Analisi Codice:');
    console.log(`  Linee: ${analysis.lines}`);
    console.log(`  Funzioni: ${analysis.functions?.length || 0}`);
    console.log(`  Classi: ${analysis.classes?.length || 0}`);
    console.log(`  Import: ${analysis.imports?.length || 0}`);
    console.log(`  Commenti: ${analysis.comments || 0}`);

    if (analysis.complexity) {
        console.log(`  Complessità: ${analysis.complexity}`);
    }

    // Crea un elemento per mostrare i risultati
    const resultsDiv = document.getElementById('analysis-results') || createAnalysisDiv();

    resultsDiv.innerHTML = `
        <h3>📊 Risultati Analisi</h3>
        <div class="stats-grid">
            <div class="stat-item">
                <span class="stat-label">Linee</span>
                <span class="stat-value">${analysis.lines}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Funzioni</span>
                <span class="stat-value">${analysis.functions?.length || 0}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Classi</span>
                <span class="stat-value">${analysis.classes?.length || 0}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Import</span>
                <span class="stat-value">${analysis.imports?.length || 0}</span>
            </div>
        </div>
        ${analysis.functions?.length > 0 ? `
            <div class="functions-list">
                <h4>⚡ Funzioni</h4>
                <ul>
                    ${analysis.functions.map(f => `
                        <li>${f.name || f} ${f.args ? `(${f.args.join(', ')})` : ''}</li>
                    `).join('')}
                </ul>
            </div>
        ` : ''}
    `;
}

function displayOutput(output, type = 'info') {
    const outputDiv = document.getElementById('code-output') || createOutputDiv();

    const timestamp = new Date().toLocaleTimeString('it-IT');
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';

    outputDiv.innerHTML += `
        <div class="output-line output-${type}">
            <span class="output-time">[${timestamp}]</span>
            <span class="output-icon">${icon}</span>
            <span class="output-text">${escapeHtml(output)}</span>
        </div>
    `;

    outputDiv.scrollTop = outputDiv.scrollHeight;
}

function createAnalysisDiv() {
    const div = document.createElement('div');
    div.id = 'analysis-results';
    div.className = 'analysis-results';
    document.body.appendChild(div);
    return div;
}

function createOutputDiv() {
    const div = document.createElement('div');
    div.id = 'code-output';
    div.className = 'code-output';
    document.body.appendChild(div);
    return div;
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

// ============================================
// ESPORTA PER USO GLOBALE
// ============================================

// Se usi ES6 modules:
// export { CodeReaderAPI, initializeCodeReader };

// Altrimenti rendi disponibile globalmente:
window.CodeReaderAPI = CodeReaderAPI;
window.initializeCodeReader = initializeCodeReader;