/**
 * Proofreading service using AI (placeholder for now)
 * In production, this would integrate with OpenAI, Anthropic, or similar AI services
 */

class ProofreadingService {
    /**
     * Proofread text using AI
     * @param {string} text - Original text to proofread
     * @returns {Promise<{correctedText: string}>}
     */
    async proofreadText(text) {
        // For now, we'll use a simple mock implementation
        // In production, you would call an AI API here
        const correctedText = this.mockProofread(text);

        return {
            correctedText: correctedText,
        };
    }

    /**
     * Mock proofreading function for development
     * @param {string} text
     * @returns {string}
     */
    mockProofread(text) {
        // Simple corrections for common mistakes
        let corrected = text
            .replace(/\bi\b/g, 'I') // Capitalize standalone 'i'
            .replace(/\bwold\b/g, 'would') // Common misspelling
            .replace(/\bno\b(?=\s+make)/g, 'not') // Context-aware correction
            .replace(/\bmistak\b/g, 'mistake') // Missing letter
            .replace(/\bagain\s+mistake/g, 'mistake again') // Word order
            .replace(/\bmake\s+same/g, 'make the same') // Missing article
            .replace(/\s+/g, ' ') // Clean up extra spaces
            .replace(/\s+\./g, '.') // Fix spacing before period
            .trim();

        // Capitalize first letter
        corrected = corrected.charAt(0).toUpperCase() + corrected.slice(1);

        return corrected;
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

module.exports = new ProofreadingService();
