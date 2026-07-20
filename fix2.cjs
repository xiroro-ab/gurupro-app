const fs = require('fs');
let content = fs.readFileSync('src/components/AboutCreatorModal.tsx', 'utf8');

// 1. Fix transform-origin and will-change
content = content.replace(
  /className="absolute top-0 left-0 w-\[260px\] pointer-events-auto cursor-grab active:cursor-grabbing select-none origin-\[50%_-25px\] will-change-transform"/,
  'className="absolute top-0 left-0 w-[260px] pointer-events-auto cursor-grab active:cursor-grabbing select-none" style={{ transformOrigin: "50% -25px", willChange: "transform" }}'
);

// 2. Fix images and fit
// Profile Image
content = content.replace(
  /src="https:\/\/raw\.githubusercontent\.com\/xiroro-ab\/Toko-Online-Script-Mlbb\/refs\/heads\/main\/photo1721528472\.jpeg" alt="Profile" className="w-full h-full object-cover object-top"/,
  'src="https://raw.githubusercontent.com/xiroro-ab/bab3-sk-kelas8v2-aris/refs/heads/main/1752495560972.jpg" alt="Profile" className="w-full h-full object-cover object-center"'
);

// YouTube Screenshot
content = content.replace(
  /src="https:\/\/raw\.githubusercontent\.com\/xiroro-ab\/Toko-Online-Script-Mlbb\/refs\/heads\/main\/WhatsApp%20Image%202026-07-15%20at%2023\.41\.21\.jpeg" alt="YouTube Screenshot" className="w-full h-full object-cover object-top"/,
  'src="https://raw.githubusercontent.com/xiroro-ab/Toko-Online-Script-Mlbb/refs/heads/main/WhatsApp%20Image%202026-07-15%20at%2023.41.21.jpeg" alt="YouTube Screenshot" className="w-full h-full object-contain bg-[#121212]"'
);

// 3. Fix Intersection Observer
content = content.replace(
  /rootMargin: '-100px 0px -40% 0px'/,
  "rootMargin: '-50% 0px -50% 0px'"
);

fs.writeFileSync('src/components/AboutCreatorModal.tsx', content);
