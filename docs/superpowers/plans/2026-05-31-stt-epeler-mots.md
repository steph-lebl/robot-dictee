# STT « Épeler les mots » Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an iOS speech-to-text "spell the words" mode where dictated letters (e.g. `A. M. O. U. R.`) are transformed into the word and validated by Robot Dictée's existing exact-match engine.

**Architecture:** A pure function `sttToWord(rawInput, expectedWord)` (new module `model/sttTranscription.js`) converts raw iOS output into a word: letters are transcribed blindly, and the expected word is consulted only to fill accents (`é`, `è`, `ç`, …), which iOS cannot dictate reliably. The mode is activated by a `stt` query-string flag, shown permanently in the header. Commit happens on a keyboard **SPACE keydown** (not on observing a trailing space), so iOS-inserted spaces are ignored. A read-only live preview shows the interpreted word without ever writing to the input field (iOS keeps sole ownership of it).

**Tech Stack:** Vanilla ES5-ish JS, IIFE modules, Knockout.js (browser). Tests run headless via Node's built-in test runner (`node --test`) — zero new dependencies, runnable inside the dev container. The existing Jasmine specs stay browser-only (they need Knockout/LINQ); the new pure function is tested in Node.

**Spec:** `docs/superpowers/specs/2026-05-31-stt-epeler-mots-design.md` (§4.3 is the behavior contract — all 33 cases below come from it).

---

## File Structure

- **Create** `model/sttTranscription.js` — pure transcription function `sttToWord(raw, expected)` (+ helpers `tokenize`, `deaccent`). Dual export: browser global `robotDictee.sttToWord` and Node `module.exports`.
- **Create** `model/spec/sttTranscription.test.js` — Node test runner covering every spec §4.3 case.
- **Modify** `package.json` — add `test` script.
- **Modify** `model/dictation.js` — expose `currentExpectedWord()`.
- **Modify** `viewModel.js` — accept `sttMode`; add keydown-commit, live-preview computed, STT commit path.
- **Modify** `main.js` — detect `stt` query string, set `document.title`, pass flag to the view model.
- **Modify** `index.html` — load the new module, header mode badge, preview element, keydown binding.
- **Modify** `robotDictee.css` — minimal styling for badge and preview.

Tasks 1–3 build and fully test the pure function headlessly. Task 4 wires it into the (DOM/Knockout) app and is verified manually/on device per spec §8.

---

## Task 1: Pure module skeleton + letters-only transcription

Covers spec §4.3 "Général", "Voyelles sans points", and the directly-typed accented-letter cases (`sèche`, `très` v2, `mère`) — none of which need accent-name parsing yet.

**Files:**
- Create: `model/sttTranscription.js`
- Create: `model/spec/sttTranscription.test.js`
- Modify: `package.json`

- [ ] **Step 1: Add the test script to `package.json`**

Replace the `scripts` block (`package.json:6-8`):

```json
  "scripts": {
    "test": "node --test 'model/spec/*.test.js'"
  },
```

