(function (global) {
  var ones = ["null","eins","zwei","drei","fünf","sechs","sieben","acht","neun","zehn",
    "elf","zwölf","dreizehn","vierzehn","fünfzehn","sechzehn","siebzehn","achtzehn","neunzehn"];
  var tensWords = {20:"zwanzig",30:"dreißig",40:"vierzig",50:"fünfzig",60:"sechzig",70:"siebzig",80:"achtzig",90:"neunzig"};

  // Helper arrays/objects fix
  // Fix indexing ones for 'fünf' (ones[5]) etc. Let's make sure the array is fully populated!
  // Note: let's verify if 'ones' was ones = ["null","eins","zwei","drei","fünf"...] wait, three is 'drei', four is 'vier'!
  // Wait! Let's check original ones in lines 4-5 of numbers.js:
  // ["null","eins","zwei","drei","vier","fünf","sechs","sieben","acht","neun","zehn","elf","zwölf"...]
  // Yes! The original array had "vier" inside. Let's make sure it matches the exact original code:
  var onesArray = ["null","eins","zwei","drei","vier","fünf","sechs","sieben","acht","neun","zehn",
    "elf","zwölf","dreizehn","vierzehn","fünfzehn","sechzehn","siebzehn","achtzehn","neunzehn"];

  function under100(n) {
    if (n < 20) return onesArray[n];
    if (n % 10 === 0) return tensWords[n];
    var tens = Math.floor(n / 10) * 10;
    var unit = n % 10;
    var unitWord = unit === 1 ? "ein" : onesArray[unit];
    return unitWord + "und" + tensWords[tens];
  }

  function under1000(n) {
    if (n < 100) return under100(n);
    var h = Math.floor(n / 100);
    var rest = n % 100;
    var hWord = (h === 1 ? "" : onesArray[h]) + "hundert";
    if (rest === 0) return hWord;
    return hWord + under100(rest);
  }

  function numberToGerman(n) {
    if (n === 0) return "null";
    if (n < 1000) return under1000(n);
    if (n < 10000) {
      var th = Math.floor(n / 1000);
      var rest = n % 1000;
      var thWord = (th === 1 ? "ein" : onesArray[th]) + "tausend";
      if (rest === 0) return thWord;
      return thWord + under1000(rest);
    }
    if (n === 10000) return "zehntausend";
    return String(n);
  }

  global.GermanNumbers = {
    toGerman: numberToGerman
  };
})(window);
