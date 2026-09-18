(function (global) {
  var IRREGULAR_CONJUGATIONS = {
    sein: {
      forms: { ich: "bin", du: "bist", er: "ist", wir: "sind", ihr: "seid", sie: "sind" },
      vowelChange: "полное изменение корня (bin, bist, ist...)"
    },
    haben: {
      forms: { ich: "habe", du: "hast", er: "hat", wir: "haben", ihr: "habt", sie: "haben" },
      vowelChange: "b выпадает: du hast, er hat"
    },
    werden: {
      forms: { ich: "werde", du: "wirst", er: "wird", wir: "werden", ihr: "werdet", sie: "werden" },
      vowelChange: "e ➔ i (du wirst, er wird)"
    },
    gehen: {
      forms: { ich: "gehe", du: "gehst", er: "geht", wir: "gehen", ihr: "geht", sie: "gehen" }
    },
    kommen: {
      forms: { ich: "komme", du: "kommst", er: "kommt", wir: "kommen", ihr: "kommt", sie: "kommen" }
    },
    sehen: {
      forms: { ich: "sehe", du: "siehst", er: "sieht", wir: "sehen", ihr: "seht", sie: "sehen" },
      vowelChange: "e ➔ ie (du siehst, er sieht)"
    },
    geben: {
      forms: { ich: "gebe", du: "gibst", er: "gibt", wir: "geben", ihr: "gebt", sie: "geben" },
      vowelChange: "e ➔ i (du gibst, er gibt)"
    },
    nehmen: {
      forms: { ich: "nehme", du: "nimmst", er: "nimmt", wir: "nehmen", ihr: "nehmt", sie: "nehmen" },
      vowelChange: "e ➔ i, mm (du nimmst, er nimmt)"
    },
    sprechen: {
      forms: { ich: "spreche", du: "sprichst", er: "spricht", wir: "sprechen", ihr: "sprecht", sie: "sprechen" },
      vowelChange: "e ➔ i (du sprichst, er spricht)"
    },
    fahren: {
      forms: { ich: "fahre", du: "fährst", er: "fährt", wir: "fahren", ihr: "fahrt", sie: "fahren" },
      vowelChange: "a ➔ ä (du fährst, er fährt)"
    },
    lesen: {
      forms: { ich: "lese", du: "liest", er: "liest", wir: "lesen", ihr: "lest", sie: "lesen" },
      vowelChange: "e ➔ ie (du liest, er liest)"
    },
    schreiben: {
      forms: { ich: "schreibe", du: "schreibst", er: "schreibt", wir: "schreiben", ihr: "schreibt", sie: "schreiben" }
    },
    finden: {
      forms: { ich: "finde", du: "findest", er: "findet", wir: "finden", ihr: "findet", sie: "finden" }
    },
    wissen: {
      forms: { ich: "weiß", du: "weißt", er: "weiß", wir: "wissen", ihr: "wisst", sie: "wissen" },
      vowelChange: "i ➔ ei (ich weiß, du weißt, er weiß)"
    },
    bring: {
      forms: { ich: "bringe", du: "bringst", er: "bringt", wir: "bringen", ihr: "bringt", sie: "bringen" }
    },
    bringen: {
      forms: { ich: "bringe", du: "bringst", er: "bringt", wir: "bringen", ihr: "bringt", sie: "bringen" }
    },
    denken: {
      forms: { ich: "denke", du: "denkst", er: "denkt", wir: "denken", ihr: "denkt", sie: "denken" }
    },
    bleiben: {
      forms: { ich: "bleibe", du: "bleibst", er: "bleibt", wir: "bleiben", ihr: "bleibt", sie: "bleiben" }
    },
    trinken: {
      forms: { ich: "trinke", du: "trinkst", er: "trinkt", wir: "trinken", ihr: "trinkt", sie: "trinken" }
    },
    essen: {
      forms: { ich: "esse", du: "isst", er: "isst", wir: "essen", ihr: "esst", sie: "essen" },
      vowelChange: "e ➔ i, ss (du isst, er isst)"
    },
    schlafen: {
      forms: { ich: "schlafe", du: "schläfst", er: "schläft", wir: "schlafen", ihr: "schlaft", sie: "schlafen" },
      vowelChange: "a ➔ ä (du schläfst, er schläft)"
    },
    laufen: {
      forms: { ich: "laufe", du: "läufst", er: "läuft", wir: "laufen", ihr: "lauft", sie: "laufen" },
      vowelChange: "au ➔ äu (du läufst, er läuft)"
    },
    helfen: {
      forms: { ich: "helfe", du: "hilfst", er: "hilft", wir: "helfen", ihr: "helft", sie: "helfen" },
      vowelChange: "e ➔ i (du hilfst, er hilft)"
    },
    treffen: {
      forms: { ich: "treffe", du: "triffst", er: "trifft", wir: "treffen", ihr: "trefft", sie: "treffen" },
      vowelChange: "e ➔ i (du triffst, er trifft)"
    },
    beginnen: {
      forms: { ich: "beginne", du: "beginnst", er: "beginnt", wir: "beginnen", ihr: "beginnt", sie: "beginnen" }
    },
    verstehen: {
      forms: { ich: "verstehe", du: "verstehst", er: "versteht", wir: "verstehen", ihr: "versteht", sie: "verstehen" }
    },
    tragen: {
      forms: { ich: "trage", du: "trägst", er: "trägt", wir: "tragen", ihr: "tragt", sie: "tragen" },
      vowelChange: "a ➔ ä (du trägst, er trägt)"
    },
    stehen: {
      forms: { ich: "stehe", du: "stehst", er: "steht", wir: "stehen", ihr: "steht", sie: "stehen" }
    },
    liegen: {
      forms: { ich: "liege", du: "liegst", er: "liegt", wir: "liegen", ihr: "liegt", sie: "liegen" }
    },
    sitzen: {
      forms: { ich: "sitze", du: "sitzt", er: "sitzt", wir: "sitzen", ihr: "sitzt", sie: "sitzen" },
      vowelChange: "основа на -z (du sitzt, er sitzt)"
    },
    fliegen: {
      forms: { ich: "fliege", du: "fliegst", er: "fliegt", wir: "fliegen", ihr: "fliegt", sie: "fliegen" }
    },
    schwimmen: {
      forms: { ich: "schwimme", du: "schwimmst", er: "schwimmt", wir: "schwimmen", ihr: "schwimmt", sie: "schwimmen" }
    },
    verlieren: {
      forms: { ich: "verliere", du: "verlierst", er: "verliert", wir: "verlieren", ihr: "verliert", sie: "verlieren" }
    },
    gewinnen: {
      forms: { ich: "gewinne", du: "gewinnst", er: "gewinnt", wir: "gewinnen", ihr: "gewinnt", sie: "gewinnen" }
    },
    schließen: {
      forms: { ich: "schließe", du: "schließt", er: "schließt", wir: "schließen", ihr: "schließt", sie: "schließen" }
    },
    ziehen: {
      forms: { ich: "ziehe", du: "ziehst", er: "zieht", wir: "ziehen", ihr: "zieht", sie: "ziehen" }
    },
    rufen: {
      forms: { ich: "rufe", du: "rufst", er: "ruft", wir: "rufen", ihr: "ruft", sie: "rufen" }
    },
    kennen: {
      forms: { ich: "kenne", du: "kennst", er: "kennt", wir: "kennen", ihr: "kennt", sie: "kennen" }
    },
    waschen: {
      forms: { ich: "wasche", du: "wäschst", er: "wäscht", wir: "waschen", ihr: "wascht", sie: "waschen" },
      vowelChange: "a ➔ ä (du wäschst, er wäscht)"
    },
    vergessen: {
      forms: { ich: "vergesse", du: "vergisst", er: "vergisst", wir: "vergessen", ihr: "vergesst", sie: "vergessen" },
      vowelChange: "e ➔ i (du vergisst, er vergisst)"
    },
    einladen: {
      forms: { ich: "lade ein", du: "lädst ein", er: "lädt ein", wir: "laden ein", ihr: "ladet ein", sie: "laden ein" },
      vowelChange: "a ➔ ä, приставка ein (du lädst ein)"
    }
  };

  function conjugateRegular(infinitive) {
    var raw = (infinitive || "").trim().toLowerCase();
    var stem = raw;
    if (stem.endsWith("en")) {
      stem = stem.slice(0, -2);
    } else if (stem.endsWith("n")) {
      stem = stem.slice(0, -1);
    }

    var needsE = /[td]$/.test(stem) || /[^aeiou][nm]$/.test(stem);
    var sEnding = /[sßzx]$/.test(stem);

    return {
      ich: stem + "e",
      du: stem + (sEnding ? "t" : (needsE ? "est" : "st")),
      er: stem + (needsE ? "et" : "t"),
      wir: raw,
      ihr: stem + (needsE ? "et" : "t"),
      sie: raw
    };
  }

  global.GermanVerbsData = {
    IRREGULAR_CONJUGATIONS: IRREGULAR_CONJUGATIONS,
    conjugateRegular: conjugateRegular
  };
})(window);