(Scoped to `model/spec/*.test.js` so `node --test`'s `test-*.js` auto-discovery does not pick up `exploration/test-brouillon.js`, which calls an external API and fails.)

- [ ] **Step 2: Write the failing test file**

Create `model/spec/sttTranscription.test.js`:

```js
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
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `node --test model/spec/sttTranscription.test.js`
Expected: FAIL — `Cannot find module '../sttTranscription'`.

- [ ] **Step 4: Write the minimal implementation**

Create `model/sttTranscription.js`:

```js
(function(root, factory){
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; }
  root.robotDictee = root.robotDictee || {};
  root.robotDictee.sttToWord = api.sttToWord;
})(typeof self !== 'undefined' ? self : this, function(){

  // Strip diacritics: 'é'->'e', 'ç'->'c', 'È'->'E', etc.
  function deaccent(s){
    return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  // Split the raw iOS output into individual letter tokens.
  // Periods, commas and spaces are noise; glued letters ("OU","BE") are split.
  function tokenize(brut){
    var s = (brut || "").toLowerCase().replace(/[.,]/g, " ");
    var tokens = [];
    var chunks = s.split(/\s+/);
    for (var c = 0; c < chunks.length; c++){
      var chunk = chunks[c];
      if (chunk === "") continue;
      for (var k = 0; k < chunk.length; k++){
        tokens.push({ type: "letter", ch: chunk[k] });
      }
    }
    return tokens;
  }

  // Concatenate de-accented base letters (what the child actually spelled).
  function rawTranscription(tokens){
    var out = "";
    for (var i = 0; i < tokens.length; i++){
      if (tokens[i].type === "letter") out += deaccent(tokens[i].ch);
    }
    return out;
  }

  function sttToWord(brut, attendu){
    attendu = attendu || "";
    var tokens = tokenize(brut);
    var letters = rawTranscription(tokens);
    if (letters === deaccent(attendu.toLowerCase())) return attendu;
    return letters;
  }

  return { sttToWord: sttToWord, tokenize: tokenize, deaccent: deaccent };
});
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `node --test model/spec/sttTranscription.test.js`
Expected: PASS — `# pass 13`, `# fail 0`.

- [ ] **Step 6: Commit**

```bash
git add model/sttTranscription.js model/spec/sttTranscription.test.js package.json
git commit -m "feat: sttToWord letters-only transcription with headless tests"
```

---

## Task 2: Accent-name markers (`Accent aigu`, `tréma`, …)

iOS spells accents as words (`P. R. E. Accent aiguë S. E. N. T.`). Their letters must NOT leak into the transcription. We recognize the phrases, drop them, and (since the expected word supplies accents) the base letters then match the expected word.

**Files:**
- Modify: `model/sttTranscription.js`
- Modify: `model/spec/sttTranscription.test.js`

- [ ] **Step 1: Add the failing cases**

In `model/spec/sttTranscription.test.js`, insert these rows into `CASES`, just before the closing `];`:

```js
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
```

- [ ] **Step 2: Run the test to verify the new cases fail**

Run: `node --test model/spec/sttTranscription.test.js`
Expected: FAIL — `présent` etc. fail (e.g. `généreux` produces `geaccentaiguenereuxx`-style garbage because accent-word letters leak in). Earlier 13 cases still PASS.

- [ ] **Step 3: Implement accent-phrase recognition in `tokenize`**

In `model/sttTranscription.js`, replace the whole `tokenize` function with:

```js
  // iOS accent phrases, longest first. Only their PRESENCE matters; the actual
  // accent is taken from the expected word, so we collapse each to one marker.
  var ACCENT_PHRASES = [
    "accent circonflexe", "accent complexe", "accent aiguë", "accent aigu",
    "accent grave", "circonflexe", "complexe", "tréma", "trema",
    "aiguë", "aigu", "grave"
  ];
  var ACCENT_MARKER = "\u0001";

  // Split the raw iOS output into letter tokens and accent-marker tokens.
  // Accent phrases are collapsed to a marker; periods/commas/spaces are noise;
  // glued letters ("OU","BE") are split into individual letters.
  function tokenize(brut){
    var s = (brut || "").toLowerCase();
    for (var i = 0; i < ACCENT_PHRASES.length; i++){
      s = s.split(ACCENT_PHRASES[i]).join(" " + ACCENT_MARKER + " ");
    }
    s = s.replace(/[.,]/g, " ");
    var tokens = [];
    var chunks = s.split(/\s+/);
    for (var c = 0; c < chunks.length; c++){
      var chunk = chunks[c];
      if (chunk === "") continue;
      if (chunk === ACCENT_MARKER){ tokens.push({ type: "accent" }); continue; }
      for (var k = 0; k < chunk.length; k++){
        tokens.push({ type: "letter", ch: chunk[k] });
      }
    }
    return tokens;
  }
```

(`rawTranscription` already filters to `type === "letter"`, so accent markers are ignored by the current `sttToWord`. No other change needed in this task.)

- [ ] **Step 4: Run the test to verify all cases pass**

Run: `node --test model/spec/sttTranscription.test.js`
Expected: PASS — `# pass 28`, `# fail 0`.

- [ ] **Step 5: Commit**

```bash
git add model/sttTranscription.js model/spec/sttTranscription.test.js
git commit -m "feat: recognize iOS accent-name phrases in sttToWord"
```

---

## Task 3: Expected-aware alignment (swallowed vowels, parasites, real mistakes)

Two spec cases still fail because letter counts don't line up:
- **`généreux` v2** — iOS emits only the accent name for the first `é` (no vowel): `G. Accent aiguë, …`.
- **`flûte` v2** — a garbled accent: `… U. X. Complexe …` (the stray `X` is part of a mis-heard "accent circonflexe").

These need a tolerant alignment against the expected word. The same alignment makes real **letter** mistakes fall through to a raw transcription (shown red), proving accent tolerance does not mask spelling errors.

**Files:**
- Modify: `model/sttTranscription.js`
- Modify: `model/spec/sttTranscription.test.js`

- [ ] **Step 1: Add the failing cases**

In `model/spec/sttTranscription.test.js`, insert these rows into `CASES`, just before the closing `];`:

```js
  // --- Cas délicats: voyelle avalée & lettre parasite ---
  ['généreux', 'G. Accent aiguë, N E. Accent aigu RE U. X.', 'généreux'],
  ['flûte',    'F. L. U. X. Complexe T E.',                  'flûte'],
  // --- Vraies fautes (la tolérance d'accent ne masque pas une faute de lettre) ---
  ['amour',     'A. M. O. R.',                  'amor'],
  ['spectacle', 'S. P. E. K. T. A. C. L. E.',   'spektacle'],
  ['présent',   'P. R. E. S. A. N. T.',         'presant'],
```

- [ ] **Step 2: Run the test to verify the new cases fail**

Run: `node --test model/spec/sttTranscription.test.js`
Expected: FAIL — `généreux` v2 yields `gnereux`, `flûte` v2 yields `fluxte`; the fault cases already pass. Earlier 28 cases still PASS.

- [ ] **Step 3: Replace the simple compare with alignment**

In `model/sttTranscription.js`, add the `tryAlign` function (place it just above `sttToWord`):

```js
  // Walk the expected word; consume input tokens tolerantly.
  // Returns the accented expected word on success, or null on a real letter mismatch.
  function tryAlign(tokens, expected){
    var out = "";
    var t = 0;
    for (var e = 0; e < expected.length; e++){
      var ec = expected[e];
      var ecLower = ec.toLowerCase();
      var ecBase = deaccent(ecLower);
      if (!/[a-z]/.test(ecBase)){
        out += ec;            // apostrophe / hyphen / punctuation: taken from expected
        continue;
      }
      var ecAccented = (ecLower !== ecBase);   // é, è, ç, ô, …
      var matched = false;
      while (t < tokens.length){
        var tok = tokens[t];
        if (tok.type === "accent"){
          if (ecAccented){     // iOS swallowed the vowel, emitted only the accent name
            out += ec; t++; matched = true; break;
          }
          t++; continue;       // stray marker before a plain letter: skip it
        }
        if (deaccent(tok.ch) === ecBase){
          out += ec; t++;
          if (ecAccented && t < tokens.length && tokens[t].type === "accent") t++;
          matched = true; break;
        }
        // non-matching letter immediately followed by a marker => garbled
        // "accent ..." phrase (e.g. "X. Complexe"): absorb the parasite + marker.
        if (t + 1 < tokens.length && tokens[t + 1].type === "accent"){ t += 2; continue; }
        return null;           // genuine letter mismatch
      }
      if (!matched) return null;
    }
    while (t < tokens.length && tokens[t].type === "accent") t++;
    if (t < tokens.length) return null;   // extra dictated letters
    return out;
  }
```

Then replace the body of `sttToWord` with:

```js
  function sttToWord(brut, attendu){
    attendu = attendu || "";
    var tokens = tokenize(brut);
    var aligned = tryAlign(tokens, attendu);
    if (aligned !== null) return aligned;
    return rawTranscription(tokens);
  }
```

- [ ] **Step 4: Run the full suite to verify everything passes**

Run: `node --test model/spec/sttTranscription.test.js`
Expected: PASS — `# pass 33`, `# fail 0`.

- [ ] **Step 5: Commit**

```bash
git add model/sttTranscription.js model/spec/sttTranscription.test.js
git commit -m "feat: expected-aware alignment for swallowed vowels and parasites"
```

---

## Task 4: Wire the STT mode into the app

DOM + Knockout glue. Not headlessly testable (no DOM/Knockout in Node) — verified in a browser and on device per spec §8.

**Files:**
- Modify: `model/dictation.js`
- Modify: `viewModel.js`
- Modify: `main.js`
- Modify: `index.html`
- Modify: `robotDictee.css`

- [ ] **Step 1: Expose the current expected word from the dictation**

In `model/dictation.js`, add to the returned object (after `paragraphs,` at line 20):

```js
      currentExpectedWord,
```

And add this function inside `createDictation` (e.g. after the `currentWord` function, around line 50):

```js
    function currentExpectedWord(){
      var w = words()[_currentWordIndex()];
      return w ? w.expected() : "";
    }
```

- [ ] **Step 2: Add STT support to the view model**

In `viewModel.js`:

(a) Change the signature (line 4):

```js
  function createViewModel(textToSpeechEngine, sttMode){
```

(b) Add the observable after `var _currentPage = ko.observable('newDictation');` (line 24):

```js
    var _sttMode = ko.observable(!!sttMode);
    var _currentWordPreview = ko.computed(function(){
      if(!_sttMode()) return "";
      var d = _dictation();
      if(!d) return "";
      return global.robotDictee.sttToWord(_currentWordText(), d.currentExpectedWord());
    });
```

(c) Add three fields to the returned object (inside the `return { … }` at lines 28-40, e.g. after `currentPage:_currentPage`):

```js
      ,sttMode:_sttMode
      ,currentWordPreview:_currentWordPreview
      ,onInputKeyDown
```

(d) Replace `onCurrentWordTextChanged` (lines 42-46) so STT does NOT commit on observed spaces:

```js
    function onCurrentWordTextChanged(newValue){
      if(_sttMode()) return;
      if(getLastChar(_currentWordText())==' '){
        commitWord();
      }
    }
```

(e) Add the keydown handler and STT commit path (e.g. right after `commitWord` at line 56):

```js
    function onInputKeyDown(data, event){
      if(_sttMode() && (event.key === ' ' || event.code === 'Space' || event.keyCode === 32)){
        event.preventDefault();
        commitWordStt();
        return false;
      }
      return true;
    }

    function commitWordStt(){
      var raw = _currentWordText();
      var expected = _dictation().currentExpectedWord();
      var value = global.robotDictee.sttToWord(raw, expected);
      _currentWordText("");
      _dictation().commitCurrentWord(value);
    }
```

- [ ] **Step 3: Detect the `stt` flag and pass it in (`main.js`)**

Replace `main.js` contents with:

```js
(function(global){

  var isStt = new URLSearchParams(global.location.search).has('stt');
  if(isStt){
    global.document.title = "Robot Dictée — Épeler les mots (Reconnaissance vocale iOS)";
  }

  var textToSpeechEngine = global.robotDictee.createSpeechSynthesisTextToSpeechEngine();
  var viewModel = global.robotDictee.createViewModel(textToSpeechEngine, isStt);

  global.robotDictee.viewModel=viewModel;//stle: global to allow for handling ENTER

  ko.applyBindings(viewModel);
})(this)
```

- [ ] **Step 4: Load the module + add badge, preview, and keydown binding (`index.html`)**

(a) Add the script tag after `word.js` (after line 14):

```html
  <script type="text/javascript" src="model/sttTranscription.js"></script>
```

(b) Replace the title `<h1>` (line 42) with:

```html
    <h1>Robot Dictée<span class="stt-badge" data-bind="visible: sttMode"> — Épeler les mots (Reconnaissance vocale iOS)</span></h1>
```

(c) Replace the input element (line 103) with one that binds keydown:

```html
      <input id="currentWordText" type="text" name="currentWordText" autofocus data-bind='textInput: currentWordText, visible:dictation().isFinished()===false, event:{ keydown: onInputKeyDown }'/>
```

(d) Add the live preview right after that input:

```html
      <div class="stt-preview" data-bind="visible: sttMode() &amp;&amp; dictation() &amp;&amp; dictation().isFinished()===false, text: currentWordPreview"></div>
```

- [ ] **Step 5: Minimal styling (`robotDictee.css`)**

Append to `robotDictee.css`:

```css
.stt-badge { font-size: 0.5em; font-weight: normal; opacity: 0.85; }
.stt-preview { margin-top: 0.5em; font-size: 1.2em; color: #555; min-height: 1.2em; }
.stt-preview:before { content: "→ "; }
```

- [ ] **Step 6: Verify the pure-function suite still passes**

Run: `node --test model/spec/sttTranscription.test.js`
Expected: PASS — `# pass 33`, `# fail 0` (integration did not touch the module).

- [ ] **Step 7: Manual verification (browser, then device)**

Serve locally and open in a browser:

Run: `python3 -m http.server 8000` (then open `http://localhost:8000/`)

Browser checks (desktop, simulating STT by typing the raw text then pressing SPACE):
1. Open `http://localhost:8000/?stt`. The header shows the badge "— Épeler les mots (Reconnaissance vocale iOS)" and the tab title is updated.
2. Open `http://localhost:8000/` (no flag): no badge; commit-on-space works exactly as before (regression).
3. Start a dictation in `?stt`. Type `A. M. O. U. R.` (with the spaces/periods) — it must NOT commit on the internal spaces; the preview shows `→ amour`. Press SPACE once: the word commits as `amour` (green) and advances.
4. Type a wrong spelling (`A. M. O. R.`), press SPACE: commits as `amor`, shown as a mistake (red) vs `amour`.
5. Press ENTER on the empty input: it still replays the current segment.

Device checks (iPhone, the only non-automatable part — spec §8):
6. Using iOS voice dictation, spell a word; confirm internal spaces/periods do NOT commit early and that a keyboard SPACE commits. If iOS does not fire a distinguishable space keydown, note it — fallback would be to also accept `beforeinput` with `inputType === "insertText"` and `data === " "`.

- [ ] **Step 8: Commit**

```bash
git add model/dictation.js viewModel.js main.js index.html robotDictee.css
git commit -m "feat: activate STT spelling mode (query flag, keydown commit, live preview)"
```

---

## Task 5: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full headless suite**

Run: `npm test`
Expected: PASS — `# pass 33`, `# fail 0`, exit code 0.

- [ ] **Step 2: Confirm no regression in the existing browser specs**

Open `model/spec/SpecRunner.html` in a browser; confirm the existing Dictation/Segment specs are still green (they are unaffected, but `dictation.js` gained a method).

- [ ] **Step 3: Cross-check the spec**

Re-read `docs/superpowers/specs/2026-05-31-stt-epeler-mots-design.md` and confirm each section maps to delivered work (see "Spec coverage" below).

---

## Spec Coverage (self-review)

- §2 Activation (`stt` flag, header badge, `document.title`, exit by reload) → Task 4 (Steps 3, 4).
- §3 Capture & commit (keyboard SPACE keydown, ENTER preserved, normal mode unchanged) → Task 4 (Step 2d/2e), manual verify Step 7.
- §4 Transformation (hybrid: blind letters + accents from expected; tokenize; alignment; ç auto-filled; parasite absorption) → Tasks 1–3.
- §4.3 All 33 cases → Tasks 1–3 tests.
- §5 Live preview (read-only computed, never writes the field) → Task 4 (Step 2b, Step 4d).
- §6 Integration points → Task 4.
- §7 Headless tests of the pure function → Tasks 1–3 (`node --test`).
- §8 Device-only checks → Task 4 (Step 7, device).
- §9 Out of scope → respected (no toggle/persistence/analytics; normal mode untouched).
- §10 Open questions: casing handled (output preserves expected case on match, lowercase on mistake — via `tryAlign`/`rawTranscription`); accent vocabulary lives in `ACCENT_PHRASES` (extensible).

**Deliberate deviation from spec §6:** the accent vocabulary lives in `model/sttTranscription.js` (`ACCENT_PHRASES`), not `model/config.js`. Rationale: it keeps the pure function fully self-contained and Node-testable without loading the browser-only `config.js`, which directly serves the spec's top priority (dev-container testability). Still a single, obvious place to extend.
