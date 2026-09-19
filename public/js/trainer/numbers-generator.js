/**
 * German Numbers Generator Module
 */

const onesArray = [
  "null", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn",
  "elf", "zwölf", "dreizehn", "vierzehn", "fünfzehn", "sechzehn", "siebzehn", "achtzehn", "neunzehn"
];

const tensWords = {
  20: "zwanzig",
  30: "dreißig",
  40: "vierzig",
  50: "fünfzig",
  60: "sechzig",
  70: "siebzig",
  80: "achtzig",
  90: "neunzig"
};

function under100(n) {
  if (n < 20) return onesArray[n];
  if (n % 10 === 0) return tensWords[n];
  const tens = Math.floor(n / 10) * 10;
  const unit = n % 10;
  const unitWord = unit === 1 ? "ein" : onesArray[unit];
  return `${unitWord}und${tensWords[tens]}`;
}

function under1000(n) {
  if (n < 100) return under100(n);
  const h = Math.floor(n / 100);
  const rest = n % 100;
  const hWord = `${h === 1 ? "" : onesArray[h]}hundert`;
  if (rest === 0) return hWord;
  return hWord + under100(rest);
}

export function numberToGerman(n) {
  if (n === 0) return "null";
  if (n < 1000) return under1000(n);
  if (n < 10000) {
    const th = Math.floor(n / 1000);
    const rest = n % 1000;
    const thWord = `${th === 1 ? "ein" : onesArray[th]}tausend`;
    if (rest === 0) return thWord;
    return thWord + under1000(rest);
  }
  if (n === 10000) return "zehntausend";
  return String(n);
}
