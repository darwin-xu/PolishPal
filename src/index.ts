/**
 * Cloudflare Worker for PolishPal - AI-powered text proofreading
 */

interface Env {
    OPENAI_TOKEN: string;
    ENVIRONMENT?: string;
}

interface ProofreadResult {
    correctedText: string;
}

interface AnalysisItem {
    position: number;
    original: string;
    corrected: string;
    type: string;
    suggestion: string;
}

declare const ExecutionContext: any;

function getApiEndpoints(env: Env): string {
    const isLocal = env.ENVIRONMENT === 'development';
    console.log('isLocal:', isLocal);

    return isLocal ? 'http://35.234.22.51:8080' : 'https://api.openai.com';
}

class ProofreadingService {
    private env: Env;

    constructor(env: Env) {
        this.env = env;
    }

    /**
     * Proofread text using OpenAI API
     */
    async proofreadText(text: string): Promise<ProofreadResult> {
        if (!this.env?.OPENAI_TOKEN) {
            throw new Error('OpenAI API key not configured');
        }
        console.log('openai_token:', this.env?.OPENAI_TOKEN);

        const prompt =
            `Please proofread and correct the following text. Fix grammar, spelling, punctuation, ` +
            `and improve clarity while maintaining the original meaning and tone.` +
            `Return only the corrected text without any explanations or additional formatting: "${text}"`;

        try {
            const response = await fetch(
                `${getApiEndpoints(this.env)}/v1/chat/completions`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${this.env.OPENAI_TOKEN}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: 'gpt-3.5-turbo',
                        messages: [
                            {
                                role: 'system',
                                content:
                                    'You are a professional proofreader and editor. Correct grammar, spelling, punctuation, and improve clarity while maintaining the original meaning and tone. Return only the corrected text without explanations.',
                            },
                            {
                                role: 'user',
                                content: prompt,
                            },
                        ],
                        max_tokens: Math.min(1000, text.length * 2),
                        temperature: 0.1,
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({})) as any;
                throw new Error(
                    `OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`
                );
            }

            const data = await response.json() as any;
            const correctedText =
                data.choices?.[0]?.message?.content?.trim() || text;

            return { correctedText };
        } catch (error) {
            console.error('OpenAI API error:', error);
            throw new Error(`Failed to proofread text: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Analyze changes between original and corrected text
     */
    analyzeChanges(original: string, corrected: string): AnalysisItem[] {
        const originalWords = original.toLowerCase().split(/\s+/);
        const correctedWords = corrected.toLowerCase().split(/\s+/);
        const analysis: AnalysisItem[] = [];

        // Simple word-by-word comparison
        const maxLength = Math.max(originalWords.length, correctedWords.length);

        for (let i = 0; i < maxLength; i++) {
            const originalWord = originalWords[i] || '';
            const correctedWord = correctedWords[i] || '';

            if (originalWord !== correctedWord) {
                let errorType = 'unknown';
                let suggestion = correctedWord;

                // Determine error type
                if (originalWord === '' && correctedWord !== '') {
                    errorType = 'missing_word';
                    suggestion = `Add "${correctedWord}"`;
                } else if (originalWord !== '' && correctedWord === '') {
                    errorType = 'extra_word';
                    suggestion = `Remove "${originalWord}"`;
                } else if (this.isSpellingError(originalWord, correctedWord)) {
                    errorType = 'spelling';
                    suggestion = `"${originalWord}" → "${correctedWord}"`;
                } else if (originalWord === 'i' && correctedWord === 'i') {
                    errorType = 'capitalization';
                    suggestion = 'Capitalize "I"';
                } else {
                    errorType = 'grammar';
                    suggestion = `"${originalWord}" → "${correctedWord}"`;
                }

                analysis.push({
                    position: i,
                    original: originalWord,
                    corrected: correctedWord,
                    type: errorType,
                    suggestion: suggestion,
                });
            }
        }

        return analysis;
    }

    /**
     * Check if the difference is likely a spelling error
     */
    isSpellingError(word1: string, word2: string): boolean {
        if (!word1 || !word2) return false;

        // Simple heuristic: if words are similar length and have common characters
        const lengthDiff = Math.abs(word1.length - word2.length);
        if (lengthDiff > 2) return false;

        let commonChars = 0;
        const minLength = Math.min(word1.length, word2.length);

        for (let i = 0; i < minLength; i++) {
            if (word1[i] === word2[i]) {
                commonChars++;
            }
        }

        return commonChars / minLength > 0.6;
    }
}

/**
 * Static file handler - serves HTML, CSS, JS files
 */
async function handleStaticFile(request: Request, pathname: string): Promise<Response> {
    // Default to index.html for root path
    if (pathname === '/' || pathname === '') {
        pathname = '/index.html';
    }

    // For a production Worker, you would typically:
    // 1. Store static files in KV storage, or
    // 2. Use a build process to embed files, or
    // 3. Serve from R2 bucket
    //
    // For this example, we'll return a simple HTML response for the root
    if (pathname === '/index.html') {
        return new Response(
            `<!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>PolishPal - AI Text Proofreading</title>
        <script src="https://cdn.jsdelivr.net/npm/diff@5.1.0/dist/diff.min.js"></script>
        <style>
            /* Embedded CSS - in production, load from KV or external resource */
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f8f9fa; }
            .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
            header { text-align: center; margin-bottom: 2rem; }
            h1 { color: #2c3e50; font-size: 2.5rem; margin-bottom: 0.5rem; }
            .input-section { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 2px 10px #00000010; margin-bottom: 2rem; }
            textarea { width: 100%; padding: 1rem; border: 2px solid #e9ecef; border-radius: 8px; font-size: 1rem; resize: vertical; font-family: inherit; }
            .primary-btn { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; }
            .results-section { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 2px 10px #00000010; }
            .result-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
            .copy-btn { background: #28a745; color: white; border: none; padding: 8px 12px; border-radius: 6px; font-size: 0.9rem; cursor: pointer; transition: background-color 0.2s; }
            .copy-btn:hover { background: #218838; }
            .copy-btn:active { background: #1e7e34; }
            .copy-btn.copied { background: #17a2b8; }
            .text-display { background: #f8f9fa; padding: 1rem; border-radius: 6px; border-left: 4px solid #667eea; margin: 1rem 0; }
            .diff-container { background: #f8f9fa; padding: 1rem; border-radius: 6px; border-left: 4px solid #667eea; margin: 1rem 0; font-family: 'Courier New', monospace; }
            .diff-added { background-color: #d4edda; color: #155724; padding: 2px 4px; border-radius: 3px; }
            .diff-removed { background-color: #f8d7da; color: #721c24; padding: 2px 4px; border-radius: 3px; text-decoration: line-through; }
            .diff-unchanged { color: #6c757d; }
            .analysis-summary { margin-bottom: 1rem; padding: 1rem; background: #e9ecef; border-radius: 6px; }
            .change-count { font-weight: bold; color: #495057; }
            .error-message { background: #f8d7da; color: #721c24; padding: 1rem; border-radius: 6px; border-left: 4px solid #dc3545; }
        </style>
    </head>
    <body>
        <div class="container">
            <header>
                <h1>PolishPal</h1>
                <p>AI-powered text proofreading with detailed analysis</p>
            </header>

            <main>
                <section class="input-section">
                    <div class="form-group">
                        <label for="input-text">Enter your text to proofread:</label>
                        <textarea id="input-text" placeholder="Type or paste your text here..." rows="6" maxlength="5000"></textarea>
                        <div class="char-counter">
                            <span id="char-count">0</span> / 5000 characters
                        </div>
                    </div>
                    <button id="proofread-btn" class="primary-btn">
                        <span class="btn-text">Proofread Text</span>
                        <span class="loading-spinner" style="display: none">⟳</span>
                    </button>
                </section>

                <section id="results-section" class="results-section" style="display: none">
                    <div class="result-card">
                        <div class="result-header">
                            <h3>Corrected Text:</h3>
                            <button id="copy-btn" class="copy-btn" title="Copy to clipboard">📋 Copy</button>
                        </div>
                        <div id="corrected-text" class="text-display"></div>
                    </div>
                    <div class="result-card">
                        <h3>Analysis:</h3>
                        <div id="analysis-results"></div>
                    </div>
                </section>

                <div id="error-section" class="error-section" style="display: none">
                    <div id="error-message" class="error-message"></div>
                </div>
            </main>
        </div>

        <script>
            class PolishPal {
                constructor() {
                    this.init();
                }

                init() {
                    this.bindEvents();
                    this.updateCharCount();
                }

                bindEvents() {
                    const inputText = document.getElementById('input-text');
                    const proofreadBtn = document.getElementById('proofread-btn');
                    const copyBtn = document.getElementById('copy-btn');
                    
                    inputText.addEventListener('input', () => this.updateCharCount());
                    proofreadBtn.addEventListener('click', () => this.proofreadText());
                    copyBtn.addEventListener('click', () => this.copyToClipboard());
                }

                updateCharCount() {
                    const inputText = document.getElementById('input-text');
                    const charCount = document.getElementById('char-count');
                    const count = inputText.value.length;
                    charCount.textContent = count;
                }

                async proofreadText() {
                    const inputText = document.getElementById('input-text');
                    const text = inputText.value.trim();

                    if (!text) {
                        this.showError('Please enter some text to proofread.');
                        return;
                    }

                    this.setLoading(true);
                    this.hideError();
                    this.hideResults();

                    try {
                        const response = await fetch('/api/proofread', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ text })
                        });

                        const data = await response.json();

                        if (!response.ok) {
                            throw new Error(data.error || 'Failed to proofread text');
                        }

                        this.displayResults(data);
                    } catch (error) {
                        console.error('Error:', error);
                        this.showError(error.message || 'Something went wrong. Please try again.');
                    } finally {
                        this.setLoading(false);
                    }
                }

                displayResults(data) {
                    document.getElementById('corrected-text').textContent = data.corrected;
                    
                    const analysisDiv = document.getElementById('analysis-results');
                    
                    // Use jsdiff to show detailed changes
                    if (typeof Diff !== 'undefined' && data.original && data.corrected) {
                        const diff = Diff.diffWords(data.original, data.corrected);
                        const diffHtml = this.generateDiffHtml(diff);
                        
                        // Count changes
                        const changes = diff.filter(part => part.added || part.removed);
                        const addedCount = diff.filter(part => part.added).length;
                        const removedCount = diff.filter(part => part.removed).length;
                        
                        let summaryHtml = '';
                        if (changes.length > 0) {
                            summaryHtml = 
                                '<div class="analysis-summary">' +
                                    '<div class="change-count">Changes made: ' + changes.length + ' modification(s)</div>' +
                                    '<div>Added: ' + addedCount + ' &bull; Removed: ' + removedCount + '</div>' +
                                '</div>';
                        }
                        
                        analysisDiv.innerHTML = summaryHtml + '<div class="diff-container">' + diffHtml + '</div>';
                    } else {
                        // Fallback to original analysis if jsdiff is not available
                        if (data.analysis && data.analysis.length > 0) {
                            analysisDiv.innerHTML = data.analysis.map(item => 
                                '<div class="analysis-item">' + item.suggestion + '</div>'
                            ).join('');
                        } else {
                            analysisDiv.innerHTML = '<div class="no-errors">No errors found!</div>';
                        }
                    }
                    
                    document.getElementById('results-section').style.display = 'block';
                }

                generateDiffHtml(diff) {
                    return diff.map(part => {
                        if (part.added) {
                            return '<span class="diff-added">' + this.escapeHtml(part.value) + '</span>';
                        } else if (part.removed) {
                            return '<span class="diff-removed">' + this.escapeHtml(part.value) + '</span>';
                        } else {
                            return '<span class="diff-unchanged">' + this.escapeHtml(part.value) + '</span>';
                        }
                    }).join('');
                }

                escapeHtml(text) {
                    const div = document.createElement('div');
                    div.textContent = text;
                    return div.innerHTML;
                }

                async copyToClipboard() {
                    const correctedText = document.getElementById('corrected-text').textContent;
                    const copyBtn = document.getElementById('copy-btn');
                    
                    if (!correctedText) {
                        return;
                    }

                    try {
                        await navigator.clipboard.writeText(correctedText);
                        
                        // Show feedback
                        const originalText = copyBtn.textContent;
                        copyBtn.textContent = '✓ Copied!';
                        copyBtn.classList.add('copied');
                        
                        // Reset after 2 seconds
                        setTimeout(() => {
                            copyBtn.textContent = originalText;
                            copyBtn.classList.remove('copied');
                        }, 2000);
                    } catch (error) {
                        // Fallback for older browsers
                        this.fallbackCopyToClipboard(correctedText);
                    }
                }

                fallbackCopyToClipboard(text) {
                    const textArea = document.createElement('textarea');
                    textArea.value = text;
                    document.body.appendChild(textArea);
                    textArea.select();
                    
                    try {
                        document.execCommand('copy');
                        const copyBtn = document.getElementById('copy-btn');
                        const originalText = copyBtn.textContent;
                        copyBtn.textContent = '✓ Copied!';
                        copyBtn.classList.add('copied');
                        
                        setTimeout(() => {
                            copyBtn.textContent = originalText;
                            copyBtn.classList.remove('copied');
                        }, 2000);
                    } catch (error) {
                        console.error('Copy failed:', error);
                    }
                    
                    document.body.removeChild(textArea);
                }

                showError(message) {
                    document.getElementById('error-message').textContent = message;
                    document.getElementById('error-section').style.display = 'block';
                }

                hideError() {
                    document.getElementById('error-section').style.display = 'none';
                }

                hideResults() {
                    document.getElementById('results-section').style.display = 'none';
                }

                setLoading(isLoading) {
                    const btn = document.getElementById('proofread-btn');
                    const btnText = btn.querySelector('.btn-text');
                    const spinner = btn.querySelector('.loading-spinner');
                    
                    btn.disabled = isLoading;
                    btnText.style.display = isLoading ? 'none' : 'inline';
                    spinner.style.display = isLoading ? 'inline' : 'none';
                }
            }

            // Initialize the app
            new PolishPal();
        </script>
    </body>
</html>`,
            {
                headers: { 'Content-Type': 'text/html' },
            }
        );
    }

    // For other static files, return 404 for now
    // In production, implement KV storage or R2 bucket serving
    return new Response('File not found', {
        status: 404,
        headers: { 'Content-Type': 'text/plain' },
    });
}

/**
 * Main Worker fetch handler
 */
export default {
    async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
        const url = new URL(request.url);
        const pathname = url.pathname;

        // Set CORS headers
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        // Handle preflight requests
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        // Handle API routes
        if (pathname.startsWith('/api/')) {
            const proofreadingService = new ProofreadingService(env);

            // Handle proofread endpoint
            if (pathname === '/api/proofread') {
                // Handle non-POST methods with 405
                if (request.method !== 'POST') {
                    return new Response(
                        JSON.stringify({ error: 'Method not allowed' }),
                        {
                            status: 405,
                            headers: {
                                ...corsHeaders,
                                'Content-Type': 'application/json',
                            },
                        }
                    );
                }

                try {
                    const { text } = await request.json() as { text: string };

                    if (!text || typeof text !== 'string') {
                        return new Response(
                            JSON.stringify({
                                error: 'Text is required and must be a string',
                            }),
                            {
                                status: 400,
                                headers: {
                                    ...corsHeaders,
                                    'Content-Type': 'application/json',
                                },
                            }
                        );
                    }

                    if (text.length > 5000) {
                        return new Response(
                            JSON.stringify({
                                error: 'Text must be less than 5000 characters',
                            }),
                            {
                                status: 400,
                                headers: {
                                    ...corsHeaders,
                                    'Content-Type': 'application/json',
                                },
                            }
                        );
                    }

                    // Get proofreading result
                    const proofreadResult =
                        await proofreadingService.proofreadText(text);

                    // Perform word-by-word analysis
                    const analysis = proofreadingService.analyzeChanges(
                        text,
                        proofreadResult.correctedText
                    );

                    return new Response(
                        JSON.stringify({
                            original: text,
                            corrected: proofreadResult.correctedText,
                            analysis: analysis,
                        }),
                        {
                            headers: {
                                ...corsHeaders,
                                'Content-Type': 'application/json',
                            },
                        }
                    );
                } catch (error) {
                    console.error('Proofreading error:', error);

                    // Return more specific error messages
                    let errorMessage = 'Failed to process text';
                    let statusCode = 500;

                    if (
                        error instanceof Error && error.message.includes('OpenAI API key not configured')
                    ) {
                        errorMessage = 'Service temporarily unavailable';
                        statusCode = 503;
                    } else if (error instanceof Error && error.message.includes('OpenAI API error')) {
                        errorMessage = 'AI service error';
                        statusCode = 502;
                    }

                    return new Response(
                        JSON.stringify({ error: errorMessage }),
                        {
                            status: statusCode,
                            headers: {
                                ...corsHeaders,
                                'Content-Type': 'application/json',
                            },
                        }
                    );
                }
            }

            // Handle other API routes
            return new Response(
                JSON.stringify({ error: 'API route not found' }),
                {
                    status: 404,
                    headers: {
                        ...corsHeaders,
                        'Content-Type': 'application/json',
                    },
                }
            );
        }

        // Handle static files (HTML, CSS, JS)
        return handleStaticFile(request, pathname);
    },
};
