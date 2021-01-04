(function(global){

  var textToSpeechEngine = global.robotDictee.createSpeechSynthesisTextToSpeechEngine();
  var viewModel = global.robotDictee.createViewModel(textToSpeechEngine);

  global.robotDictee.viewModel=viewModel;//stle: global to allow for handling ENTER

  ko.applyBindings(viewModel);
})(this)  

