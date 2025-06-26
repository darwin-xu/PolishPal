class PolishPal {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadRecords();
        this.updateCharCount();
    }

    bindEvents() {
        const inputText = document.getElementById('input-text');
        const proofreadBtn = document.getElementById('proofread-btn');
        const refreshBtn = document.getElementById('refresh-records');

        inputText.addEventListener('input', () => this.updateCharCount());
        proofreadBtn.addEventListener('click', () => this.proofreadText());
        refreshBtn.addEventListener('click', () => this.loadRecords());

        // Allow Enter + Ctrl/Cmd to submit
        inputText.addEventListener('keydown', e => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                this.proofreadText();
            }
        });
    }

    updateCharCount() {
        const inputText = document.getElementById('input-text');
        const charCount = document.getElementById('char-count');
        const count = inputText.value.length;
        charCount.textContent = count;

        // Change color as approaching limit
        if (count > 4500) {
            charCount.style.color = '#dc3545';
        } else if (count > 4000) {
            charCount.style.color = '#fd7e14';
        } else {
            charCount.style.color = '#666';
        }
    }

    async proofreadText() {
        const inputText = document.getElementById('input-text');
        const text = inputText.value.trim();

        if (!text) {
            this.showError('Please enter some text to proofread.');
            return;
        }

        if (text.length > 5000) {
            this.showError('Text must be less than 5000 characters.');
            return;
        }

        this.setLoading(true);

        try {
            const response = await fetch('/api/proofread', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to proofread text');
            }

            const result = await response.json();
            this.displayResults(result);
            this.loadRecords(); // Refresh records after new proofreading
        } catch (error) {
            console.error('Proofreading error:', error);
            this.showError(
                error.message || 'Failed to proofread text. Please try again.'
            );
        } finally {
            this.setLoading(false);
        }
    }

    displayResults(result) {
        const resultsSection = document.getElementById('results-section');
        const originalText = document.getElementById('original-text');
        const correctedText = document.getElementById('corrected-text');
        const analysisDisplay = document.getElementById('analysis-display');

        // Show results section
        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth' });

        // Display original and corrected text
        originalText.textContent = result.original;
        correctedText.textContent = result.corrected;

        // Display analysis
        this.displayAnalysis(result.analysis, analysisDisplay);
    }

    displayAnalysis(analysis, container) {
        container.innerHTML = '';

        if (!analysis || analysis.length === 0) {
            container.innerHTML =
                '<p style="color: #28a745; font-weight: 600;">✓ No errors found! Your text looks great.</p>';
            return;
        }

        const title = document.createElement('h4');
        title.textContent = `Found ${analysis.length} issue${analysis.length > 1 ? 's' : ''}:`;
        title.style.marginBottom = '15px';
        title.style.color = '#495057';
        container.appendChild(title);

        analysis.forEach((error, index) => {
            const errorItem = document.createElement('div');
            errorItem.className = 'error-item';

            const errorType = document.createElement('span');
            errorType.className = `error-type ${error.type}`;
            errorType.textContent = error.type.replace('_', ' ');

            const errorSuggestion = document.createElement('span');
            errorSuggestion.className = 'error-suggestion';
            errorSuggestion.textContent = error.suggestion;

            errorItem.appendChild(errorType);
            errorItem.appendChild(errorSuggestion);
            container.appendChild(errorItem);
        });
    }

    async loadRecords() {
        try {
            const response = await fetch('/api/records');
            if (!response.ok) {
                throw new Error('Failed to load records');
            }

            const records = await response.json();
            this.displayRecords(records);
        } catch (error) {
            console.error('Error loading records:', error);
            this.showError('Failed to load records.');
        }
    }

    displayRecords(records) {
        const recordsList = document.getElementById('records-list');
        recordsList.innerHTML = '';

        if (records.length === 0) {
            recordsList.innerHTML =
                '<p style="color: #666; text-align: center; padding: 20px;">No records yet. Start proofreading some text!</p>';
            return;
        }

        records.slice(0, 10).forEach(record => {
            const recordItem = document.createElement('div');
            recordItem.className = 'record-item';
            recordItem.onclick = () => this.showRecordDetails(record);

            const preview = document.createElement('div');
            preview.className = 'record-preview';
            preview.textContent = record.originalText;

            const meta = document.createElement('div');
            meta.className = 'record-meta';

            const timestamp = new Date(record.timestamp).toLocaleString();
            const errorCount = record.analysis ? record.analysis.length : 0;

            meta.innerHTML = `
                <span>${errorCount} error${errorCount !== 1 ? 's' : ''} found</span>
                <span>${timestamp}</span>
            `;

            recordItem.appendChild(preview);
            recordItem.appendChild(meta);
            recordsList.appendChild(recordItem);
        });
    }

    showRecordDetails(record) {
        // Fill the input with the original text
        document.getElementById('input-text').value = record.originalText;
        this.updateCharCount();

        // Display the results
        this.displayResults({
            original: record.originalText,
            corrected: record.correctedText,
            analysis: record.analysis,
        });
    }

    setLoading(isLoading) {
        const btn = document.getElementById('proofread-btn');
        const btnText = btn.querySelector('.btn-text');
        const spinner = btn.querySelector('.loading-spinner');

        if (isLoading) {
            btn.disabled = true;
            btnText.style.display = 'none';
            spinner.style.display = 'inline';
        } else {
            btn.disabled = false;
            btnText.style.display = 'inline';
            spinner.style.display = 'none';
        }
    }

    showError(message) {
        // Remove existing error messages
        const existingErrors = document.querySelectorAll('.error-message');
        existingErrors.forEach(error => error.remove());

        // Create new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;

        // Insert after the input section
        const inputSection = document.querySelector('.input-section');
        inputSection.parentNode.insertBefore(
            errorDiv,
            inputSection.nextSibling
        );

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }

    showSuccess(message) {
        // Remove existing success messages
        const existingSuccess = document.querySelectorAll('.success-message');
        existingSuccess.forEach(success => success.remove());

        // Create new success message
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;

        // Insert after the input section
        const inputSection = document.querySelector('.input-section');
        inputSection.parentNode.insertBefore(
            successDiv,
            inputSection.nextSibling
        );

        // Auto remove after 3 seconds
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.remove();
            }
        }, 3000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PolishPal();
});
