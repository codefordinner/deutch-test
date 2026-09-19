const fs = require("fs");
const path = require("path");
const prisma = require("./src/db/prisma");

const IRREGULAR_VERBS = [
  { de: "sein", ru: "быть, являться", praeteritum: "war", partizip2: "gewesen", hilfsverb: "sein", praesens: "ist" },
  { de: "haben", ru: "иметь", praeteritum: "hatte", partizip2: "gehabt", hilfsverb: "haben", praesens: "hat" },
  { de: "werden", ru: "становиться", praeteritum: "wurde", partizip2: "geworden", hilfsverb: "sein", praesens: "wird" },
  { de: "gehen", ru: "идти, ходить", praeteritum: "ging", partizip2: "gegangen", hilfsverb: "sein", praesens: "geht" },
  { de: "kommen", ru: "приходить, приезжать", praeteritum: "kam", partizip2: "gekommen", hilfsverb: "sein", praesens: "kommt" },
  { de: "sehen", ru: "видеть, смотреть", praeteritum: "sah", partizip2: "gesehen", hilfsverb: "haben", praesens: "sieht" },
  { de: "geben", ru: "давать", praeteritum: "gab", partizip2: "gegeben", hilfsverb: "haben", praesens: "gibt" },
  { de: "nehmen", ru: "брать, взять", praeteritum: "nahm", partizip2: "genommen", hilfsverb: "haben", praesens: "nimmt" },
  { de: "sprechen", ru: "говорить, разговаривать", praeteritum: "sprach", partizip2: "gesprochen", hilfsverb: "haben", praesens: "spricht" },
  { de: "fahren", ru: "ехать, водить", praeteritum: "fuhr", partizip2: "gefahren", hilfsverb: "sein", praesens: "fährt" },
  { de: "lesen", ru: "читать", praeteritum: "las", partizip2: "gelesen", hilfsverb: "haben", praesens: "liest" },
  { de: "schreiben", ru: "писать", praeteritum: "schrieb", partizip2: "geschrieben", hilfsverb: "haben", praesens: "schreibt" },
  { de: "finden", ru: "находить", praeteritum: "fand", partizip2: "gefunden", hilfsverb: "haben", praesens: "findet" },
  { de: "wissen", ru: "знать", praeteritum: "wusste", partizip2: "gewusst", hilfsverb: "haben", praesens: "weiß" },
  { de: "bringen", ru: "приносить", praeteritum: "brachte", partizip2: "gebracht", hilfsverb: "haben", praesens: "bringt" },
  { de: "denken", ru: "думать", praeteritum: "dachte", partizip2: "gedacht", hilfsverb: "haben", praesens: "denkt" },
  { de: "bleiben", ru: "оставаться", praeteritum: "blieb", partizip2: "geblieben", hilfsverb: "sein", praesens: "bleibt" },
  { de: "trinken", ru: "пить", praeteritum: "trank", partizip2: "getrunken", hilfsverb: "haben", praesens: "trinkt" },
  { de: "essen", ru: "есть, кушать", praeteritum: "aß", partizip2: "gegessen", hilfsverb: "haben", praesens: "isst" },
  { de: "schlafen", ru: "спать", praeteritum: "schlief", partizip2: "geschlafen", hilfsverb: "haben", praesens: "schläft" },
  { de: "laufen", ru: "бегать, идти", praeteritum: "lief", partizip2: "gelaufen", hilfsverb: "sein", praesens: "läuft" },
  { de: "helfen", ru: "помогать", praeteritum: "half", partizip2: "geholfen", hilfsverb: "haben", praesens: "hilft" },
  { de: "treffen", ru: "встречать, встречаться", praeteritum: "traf", partizip2: "getroffen", hilfsverb: "haben", praesens: "trifft" },
  { de: "beginnen", ru: "начинать", praeteritum: "begann", partizip2: "begonnen", hilfsverb: "haben", praesens: "beginnt" },
  { de: "verstehen", ru: "понимать", praeteritum: "verstand", partizip2: "verstanden", hilfsverb: "haben", praesens: "versteht" },
  { de: "tragen", ru: "носить", praeteritum: "trug", partizip2: "getragen", hilfsverb: "haben", praesens: "trägt" },
  { de: "stehen", ru: "стоять", praeteritum: "stand", partizip2: "gestanden", hilfsverb: "haben", praesens: "steht" },
  { de: "liegen", ru: "лежать", praeteritum: "lag", partizip2: "gelegen", hilfsverb: "haben", praesens: "liegt" },
  { de: "sitzen", ru: "сидеть", praeteritum: "saß", partizip2: "gesessen", hilfsverb: "haben", praesens: "sitzt" },
  { de: "fliegen", ru: "летать", praeteritum: "flog", partizip2: "geflogen", hilfsverb: "sein", praesens: "fliegt" },
  { de: "schwimmen", ru: "плавать", praeteritum: "schwamm", partizip2: "geschwommen", hilfsverb: "sein", praesens: "schwimmt" },
  { de: "verlieren", ru: "терять, проигрывать", praeteritum: "verlor", partizip2: "verloren", hilfsverb: "haben", praesens: "verliert" },
  { de: "gewinnen", ru: "выигрывать, побеждать", praeteritum: "gewann", partizip2: "gewonnen", hilfsverb: "haben", praesens: "gewinnt" },
  { de: "schließen", ru: "закрывать", praeteritum: "schloss", partizip2: "geschlossen", hilfsverb: "haben", praesens: "schließt" },
  { de: "ziehen", ru: "тянуть, переезжать", praeteritum: "zog", partizip2: "gezogen", hilfsverb: "haben", praesens: "zieht" },
  { de: "rufen", ru: "звать, кричать", praeteritum: "rief", partizip2: "gerufen", hilfsverb: "haben", praesens: "ruft" },
  { de: "kennen", ru: "знать, быть знакомым", praeteritum: "kannte", partizip2: "gekannt", hilfsverb: "haben", praesens: "kennt" },
  { de: "waschen", ru: "мыть, стирать", praeteritum: "wusch", partizip2: "gewaschen", hilfsverb: "haben", praesens: "wäscht" },
  { de: "vergessen", ru: "забывать", praeteritum: "vergaß", partizip2: "vergessen", hilfsverb: "haben", praesens: "vergisst" },
  { de: "einladen", ru: "приглашать", praeteritum: "lud ein", partizip2: "eingeladen", hilfsverb: "haben", praesens: "lädt ein" }
];

