const fs = require('fs');
let code = fs.readFileSync('src/components/JurnalMengajar.tsx', 'utf-8');

// Change root element from <div id={`${type}-section`} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
// to: <div><div id={`${type}-section`} className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:hidden">

code = code.replace(
  /<div id=\{\`\$\{type\}-section\`\} className="grid grid-cols-1 lg:grid-cols-3 gap-8">/,
  `<div>
      <div id={\`\${type}-section\`} className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:hidden">`
);

// We need to close this div before the Print Preview Modal, OR at the end of the grid.
// Let's find the closing tag. The grid div contains "Recording Form Column" and "History Column".
// Let's check where the grid ends.
