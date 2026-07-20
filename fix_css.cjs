const fs = require('fs');
let code = fs.readFileSync('src/index.css', 'utf-8');

code = code.replace(
  /html, body, #root, #gurupro-workspace, main \{/g,
  `html, body, #root, #gurupro-workspace, .print-flow-fix, main {`
);

fs.writeFileSync('src/index.css', code);
