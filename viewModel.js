(function(global){
  global.robotDictee.createViewModel=createViewModel;

  function createViewModel(textToSpeechEngine){
    var _predefinedDictations = ko.observable(global.robotDictee.predefinedDictations)
    var _newDictationText = ko.observable("");
    var _dictation = ko.observable();
    var _currentWordText = ko.observable("");
    var _segmentSaidSubscription=null;

    _currentWordText.subscribe(onCurrentWordTextChanged);

    return {
      dictation:_dictation,
      currentWordText:_currentWordText,
      predefinedDictations: _predefinedDictations,
      usePredefinedDictation: usePredefinedDictation,
      newDictationText:_newDictationText,
      createDictation:createDictation,
      sayCurrentSegment:sayCurrentSegment
    }

    function onCurrentWordTextChanged(newValue){
      if(getLastChar(_currentWordText())==' '){
        commitWord();
      }
    }

    function getLastChar(value){
      return value.substr(value.length - 1);
    }

    function commitWord(){
      var valueToCommit = _currentWordText().rtrim();
      _currentWordText("");
      _dictation().commitCurrentWord(valueToCommit);
    }

    function sayCurrentSegment(event){
      _dictation().sayCurrentSegment();
      document.getElementById("currentWordText").focus();
    }


    function onSegmentSaid(value){
      textToSpeechEngine.textToSpeech(value);
    }


    //read-only
    var _dictation = ko.computed(function() {
        return _dictation();
    });

    function usePredefinedDictation(predefinedDictation){
      startDictation(predefinedDictation.text);
    }

    function createDictation(){
      startDictation(_newDictationText());
    }

    function startDictation(text){
      var newDictation = global.robotDictee.createDictation(text);

      _dictation(newDictation);
      subscribeToSegmentSaid();

      sayCurrentSegment();
    }

    function subscribeToSegmentSaid(){
      if(_segmentSaidSubscription){
        _segmentSaidSubscription.dispose();
      }
      _segmentSaidSubscription=_dictation().segmentSaid.subscribe(onSegmentSaid);
    }
  }
})(this)  

