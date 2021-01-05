(function(global){
  global.robotDictee.createSpeechSynthesisTextToSpeechEngine=createSpeechSynthesisTextToSpeechEngine;

  function createSpeechSynthesisTextToSpeechEngine() {
    return {
      textToSpeech:textToSpeech
    }
    
    function textToSpeech(text){
      var msg = new SpeechSynthesisUtterance(text);
      msg.lang='fr-CA';
      msg.rate=0.6;
      window.speechSynthesis.speak(msg);
    }
  }
})(this)  

