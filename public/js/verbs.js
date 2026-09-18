/**
 * German Verbs Trainer Module: Present Tense Conjugation (Präsens)
 * with Per-Form Leitner Spaced Repetition (SRS)
 * Every pronoun form (ich, du, er, wir, ihr, sie) is tracked as an individual Leitner cell!
 */
(function () {
  // Storage Keys
  var VERB_TYPE_KEY = "german-trainer-verb-type-v2";       // 'irregular' | 'regular' | 'all'
  var VERB_MODE_KEY = "german-trainer-verb-mode-v2";       // 'input' | 'choice'
  var VERB_SRS_KEY = "german-trainer-verb-srs-v2";         // Leitner state store per form
  var VERB_SRS_ENABLED_KEY = "german-trainer-verb-srs-on-v2";
  var VERB_STATS_KEY = "german-trainer-stats-verb-v2";

  // Pronoun definitions (all 6 forms)
  var PRONOUNS = [
    { key: "ich", de: "ich", ru: "я" },
    { key: "du", de: "du", ru: "ты", highlight: true },
    { key: "er", de: "er/sie/es", ru: "он / она / оно", highlight: true },
    { key: "wir", de: "wir", ru: "мы" },
    { key: "ihr", de: "ihr", ru: "вы" },
    { key: "sie", de: "sie/Sie", ru: "они / Вы" }
  ];

  // Leitner SRS Levels & Intervals in Days
  var LEVEL_INTERVALS = {
    1: 0,        // 🌱 Level 1: New / Review Today (0 days)
    2: 1,        // 🌿 Level 2: Familiar (1 day)
    3: 3,        // 🌳 Level 3: Retained (3 days)
    4: 7,        // 🌲 Level 4: Confident (7 days)
    5: 14        // 🏆 Level 5: Mastered (14 days)
  };

  var LEVEL_BADGES = {
    1: { name: "🌱 Уровень 1 (сегодня)", shortName: "Ур. 1", cls: "box-1" },
    2: { name: "🌿 Уровень 2 (1 день)", shortName: "Ур. 2", cls: "box-2" },
    3: { name: "🌳 Уровень 3 (3 дня)", shortName: "Ур. 3", cls: "box-3" },
    4: { name: "🌲 Уровень 4 (7 дней)", shortName: "Ур. 4", cls: "box-4" },
    5: { name: "🏆 Уровень 5 (выучено)", shortName: "Ур. 5", cls: "box-5" }
  };

  var DAY_MS = 24 * 60 * 60 * 1000;

  // Complete database of irregular verb conjugations in Präsens
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

  /**
   * Universal regular German verb conjugation rule for any weak verb
   */
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

  // State
  var allVerbs = [];
  var irregularVerbs = [];
  var regularVerbs = [];
  var activePool = [];

  var currentUnit = null; // { verb, pronoun, formKey, correctAnswer }
  var lastUnitKey = null; // 'verb_sprechen_du'
  var isAnswerChecked = false;
  var lastResult = null;  // { isCorrect, pronounDe, pronounRu, correctAnswer, userAnswer, verbDe, srsInfo }

  var currentVerbType = "irregular"; // 'irregular' | 'regular' | 'all'
  var currentMode = "input";          // 'input' | 'choice'
  var srsEnabled = true;

  // Scores
  var scores = {
    correct: 0,
    total: 0,
    streak: 0,
    bestStreak: 0
  };

  // String normalization
  function normalize(s) {
    if (!s) return "";
    return s.trim().toLowerCase().replace(/ß/g, "ss").replace(/\s+/g, " ");
  }

  // DOM Elements
  var dom = {};

  function initDom() {
    dom.panel = document.getElementById("panel-verbs");
    dom.typePills = document.getElementById("verb-type-pills");
    dom.modePills = document.getElementById("verb-mode-pills");
    dom.prevResult = document.getElementById("verb-prev-result");
    dom.srsBadge = document.getElementById("verb-srs-badge");
    dom.qmode = document.getElementById("verb-qmode");
    dom.question = document.getElementById("verb-question");
    dom.translationHint = document.getElementById("verb-translation-hint");
    dom.pronounBadge = document.getElementById("verb-pronoun-badge");
    dom.pronounDe = document.getElementById("verb-pronoun-de");
    dom.pronounRu = document.getElementById("verb-pronoun-ru");

    dom.inputContainer = document.getElementById("verb-conjugation-input-container");
    dom.inputLead = document.getElementById("verb-input-lead");
    dom.answerInput = document.getElementById("verb-answer");

    dom.choiceContainer = document.getElementById("verb-choice-container");

    dom.umlautsBar = document.getElementById("verb-umlauts-bar");
    dom.quizButtons = document.getElementById("verb-quiz-buttons");
    dom.checkBtn = document.getElementById("verb-check-btn");
    dom.hintBtn = document.getElementById("verb-hint-btn");
    dom.nextBtn = document.getElementById("verb-next-btn");
    dom.feedback = document.getElementById("verb-feedback");

    dom.scoreCorrect = document.getElementById("verb-score-correct");
    dom.scoreTotal = document.getElementById("verb-score-total");
    dom.scorePercent = document.getElementById("verb-score-percent");
    dom.streak = document.getElementById("verb-streak");
    dom.bestStreak = document.getElementById("verb-best-streak");
    dom.resetBtn = document.getElementById("verb-reset-btn");

    // Modals
    dom.settingsModal = document.getElementById("verb-settings-modal");
    dom.srsModal = document.getElementById("verb-srs-modal");
    dom.cheatsheetModal = document.getElementById("verb-cheatsheet-modal");

    dom.cheatsheetSearch = document.getElementById("verb-cheatsheet-search");
    dom.cheatsheetTbody = document.getElementById("verb-cheatsheet-tbody");

    // SRS Modal stats elements
    dom.srsTotal = document.getElementById("verb-srs-total-count");
    dom.srsDue = document.getElementById("verb-srs-due-count");
    dom.srsMastered = document.getElementById("verb-srs-mastered-count");
    dom.srsDueList = document.getElementById("verb-srs-due-list");
    dom.srsResetBtn = document.getElementById("verb-reset-srs-btn");

    // Dynamic count badges in parameters modal
    dom.countIrreg = document.getElementById("verb-count-irreg");
    dom.countReg = document.getElementById("verb-count-reg");
    dom.countAll = document.getElementById("verb-count-all");
  }

  // ==================== PER-FORM SRS STORAGE ENGINE ====================

  function getSrsStore() {
    try {
      var raw = localStorage.getItem(VERB_SRS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveSrsStore(data) {
    try {
      localStorage.setItem(VERB_SRS_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  function getFormKey(verbId, pronounKey) {
    return (verbId || "") + "_" + (pronounKey || "");
  }

  function getFormSrs(verbId, pronounKey) {
    if (!verbId || !pronounKey) {
      return { box: 1, nextReview: 0, reviews: 0, mistakes: 0, lastReviewed: 0 };
    }
    var store = getSrsStore();
    var key = getFormKey(verbId, pronounKey);
    var record = store[key];

    // Graceful fallback if legacy single-verb record exists
    if (!record && store[verbId] && typeof store[verbId].box === "number") {
      record = {
        box: store[verbId].box || 1,
        nextReview: store[verbId].nextReview || 0,
        reviews: 0,
        mistakes: 0,
        lastReviewed: 0
      };
    }

    return record || { box: 1, nextReview: 0, reviews: 0, mistakes: 0, lastReviewed: 0 };
  }

  function updateFormSrs(verbId, pronounKey, isCorrect) {
    if (!verbId || !pronounKey || !srsEnabled) return null;
    var store = getSrsStore();
    var key = getFormKey(verbId, pronounKey);
    var record = getFormSrs(verbId, pronounKey);

    var now = Date.now();
    var oldBox = record.box || 1;
    var newBox = oldBox;
    record.reviews = (record.reviews || 0) + 1;
    record.lastReviewed = now;

    if (isCorrect) {
      newBox = Math.min(5, oldBox + 1);
      record.box = newBox;
      var intervalDays = LEVEL_INTERVALS[newBox];
      record.nextReview = now + intervalDays * DAY_MS;
    } else {
      newBox = 1;
      record.box = 1;
      record.mistakes = (record.mistakes || 0) + 1;
      record.nextReview = now; // due immediately today
    }

    store[key] = record;
    saveSrsStore(store);

    return {
      oldBox: oldBox,
      newBox: newBox,
      levelName: LEVEL_BADGES[newBox].name,
      intervalDays: LEVEL_INTERVALS[newBox]
    };
  }

  function updateSrsBadge(pronounDe, box) {
    if (!dom.srsBadge) return;
    var b = box || 1;
    var info = LEVEL_BADGES[b] || LEVEL_BADGES[1];
    dom.srsBadge.className = "srs-box-badge " + info.cls;
    dom.srsBadge.textContent = info.name.replace(")", ": " + (pronounDe || "") + ")");
    dom.srsBadge.style.display = srsEnabled ? "inline-flex" : "none";
  }

  // ==================== VERBS DATA FETCHING & CLASSIFICATION ====================

  async function loadVerbs() {
    try {
      var words = await ApiClient.getWords();
      classifyVerbs(words);
      applyVerbTypeFilter(currentVerbType);
      renderCheatsheet();
      nextQuestion(true);
    } catch (err) {
      console.error("Could not fetch verbs from API:", err);
      classifyVerbs([]);
      applyVerbTypeFilter(currentVerbType);
      renderCheatsheet();
      nextQuestion(true);
    }
  }

  function classifyVerbs(words) {
    allVerbs = [];
    irregularVerbs = [];
    regularVerbs = [];

    var seen = new Map();

    (words || []).forEach(function (w) {
      if (!w || !w.de) return;
      var catName = (w.category && w.category.name) ? w.category.name.toLowerCase() : "";
      var catId = w.categoryId || "";
      var de = (w.de || "").trim();
      var deLower = de.toLowerCase();

      var isVerb = (
        catId === "cat_irregular_verbs" ||
        catId === "cat_regular_verbs" ||
        catName.includes("глагол") ||
        catName.includes("verb") ||
        Boolean(w.praeteritum || w.partizip2 || w.praesens || w.hilfsverb)
      );

      if (!isVerb) return;

      if (seen.has(deLower)) {
        var prev = seen.get(deLower);
        if (!prev.praeteritum && w.praeteritum) {
          seen.set(deLower, w);
        }
      } else {
        seen.set(deLower, w);
      }
    });

    seen.forEach(function (w) {
      var de = (w.de || "").trim();
      var deLower = de.toLowerCase();
      var catName = (w.category && w.category.name) ? w.category.name.toLowerCase() : "";
      var catId = w.categoryId || "";

      var isIrreg = (
        catId === "cat_irregular_verbs" ||
        catName.includes("неправильн") ||
        Boolean(IRREGULAR_CONJUGATIONS[deLower])
      );

      var forms;
      var vowelChange = null;

      if (IRREGULAR_CONJUGATIONS[deLower]) {
        var baseConj = IRREGULAR_CONJUGATIONS[deLower];
        forms = Object.assign({}, baseConj.forms);
        vowelChange = baseConj.vowelChange || null;
      } else {
        forms = conjugateRegular(deLower);
      }

      if (w.praesens) {
        var cleanP3 = w.praesens.replace(/^(er|sie|es)\s+/i, "").trim();
        if (cleanP3) {
          forms.er = cleanP3;
        }
      }

      if (w.praesensIch) forms.ich = w.praesensIch.trim();
      if (w.praesensDu) forms.du = w.praesensDu.trim();
      if (w.praesensEr) forms.er = w.praesensEr.trim();
      if (w.praesensWir) forms.wir = w.praesensWir.trim();
      if (w.praesensIhr) forms.ihr = w.praesensIhr.trim();
      if (w.praesensSie) forms.sie = w.praesensSie.trim();

      var verbObj = {
        id: w.id || "verb_" + deLower,
        de: de,
        ru: w.ru || "",
        praesens: w.praesens || forms.er || "",
        praeteritum: w.praeteritum || "",
        partizip2: w.partizip2 || "",
        hilfsverb: w.hilfsverb || "haben",
        praesensIch: w.praesensIch || "",
        praesensDu: w.praesensDu || "",
        praesensEr: w.praesensEr || "",
        praesensWir: w.praesensWir || "",
        praesensIhr: w.praesensIhr || "",
        praesensSie: w.praesensSie || "",
        conjugation: {
          forms: forms,
          vowelChange: vowelChange,
          isIrregular: isIrreg
        },
        isIrregular: isIrreg
      };

      allVerbs.push(verbObj);
      if (isIrreg) {
        irregularVerbs.push(verbObj);
      } else {
        regularVerbs.push(verbObj);
      }
    });

    if (dom.countIrreg) dom.countIrreg.textContent = irregularVerbs.length;
    if (dom.countReg) dom.countReg.textContent = regularVerbs.length;
    if (dom.countAll) dom.countAll.textContent = allVerbs.length;
  }

  function applyVerbTypeFilter(type) {
    currentVerbType = type;
    try {
      localStorage.setItem(VERB_TYPE_KEY, type);
    } catch (e) {}

    if (type === "irregular") {
      activePool = irregularVerbs;
    } else if (type === "regular") {
      activePool = regularVerbs;
    } else {
      activePool = allVerbs;
    }

    if (dom.typePills) {
      dom.typePills.querySelectorAll(".verb-pill-btn").forEach(function (btn) {
        btn.classList.toggle("active", btn.dataset.verbType === type);
      });
    }

    var radio = document.querySelector('input[name="verb-type-radio"][value="' + type + '"]');
    if (radio) radio.checked = true;
  }

  function applyMode(mode) {
    if (mode !== "input" && mode !== "choice") {
      mode = "input";
    }
    currentMode = mode;
    try {
      localStorage.setItem(VERB_MODE_KEY, mode);
    } catch (e) {}

    if (dom.inputContainer) dom.inputContainer.style.display = mode === "input" ? "flex" : "none";
    if (dom.choiceContainer) dom.choiceContainer.style.display = mode === "choice" ? "grid" : "none";

    if (dom.quizButtons) dom.quizButtons.style.display = "flex";
    if (dom.umlautsBar) dom.umlautsBar.style.display = mode === "input" ? "flex" : "none";
    if (dom.hintBtn) dom.hintBtn.style.display = mode === "input" ? "inline-block" : "none";
    if (dom.checkBtn) dom.checkBtn.style.display = mode === "input" ? "inline-block" : "none";

    if (dom.qmode) {
      if (mode === "input") dom.qmode.textContent = "Спряжение: введите форму";
      else dom.qmode.textContent = "Тест: выберите правильную форму";
    }

    if (dom.modePills) {
      dom.modePills.querySelectorAll(".verb-pill-btn").forEach(function (btn) {
        btn.classList.toggle("active", btn.dataset.verbMode === mode);
      });
    }

    var radio = document.querySelector('input[name="verb-mode-radio"][value="' + mode + '"]');
    if (radio) radio.checked = true;
  }

  // ==================== PICKING NEXT QUESTION (PER-FORM SRS) ====================

  function getAllActiveUnits() {
    var units = [];
    (activePool || []).forEach(function (verb) {
      var forms = verb.conjugation.forms;
      PRONOUNS.forEach(function (pronoun) {
        var ans = forms[pronoun.key];
        if (ans) {
          units.push({
            verb: verb,
            pronoun: pronoun,
            formKey: getFormKey(verb.id, pronoun.key),
            correctAnswer: (ans || "").trim()
          });
        }
      });
    });
    return units;
  }

  function pickNextUnit() {
    var allUnits = getAllActiveUnits();
    if (allUnits.length === 0) return null;

    var now = Date.now();

    if (srsEnabled) {
      var dueUnits = [];
      allUnits.forEach(function (u) {
        if (lastUnitKey && u.formKey === lastUnitKey && allUnits.length > 1) return;
        var srs = getFormSrs(u.verb.id, u.pronoun.key);
        if (srs.nextReview <= now) {
          dueUnits.push(u);
        }
      });

      if (dueUnits.length > 0) {
        return dueUnits[Math.floor(Math.random() * dueUnits.length)];
      }

      // If no forms are strictly due today, pick weighted by box level (Box 1 is most frequent)
      var candidates = allUnits.filter(function (u) {
        return allUnits.length === 1 || u.formKey !== lastUnitKey;
      });
      var poolToPick = candidates.length > 0 ? candidates : allUnits;

      var weighted = poolToPick.map(function (u) {
        var srs = getFormSrs(u.verb.id, u.pronoun.key);
        var box = srs.box || 1;
        var weight = Math.pow(6 - box, 2); // Box 1 = 25, Box 2 = 16, Box 3 = 9, Box 4 = 4, Box 5 = 1
        return { unit: u, weight: weight };
      });

      var totalWeight = weighted.reduce(function (sum, item) { return sum + item.weight; }, 0);
      var r = Math.random() * totalWeight;
      for (var i = 0; i < weighted.length; i++) {
        r -= weighted[i].weight;
        if (r <= 0) return weighted[i].unit;
      }
      return poolToPick[Math.floor(Math.random() * poolToPick.length)];
    }

    var nonLast = allUnits.filter(function (u) {
      return allUnits.length === 1 || u.formKey !== lastUnitKey;
    });
    return nonLast[Math.floor(Math.random() * nonLast.length)] || allUnits[0];
  }

  // ==================== RENDERING PREVIOUS RESULT ====================

  function renderPrevResult() {
    if (!dom.prevResult) return;
    if (!lastResult) {
      dom.prevResult.innerHTML = "";
      return;
    }

    var targetText = lastResult.pronounDe + " " + lastResult.correctAnswer;
    var verbNote = "(" + lastResult.verbDe + (lastResult.ru ? " — " + lastResult.ru : "") + ")";

    if (lastResult.isCorrect) {
      dom.prevResult.innerHTML = "Прошлый ответ верный: <b>" + targetText + "</b> " + verbNote;
      dom.prevResult.style.color = "var(--success)";
    } else {
      var userGiven = lastResult.userAnswer ? ' (вы ввели: "' + lastResult.userAnswer + '")' : "";
      dom.prevResult.innerHTML = "Прошлый ответ неверный. Правильно: <b>" + targetText + "</b>" + userGiven + " " + verbNote;
      dom.prevResult.style.color = "var(--danger)";
    }
  }

  // ==================== ADVANCING & SETUP QUESTION ====================

  function nextQuestion(skipEvaluation) {
    if (!activePool || activePool.length === 0) return;

    // 1. If moving to next question without having checked the current one, evaluate it first!
    if (!skipEvaluation && !isAnswerChecked && currentUnit) {
      evaluateCurrentSilently();
    }

    // 2. Render previous result at the top of the card
    if (!skipEvaluation) {
      renderPrevResult();
    }

    isAnswerChecked = false;
    currentUnit = pickNextUnit();
    if (!currentUnit) return;
    lastUnitKey = currentUnit.formKey;

    var verb = currentUnit.verb;
    var pronoun = currentUnit.pronoun;

    // Update SRS Badge for this specific form
    var srs = getFormSrs(verb.id, pronoun.key);
    updateSrsBadge(pronoun.de, srs.box);

    // Update Question text
    if (dom.question) dom.question.textContent = verb.de;
    if (dom.translationHint) dom.translationHint.textContent = verb.ru;

    // Update Pronoun Callout
    if (dom.pronounDe) dom.pronounDe.textContent = pronoun.de;
    if (dom.pronounRu) dom.pronounRu.textContent = "(" + pronoun.ru + ")";
    if (dom.inputLead) dom.inputLead.textContent = pronoun.de;

    // Clear feedback
    if (dom.feedback) {
      dom.feedback.textContent = "";
      dom.feedback.className = "feedback";
    }

    // Configure for current mode
    if (currentMode === "input") {
      setupInputMode();
      if (dom.checkBtn) {
        dom.checkBtn.style.display = "inline-block";
        dom.checkBtn.textContent = "Проверить";
      }
    } else {
      setupChoiceMode();
      if (dom.checkBtn) {
        dom.checkBtn.style.display = "none";
      }
    }

    if (dom.nextBtn) dom.nextBtn.style.display = "inline-block";
  }

  // ==================== MODE 1: TYPING / INPUT ====================

  function setupInputMode() {
    if (!dom.answerInput) return;
    dom.answerInput.value = "";
    dom.answerInput.style.borderColor = "";
    dom.answerInput.placeholder = "";
    setTimeout(function () {
      dom.answerInput.focus();
    }, 50);
  }

  function evaluateCurrentSilently() {
    if (!currentUnit || isAnswerChecked) return;
    var rawInput = (dom.answerInput ? dom.answerInput.value : "").trim();
    if (currentMode === "input" && rawInput) {
      var cleanInput = rawInput.replace(new RegExp("^" + currentUnit.pronoun.de + "\\s+", "i"), "").trim();
      var isCorrect = normalize(cleanInput) === normalize(currentUnit.correctAnswer);
      finishAnswer(isCorrect, cleanInput);
    } else {
      // Empty or skipped
      finishAnswer(false, rawInput || "");
    }
  }

  function checkInputAnswer() {
    if (!currentUnit || isAnswerChecked) return;

    var rawInput = (dom.answerInput ? dom.answerInput.value : "").trim();
    if (!rawInput) {
      showFeedback("Пожалуйста, введите форму глагола", "incorrect");
      if (dom.answerInput) dom.answerInput.focus();
      return;
    }

    var cleanInput = rawInput.replace(new RegExp("^" + currentUnit.pronoun.de + "\\s+", "i"), "").trim();
    var isCorrect = normalize(cleanInput) === normalize(currentUnit.correctAnswer);
    finishAnswer(isCorrect, cleanInput);
  }

  // ==================== MODE 2: MULTIPLE CHOICE TEST ====================

  function setupChoiceMode() {
    if (!dom.choiceContainer || !currentUnit) return;
    dom.choiceContainer.innerHTML = "";

    var options = generateDistractors(currentUnit.verb, currentUnit.pronoun, currentUnit.correctAnswer);

    options.forEach(function (opt) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "conjugation-choice-btn";
      btn.textContent = opt;

      btn.addEventListener("click", function () {
        if (isAnswerChecked) return;
        var isCorrect = normalize(opt) === normalize(currentUnit.correctAnswer);

        dom.choiceContainer.querySelectorAll(".conjugation-choice-btn").forEach(function (b) {
          if (normalize(b.textContent) === normalize(currentUnit.correctAnswer)) {
            b.classList.add("correct");
          } else if (b === btn && !isCorrect) {
            b.classList.add("wrong");
          }
        });

        finishAnswer(isCorrect, opt);
      });

      dom.choiceContainer.appendChild(btn);
    });
  }

  function generateDistractors(verb, pronoun, correct) {
    var set = new Set();
    set.add(correct);

    // 1. Add other forms of the same verb
    var forms = verb.conjugation.forms;
    Object.keys(forms).forEach(function (k) {
      if (forms[k] && forms[k] !== correct) {
        set.add(forms[k]);
      }
    });

    // 2. Add regularized/distorted stem variations
    var stem = verb.de.replace(/en$/, "").replace(/n$/, "");
    if (pronoun.key === "du") {
      set.add(stem + "st");
      set.add(stem + "t");
    } else if (pronoun.key === "er") {
      set.add(stem + "t");
      set.add(stem + "st");
    }

    // 3. Add forms from other verbs in active pool
    var tries = 0;
    while (set.size < 4 && tries < 30) {
      tries++;
      var otherVerb = activePool[Math.floor(Math.random() * activePool.length)];
      if (otherVerb && otherVerb.conjugation && otherVerb.conjugation.forms) {
        var otherForm = otherVerb.conjugation.forms[pronoun.key];
        if (otherForm) set.add(otherForm);
      }
    }

    var list = Array.from(set).slice(0, 4);
    return list.sort(function () { return Math.random() - 0.5; });
  }

  // ==================== CHECKING & SCORING ====================

  function finishAnswer(isCorrect, userVal) {
    if (!currentUnit || isAnswerChecked) return;
    isAnswerChecked = true;
    scores.total++;

    var verb = currentUnit.verb;
    var pronoun = currentUnit.pronoun;
    var correctAns = currentUnit.correctAnswer;

    var srsInfo = updateFormSrs(verb.id, pronoun.key, isCorrect);

    if (isCorrect) {
      scores.correct++;
      scores.streak++;
      if (scores.streak > scores.bestStreak) scores.bestStreak = scores.streak;

      var vowelNote = verb.conjugation.vowelChange ? " (⚡ " + verb.conjugation.vowelChange + ")" : "";
      var srsNote = "";
      if (srsInfo) {
        if (srsInfo.newBox === 5) {
          srsNote = "<br><small style='color: #059669; font-weight: 600;'>🏆 Форма <b>" + pronoun.de + " " + correctAns + "</b> полностью выучена (Уровень 5 — повтор через " + srsInfo.intervalDays + " дн.)</small>";
        } else {
          srsNote = "<br><small style='color: var(--primary);'>Форма <b>" + pronoun.de + " " + correctAns + "</b> ➔ Уровень " + srsInfo.newBox + " (повтор через " + srsInfo.intervalDays + " дн.)</small>";
        }
      }

      showFeedback("🎉 Верно! <b>" + pronoun.de + " " + correctAns + "</b>" + vowelNote + srsNote, "correct");
      if (dom.answerInput) dom.answerInput.style.borderColor = "var(--success-border)";
    } else {
      scores.streak = 0;
      var hint = "Правильно: <b>" + pronoun.de + " " + correctAns + "</b>";
      if (verb.conjugation.vowelChange) {
        hint += " — " + verb.conjugation.vowelChange;
      }
      var srsNoteErr = srsInfo ? "<br><small style='color: #d9480f;'>🌱 Форма <b>" + pronoun.de + " " + correctAns + "</b> вернулась на Уровень 1 (повтор сегодня)</small>" : "";
      showFeedback("❌ Неверно. " + hint + srsNoteErr, "incorrect");
      if (dom.answerInput) dom.answerInput.style.borderColor = "var(--danger-border)";
    }

    lastResult = {
      isCorrect: isCorrect,
      pronounDe: pronoun.de,
      pronounRu: pronoun.ru,
      correctAnswer: correctAns,
      userAnswer: userVal || "",
      verbDe: verb.de,
      ru: verb.ru,
      formKey: currentUnit.formKey,
      srsInfo: srsInfo
    };

    renderPrevResult();
    updateScorebar();
    saveStats();

    if (dom.checkBtn) {
      dom.checkBtn.style.display = "none";
    }
  }

  function showFeedback(htmlText, type) {
    if (!dom.feedback) return;
    dom.feedback.innerHTML = htmlText;
    dom.feedback.className = "feedback " + type;
  }

  function updateScorebar() {
    if (dom.scoreCorrect) dom.scoreCorrect.textContent = scores.correct;
    if (dom.scoreTotal) dom.scoreTotal.textContent = scores.total;
    var pct = scores.total > 0 ? Math.round((scores.correct / scores.total) * 100) : 0;
    if (dom.scorePercent) dom.scorePercent.textContent = pct + "%";
    if (dom.streak) dom.streak.textContent = scores.streak;
    if (dom.bestStreak) dom.bestStreak.textContent = scores.bestStreak;
  }

  function loadSavedStats() {
    try {
      var raw = localStorage.getItem(VERB_STATS_KEY);
      if (!raw) return;
      var saved = JSON.parse(raw);
      if (typeof saved.correct === "number") scores.correct = saved.correct;
      if (typeof saved.total === "number") scores.total = saved.total;
      if (typeof saved.streak === "number") scores.streak = saved.streak;
      if (typeof saved.bestStreak === "number") scores.bestStreak = saved.bestStreak;
    } catch (e) {}
  }

  function saveStats() {
    try {
      localStorage.setItem(VERB_STATS_KEY, JSON.stringify(scores));
    } catch (e) {}
  }

  // ==================== CHEATSHEET TABLE MODAL ====================

  function renderCheatsheet() {
    if (!dom.cheatsheetTbody) return;
    var search = (dom.cheatsheetSearch ? dom.cheatsheetSearch.value : "").trim().toLowerCase();
    var filter = "all";
    var activeFilterBtn = document.querySelector(".verb-cs-filter-btn.active");
    if (activeFilterBtn) filter = activeFilterBtn.dataset.filter;

    var source = allVerbs;
    if (filter === "irregular") source = irregularVerbs;
    else if (filter === "regular") source = regularVerbs;

    var filtered = source.filter(function (v) {
      if (!search) return true;
      var matchDe = v.de.toLowerCase().includes(search);
      var matchRu = (v.ru || "").toLowerCase().includes(search);
      var forms = v.conjugation.forms;
      var matchForms = Object.values(forms).some(function (f) {
        return f.toLowerCase().includes(search);
      });
      return matchDe || matchRu || matchForms;
    });

    dom.cheatsheetTbody.innerHTML = "";

    if (filtered.length === 0) {
      dom.cheatsheetTbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 20px; color: var(--text-muted);">Ничего не найдено</td></tr>';
      return;
    }

    filtered.forEach(function (v) {
      var tr = document.createElement("tr");
      var forms = v.conjugation.forms;
      var tagClass = v.isIrregular ? "irreg" : "reg";
      var tagText = v.isIrregular ? "⚡ неправ." : "📘 обычн.";

      // Build form cell with individual Leitner badge
      function buildFormCell(pronounKey, isMutated) {
        var formVal = forms[pronounKey] || "—";
        var formSrs = getFormSrs(v.id, pronounKey);
        var box = formSrs.box || 1;
        var cellCls = isMutated ? "verb-form-cell mutated" : "verb-form-cell";
        return '<td style="padding: 8px 10px;" class="' + cellCls + '">' +
          formVal +
          ' <span class="srs-micro-pill ' + (LEVEL_BADGES[box] ? LEVEL_BADGES[box].cls : "box-1") + '" title="Ячейка ' + box + ' (' + (PRONOUNS.find(function(p){ return p.key === pronounKey; }) || {}).de + ')">ур.' + box + '</span>' +
          '</td>';
      }

      var duMutated = v.isIrregular && (v.conjugation.vowelChange || /du/.test(v.conjugation.vowelChange || ""));
      var erMutated = v.isIrregular && Boolean(v.conjugation.vowelChange);

      // Overall verb progress summary
      var totalBoxes = 0;
      var masteredCount = 0;
      PRONOUNS.forEach(function (p) {
        var s = getFormSrs(v.id, p.key);
        totalBoxes += (s.box || 1);
        if (s.box === 5) masteredCount++;
      });
      var avgBox = (totalBoxes / 6).toFixed(1);

      var srsSummaryHtml = masteredCount === 6
        ? '<span class="srs-box-badge box-5">🏆 Все 6</span>'
        : '<span class="srs-box-badge ' + (avgBox >= 4 ? "box-4" : (avgBox >= 2.5 ? "box-3" : (avgBox >= 1.8 ? "box-2" : "box-1"))) + '" title="Выучено форм: ' + masteredCount + ' из 6">' + masteredCount + '/6 форм</span>';

      tr.innerHTML = [
        '<td style="padding: 8px 10px; font-weight: 700;">' + v.de + ' <span class="verb-table-tag ' + tagClass + '">' + tagText + '</span></td>',
        buildFormCell("ich", false),
        buildFormCell("du", duMutated),
        buildFormCell("er", erMutated),
        buildFormCell("wir", false),
        buildFormCell("ihr", false),
        buildFormCell("sie", false),
        '<td style="padding: 8px 10px; color: var(--text-secondary); font-size: 12px;">' + v.ru + '</td>',
        '<td style="padding: 8px 10px; text-align: right;">' + srsSummaryHtml + '</td>'
      ].join("");

      dom.cheatsheetTbody.appendChild(tr);
    });
  }

  // ==================== SRS PROGRESS MODAL (INDIVIDUAL FORMS) ====================

  function updateSrsModal() {
    var now = Date.now();
    var counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    var dueCount = 0;
    var dueList = [];

    var allUnits = getAllActiveUnits();
    var totalForms = allUnits.length;

    allUnits.forEach(function (u) {
      var srs = getFormSrs(u.verb.id, u.pronoun.key);
      var box = srs.box || 1;
      counts[box] = (counts[box] || 0) + 1;

      if (srs.nextReview <= now) {
        dueCount++;
        dueList.push(u);
      }
    });

    if (dom.srsTotal) {
      dom.srsTotal.textContent = totalForms + " форм (" + activePool.length + " глаголов)";
    }
    if (dom.srsDue) dom.srsDue.textContent = dueCount;
    if (dom.srsMastered) {
      var m = counts[5] || 0;
      var mPct = totalForms > 0 ? Math.round((m / totalForms) * 100) : 0;
      dom.srsMastered.textContent = m + " (" + mPct + "%)";
    }

    for (var b = 1; b <= 5; b++) {
      var countEl = document.getElementById("verb-srs-box-" + b + "-count");
      var barEl = document.getElementById("verb-srs-box-" + b + "-bar");
      var c = counts[b] || 0;
      var pct = totalForms > 0 ? Math.round((c / totalForms) * 100) : 0;
      if (countEl) countEl.textContent = c + " форм (" + pct + "%)";
      if (barEl) barEl.style.width = pct + "%";
    }

    if (dom.srsDueList) {
      if (dueList.length === 0) {
        dom.srsDueList.innerHTML = '<span style="font-size: 12px; color: var(--text-muted);">🎉 Все формы глаголов на сегодня повторены!</span>';
      } else {
        dom.srsDueList.innerHTML = dueList.map(function (u) {
          return '<span style="display: inline-block; padding: 3px 8px; margin: 2px; border-radius: 6px; background: var(--settings-bg); border: 1px solid var(--border); font-size: 12px;">' +
            u.verb.de + ' <b>(' + u.pronoun.de + ')</b>' +
            '</span>';
        }).join("");
      }
    }
  }

  // ==================== EVENT LISTENERS & SETUP ====================

  function bindEvents() {
    // 1. Quick Category Pills (⚡ Неправильные / 📘 Обычные / 🌟 Все)
    if (dom.typePills) {
      dom.typePills.querySelectorAll(".verb-pill-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
          applyVerbTypeFilter(btn.dataset.verbType);
          renderCheatsheet();
          nextQuestion(true);
        });
      });
    }

    // 2. Quick Mode Switch Pills (✍️ Ввод / 🔘 Тест)
    if (dom.modePills) {
      dom.modePills.querySelectorAll(".verb-pill-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
          applyMode(btn.dataset.verbMode);
          nextQuestion(true);
        });
      });
    }

    // 3. Quiz Buttons
    if (dom.checkBtn) {
      dom.checkBtn.addEventListener("click", function () {
        if (currentMode === "input" && !isAnswerChecked) {
          checkInputAnswer();
        }
      });
    }

    if (dom.nextBtn) {
      dom.nextBtn.addEventListener("click", function () {
        nextQuestion(false);
      });
    }

    // 4. Hint Button (reveals next letter of answer)
    if (dom.hintBtn) {
      dom.hintBtn.addEventListener("click", function () {
        if (!currentUnit || !currentUnit.correctAnswer || isAnswerChecked) return;
        var ansEl = dom.answerInput;
        if (!ansEl) return;

        var firstTarget = (currentUnit.correctAnswer || "").split("/")[0].trim();
        if (!firstTarget) return;

        var val = ansEl.value;
        var pronoun = currentUnit.pronoun;

        if (pronoun && pronoun.de) {
          var pfx = pronoun.de + " ";
          if (val.toLowerCase().startsWith(pfx.toLowerCase())) {
            val = val.slice(pfx.length);
          }
        }

        var matchLen = 0;
        for (var i = 0; i < val.length && i < firstTarget.length; i++) {
          if (val[i].toLowerCase() === firstTarget[i].toLowerCase()) {
            matchLen++;
          } else {
            break;
          }
        }

        if (matchLen < firstTarget.length) {
          ansEl.value = firstTarget.slice(0, matchLen + 1);
        } else {
          ansEl.value = firstTarget;
        }

        ansEl.focus();
        try {
          var len = ansEl.value.length;
          ansEl.setSelectionRange(len, len);
        } catch (e) {}
      });
    }

    // 5. Enter key in input field
    if (dom.answerInput) {
      dom.answerInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          if (!isAnswerChecked) {
            checkInputAnswer();
          } else {
            nextQuestion(false);
          }
        }
      });
    }

    // 6. Umlaut Buttons
    document.querySelectorAll(".verb-umlaut-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var char = btn.dataset.char;
        if (!dom.answerInput) return;
        var start = dom.answerInput.selectionStart || dom.answerInput.value.length;
        var end = dom.answerInput.selectionEnd || dom.answerInput.value.length;
        var val = dom.answerInput.value;
        dom.answerInput.value = val.slice(0, start) + char + val.slice(end);
        dom.answerInput.focus();
        dom.answerInput.setSelectionRange(start + char.length, start + char.length);
      });
    });

    // 7. Reset Score Button
    if (dom.resetBtn) {
      dom.resetBtn.addEventListener("click", function () {
        scores.correct = 0;
        scores.total = 0;
        scores.streak = 0;
        scores.bestStreak = 0;
        updateScorebar();
        saveStats();
        lastResult = null;
        if (dom.prevResult) dom.prevResult.innerHTML = "";
        showFeedback("Счёт сброшен", "neutral");
      });
    }

    // 8. Cheatsheet Search and Filter
    if (dom.cheatsheetSearch) {
      dom.cheatsheetSearch.addEventListener("input", renderCheatsheet);
    }
    document.querySelectorAll(".verb-cs-filter-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll(".verb-cs-filter-btn").forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        renderCheatsheet();
      });
    });

    // 9. Settings Modal Radios
    document.querySelectorAll('input[name="verb-mode-radio"]').forEach(function (radio) {
      radio.addEventListener("change", function (e) {
        applyMode(e.target.value);
        nextQuestion(true);
      });
    });

    document.querySelectorAll('input[name="verb-type-radio"]').forEach(function (radio) {
      radio.addEventListener("change", function (e) {
        applyVerbTypeFilter(e.target.value);
        renderCheatsheet();
        nextQuestion(true);
      });
    });

    // 10. SRS enabled toggle
    var srsCb = document.getElementById("verb-srs-enabled-cb");
    if (srsCb) {
      srsCb.checked = srsEnabled;
      srsCb.addEventListener("change", function (e) {
        srsEnabled = e.target.checked;
        try {
          localStorage.setItem(VERB_SRS_ENABLED_KEY, srsEnabled ? "true" : "false");
        } catch (err) {}
        if (currentUnit) {
          var srs = getFormSrs(currentUnit.verb.id, currentUnit.pronoun.key);
          updateSrsBadge(currentUnit.pronoun.de, srs.box);
        }
      });
    }

    // 11. Reset SRS button inside SRS modal
    if (dom.srsResetBtn) {
      dom.srsResetBtn.addEventListener("click", function () {
        if (!confirm("Вы уверены, что хотите сбросить весь прогресс Лейтнера по формам глаголов?")) return;
        localStorage.removeItem(VERB_SRS_KEY);
        updateSrsModal();
        if (currentUnit) {
          updateSrsBadge(currentUnit.pronoun.de, 1);
        }
        renderCheatsheet();
        alert("Прогресс повторений всех форм глаголов успешно сброшен на Уровень 1.");
      });
    }

    // Modal open hooks
    document.querySelectorAll('.settings-trigger[data-modal="verb-srs-modal"]').forEach(function (btn) {
      btn.addEventListener("click", updateSrsModal);
    });
    document.querySelectorAll('.settings-trigger[data-modal="verb-cheatsheet-modal"]').forEach(function (btn) {
      btn.addEventListener("click", renderCheatsheet);
    });
  }

  // ==================== RESTORE SAVED PREFERENCES ====================

  function loadPreferences() {
    try {
      var savedType = localStorage.getItem(VERB_TYPE_KEY);
      if (savedType) currentVerbType = savedType;

      var savedMode = localStorage.getItem(VERB_MODE_KEY);
      if (savedMode === "input" || savedMode === "choice") {
        currentMode = savedMode;
      } else {
        currentMode = "input";
      }

      var savedSrsOn = localStorage.getItem(VERB_SRS_ENABLED_KEY);
      if (savedSrsOn !== null) srsEnabled = savedSrsOn === "true";
    } catch (e) {}
  }

  // ==================== INITIALIZATION ====================

  function init() {
    initDom();
    loadPreferences();
    loadSavedStats();
    updateScorebar();
    bindEvents();
    applyMode(currentMode);
    loadVerbs();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
