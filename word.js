(function(global){
  global.dictaphone.createWord=createWord;

  function createWord(_expected, _segmentToSay, _sizeOfSegmentToSay){
    var _actual=ko.observable(null);
    var isCommitted = ko.computed(function() {
        return _actual()!==null;
    });

    return {
      actual:actual,
      expected:expected,
      commit:commit,
      isMistake:isMistake,
      isCommitted:isCommitted,
      segmentToSay:segmentToSay,
      sizeOfSegmentToSay:sizeOfSegmentToSay
    }

    function actual(){
      return _actual();
    }

    function expected(){
      return _expected;
    }

    function commit(actual){
      _actual(actual);
    }

    function isMistake(){
      return isCommitted()===true &&
             actual()!==expected();
    }

    function segmentToSay(){
      return _segmentToSay;
    }

    function sizeOfSegmentToSay(){
      return _sizeOfSegmentToSay;
    }
  }
})(this)  

