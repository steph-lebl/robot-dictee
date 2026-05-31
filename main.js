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
