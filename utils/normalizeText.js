const substitutions = {
  '4': 'a',
  '@': 'a',
  '1': 'i',
  '!': 'i',
  '3': 'e',
  '0': 'o',
  '$': 's',
  '+': 't',
  '7': 't'
};

/**
 * Nettoie un texte :
 * - enlève les accents
 * - remplace caractères équivalents
 * - réduit les répétitions de lettres
 * - retourne tout en minuscule
 */
function normalizeText(text) {
  return text
    .normalize("NFD")                    // enlève accents
    .replace(/[\u0300-\u036f]/g, "")     // supprime diacritiques
    .replace(/(.)\1{2,}/g, "$1")         // réduit lettres doublées (3+)
    .replace(/[^\w\s]/gi, char => substitutions[char] || char) // remplace symboles
    .toLowerCase();                      // tout en minuscule
}

module.exports = normalizeText;
