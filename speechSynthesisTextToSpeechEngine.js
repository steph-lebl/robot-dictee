(function(global){
  global.robotDictee.createSpeechSynthesisTextToSpeechEngine=createSpeechSynthesisTextToSpeechEngine;

  function createSpeechSynthesisTextToSpeechEngine() {
    var _availableVoices = ko.observableArray([]);
    var _selectedVoice = ko.observable(null);

    loadVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }

    return {
      textToSpeech: textToSpeech,
      availableVoices: _availableVoices,
      selectedVoice: _selectedVoice
    }

    function loadVoices() {
      var voices = speechSynthesis.getVoices();
      var frenchVoices = voices.filter(function(v) {
        return v.lang.startsWith('fr');
      });
      if (frenchVoices.length === 0) {
        frenchVoices = voices;
      }
      _availableVoices(frenchVoices);

      if (!_selectedVoice() && frenchVoices.length > 0) {
        var caVoice = frenchVoices.find(function(v) { return v.lang === 'fr-CA'; });
        _selectedVoice(caVoice || frenchVoices[0]);
      }
    }

    function textToSpeech(text){
      var msg = new SpeechSynthesisUtterance(text);
      msg.lang='fr-CA';
      msg.rate=0.6;
      if (_selectedVoice()) {
        msg.voice = _selectedVoice();
        msg.lang = _selectedVoice().lang;
      }
      window.speechSynthesis.speak(msg);
    }
  }
})(this)
