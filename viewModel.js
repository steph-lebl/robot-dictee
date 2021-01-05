(function(global){
  global.robotDictee.createViewModel=createViewModel;

  function createViewModel(textToSpeechEngine){
    var _newDictationText = ko.observable("");
    var _dictation = ko.observable();
    var _currentWordText = ko.observable("");
    var _segmentSaidSubscription=null;

    _currentWordText.subscribe(onCurrentWordTextChanged);

    return {
      dictation:_dictation,
      currentWordText:_currentWordText,
      onKeyPress:onKeyPress,

      newDictationText:_newDictationText,
      createDicatation:createDicatation
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

    function onKeyPress(event){
      if(event.keyCode!=13){ return true; }
      
      sayCurrentSegment();
      return false; //never send the ENTER key press
    }

    function sayCurrentSegment(){
      _dictation().sayCurrentSegment();
    }


    function onSegmentSaid(value){
      textToSpeechEngine.textToSpeech(value);
    }


    //read-only
    var _dictation = ko.computed(function() {
        return _dictation();
    });

    function createDicatation(){
      var newDictation = global.robotDictee.createDictation(_newDictationText());

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

