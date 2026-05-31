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

  function sttToWord(brut, attendu){
    attendu = attendu || "";
    var tokens = tokenize(brut);
    var letters = rawTranscription(tokens);
    if (letters === deaccent(attendu.toLowerCase())) return attendu;
    return letters;
  }

  return { sttToWord: sttToWord, tokenize: tokenize, deaccent: deaccent };
});
