(function(global){
  global.dictaphone.createDictation=createDictation;

  function createDictation(text){
    var _delimiter = global.dictaphone.config.segmentDelimitersRegEx;
    var _paragraphs=createParagraphs();
    var _words=wordsFromParagraphs(_paragraphs);
    var _currentWordIndex=ko.observable(0);
    var isFinished = ko.computed(function() {
        return _currentWordIndex()===_words.length;
    });
    var _nextWordIndexToSaySegmentAutomatically=0;
    var _segmentSaid=ko.observable();
    _segmentSaid.extend({ notify: 'always' });

    return {
      paragraphs:paragraphs,
      commitCurrentWord:commitCurrentWord,
      sayCurrentSegment:sayCurrentSegment,
      segmentSaid:_segmentSaid,
      isFinished:isFinished, 
      avgNumOfWordsForOneMistake:avgNumOfWordsForOneMistake,
      noMistakes:noMistakes
    }

    function paragraphs(){
      return _paragraphs;
    }

    function commitCurrentWord(value){
      currentWord().commit(value);
      _currentWordIndex(_currentWordIndex()+1);

      if(_currentWordIndex()>=_nextWordIndexToSaySegmentAutomatically){
        sayCurrentSegment();
      }
    }

    function sayCurrentSegment(){
      _nextWordIndexToSaySegmentAutomatically=_currentWordIndex() + currentWord().sizeOfSegmentToSay();
      _segmentSaid(currentWord().segmentToSay());
    }

    function currentWord(){
      return words()[_currentWordIndex()];
    }

    function words(){
      return _words;
    }

    function avgNumOfWordsForOneMistake(){
      var ratio = numOfMistakes()/_words.length;
      return Math.round(1/ratio);
    }

    function noMistakes(){
      return numOfMistakes()===0;
    }

    function numOfMistakes(){
      return Enumerable.From(_words)
        .Count(function(word) {
          return word.isMistake();
        });
    }

    function simplifyText(text){
      text=simplifySpaces(text);
      text=simplifyNewLines(text);

      text=removeSegmentDelimiterLeadingSpaces(text);
      text=removeSegmentDelimiterTrailingSpaces(text);
      text=replaceDemiCadratinByDash(text);
      text=replaceSuspensionPointsBy3SinglePoints(text);
      text=uniformApostrophes(text);
      text=uniformQuotes(text);

      return text;
    }

    function removeSegmentDelimiterLeadingSpaces(text){
      var regex = new RegExp(" (["+_delimiter+"])","g")
      return text.replace(regex,"$1");
    }

    function removeSegmentDelimiterTrailingSpaces(text){
      var regex = new RegExp("(["+_delimiter+"]) ","g")
      return text.replace(regex,"$1");
    }

    function replaceDemiCadratinByDash(text){
      return text.replace(/—/g, '-');
    }

    function replaceSuspensionPointsBy3SinglePoints(text){
      return text.replace(/…/g, '...');
    }

    function uniformApostrophes(text){
      return text.replace(/’/g, "'" );
    }

    function uniformQuotes(text){
      text=text.replace(/«/g, '"');
      return text.replace(/»/g, '"');
    }


    function simplifySpaces(text){
      text=replaceTabsBySpaces(text);
      text=removeDoubleSpaces(text);
      text=text.trim();
      text=removeParagraphLeadingSpaces(text);
      text=removeParagraphTrailingSpaces(text);
      return text;
    }

    function removeDoubleSpaces(text){
      return text.replace(/ {2,}/g, ' ');
    }

    function replaceTabsBySpaces(text){
      return text.replace(/\t/g," ");
    }

    function removeParagraphLeadingSpaces(text){
      return text.replace(/\n /g,"\n");
    }

    function removeParagraphTrailingSpaces(text){
      return text.replace(/ \n/g,"\n");
    }

    function simplifyNewLines(text){
      text=removeDoubleNewLines(text);
      text=removeLeadingNewLines(text);
      text=removeTrailingNewLines(text);
      return text;
    }

    function removeDoubleNewLines(text){
      return text.replace(/\n{2,}/g, '\n');
    }

    function removeLeadingNewLines(text){
      return text.replace(/^\n+/g,"");
    }

    function removeTrailingNewLines(text){
      return text.replace(/\n+$/g,"");
    }

    function createParagraphs(){
      var simplifiedText=simplifyText(text);
      var paragraphTexts=simplifiedText.split('\n');
      return Enumerable.From(paragraphTexts)
        .Select(function(paragraphText) {
          return global.dictaphone.createParagraph(paragraphText);
        })
        .ToArray();
    }

    function wordsFromParagraphs(paragraphs){
      return Enumerable.From(paragraphs)
        .SelectMany(function(paragraph) { 
          return paragraph.words(); 
        })
        .ToArray();
    }
  }
})(this)  
