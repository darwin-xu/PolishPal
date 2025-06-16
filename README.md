# PolishPal

This project aims to build a tool that helps users polish and proofread their English writing using AI. The application performs word by word analysis and stores the results for later review.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Obtain an OpenAI API key and set it as an environment variable:
   ```bash
   export OPENAI_API_KEY=your_key_here
   ```

## Usage

Run the proofreader by providing the text to check:

```bash
npm start -- "This is an example sentence."
```

The analysis output will be printed to the console and saved under the `records/` directory as a JSON file with a timestamped filename.

If the `OPENAI_API_KEY` environment variable is not provided or if the API call fails, the application will generate a dummy analysis for each word.
