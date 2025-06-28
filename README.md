# PolishPal - AI Text Proofreading Tool

PolishPal is a Cloudflare Worker application that provides AI-powered text proofreading with detailed word-by-word analysis. It helps users improve their writing by identifying errors and providing corrections with explanations.

## Features

- **Real-time Text Proofreading**: Submit text and get instant corrections
- **Word-by-Word Analysis**: Detailed breakdown of errors with categorization
- **Error Types**: Identifies spelling, grammar, capitalization, missing words, and extra words
- **Modern UI**: Clean, responsive interface with gradient design
- **Character Limit**: Supports up to 5,000 characters per submission
- **Edge Computing**: Runs on Cloudflare's global network for fast response times

## Example

**Input:**

```
i wold no make same again mistak .
```

**Output:**

```
I would not make the same mistake again.
```

**Analysis:**

- `i` → `I` (capitalization)
- `wold` → `would` (spelling)
- `no` → `not` (grammar)
- `make` → `make the` (missing word: "the")
- `again mistak` → `mistake again` (word order)
- `mistak` → `mistake` (spelling)

## Project Structure

```
PolishPal/
├── src/
│   └── index.js               # Main Cloudflare Worker
├── wrangler.toml              # Worker configuration
├── package.json               # Dependencies and scripts
├── migrate.sh                 # Migration script from Pages to Workers
├── .env.example
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd PolishPal
```

2. Install dependencies:

```bash
npm install
```

3. Set up your OpenAI API key:

```bash
wrangler secret put OPENAI_API_KEY
```

4. Start the development server:

```bash
npm run dev
```

5. Open your browser and navigate to:

```
http://localhost:8787
```

### Production Deployment

Deploy to Cloudflare Workers:

```bash
npm run deploy
```

## Migration from Pages to Workers

If you're migrating from the previous Cloudflare Pages version:

1. Run the migration script:

```bash
./migrate.sh
```

2. Set up your OpenAI API key as a Worker secret:

```bash
wrangler secret put OPENAI_API_KEY
```

## API Endpoints

### POST /api/proofread

Proofread text and get analysis.

**Request:**

```json
{
    "text": "i wold no make same again mistak ."
}
```

**Response:**

```json
{
    "original": "i wold no make same again mistak .",
    "corrected": "I would not make the same mistake again.",
    "analysis": [
        {
            "position": 0,
            "original": "i",
            "corrected": "I",
            "type": "capitalization",
            "suggestion": "Capitalize \"I\""
        }
    ]
}
```

## Technology Stack

- **Backend**: Node.js, Express.js
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Security**: Helmet.js for security headers
- **Styling**: Modern CSS with gradients and animations

## Future Enhancements

### AI Integration

Currently uses a mock proofreading service. To integrate with real AI:

1. **OpenAI Integration**: Add OpenAI API calls in `proofreadingService.js`
2. **Anthropic Claude**: Alternative AI service integration
3. **Multiple AI Providers**: Compare results from different AI services

### Example AI Integration:

```javascript
// In proofreadingService.js
async proofreadText(text) {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{
      role: "user",
      content: `Proofread this text: "${text}"`
    }]
  });
  return { correctedText: response.choices[0].message.content };
}
```

### Database Integration

- Replace file storage with a database like PostgreSQL/MongoDB
- Add user authentication and personal data storage

### Advanced Features

- **Bulk Processing**: Handle multiple texts at once
- **Export Options**: PDF, Word document export
- **Analytics Dashboard**: Writing improvement metrics
- **Collaborative Features**: Share and review texts
- **Custom Dictionaries**: Industry-specific terminology

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Deployment

### Cloudflare Workers

As mentioned in the original concept, this can be adapted for Cloudflare Workers:

1. Refactor Express app to use Cloudflare Workers APIs
2. Integrate with Cloudflare AI for proofreading

### Other Platforms

- **Vercel**: Easy deployment with `vercel` command
- **Heroku**: Traditional cloud platform
- **AWS Lambda**: Serverless deployment
- **Docker**: Containerized deployment

## Support

For support, please open an issue on GitHub or contact the development team.
