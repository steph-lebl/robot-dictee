(function(global){

  var textToSpeechEngine = global.dictaphone.createSpeechSynthesisTextToSpeechEngine();
  var viewModel = global.dictaphone.createViewModel(textToSpeechEngine);

  global.dictaphone.viewModel=viewModel;//stle: global to allow for handling ENTER

  ko.applyBindings(viewModel);
})(this)  