const REGULAR_VERBS = [
  { de: "machen", ru: "делать", praeteritum: "machte", partizip2: "gemacht", hilfsverb: "haben", praesens: "macht" },
  { de: "lernen", ru: "учить, учиться", praeteritum: "lernte", partizip2: "gelernt", hilfsverb: "haben", praesens: "lernt" },
  { de: "arbeiten", ru: "работать", praeteritum: "arbeitete", partizip2: "gearbeitet", hilfsverb: "haben", praesens: "arbeitet" },
  { de: "wohnen", ru: "жить, проживать", praeteritum: "wohnte", partizip2: "gewohnt", hilfsverb: "haben", praesens: "wohnt" },
  { de: "kaufen", ru: "покупать", praeteritum: "kaufte", partizip2: "gekauft", hilfsverb: "haben", praesens: "kauft" },
  { de: "hören", ru: "слушать, слышать", praeteritum: "hörte", partizip2: "gehört", hilfsverb: "haben", praesens: "hört" },
  { de: "fragen", ru: "спрашивать", praeteritum: "fragte", partizip2: "gefragt", hilfsverb: "haben", praesens: "fragt" },
  { de: "antworten", ru: "отвечать", praeteritum: "antwortete", partizip2: "geantwortet", hilfsverb: "haben", praesens: "antwortet" },
  { de: "suchen", ru: "искать", praeteritum: "suchte", partizip2: "gesucht", hilfsverb: "haben", praesens: "sucht" },
  { de: "brauchen", ru: "нуждаться, требоваться", praeteritum: "brauchte", partizip2: "gebraucht", hilfsverb: "haben", praesens: "braucht" },
  { de: "spielen", ru: "играть", praeteritum: "spielte", partizip2: "gespielt", hilfsverb: "haben", praesens: "spielt" },
  { de: "leben", ru: "жить", praeteritum: "lebte", partizip2: "gelebt", hilfsverb: "haben", praesens: "lebt" },
  { de: "lieben", ru: "любить", praeteritum: "liebte", partizip2: "geliebt", hilfsverb: "haben", praesens: "liebt" },
  { de: "kochen", ru: "готовить еду", praeteritum: "kochte", partizip2: "gekocht", hilfsverb: "haben", praesens: "kocht" },
  { de: "reisen", ru: "путешествовать", praeteritum: "reiste", partizip2: "gereist", hilfsverb: "sein", praesens: "reist" },
  { de: "warten", ru: "ждать", praeteritum: "wartete", partizip2: "gewartet", hilfsverb: "haben", praesens: "wartet" },
  { de: "öffnen", ru: "открывать", praeteritum: "öffnete", partizip2: "geöffnet", hilfsverb: "haben", praesens: "öffnet" },
  { de: "glauben", ru: "верить, полагать", praeteritum: "glaubte", partizip2: "geglaubt", hilfsverb: "haben", praesens: "glaubt" },
  { de: "hoffen", ru: "надеяться", praeteritum: "hoffte", partizip2: "gehofft", hilfsverb: "haben", praesens: "hofft" },
  { de: "erzählen", ru: "рассказывать", praeteritum: "erzählte", partizip2: "erzählt", hilfsverb: "haben", praesens: "erzählt" },
  { de: "bezahlen", ru: "оплачивать, платить", praeteritum: "bezahlte", partizip2: "bezahlt", hilfsverb: "haben", praesens: "bezahlt" },
  { de: "bestellen", ru: "заказывать", praeteritum: "bestellte", partizip2: "bestellt", hilfsverb: "haben", praesens: "bestellt" },
  { de: "feiern", ru: "праздновать, отмечать", praeteritum: "feierte", partizip2: "gefeiert", hilfsverb: "haben", praesens: "feiert" },
  { de: "putzen", ru: "чистить, убирать", praeteritum: "putzte", partizip2: "geputzt", hilfsverb: "haben", praesens: "putzt" },
  { de: "tanzen", ru: "танцевать", praeteritum: "tanzte", partizip2: "getanzt", hilfsverb: "haben", praesens: "tanzt" },
  { de: "sagen", ru: "говорить, сказать", praeteritum: "sagte", partizip2: "gesagt", hilfsverb: "haben", praesens: "sagt" }
];

