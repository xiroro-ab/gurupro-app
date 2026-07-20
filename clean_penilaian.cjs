const fs = require('fs');
let code = fs.readFileSync('src/components/PenilaianSiswa.tsx', 'utf-8');

// 1. Remove the incorrectly placed `</div></div>` in the IIFE
code = code.replace(
  /                  <\/table>\n                <\/div>\n          <\/div>\n                \{\/\* Hidden Print Content for Riwayat \*\/\}\n                <div className="hidden print:block print-area print:p-8 bg-white" id="print-riwayat-nilai">/g,
  `                  </table>
                </div>

                {/* Hidden Print Content for Riwayat */}
                <div className="hidden print:block print-area print:p-8 bg-white" id="print-riwayat-nilai">`
);

// 2. Remove the extra closing divs I added at the end of IIFE
// I added `</div> </div>` before `</>` in my previous script, but wait, I just added them before `</>`. Let's see how it looks:
/*
                      <p className="text-sm font-mono">NIP. {profile.nip || '-'}</p>
                    </div>
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
  /                      <p className="text-sm font-mono">NIP\. \{profile\.nip \|\| '-'\\}<\/p>\n                    <\/div>\n                  <\/div>\n                <\/div>\n          <\/div>\n                <\/>\n              \);\n            \}\)\(\)\}\n          <\/div>\n        <\/div>\n      \)\}/g,
  `                      <p className="text-sm font-mono">NIP. {profile.nip || '-'}</p>
                    </div>
                  </div>
                </div>
                </>
              );
            })()}
          </div>
          </div>
        </div>
      )}`
);

fs.writeFileSync('src/components/PenilaianSiswa.tsx', code);
