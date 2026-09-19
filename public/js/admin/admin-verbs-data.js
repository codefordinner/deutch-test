/**
 * Admin Panel Verbs Conjugation Dictionary & Generator
 */

export const KNOWN_VERBS_DICT = {
  sein: { ru: "быть, являться", isIrregular: true, praesens: "ist", praeteritum: "war", partizip2: "gewesen", hilfsverb: "sein", forms: { ich: "bin", du: "bist", er: "ist", wir: "sind", ihr: "seid", sie: "sind" }, vowelChange: "неправильное спряжение (bin, bist, ist)" },
  haben: { ru: "иметь", isIrregular: true, praesens: "hat", praeteritum: "hatte", partizip2: "gehabt", hilfsverb: "haben", forms: { ich: "habe", du: "hast", er: "hat", wir: "haben", ihr: "habt", sie: "haben" }, vowelChange: "b выпадает: du hast, er hat" },
  werden: { ru: "становиться", isIrregular: true, praesens: "wird", praeteritum: "wurde", partizip2: "geworden", hilfsverb: "sein", forms: { ich: "werde", du: "wirst", er: "wird", wir: "werden", ihr: "werdet", sie: "werden" }, vowelChange: "e ➔ i (du wirst, er wird)" },
  gehen: { ru: "идти, ходить", isIrregular: true, praesens: "geht", praeteritum: "ging", partizip2: "gegangen", hilfsverb: "sein", forms: { ich: "gehe", du: "gehst", er: "geht", wir: "gehen", ihr: "geht", sie: "gehen" } },
  kommen: { ru: "приходить, приезжать", isIrregular: true, praesens: "kommt", praeteritum: "kam", partizip2: "gekommen", hilfsverb: "sein", forms: { ich: "komme", du: "kommst", er: "kommt", wir: "kommen", ihr: "kommt", sie: "kommen" } },
  sehen: { ru: "видеть, смотреть", isIrregular: true, praesens: "sieht", praeteritum: "sah", partizip2: "gesehen", hilfsverb: "haben", forms: { ich: "sehe", du: "siehst", er: "sieht", wir: "sehen", ihr: "seht", sie: "sehen" }, vowelChange: "e ➔ ie (du siehst, er sieht)" },
  geben: { ru: "давать", isIrregular: true, praesens: "gibt", praeteritum: "gab", partizip2: "gegeben", hilfsverb: "haben", forms: { ich: "gebe", du: "gibst", er: "gibt", wir: "geben", ihr: "gebt", sie: "geben" }, vowelChange: "e ➔ i (du gibst, er gibt)" },
  nehmen: { ru: "брать, взять", isIrregular: true, praesens: "nimmt", praeteritum: "nahm", partizip2: "genommen", hilfsverb: "haben", forms: { ich: "nehme", du: "nimmst", er: "nimmt", wir: "nehmen", ihr: "nehmt", sie: "nehmen" }, vowelChange: "e ➔ i, mm (du nimmst, er nimmt)" },
  sprechen: { ru: "говорить, разговаривать", isIrregular: true, praesens: "spricht", praeteritum: "sprach", partizip2: "gesprochen", hilfsverb: "haben", forms: { ich: "spreche", du: "sprichst", er: "spricht", wir: "sprechen", ihr: "sprecht", sie: "sprechen" }, vowelChange: "e ➔ i (du sprichst, er spricht)" },
  fahren: { ru: "ехать, водить", isIrregular: true, praesens: "fährt", praeteritum: "fuhr", partizip2: "gefahren", hilfsverb: "sein", forms: { ich: "fahre", du: "fährst", er: "fährt", wir: "fahren", ihr: "fahrt", sie: "fahren" }, vowelChange: "a ➔ ä (du fährst, er fährt)" },
  lesen: { ru: "читать", isIrregular: true, praesens: "liest", praeteritum: "las", partizip2: "gelesen", hilfsverb: "haben", forms: { ich: "lese", du: "liest", er: "liest", wir: "lesen", ihr: "lest", sie: "lesen" }, vowelChange: "e ➔ ie (du liest, er liest)" },
  schreiben: { ru: "писать", isIrregular: true, praesens: "schreibt", praeteritum: "schrieb", partizip2: "geschrieben", hilfsverb: "haben", forms: { ich: "schreibe", du: "schreibst", er: "schreibt", wir: "schreiben", ihr: "schreibt", sie: "schreiben" } },
  finden: { ru: "находить, считать", isIrregular: true, praesens: "findet", praeteritum: "fand", partizip2: "gefunden", hilfsverb: "haben", forms: { ich: "finde", du: "findest", er: "findet", wir: "finden", ihr: "findet", sie: "finden" } },
  wissen: { ru: "знать (факты)", isIrregular: true, praesens: "weiß", praeteritum: "wusste", partizip2: "gewusst", hilfsverb: "haben", forms: { ich: "weiß", du: "weißt", er: "weiß", wir: "wissen", ihr: "wisst", sie: "wissen" }, vowelChange: "i ➔ ei (ich weiß, du weißt, er weiß)" },
  bringen: { ru: "приносить", isIrregular: true, praesens: "bringt", praeteritum: "brachte", partizip2: "gebracht", hilfsverb: "haben", forms: { ich: "bringe", du: "bringst", er: "bringt", wir: "bringen", ihr: "bringt", sie: "bringen" } },
  denken: { ru: "думать", isIrregular: true, praesens: "denkt", praeteritum: "dachte", partizip2: "gedacht", hilfsverb: "haben", forms: { ich: "denke", du: "denkst", er: "denkt", wir: "denken", ihr: "denkt", sie: "деnken" } },
  bleiben: { ru: "оставаться", isIrregular: true, praesens: "bleibt", praeteritum: "blieb", partizip2: "geblieben", hilfsverb: "sein", forms: { ich: "bleibe", du: "bleibst", er: "bleibt", wir: "bleiben", ihr: "bleibt", sie: "bleiben" } },
  trinken: { ru: "пить", isIrregular: true, praesens: "trinkt", praeteritum: "trank", partizip2: "getrunken", hilfsverb: "haben", forms: { ich: "trinke", du: "trinkst", er: "trinkt", wir: "trinken", ihr: "trinkt", sie: "trinken" } },
  essen: { ru: "есть, кушать", isIrregular: true, praesens: "isst", praeteritum: "aß", partizip2: "gegessen", hilfsverb: "haben", forms: { ich: "esse", du: "isst", er: "isst", wir: "essen", ihr: "esst", sie: "essen" }, vowelChange: "e ➔ i, ss (du isst, er isst)" },
  schlafen: { ru: "спать", isIrregular: true, praesens: "schläft", praeteritum: "schlief", partizip2: "geschlafen", hilfsverb: "haben", forms: { ich: "schlafe", du: "schläfst", er: "schläft", wir: "schlafen", ihr: "schlaft", sie: "schlafen" }, vowelChange: "a ➔ ä (du schläfst, er schläft)" },
  laufen: { ru: "бегать, идти пешком", isIrregular: true, praesens: "läuft", praeteritum: "lief", partizip2: "gelaufen", hilfsverb: "sein", forms: { ich: "laufe", du: "läufst", er: "läuft", wir: "laufen", ihr: "lauft", sie: "laufen" }, vowelChange: "au ➔ äu (du läufst, er läuft)" },
  helfen: { ru: "помогать", isIrregular: true, praesens: "hilft", praeteritum: "half", partizip2: "geholfen", hilfsverb: "haben", forms: { ich: "helfe", du: "hilfst", er: "hilft", wir: "helfen", ihr: "helft", sie: "helfen" }, vowelChange: "e ➔ i (du hilfst, er hilft)" },
  treffen: { ru: "встречать, видеться", isIrregular: true, praesens: "trifft", praeteritum: "traf", partizip2: "getroffen", hilfsverb: "haben", forms: { ich: "treffe", du: "triffst", er: "trifft", wir: "treffen", ihr: "trefft", sie: "treffen" }, vowelChange: "e ➔ i (du triffst, er trifft)" },
  beginnen: { ru: "начинать", isIrregular: true, praesens: "beginnt", praeteritum: "begann", partizip2: "begonnen", hilfsverb: "haben", forms: { ich: "beginne", du: "beginnst", er: "beginnt", wir: "beginnen", ihr: "beginnt", sie: "beginnen" } },
  verstehen: { ru: "понимать", isIrregular: true, praesens: "versteht", praeteritum: "verstand", partizip2: "verstanden", hilfsverb: "haben", forms: { ich: "verstehe", du: "verstehst", er: "versteht", wir: "verstehen", ihr: "versteht", sie: "verstehen" } },
  tragen: { ru: "носить, нести", isIrregular: true, praesens: "trägt", praeteritum: "trug", partizip2: "getragen", hilfsverb: "haben", forms: { ich: "trage", du: "trägst", er: "trägt", wir: "tragen", ihr: "tragt", sie: "tragen" }, vowelChange: "a ➔ ä (du trägst, er trägt)" },
  stehen: { ru: "стоять", isIrregular: true, praesens: "steht", praeteritum: "stand", partizip2: "gestanden", hilfsverb: "haben", forms: { ich: "stehe", du: "stehst", er: "steht", wir: "stehen", ihr: "steht", sie: "stehen" } },
  liegen: { ru: "лежать", isIrregular: true, praesens: "liegt", praeteritum: "lag", partizip2: "gelegen", hilfsverb: "haben", forms: { ich: "liege", du: "liegst", er: "liegt", wir: "liegen", ihr: "liegt", sie: "liegen" } },
  sitzen: { ru: "сидеть", isIrregular: true, praesens: "sitzt", praeteritum: "saß", partizip2: "gesessen", hilfsverb: "haben", forms: { ich: "sitze", du: "sitzt", er: "sitzt", wir: "sitzen", ihr: "sitzt", sie: "sitzen" }, vowelChange: "основа на -z (du sitzt, er sitzt)" },
  fliegen: { ru: "летать, лететь", isIrregular: true, praesens: "fliegt", praeteritum: "flog", partizip2: "geflogen", hilfsverb: "sein", forms: { ich: "fliege", du: "fliegst", er: "fliegt", wir: "fliegen", ihr: "fliegt", sie: "fliegen" } },
  schwimmen: { ru: "плавать", isIrregular: true, praesens: "schwimmt", praeteritum: "schwamm", partizip2: "geschwommen", hilfsverb: "sein", forms: { ich: "schwimme", du: "schwimmst", er: "schwimmt", wir: "schwimmen", ihr: "schwimmt", sie: "schwimmen" } },
  verlieren: { ru: "терять, проигрывать", isIrregular: true, praesens: "verliert", praeteritum: "verlor", partizip2: "verloren", hilfsverb: "haben", forms: { ich: "verliere", du: "verlierst", er: "verliert", wir: "verlieren", ihr: "verliert", sie: "verlieren" } },
  gewinnen: { ru: "выигрывать, побеждать", isIrregular: true, praesens: "gewinnt", praeteritum: "gewann", partizip2: "gewonnen", hilfsverb: "haben", forms: { ich: "gewinne", du: "gewinnst", er: "gewinnt", wir: "gewinnen", ihr: "gewinnt", sie: "gewinnen" } },
  schließen: { ru: "закрывать, завершать", isIrregular: true, praesens: "schließt", praeteritum: "schloss", partizip2: "geschlossen", hilfsverb: "haben", forms: { ich: "schließe", du: "schließt", er: "schließt", wir: "schließen", ihr: "schließt", sie: "schließen" } },
  ziehen: { ru: "тянуть, переезжать", isIrregular: true, praesens: "zieht", praeteritum: "zog", partizip2: "gezogen", hilfsverb: "haben", forms: { ich: "ziehe", du: "ziehst", er: "zieht", wir: "ziehen", ihr: "zieht", sie: "ziehen" } },
  rufen: { ru: "звать, кричать", isIrregular: true, praesens: "ruft", praeteritum: "rief", partizip2: "gerufen", hilfsverb: "haben", forms: { ich: "rufe", du: "rufst", er: "ruft", wir: "rufen", ihr: "ruft", sie: "rufen" } },
  kennen: { ru: "знать (человека, город)", isIrregular: true, praesens: "kennt", praeteritum: "kannte", partizip2: "gekannt", hilfsverb: "haben", forms: { ich: "kenne", du: "kennst", er: "kennt", wir: "kennen", ihr: "kennt", sie: "kennen" } },
  waschen: { ru: "мыть, стирать", isIrregular: true, praesens: "wäscht", praeteritum: "wusch", partizip2: "gewaschen", hilfsverb: "haben", forms: { ich: "wasche", du: "wäschst", er: "wäscht", wir: "waschen", ihr: "wascht", sie: "waschen" }, vowelChange: "a ➔ ä (du wäschst, er wäscht)" },
  vergessen: { ru: "забывать", isIrregular: true, praesens: "vergisst", praeteritum: "vergaß", partizip2: "vergessen", hilfsverb: "haben", forms: { ich: "vergesse", du: "vergisst", er: "vergisst", wir: "vergessen", ihr: "vergesst", sie: "vergessen" }, vowelChange: "e ➔ i (du vergisst, er vergisst)" },
  einladen: { ru: "приглашать", isIrregular: true, praesens: "lädt ein", praeteritum: "lud ein", partizip2: "eingeladen", hilfsverb: "haben", forms: { ich: "lade ein", du: "lädst ein", er: "lädt ein", wir: "laden ein", ihr: "ladet ein", sie: "laden ein" }, vowelChange: "a ➔ ä (du lädst ein, er lädt ein)" },
  anfangen: { ru: "начинать", isIrregular: true, praesens: "fängt an", praeteritum: "fing an", partizip2: "angefangen", hilfsverb: "haben", forms: { ich: "fange an", du: "fängst an", er: "fängt an", wir: "fangen an", ihr: "fangt an", sie: "fangen an" }, vowelChange: "a ➔ ä (du fängst an, er fängt an)" },
  aufstehen: { ru: "вставать, подниматься", isIrregular: true, praesens: "steht auf", praeteritum: "stand auf", partizip2: "aufgestanden", hilfsverb: "sein", forms: { ich: "stehe auf", du: "stehst auf", er: "steht auf", wir: "stehen auf", ihr: "steht auf", sie: "stehen auf" } },
  fernsehen: { ru: "смотреть телевизор", isIrregular: true, praesens: "sieht fern", praeteritum: "sah fern", partizip2: "ferngesehen", hilfsverb: "haben", forms: { ich: "sehe fern", du: "siehst fern", er: "sieht fern", wir: "sehen fern", ihr: "seht fern", sie: "sehen fern" }, vowelChange: "e ➔ ie (du siehst fern, er sieht fern)" },
  mitkommen: { ru: "идти вместе, составить компанию", isIrregular: true, praesens: "kommt mit", praeteritum: "kam mit", partizip2: "mitgekommen", hilfsverb: "sein", forms: { ich: "komme mit", du: "kommst mit", er: "kommt mit", wir: "kommen mit", ihr: "kommt mit", sie: "kommen mit" } },
  sterben: { ru: "умирать", isIrregular: true, praesens: "stirbt", praeteritum: "starb", partizip2: "gestorben", hilfsverb: "sein", forms: { ich: "sterbe", du: "stirbst", er: "stirbt", wir: "sterben", ihr: "sterbt", sie: "sterben" }, vowelChange: "e ➔ i (du stirbst, er stirbt)" },
  bieten: { ru: "предлагать", isIrregular: true, praesens: "bietet", praeteritum: "bot", partizip2: "geboten", hilfsverb: "haben", forms: { ich: "biete", du: "bietest", er: "bietet", wir: "bieten", ihr: "bietet", sie: "bieten" } },
  bitten: { ru: "просить", isIrregular: true, praesens: "bittet", praeteritum: "bat", partizip2: "gebeten", hilfsverb: "haben", forms: { ich: "bitte", du: "bittest", er: "bittet", wir: "bitten", ihr: "bittet", sie: "bitten" } },
  fallen: { ru: "падать", isIrregular: true, praesens: "fällt", praeteritum: "fiel", partizip2: "gefallen", hilfsverb: "sein", forms: { ich: "falle", du: "fällst", er: "fällt", wir: "fallen", ihr: "fallt", sie: "fallen" }, vowelChange: "a ➔ ä (du fällst, er fällt)" },
  halten: { ru: "держать, останавливаться", isIrregular: true, praesens: "hält", praeteritum: "hielt", partizip2: "gehalten", hilfsverb: "haben", forms: { ich: "halte", du: "hältst", er: "hält", wir: "halten", ihr: "haltet", sie: "halten" }, vowelChange: "a ➔ ä (du hältst, er hält)" },
  lassen: { ru: "оставлять, позволять", isIrregular: true, praesens: "lässt", praeteritum: "ließ", partizip2: "gelassen", hilfsverb: "haben", forms: { ich: "lasse", du: "lässt", er: "lässt", wir: "lassen", ihr: "lasst", sie: "lassen" }, vowelChange: "a ➔ ä (du lässt, er lässt)" },
  nennen: { ru: "называть", isIrregular: true, praesens: "nennt", praeteritum: "nannte", partizip2: "genannt", hilfsverb: "haben", forms: { ich: "nenne", du: "nennst", er: "nennt", wir: "nennen", ihr: "nennt", sie: "nennen" } },
  rennen: { ru: "бежать, мчаться", isIrregular: true, praesens: "rennt", praeteritum: "rannte", partizip2: "gerannt", hilfsverb: "sein", forms: { ich: "renne", du: "rennst", er: "rennt", wir: "rennen", ihr: "rennt", sie: "rennen" } },
  scheinen: { ru: "светить, казаться", isIrregular: true, praesens: "scheint", praeteritum: "schien", partizip2: "geschienen", hilfsverb: "haben", forms: { ich: "scheine", du: "scheinst", er: "scheint", wir: "scheinen", ihr: "scheint", sie: "scheinen" } },
  schlagen: { ru: "бить, ударять", isIrregular: true, praesens: "schlägt", praeteritum: "schlug", partizip2: "geschlagen", hilfsverb: "haben", forms: { ich: "schlage", du: "schlägst", er: "schlägt", wir: "schlagen", ihr: "schlagt", sie: "schlagen" }, vowelChange: "a ➔ ä (du schlägst, er schlägt)" },
  schneiden: { ru: "резать", isIrregular: true, praesens: "schneidet", praeteritum: "schnitt", partizip2: "geschnitten", hilfsverb: "haben", forms: { ich: "schneide", du: "schneidest", er: "schneidet", wir: "schneiden", ihr: "schneidet", sie: "schneiden" } },
  sinken: { ru: "опускаться, тонуть", isIrregular: true, praesens: "sinkt", praeteritum: "sank", partizip2: "gesunken", hilfsverb: "sein", forms: { ich: "sinke", du: "sinkst", er: "sinkt", wir: "sinken", ihr: "sinkt", sie: "sinken" } },
  steigen: { ru: "подниматься", isIrregular: true, praesens: "steigt", praeteritum: "stieg", partizip2: "gestiegen", hilfsverb: "sein", forms: { ich: "steige", du: "steigst", er: "steigt", wir: "steigen", ihr: "steigt", sie: "steigen" } },
  tun: { ru: "делать", isIrregular: true, praesens: "tut", praeteritum: "tat", partizip2: "getan", hilfsverb: "haben", forms: { ich: "tue", du: "tust", er: "tut", wir: "tun", ihr: "tut", sie: "tun" } },
  verbringen: { ru: "проводить (время)", isIrregular: true, praesens: "verbringt", praeteritum: "verbrachte", partizip2: "verbracht", hilfsverb: "haben", forms: { ich: "verbringe", du: "verbringst", er: "verbringt", wir: "verbringen", ihr: "verbringt", sie: "verbringen" } },
  verlassen: { ru: "покидать, оставлять", isIrregular: true, praesens: "verlässt", praeteritum: "verließ", partizip2: "verlassen", hilfsverb: "haben", forms: { ich: "verlasse", du: "verlässt", er: "verlässt", wir: "verlassen", ihr: "verlasst", sie: "verlassen" }, vowelChange: "a ➔ ä (du verlässt, er verlässt)" },
  wachsen: { ru: "расти", isIrregular: true, praesens: "wächst", praeteritum: "wuchs", partizip2: "gewachsen", hilfsverb: "sein", forms: { ich: "wachse", du: "wächst", er: "wächst", wir: "wachsen", ihr: "wachst", sie: "wachsen" }, vowelChange: "a ➔ ä (du wächst, er wächst)" },
  werfen: { ru: "бросать, кидать", isIrregular: true, praesens: "wirft", praeteritum: "warf", partizip2: "geworfen", hilfsverb: "haben", forms: { ich: "werfe", du: "wirfst", er: "wirft", wir: "werfen", ihr: "werft", sie: "werfen" }, vowelChange: "e ➔ i (du wirfst, er wirft)" },

  // Common regular verbs
  machen: { ru: "делать", isIrregular: false, praesens: "macht", praeteritum: "machte", partizip2: "gemacht", hilfsverb: "haben" },
  lernen: { ru: "учить, изучать", isIrregular: false, praesens: "lernt", praeteritum: "lernte", partizip2: "gelernt", hilfsverb: "haben" },
  arbeiten: { ru: "работать", isIrregular: false, praesens: "arbeitet", praeteritum: "arbeitete", partizip2: "gearbeitet", hilfsverb: "haben" },
  wohnen: { ru: "жить, проживать", isIrregular: false, praesens: "wohnt", praeteritum: "wohnte", partizip2: "gewohnt", hilfsverb: "haben" },
  kaufen: { ru: "покупать", isIrregular: false, praesens: "kauft", praeteritum: "kaufte", partizip2: "gekauft", hilfsverb: "haben" },
  kochen: { ru: "готовить (еду), варить", isIrregular: false, praesens: "kocht", praeteritum: "kochte", partizip2: "gekocht", hilfsverb: "haben" },
  spielen: { ru: "играть", isIrregular: false, praesens: "spielt", praeteritum: "spielte", partizip2: "gespielt", hilfsverb: "haben" },
  fragen: { ru: "спрашивать", isIrregular: false, praesens: "fragt", praeteritum: "fragte", partizip2: "gefragt", hilfsverb: "haben" },
  antworten: { ru: "отвечать", isIrregular: false, praesens: "antwortet", praeteritum: "antwortete", partizip2: "geantwortet", hilfsverb: "haben" },
  hören: { ru: "слушать, слышать", isIrregular: false, praesens: "hört", praeteritum: "hörte", partizip2: "gehört", hilfsverb: "haben" },
  brauchen: { ru: "нуждаться, требоваться", isIrregular: false, praesens: "braucht", praeteritum: "brauchte", partizip2: "gebraucht", hilfsverb: "haben" },
  leben: { ru: "жить, существовать", isIrregular: false, praesens: "lebt", praeteritum: "lebte", partizip2: "gelebt", hilfsverb: "haben" },
  lieben: { ru: "любить", isIrregular: false, praesens: "liebt", praeteritum: "liebte", partizip2: "geliebt", hilfsverb: "haben" },
  suchen: { ru: "искать", isIrregular: false, praesens: "sucht", praeteritum: "suchte", partizip2: "gesucht", hilfsverb: "haben" },
  reisen: { ru: "путешествовать", isIrregular: false, praesens: "reist", praeteritum: "reiste", partizip2: "gereist", hilfsverb: "sein" },
  tanzen: { ru: "танцевать", isIrregular: false, praesens: "tanzt", praeteritum: "tanzte", partizip2: "getanzt", hilfsverb: "haben" }
};

