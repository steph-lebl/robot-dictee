(function(global){
  global.robotDictee.createParagraph=createParagraph;

  function createParagraph(paragraphText){
    var _segments=createSegments(paragraphText);
    return {
      segments:segments,
      words:words
    }
    
    function createSegments(paragraphText){
      var segmentTexts=splitIntoSegments(paragraphText);

      return Enumerable.From(segmentTexts)
        .Select(function(segmentText) {
          return global.robotDictee.createSegment(segmentText);
        })
        .ToArray();
    }

    function splitIntoSegments(paragraphText){
      var delimiter = global.robotDictee.config.segmentDelimitersRegEx;
      var segmentEndingWithDelimiter = "[^"+delimiter+"]*["+delimiter+"]+";
      var or = "|";
      var lastSegment="[^"+delimiter+"]+$";

      var regex = new RegExp(segmentEndingWithDelimiter+or+lastSegment,"g");
      return paragraphText.match(regex);
    }

    function words(){
      return Enumerable.From(segments())
        .SelectMany(function(segment) { 
          return segment.words(); 
        })
        .ToArray();
    }

    function segments(){
      return _segments;
    }

  }
})(this)  
