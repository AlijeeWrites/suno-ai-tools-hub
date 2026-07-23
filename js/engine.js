/**
 * Suno AI Tools Engine - Auto-detects config & adjusts labels
 */
class SunoToolEngine {
    constructor(configPath) {
        this.configPath = configPath;
        this.config = null;
        this.init();
    }

    async init() {
        try {
            const response = await fetch(this.configPath);
            if (!response.ok) throw new Error('Config not found');
            this.config = await response.json();
            this.renderTool();
        } catch (error) {
            console.error('Failed to load tool config:', error);
            document.getElementById('tool-container').innerHTML = 
                '<p class="error">Error loading tool configuration. Please refresh.</p>';
        }
    }

    renderTool() {
        const container = document.getElementById('tool-container');
        if (!container || !this.config) return;

        // AUTO-DETECT TOOL TYPE FOR DYNAMIC LABELS
        const path = window.location.pathname;
        const isLyrics = path.includes('lyrics') || this.config.toolId.includes('lyrics');
        
        const btnText = isLyrics ? 'Generate Prompt' : 'Generate Prompt';
        const outputLabel = isLyrics ? 'Your Generated Prompt:' : 'Your Generated Prompt:';

        let html = `<form id="prompt-form">`;
        
        this.config.fields.forEach(field => {
            html += `<div class="field-group"><label for="${field.id}">${field.label}${field.required ? ' *' : ''}</label>`;
            
            if (field.type === 'select') {
                html += `<select id="${field.id}" ${field.required ? 'required' : ''}>`;
                field.options.forEach(opt => html += `<option value="${opt}">${opt}</option>`);
                html += `</select>`;
            } else if (field.type === 'textarea') {
                html += `<textarea id="${field.id}" placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''}></textarea>`;
            } else if (field.type === 'range') {
                html += `<input type="range" id="${field.id}" min="${field.min}" max="${field.max}" value="${field.default || field.min}" 
                         oninput="document.getElementById('${field.id}-val').textContent = this.value">
                         <span id="${field.id}-val">${field.default || field.min}</span>`;
            }
            html += `</div>`;
        });

        html += `<button type="submit" class="btn">${btnText}</button></form>
                 <div id="output-area" style="display:none; margin-top: 2rem;">
                    <h3>${outputLabel}</h3>
                    <textarea id="generated-prompt" readonly></textarea>
                    <button id="copy-btn" class="btn btn-copy">Copy to Clipboard</button>
                 </div>`;
                 
        container.innerHTML = html;
        this.attachEventListeners();
    }

    attachEventListeners() {
        document.getElementById('prompt-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.generateOutput();
        });
        
        document.getElementById('copy-btn')?.addEventListener('click', () => {
            const output = document.getElementById('generated-prompt');
            output.select();
            navigator.clipboard.writeText(output.value);
            alert('Prompt copied!');
        });
    }

    generateOutput() {
        let output = this.config.template;
        this.config.fields.forEach(field => {
            const el = document.getElementById(field.id);
            const value = field.type === 'multiselect' ? 
                Array.from(el.selectedOptions).map(o => o.value).join(', ') : 
                el.value;
            output = output.replace(`{${field.id}}`, value);
        });
        
        document.getElementById('generated-prompt').value = output;
        document.getElementById('output-area').style.display = 'block';
    }
}

// AUTO-DETECT CONFIG BASED ON URL PATHNAME
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('tool-container');
    if (!container) return;

    const path = window.location.pathname;
    let configPath = '../config/suno-prompt.json'; // Default fallback
    
    if (path.includes('lyrics')) {
        configPath = '../config/suno-lyrics.json';
    } else if (path.includes('structure')) {
        configPath = '../config/suno-structure.json';
    }
    
    new SunoToolEngine(configPath);
});
