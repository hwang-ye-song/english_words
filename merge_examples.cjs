const fs = require('fs');
const path = require('path');

const chunkPaths = [
  `C:\\Users\\77dpt\\.gemini\\antigravity\\brain\\992d2be4-5146-4e48-bf77-465fd6e6c9a4\\scratch\\chunk_1_done.json`,
  `C:\\Users\\77dpt\\.gemini\\antigravity\\brain\\66bb4bde-e6b4-49df-b62f-9b23fe11e87c\\scratch\\chunk_2_done.json`,
  `C:\\Users\\77dpt\\.gemini\\antigravity\\brain\\f801a556-3247-4434-b73b-183785a3a84b\\scratch\\chunk_3_done.json`,
  `C:\\Users\\77dpt\\.gemini\\antigravity\\brain\\1bc5e704-86bd-40f4-9716-5f8a87acde3e\\scratch\\chunk_4_done.json`,
  `C:\\Users\\77dpt\\.gemini\\antigravity\\brain\\cd27fdbf-53f5-4655-83e2-81cb4a2c08ed\\scratch\\chunk_5_done.json`,
  `C:\\Users\\77dpt\\.gemini\\antigravity\\brain\\fdbfad82-b15f-4c69-9685-69012acf6ce9\\scratch\\chunk_6_done.json`,
  `C:\\Users\\77dpt\\.gemini\\antigravity\\brain\\27ef1ced-0d6f-40eb-840d-7d77b4ff4434\\scratch\\chunk_7_done.json`,
  `C:\\Users\\77dpt\\.gemini\\antigravity\\brain\\e44d02dd-cf7e-4a17-84fc-420f6efa9b1f\\scratch\\chunk_8_done.json`,
  `C:\\Users\\77dpt\\.gemini\\antigravity\\brain\\255043a4-d135-4dde-82e1-ca3e879f5fb3\\scratch\\chunk_9_done.json`,
  `C:\\Users\\77dpt\\.gemini\\antigravity\\brain\\8e109986-2c97-44b0-9db6-400b393a1c5b\\scratch\\chunk_10_done.json`,
  `C:\\Users\\77dpt\\.gemini\\antigravity\\brain\\0f6ee2b0-36ad-4faf-83c0-e982f48ce488\\scratch\\chunk_11_done.json`,
  `C:\\Users\\77dpt\\.gemini\\antigravity\\brain\\1b904873-fa5d-42fa-8e2a-98cde1a63764\\scratch\\chunk_12_done.json`
];

const examplesDict = {};

for (const p of chunkPaths) {
  if (fs.existsSync(p)) {
    const arr = require(p);
    arr.forEach(item => {
      if (item.english && item.example && item.example_translation) {
        examplesDict[item.english] = {
          example: item.example,
          example_translation: item.example_translation
        };
      }
    });
  } else {
    console.warn("Could not find file: " + p);
  }
}

const seedPath = path.join(__dirname, 'src', 'data', 'seedWords.json');
const originalData = require(seedPath);
let updated = 0;

const newData = originalData.map(word => {
  if (!word.example && examplesDict[word.english]) {
    updated++;
    return {
      ...word,
      example: examplesDict[word.english].example,
      example_translation: examplesDict[word.english].example_translation
    };
  }
  return word;
});

fs.writeFileSync(seedPath, JSON.stringify(newData, null, 2), 'utf-8');
console.log(`Successfully merged examples for ${updated} words.`);

const missingNow = newData.filter(w => !w.example).length;
console.log(`Remaining words missing examples: ${missingNow}`);
