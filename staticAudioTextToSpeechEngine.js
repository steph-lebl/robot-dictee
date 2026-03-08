(function(global){
  global.robotDictee.createStaticAudioTextToSpeechEngine=createStaticAudioTextToSpeechEngine;

  function createStaticAudioTextToSpeechEngine(audioMap) {
    return {
      textToSpeech:textToSpeech
    }

    function textToSpeech(text){
      var key = text.trim().toLowerCase();
      var url = audioMap[key];
      if(url){
        var audio = new Audio(url);
        audio.play();
      }
    }
  }
})(this)
