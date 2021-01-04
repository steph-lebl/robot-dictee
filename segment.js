(function(global){
  global.dictaphone.createSegment=createSegment;

  function createSegment(_segmentText){
    var _words=createWords();
    return { words:words };

    function words(){
      return _words;
    }

    function createWords(){
      var wordTexts=_segmentText.split(' ');
      

      return Enumerable.From(wordTexts)
        .Select(function(dontCare,wordIndex) {
          return createWord(wordTexts,wordIndex);
        })
        .ToArray();
    }

    function createWord(wordTexts,wordIndex){
      var wordText = wordTexts[wordIndex];
      var segmentWords = getSegmentWords(wordTexts,wordIndex);
      var segmentText = segmentWords.Aggregate(wordsToSayToSegmentText);
      var segmentToSay = createSegmentToSay(segmentText);

      return global.dictaphone.createWord(wordText,segmentToSay,segmentWords.Count());
    }

    function getSegmentWords(wordTexts,wordIndex){
      return Enumerable
              .From(wordTexts)
              .Skip(wordIndex)
              .Take(5);
    }

    function wordsToSayToSegmentText(current,next){
      return current + " " + next;
    }

    function createSegmentToSay(segmentText){
      var pairs = global.dictaphone.config.patternRegExPatternToSayPairs;
      var result = segmentText;
      for (var i = 0; i < pairs.length; i++) {
        var pair=pairs[i];
        result=replacePatternRegExPatternToSayPair(result,pair);
      };
      return result;
    }

    function replacePatternRegExPatternToSayPair(text,pair){
      var regex = new RegExp(pair.patternRegEx,"g")
      return text.replace(regex,pair.patternToSay);
    }
  }
})(this)  
