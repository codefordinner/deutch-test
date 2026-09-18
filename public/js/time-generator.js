(function (global) {
  var ones = [
    "null", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn",
    "elf", "zwölf", "dreizehn", "vierzehn", "fünfzehn", "sechzehn", "siebzehn", "achtzehn", "neunzehn"
  ];
  var tensWords = {
    20: "zwanzig", 30: "dreißig", 40: "vierzig", 50: "fünfzig", 60: "sechzig", 70: "siebzig", 80: "achtzig", 90: "neunzig"
  };

  function minuteToGerman(n) {
    if (n < 20) return ones[n];
    if (n % 10 === 0) return tensWords[n];
    var tens = Math.floor(n / 10) * 10;
    var unit = n % 10;
    var unitWord = unit === 1 ? "ein" : ones[unit];
    return unitWord + "und" + tensWords[tens];
  }

  function pad2(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function generateClockSvg(hours, minutes, size) {
    var s = size || 130;
    var minAngle = minutes * 6;
    var hrAngle = ((hours % 12) + minutes / 60) * 30;

    var ticks = "";
    for (var i = 0; i < 60; i++) {
      var isHour = (i % 5 === 0);
      var rad = (i * 6 - 90) * Math.PI / 180;
      var r1 = 72;
      var r2 = isHour ? 64 : 68;
      var x1 = (80 + r1 * Math.cos(rad)).toFixed(1);
      var y1 = (80 + r1 * Math.sin(rad)).toFixed(1);
      var x2 = (80 + r2 * Math.cos(rad)).toFixed(1);
      var y2 = (80 + r2 * Math.sin(rad)).toFixed(1);
      var strokeWidth = isHour ? "2" : "1";
      var opacity = isHour ? "0.7" : "0.35";
      ticks += '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="currentColor" stroke-width="' + strokeWidth + '" opacity="' + opacity + '" />';
    }

    var numbers = "";
    for (var h = 1; h <= 12; h++) {
      var nRad = (h * 30 - 90) * Math.PI / 180;
      var numR = 53;
      var nx = (80 + numR * Math.cos(nRad)).toFixed(1);
      var ny = (80 + numR * Math.sin(nRad) + 4.5).toFixed(1);
      numbers += '<text x="' + nx + '" y="' + ny + '" text-anchor="middle" font-size="12" font-weight="600" fill="currentColor" opacity="0.85">' + h + '</text>';
    }

    return '<svg class="analog-clock" viewBox="0 0 160 160" width="' + s + '" height="' + s + '" aria-label="Часы ' + hours + ':' + pad2(minutes) + '">' +
      '<circle cx="80" cy="80" r="74" class="clock-face" />' +
      '<g class="clock-ticks">' + ticks + '</g>' +
      '<g class="clock-numbers">' + numbers + '</g>' +
      '<line x1="80" y1="80" x2="80" y2="44" class="clock-hour-hand" transform="rotate(' + hrAngle.toFixed(1) + ', 80, 80)" />' +
      '<line x1="80" y1="80" x2="80" y2="22" class="clock-minute-hand" transform="rotate(' + minAngle.toFixed(1) + ', 80, 80)" />' +
      '<circle cx="80" cy="80" r="4.5" class="clock-center-dot" />' +
      '</svg>';
  }

  function getTimeInfo(h24, m) {
    var h12 = (h24 % 12 === 0) ? 12 : (h24 % 12);
    var nextH12 = (h12 % 12) + 1;
    var curHWord = h12 === 1 ? "eins" : ones[h12];
    var curHWordBeforeUhr = h12 === 1 ? "ein" : ones[h12];
    var nextHWord = nextH12 === 1 ? "eins" : ones[nextH12];

    var primaryColloquial = "";
    var isKurz = false;
    var validMinutes = [m];

    if (m === 0) {
      primaryColloquial = curHWordBeforeUhr + " Uhr";
    } else if (m >= 1 && m <= 4) {
      isKurz = true;
      validMinutes = [1, 2, 3, 4];
      primaryColloquial = "kurz nach " + curHWord;
    } else if (m === 5) {
      primaryColloquial = "fünf nach " + curHWord;
    } else if (m >= 6 && m <= 9) {
      primaryColloquial = minuteToGerman(m) + " nach " + curHWord;
    } else if (m === 10) {
      primaryColloquial = "zehn nach " + curHWord;
    } else if (m >= 11 && m <= 14) {
      primaryColloquial = "kurz vor Viertel nach " + curHWord;
    } else if (m === 15) {
      primaryColloquial = "Viertel nach " + curHWord;
    } else if (m >= 16 && m <= 19) {
      primaryColloquial = "kurz nach Viertel nach " + curHWord;
    } else if (m === 20) {
      primaryColloquial = "zwanzig nach " + curHWord;
    } else if (m >= 21 && m <= 24) {
      primaryColloquial = minuteToGerman(30 - m) + " vor halb " + nextHWord;
    } else if (m === 25) {
      primaryColloquial = "fünf vor halb " + nextHWord;
    } else if (m >= 26 && m <= 29) {
      isKurz = true;
      validMinutes = [26, 27, 28, 29];
      primaryColloquial = "kurz vor halb " + nextHWord;
    } else if (m === 30) {
      primaryColloquial = "halb " + nextHWord;
    } else if (m >= 31 && m <= 34) {
      isKurz = true;
      validMinutes = [31, 32, 33, 34];
      primaryColloquial = "kurz nach halb " + nextHWord;
    } else if (m === 35) {
      primaryColloquial = "fünf nach halb " + nextHWord;
    } else if (m >= 36 && m <= 39) {
      primaryColloquial = minuteToGerman(m - 30) + " nach halb " + nextHWord;
    } else if (m === 40) {
      primaryColloquial = "zwanzig vor " + nextHWord;
    } else if (m >= 41 && m <= 44) {
      primaryColloquial = "kurz vor Viertel vor " + nextHWord;
    } else if (m === 45) {
      primaryColloquial = "Viertel vor " + nextHWord;
    } else if (m >= 46 && m <= 49) {
      primaryColloquial = "kurz nach Viertel vor " + nextHWord;
    } else if (m === 50) {
      primaryColloquial = "zehn vor " + nextHWord;
    } else if (m >= 51 && m <= 54) {
      primaryColloquial = minuteToGerman(60 - m) + " vor " + nextHWord;
    } else if (m === 55) {
      primaryColloquial = "fünf vor " + nextHWord;
    } else if (m >= 56 && m <= 59) {
      isKurz = true;
      validMinutes = [56, 57, 58, 59];
      primaryColloquial = "kurz vor " + nextHWord;
    }

    var hOfficial = h24 === 1 ? "ein" : minuteToGerman(h24);
    var official = hOfficial + " Uhr" + (m > 0 ? " " + minuteToGerman(m) : "");

    var digital24 = pad2(h24) + ":" + pad2(m);
    var digital12 = pad2(h12) + ":" + pad2(m);

    return {
      h24: h24,
      h12: h12,
      m: m,
      digital24: digital24,
      digital12: digital12,
      primaryColloquial: primaryColloquial,
      official: official,
      isKurz: isKurz,
      validMinutes: validMinutes,
      id: digital24
    };
  }

  global.GermanTime = {
    getTimeInfo: getTimeInfo,
    generateClockSvg: generateClockSvg,
    pad2: pad2
  };
})(window);
