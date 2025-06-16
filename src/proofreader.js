const { OpenAI } = require('openai');

async function proofread(text) {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY not provided, returning dummy analysis');
    return text.split(/\s+/).map(word => ({ word, comment: 'No analysis (API key missing)' }));
  }
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful proofreader. For each word in the user text, return a JSON array of objects with keys `word`, `correction`, and `comment`. If the word is correct leave `correction` empty.' },
        { role: 'user', content: text }
      ],
      response_format: { type: 'json_object' }
    });
    const content = completion.choices[0].message.content;
    try {
      return JSON.parse(content);
    } catch (err) {
      console.warn('Failed to parse AI response, returning raw content');
      return { raw: content };
    }
  } catch (err) {
    console.error('Error calling OpenAI:', err.message);
    return text.split(/\s+/).map(word => ({ word, comment: 'Error contacting AI' }));
  }
}

module.exports = { proofread };
