const { proofread } = require('./proofreader');
const fs = require('fs');

async function main() {
  const text = process.argv.slice(2).join(' ');
  if (!text) {
    console.error('Usage: node src/index.js "<text to proofread>"');
    process.exit(1);
  }
  const analysis = await proofread(text);
  console.log(JSON.stringify(analysis, null, 2));

  const outDir = 'records';
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir);
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${outDir}/analysis-${timestamp}.json`;
  fs.writeFileSync(filename, JSON.stringify({ text, analysis }, null, 2));
  console.log(`Analysis saved to ${filename}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
