(function(global){
  global.robotDictee.config={
    segmentDelimitersRegEx:"\\.\\?!,",
    patternRegExPatternToSayPairs:[
      {
        patternRegEx:"\\!",
        patternToSay:"!point d'exclamation!"
      },
      //Precondition: "!" doit absolument être la première paires.
      {
        patternRegEx:":",
        patternToSay:"!deux points!"
      },

      {
        patternRegEx:"\\(",
        patternToSay:"!ouvrir les parenthèses!"
      },
      {
        patternRegEx:"\\)",
        patternToSay:"!fermer les parenthèses!"
      },
      {
        patternRegEx:"\\.\\.\\.",
        patternToSay:"!Points de suspension!"
      },
      {
        patternRegEx:"\\.",
        patternToSay:"!point!"
      },
      {
        patternRegEx:"\\?",
        patternToSay:"!point d'interrogation!"
      },
      {
        patternRegEx:",",
        patternToSay:"!virgule!"
      },
      {
        patternRegEx:";",
        patternToSay:"!point virgule!"
      },
      {
        patternRegEx:"\\[",
        patternToSay:"!ouvrir les crochets!"
      },
      {
        patternRegEx:"\\]",
        patternToSay:"!fermer les crochets!"
      },
      {
        patternRegEx:"\\{",
        patternToSay:"!ouvrir les accolades!"
      },
      {
        patternRegEx:"\\}",
        patternToSay:"!fermer les accolades!"
      },
      {
        patternRegEx:"\"",
        patternToSay:"!guillemet!"
      },
      {
        patternRegEx:"- ",
        patternToSay:"!tiret!"
      },
      {
        patternRegEx:"\\$",
        patternToSay:"!signe de dollar!"
      }


//En chiffre     

    ]
  }
})(this)  
