(function(root, factory){
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; }
  root.robotDictee = root.robotDictee || {};
  root.robotDictee.sttToWord = api.sttToWord;
})(typeof self !== 'undefined' ? self : this, function(){

  // Strip diacritics: 'é'->'e', 'ç'->'c', 'È'->'E', etc.
  function deaccent(s){
    return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  // iOS accent phrases, longest first. Only their PRESENCE matters; the actual
  // accent is taken from the expected word, so we collapse each to one marker.
  var ACCENT_PHRASES = [
    "accent circonflexe", "accent complexe", "accent aiguë", "accent aigu",
    "accent grave", "circonflexe", "complexe", "tréma", "trema",
    "aiguë", "aigu", "grave"
  ];
  var ACCENT_MARKER = "\x01";

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

  // Concatenate de-accented base letters (what the child actually spelled).
  function rawTranscription(tokens){
    var out = "";
    for (var i = 0; i < tokens.length; i++){
      if (tokens[i].type === "letter") out += deaccent(tokens[i].ch);
    }
    return out;
  }

  // Walk the expected word; consume input tokens tolerantly.
  // Returns the accented expected word on success, or null on a real letter mismatch.
  // Assumption (matches observed iOS output): an accent name always FOLLOWS its
  // letter ("E. Accent aiguë") or stands alone for a vowel iOS swallowed
  // ("G. Accent aiguë" for "gé..."). The reverse ordering (accent name before its
  // vowel) does not occur when spelling aloud, so it is not handled; if it ever did,
  // it would safely fall back to the raw transcription (shown as a mistake), never a
  // false positive.
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

  function sttToWord(brut, attendu){
    attendu = attendu || "";
    var tokens = tokenize(brut);
    var aligned = tryAlign(tokens, attendu);
    if (aligned !== null) return aligned;
    return rawTranscription(tokens);
  }

  return { sttToWord: sttToWord, tokenize: tokenize, deaccent: deaccent };
});
