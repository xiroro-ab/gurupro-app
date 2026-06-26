const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('src/components');
files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  for (let i = 0; i < lines.length - 1; i++) {
    const line1 = lines[i].trim();
    const line2 = lines[i+1].trim();
    if (line1.match(/<[A-Z][a-zA-Z]+.*(className|size).*(\/?>|><\/[A-Z][a-zA-Z]+>)/) && line2.match(/^[A-Z][a-zA-Z0-9 ]+$/) && !line2.includes('<')) {
      console.log(`${file}:${i+2}: ${line2}`);
    }
  }
});
