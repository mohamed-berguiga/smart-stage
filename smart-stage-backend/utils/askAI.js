const { GoogleGenAI } = require('@google/genai');

let client;

function getClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY manquant dans .env — créez une clé gratuite sur aistudio.google.com",
    );
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return client;
}

/**
 * Fonction unique utilisée par toutes les fonctionnalités IA du projet
 * (description de tâche, résumé de rapport, suggestion de compétence,
 * chatbot FAQ, assistant RH). Centraliser l'appel ici évite de dupliquer
 * la config/gestion d'erreurs dans chaque contrôleur.
 *
 * @param {string} prompt - Instruction envoyée au modèle.
 * @param {string} [systemInstruction] - Contexte/rôle donné au modèle (optionnel).
 * @returns {Promise<string>} Le texte généré.
 */
async function askAI(prompt, systemInstruction) {
  const ai = getClient();

  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash-lite',
    contents: prompt,
    ...(systemInstruction ? { config: { systemInstruction } } : {}),
  });

  const text = response.text;
  if (!text) {
    throw new Error("Réponse vide de l'IA");
  }
  return text.trim();
}

module.exports = { askAI };