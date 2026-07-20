const fs = require('fs');
let content = fs.readFileSync('src/components/AboutCreatorModal.tsx', 'utf8');

// Ensure profile is object-contain
content = content.replace(
  /className="w-full h-full object-cover object-center" draggable=\{false\}/,
  'className="w-full h-full object-contain bg-[#1a1a1a]" draggable={false}'
);

fs.writeFileSync('src/components/AboutCreatorModal.tsx', content);