export function conjugateRegularVerb(inf) {
  if (!inf) return null;
  const lower = inf.trim().toLowerCase();
  let stem = lower;
  if (lower.endsWith("en")) stem = lower.slice(0, -2);
  else if (lower.endsWith("n")) stem = lower.slice(0, -1);

  const needsE = /[td]$/.test(stem) || /[^aeiou][mn]$/.test(stem);
  const sEnding = /[sßzx]$|tz$/.test(stem);

  const forms = {
    ich: stem + "e",
    du: stem + (sEnding ? "t" : (needsE ? "est" : "st")),
    er: stem + (needsE ? "et" : "t"),
    wir: lower,
    ihr: stem + (needsE ? "et" : "t"),
    sie: lower
  };

  const praeteritum = stem + (needsE ? "ete" : "te");

  let partizip2;
  if (lower.endsWith("ieren")) {
    partizip2 = stem + "t";
  } else if (/^(be|ver|zer|er|ent|emp|miss|ge)/.test(lower)) {
    partizip2 = stem + (needsE ? "et" : "t");
  } else {
    partizip2 = "ge" + stem + (needsE ? "et" : "t");
  }

  const isMotion = ["reisen", "wandern", "folgen", "klettern", "segeln", "joggen"].includes(lower);
  const hilfsverb = isMotion ? "sein" : "haben";

  return {
    forms,
    praesens: forms.er,
    praeteritum,
    partizip2,
    hilfsverb,
    isIrregular: false
  };
}

