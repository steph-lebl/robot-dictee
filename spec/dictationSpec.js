(function(global){
  describe("Dictation (parsing)", function() {
    it("should be able to parse paragraphs from text", function() {
      var dictation = global.robotDictee.createDictation("a\nb")

      expect(dictation.paragraphs().length).toBe(2);
    });

    it("should parse paragraphs with leading spaces from text", function() {
      parseParagraphsABC(" a\n b\n  c");
    });

    it("should parse paragraphs with leading tabs from text", function() {
      parseParagraphsABC("\ta\n\tb\n\t\tc");
    });

    it("should parse paragraphs with trailing spaces from text", function() {
      parseParagraphsABC("a  \nb \nc ");
    });

    it("should parse paragraphs with trailing tabs from text", function() {
      parseParagraphsABC("a\t\t\nb\t\nc\t");
    });

    it("should filter out empty paragraphs", function() {
      parseParagraphsABC("\na\nb\n\nc\n");
    });

    it("should merge double spaces", function() {
      var dictation = global.robotDictee.createDictation("a  b   c");

      expect(dictation.paragraphs()[0].words().length).toBe(3)
      expect(dictation.paragraphs()[0].words()[0].expected()).toBe("a")
      expect(dictation.paragraphs()[0].words()[1].expected()).toBe("b")
      expect(dictation.paragraphs()[0].words()[2].expected()).toBe("c")
    });
    it("should parse segment delimiters with leading spaces from text", function() {
      var dictation = global.robotDictee.createDictation("a .b  !c ?dont-care");

      expect(dictation.paragraphs()[0].segments().length).toBe(4)
      expect(dictation.paragraphs()[0].segments()[0].words()[0].expected()).toBe("a.")
      expect(dictation.paragraphs()[0].segments()[1].words()[0].expected()).toBe("b!")
      expect(dictation.paragraphs()[0].segments()[2].words()[0].expected()).toBe("c?")
    });
    it("should parse segment delimiters with trailing spaces from text", function() {
      var dictation = global.robotDictee.createDictation("a. b!  c? dont-care");

      expect(dictation.paragraphs()[0].segments().length).toBe(4)
      expect(dictation.paragraphs()[0].segments()[0].words()[0].expected()).toBe("a.")
      expect(dictation.paragraphs()[0].segments()[1].words()[0].expected()).toBe("b!")
      expect(dictation.paragraphs()[0].segments()[2].words()[0].expected()).toBe("c?")
    });

    it("should parse double segment delimiters", function() {
      var dictation = global.robotDictee.createDictation("a!.b?!.c")

      expect(dictation.paragraphs().length).toBe(1);
      expect(dictation.paragraphs()[0].segments().length).toBe(3);
      expect(dictation.paragraphs()[0].segments()[0].words()[0].expected()).toBe("a!.")
      expect(dictation.paragraphs()[0].segments()[1].words()[0].expected()).toBe("b?!.")
      expect(dictation.paragraphs()[0].segments()[2].words()[0].expected()).toBe("c")
    });

    it("should replace demi-cadratin par un tiret", function() {
      var dictation = global.robotDictee.createDictation("a — b")

      expect(dictation.paragraphs().length).toBe(1);
      expect(dictation.paragraphs()[0].segments().length).toBe(1);
      expect(dictation.paragraphs()[0].segments()[0].words().length).toBe(3);
      expect(dictation.paragraphs()[0].segments()[0].words()[0].expected()).toBe("a");
      expect(dictation.paragraphs()[0].segments()[0].words()[1].expected()).toBe("-");
      expect(dictation.paragraphs()[0].segments()[0].words()[2].expected()).toBe("b");
    });

   it("should replace the caracter '…' par '.'+'.'+'.'", function() {
      var dictation = global.robotDictee.createDictation("…")

      expect(dictation.paragraphs()[0].segments()[0].words()[0].expected()).toBe("...");
    });



  });

  describe("Segment", function() {
    it("should say 5 first words.", function() {
      var sut = global.robotDictee.createSegment("Un deux trois quatre cinq six")

      var actual = sut.words()[0];

      expect(actual.segmentToSay()).toBe("Un deux trois quatre cinq");
      expect(actual.sizeOfSegmentToSay()).toBe(5);
    });

    it("should say 5 next words.", function() {
      var sut = global.robotDictee.createSegment("Un deux trois quatre cinq six sept")

      var actual = sut.words()[1];

      expect(actual.segmentToSay()).toBe("deux trois quatre cinq six");
      expect(actual.sizeOfSegmentToSay()).toBe(5);
    });

    it("should say all remaining words if less than 5", function() {
      var sut = global.robotDictee.createSegment("Un deux trois quatre cinq")

      var actual = sut.words()[1];

      expect(actual.segmentToSay()).toBe("deux trois quatre cinq");
      expect(actual.sizeOfSegmentToSay()).toBe(4);
    });

    it("should be able to say a single word", function() {
      var sut = global.robotDictee.createSegment("Un")

      var actual = sut.words()[0];

      expect(actual.segmentToSay()).toBe("Un");
      expect(actual.sizeOfSegmentToSay()).toBe(1);
    });

    it("should be able to say the last word", function() {
      var sut = global.robotDictee.createSegment("Un deux.")

      var actual = sut.words()[1];

      expect(actual.segmentToSay()).toBe("deux!point!");
      expect(actual.sizeOfSegmentToSay()).toBe(1);
    });


    it("should say symbols explicitly", function() {
      var sut = global.robotDictee.createSegment("a (b)")

      var actual = sut.words()[0];

      expect(actual.segmentToSay()).toBe("a !ouvrir les parenthèses!b!fermer les parenthèses!");
      expect(actual.sizeOfSegmentToSay()).toBe(2);
    });
  });

//helpers
function parseParagraphsABC(text){
  var dictation = global.robotDictee.createDictation(text)

  expect(dictation.paragraphs().length).toBe(3);
  expect(dictation.paragraphs()[0].words()[0].expected()).toBe("a")
  expect(dictation.paragraphs()[1].words()[0].expected()).toBe("b")
  expect(dictation.paragraphs()[2].words()[0].expected()).toBe("c")
}

})(this)  


