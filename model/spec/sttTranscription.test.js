const test = require('node:test');
const assert = require('node:assert/strict');
const { sttToWord } = require('../sttTranscription');

// [expectedWord, rawIosDictation, wantOutput]
const CASES = [
  // --- Général ---
  ['amour',     'A. M. O. U. R.',                 'amour'],
  ['soie',      'S. O. I E.',                      'soie'],
  ['soin',      'S. O. I N.',                      'soin'],
  ['son',       'S. O. N.',                        'son'],
  ['spectacle', 'S. P. E. C. T. A. C. L. E.',      'spectacle'],
  ['sucre',     'S. U. C. R. E.',                  'sucre'],
  ['surface',   'S. U. R. F. A. C. E.',            'surface'],
  // --- Voyelles sans points (lettres collées) ---
  ['secouer',   'S. E. C. O U. E. R.',             'secouer'],
  ['soulier',   'S. OU L. I. E. R.',               'soulier'],
  ['souriant',  'S. OU R. I A. N. T.',             'souriant'],
  // --- Lettres déjà accentuées (pas de nom d'accent) ---
  ['sèche',     'S. È. C. H. E.',                  'sèche'],
  ['très',      'T. R. È, S.',                     'très'],
  ['mère',      'M. È, R. E.',                     'mère'],
];

for (const [expected, raw, want] of CASES) {
  test(`${expected} ⟵ ${raw}`, () => {
    assert.equal(sttToWord(raw, expected), want);
  });
}
