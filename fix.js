const fs = require('fs');
let content = fs.readFileSync('src/components/AboutCreatorModal.tsx', 'utf8');
content = content.replace(/\\\${/g, '${');
fs.writeFileSync('src/components/AboutCreatorModal.tsx', content);