async function seed() {
  console.log("[Seed] Starting verb category seeding...");

  // 1. Irregular Verbs Category
  let irregCat = await prisma.category.findFirst({
    where: { name: "Неправильные глаголы" }
  });
  if (!irregCat) {
    irregCat = await prisma.category.create({
      data: {
        id: "cat_irregular_verbs",
        name: "Неправильные глаголы"
      }
    });
    console.log("[Seed] Created category: Неправильные глаголы");
  }

  // 2. Regular Verbs Category
  let regCat = await prisma.category.findFirst({
    where: { name: "Обычные глаголы" }
  });
  if (!regCat) {
    regCat = await prisma.category.create({
      data: {
        id: "cat_regular_verbs",
        name: "Обычные глаголы"
      }
    });
    console.log("[Seed] Created category: Обычные глаголы");
  }

  // Insert/update irregular verbs
  for (const v of IRREGULAR_VERBS) {
    const pluralStr = `${v.praeteritum}, ${v.hilfsverb} ${v.partizip2} (er ${v.praesens})`;
    const existing = await prisma.word.findFirst({
      where: {
        de: v.de,
        categoryId: irregCat.id
      }
    });

    if (!existing) {
      await prisma.word.create({
        data: {
          id: `w_irreg_${v.de.toLowerCase().replace(/[^a-zäöüß]/g, '')}`,
          de: v.de,
          ru: v.ru,
          plural: pluralStr,
          praeteritum: v.praeteritum,
          partizip2: v.partizip2,
          hilfsverb: v.hilfsverb,
          praesens: v.praesens,
          categoryId: irregCat.id
        }
      });
    } else {
      await prisma.word.update({
        where: { id: existing.id },
        data: {
          ru: v.ru,
          plural: pluralStr,
          praeteritum: v.praeteritum,
          partizip2: v.partizip2,
          hilfsverb: v.hilfsverb,
          praesens: v.praesens
        }
      });
    }
  }

  // Insert/update regular verbs
  for (const v of REGULAR_VERBS) {
    const pluralStr = `${v.praeteritum}, ${v.hilfsverb} ${v.partizip2} (er ${v.praesens})`;
    const existing = await prisma.word.findFirst({
      where: {
        de: v.de,
        categoryId: regCat.id
      }
    });

    if (!existing) {
      await prisma.word.create({
        data: {
          id: `w_reg_${v.de.toLowerCase().replace(/[^a-zäöüß]/g, '')}`,
          de: v.de,
          ru: v.ru,
          plural: pluralStr,
          praeteritum: v.praeteritum,
          partizip2: v.partizip2,
          hilfsverb: v.hilfsverb,
          praesens: v.praesens,
          categoryId: regCat.id
        }
      });
    } else {
      await prisma.word.update({
        where: { id: existing.id },
        data: {
          ru: v.ru,
          plural: pluralStr,
          praeteritum: v.praeteritum,
          partizip2: v.partizip2,
          hilfsverb: v.hilfsverb,
          praesens: v.praesens
        }
      });
    }
  }

  console.log(`[Seed] Successfully seeded ${IRREGULAR_VERBS.length} irregular verbs and ${REGULAR_VERBS.length} regular verbs.`);
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
