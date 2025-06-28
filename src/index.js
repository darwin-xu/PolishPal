/**
 * Cloudflare Worker for PolishPal - AI-powered text proofreading
 */

class ProofreadingService {
    constructor(env) {
        this.env = env;
    }

    /**
     * Proofread text using OpenAI API
     * @param {string} text - Original text to proofread
     * @returns {Promise<{correctedText: string}>}
     */
    async proofreadText(text) {
        if (!this.env?.OPENAI_API_KEY) {
            throw new Error('OpenAI API key not configured');
        }

        const prompt =
            `Please proofread and correct the following text. Fix grammar, spelling, punctuation, ` +
            `and improve clarity while maintaining the original meaning and tone.` +
            `Return only the corrected text without any explanations or additional formatting: "${text}"`;

        try {
            const response = await fetch(
                'http://35.234.22.51:8080/v1/chat/completions',
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${this.env.OPENAI_API_KEY}`,
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
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    `OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`
                );
            }

            const data = await response.json();
            const correctedText =
                data.choices?.[0]?.message?.content?.trim() || text;

            return { correctedText };
        } catch (error) {
            console.error('OpenAI API error:', error);
            throw new Error(`Failed to proofread text: ${error.message}`);
        }
    }

    /**
     * Analyze changes between original and corrected text
     * @param {string} original
     * @param {string} corrected
     * @returns {Array<{word: string, type: string, suggestion: string, position: number}>}
     */
    analyzeChanges(original, corrected) {
        const originalWords = original.toLowerCase().split(/\s+/);
        const correctedWords = corrected.toLowerCase().split(/\s+/);
        const analysis = [];

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
     * @param {string} word1
     * @param {string} word2
     * @returns {boolean}
     */
    isSpellingError(word1, word2) {
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
async function handleStaticFile(request, pathname) {
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
            .text-display { background: #f8f9fa; padding: 1rem; border-radius: 6px; border-left: 4px solid #667eea; margin: 1rem 0; }
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
                        <h3>Original Text:</h3>
                        <div id="original-text" class="text-display"></div>
                    </div>
                    <div class="result-card">
                        <h3>Corrected Text:</h3>
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
                    inputText.addEventListener('input', () => this.updateCharCount());
                    proofreadBtn.addEventListener('click', () => this.proofreadText());
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
                    document.getElementById('original-text').textContent = data.original;
                    document.getElementById('corrected-text').textContent = data.corrected;
                    
                    const analysisDiv = document.getElementById('analysis-results');
                    if (data.analysis && data.analysis.length > 0) {
                        analysisDiv.innerHTML = data.analysis.map(item => 
                            '<div class="analysis-item">' + item.suggestion + '</div>'
                        ).join('');
                    } else {
                        analysisDiv.innerHTML = '<div class="no-errors">No errors found!</div>';
                    }
                    
                    document.getElementById('results-section').style.display = 'block';
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
    async fetch(request, env, ctx) {
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
                    const { text } = await request.json();

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
                        error.message.includes('OpenAI API key not configured')
                    ) {
                        errorMessage = 'Service temporarily unavailable';
                        statusCode = 503;
                    } else if (error.message.includes('OpenAI API error')) {
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