export function getVerbForms(infinitive, userPraesens, userPraeteritum, userPartizip2, userHilfsverb, forceRegular = false) {
  const key = (infinitive || "").trim().toLowerCase();
  const known = forceRegular ? null : KNOWN_VERBS_DICT[key];
  const regular = conjugateRegularVerb(infinitive);

  let forms;
  if (known && known.forms) {
    forms = { ...known.forms };
  } else if (regular) {
    forms = { ...regular.forms };
  } else {
    forms = { ich: "-", du: "-", er: "-", wir: "-", ihr: "-", sie: "-" };
  }

  if (userPraesens && userPraesens.trim()) {
    let p = userPraesens.trim();
    p = p.replace(/^(er|sie|es)\s+/i, "");
    forms.er = p;
    if (known && known.forms) {
      forms.du = known.forms.du;
    }
  }

  const praeteritum = (userPraeteritum && userPraeteritum.trim()) || (known?.praeteritum) || (regular?.praeteritum) || "";
  const partizip2 = (userPartizip2 && userPartizip2.trim()) || (known?.partizip2) || (regular?.partizip2) || "";
  const hilfsverb = userHilfsverb || (known?.hilfsverb) || (regular?.hilfsverb) || "haben";
  const vowelChange = known?.vowelChange || "";

  return { forms, praeteritum, partizip2, hilfsverb, vowelChange };
}

export function isVerbWord(w) {
  if (!w) return false;
  const catName = (w.category?.name || "").toLowerCase();
  const catId = w.categoryId || "";

  if (catId === "cat_irregular_verbs" || catId === "cat_regular_verbs") return true;
  if (catName.includes("глагол") || catName.includes("verb")) return true;
  if (w.praeteritum || w.partizip2 || w.praesens) return true;

  return false;
}

export function classifyVerbType(w) {
  const catName = (w.category?.name || "").toLowerCase();
  const catId = w.categoryId || "";

  if (catId === "cat_irregular_verbs" || catName.includes("неправильн")) return "irregular";
  if (catId === "cat_regular_verbs" || catName.includes("обычн")) return "regular";

  if (w.praeteritum) {
    const reg = conjugateRegularVerb(w.de);
    const cleanPrat = String(w.praeteritum).trim().toLowerCase().replace(/^(er|sie|es)\s+/i, "");
    if (reg) {
      return (cleanPrat === reg.praeteritum) ? "regular" : "irregular";
    }
  }

  const known = KNOWN_VERBS_DICT[(w.de || "").trim().toLowerCase()];
  if (known) return known.isIrregular ? "irregular" : "regular";

  return "regular";
}
