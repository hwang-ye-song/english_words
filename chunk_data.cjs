const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'src', 'data', 'seedWords.json');
const scratchDir = 'C:\\Users\\77dpt\\.gemini\\antigravity\\brain\\b546f28f-24a3-4560-aaf6-08b4d252e1bc\\scratch';

if (!fs.existsSync(scratchDir)) {
  fs.mkdirSync(scratchDir, { recursive: true });
}

const data = require(srcPath);
const missing = data.filter(w => !w.example);

// 2379 items. Chunk into 12 parts -> 2379 / 12 = 198 items per chunk
const numChunks = 12;
const chunkSize = Math.ceil(missing.length / numChunks);

for (let i = 0; i < numChunks; i++) {
  const chunk = missing.slice(i * chunkSize, (i + 1) * chunkSize);
  const outPath = path.join(scratchDir, `chunk_${i + 1}.json`);
  fs.writeFileSync(outPath, JSON.stringify(chunk, null, 2), 'utf-8');
}

console.log(`Created ${numChunks} chunks in scratch dir.`);
