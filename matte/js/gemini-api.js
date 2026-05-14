// js/gemini-api.js

const API_KEY = "AIzaSyBIZ4HsB_TwwBvTJnYhdy5ejnmsKudO7wk"; 
const API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent";

/**
 * Rens funksjon som fjerner eventuelle markdown-tagger
 */
function cleanText(t) {
    if (!t) return "";
    // Fjerner de vanligste JSON-innpakningene manuelt uten regex
    let cleaned = t.replace("```json", "");
    cleaned = cleaned.replace("
```JSON", "");
    cleaned = cleaned.replace("```", "");
    cleaned = cleaned.replace("
```", ""); 
    return cleaned.trim();
}

export async function generateEquationTask(level) {
    const prompt = "Lag en matteoppgave i JSON-format for niva " + level + ". Svaret x ma være et heltall. Format: {\"oppgaveTekst\": \"...\", \"xVerdi\": 5}";

    try {
        const response = await fetch(API_URL + "?key=" + API_KEY, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.7 }
            })
        });

        const data = await response.json();
        const rawText = data.candidates[0].content.parts[0].text;
        const finalJson = cleanText(rawText);
        
        return JSON.parse(finalJson);
    } catch (error) {
        console.error("API Feil oppgave:", error);
        return null;
    }
}

export async function generateCarName() {
    const prompt = "Lag et navn på en racerbil (to ord på norsk). Returner kun navnet.";
    
    try {
        const response = await fetch(API_URL + "?key=" + API_KEY, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });
        const data = await response.json();
        return data.candidates[0].content.parts[0].text.trim();
    } catch (error) {
        console.error("API Feil navn:", error);
        return "Raske Racer";
    }
}
