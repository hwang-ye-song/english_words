const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const workbook = xlsx.readFile('영단어_2480개_데이터셋.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

const words = [];
for (let i = 1; i < data.length; i++) {
  const row = data[i];
  if (!row || !row[0] || !row[1]) continue;
  
  const english = String(row[0]).trim();
  let korean_raw = String(row[1]).trim();
  
  let memo_tip = null;
  const match = korean_raw.match(/\((.*?)\)/);
  if (match) {
    memo_tip = match[1].trim();
    korean_raw = korean_raw.replace(/\(.*?\)/g, '').trim();
  }
  
  words.push({
    english,
    korean: korean_raw,
    memo_tip
  });
}

fs.mkdirSync(path.join(__dirname, 'src', 'data'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'src', 'data', 'seedWords.json'), JSON.stringify(words, null, 2));
console.log(`Successfully extracted ${words.length} words to seedWords.json`);
