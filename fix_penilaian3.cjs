const fs = require('fs');
let code = fs.readFileSync('src/components/PenilaianSiswa.tsx', 'utf-8');

// The file currently has this:
/*
                </div>
                   
                {/* Hidden Print Content for Riwayat *\/}
                <div className="hidden" id="print-riwayat-nilai">
*/

code = code.replace(
  /                <\/div>\s*\{\/\* Hidden Print Content for Riwayat \*\/\}\s*<div className="hidden" id="print-riwayat-nilai">/g,
  `                </div>
          </div>
                {/* Hidden Print Content for Riwayat */}
                <div className="hidden print:block print-area print:p-8 bg-white" id="print-riwayat-nilai">`
);

// Close the outer div for riwayat_input
// The current ending is:
/*
                      <p className="text-sm font-mono">NIP. {profile.nip || '-'}</p>
                    </div>
                  </div>
                </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
*/

code = code.replace(
  /                      <p className="text-sm font-mono">NIP\. \{profile\.nip \|\| '-'\\}<\/p>\n                    <\/div>\n                  <\/div>\n                <\/div>\n                <\/>\n              \);\n            \}\)\(\)\}\n          <\/div>\n        <\/div>\n      \)\}/g,
  `                      <p className="text-sm font-mono">NIP. {profile.nip || '-'}</p>
                    </div>
                  </div>
                </div>
          </div>
                </>
              );
            })()}
          </div>
        </div>
      )}`
);

fs.writeFileSync('src/components/PenilaianSiswa.tsx', code);
