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
  // --- Accents par nom (mot attendu fournit l'accent) ---
  ['présent',  'P. R. E. Accent aiguë S. E. N. T.',          'présent'],
  ['bébé',     'B. E. Accent aigu B E. Accent aigu',         'bébé'],
  ['bébé',     'B. E. Accent aigu BE Accent aigu',           'bébé'],
  ['bébé',     'B. E. Accent aiguë BE Accent aiguë',         'bébé'],
  ['bébé',     'B. E. Accent aiguë BE accent aiguë',         'bébé'],
  ['bébé',     'B. E. Accent aigu BE Accent aiguë',          'bébé'],
  ['généreux', 'G. E. Accent aiguë, NE accent aiguë REU X.', 'généreux'],
  ['très',     'T. R. E. Grave S.',                          'très'],
  ['où',       'O. U. Accent grave.',                        'où'],
  ['sûr',      'S. U. Accent circonflexe R.',                'sûr'],
  ['hôpital',  'H.O accent circonflexe, P. I. T. A. L.',     'hôpital'],
  ['hôpital',  'H.O accent complexe, P I.T A. L.',           'hôpital'],
  ['flûte',    'F. L. U. Accent complexe T E.',              'flûte'],
  ['noël',     'N. O. E tréma L.',                           'noël'],
  ['leçon',    'L. E. C. O N.',                              'leçon'],
];

for (const [expected, raw, want] of CASES) {
  test(`${expected} ⟵ ${raw}`, () => {
    assert.equal(sttToWord(raw, expected), want);
  });
}
