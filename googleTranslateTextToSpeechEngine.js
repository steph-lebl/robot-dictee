(function(global){
  global.dictaphone.createGoogleTranslateTextToSpeechEngine=createGoogleTranslateTextToSpeechEngine;

  function createGoogleTranslateTextToSpeechEngine() {
    var _maxLength=100;
    var _audio = new Audio();

    return {
      textToSpeech:textToSpeech
    }
    
    function textToSpeech(text){
      if(isTextTooLong(text)){
        playTooLongText(text);
      }
      else{
        setAudioSrc(text);
        _audio.play();
      }
    }

    function isTextTooLong(text){
      return text.length>=_maxLength;        
    }

    function playTooLongText(text){
      var splitted = splitTooLongText(text);
      setAudioSrc(splitted.part1);
      var onEnded=createPlayNextPartListner(splitted.part2);
      _audio.addEventListener('ended', onEnded, false);
      _audio.play();

      function createPlayNextPartListner(text){
        return function(){
          _audio.removeEventListener('ended', onEnded, false);
          textToSpeech(text);
        }
      }
    }

    //preconditions: text.length>=_maxLength
    function splitTooLongText(text){
      var part1="";
      var part2="";
      var words=text.split(' ');
      var isPart1Full=false;

      for (var i = 0; i < words.length; i++) { 
        processWord(words[i]); 
      };

      return {
        part1:part1,
        part2:part2
      };

      function processWord(word){
        if(isTextTooLong(part1+word)){
          isPart1Full=true;
        }

        if(isPart1Full===false){
          part1=combineWord(part1,word);
        }
        else{
          part2=combineWord(part2,word);
        }
      }
    }

    function combineWord(text,word){
        if(text!==""){ 
          text=text+" "; 
        }  
        return text+word; 
    }

    function setAudioSrc(text){
      _audio.src ='http://translate.google.com/translate_tts?ie=utf-8&tl=fr&q='+text;
    }
  }
})(this)  

