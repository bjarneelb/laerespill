// js/gemini-api.js

const API_KEY = "AIzaSyBIZ4HsB_TwwBvTJnYhdy5ejnmsKudO7wk"; 
const API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent";

/**
 * Rens funksjon som bruker standard tekst-metoder for å fjerne
 * JSON-innpakning som Gemini ofte legger til (markdown).
 */
function cleanGeminiText(t) {
    if (!t) return "";
    let cleaned = t;
    // Vi fjerner blokker ved å lete etter tekst-strenger manuelt
    cleaned = cleaned.replace("```json", "");
    cleaned = cleaned.replace("
```JSON", "");
    cleaned = cleaned.replace("```", ""); // Fjerner start
    cleaned = cleaned.replace("
```", ""); // Fjerner slutt
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
        
        if (!data.candidates) {
            console.error("Ingen kandidater i API-respons", data);
            return null;
        }

        const rawText = data.candidates[0].content.parts[0].text;
        const finalJson = cleanGeminiText(rawText);
        
        return JSON.parse(finalJson);
    } catch (error) {
        console.error("API Feil ved henting av oppgave:", error);
        return null;
    }
}

export async function generateCarName() {
    const prompt = "Lag et navn på en racerbil (to ord på norsk, f.eks. Raske Rev). Returner kun navnet uten punktum.";
    
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
        console.error("API Feil ved henting av navn:", error);
        return "Lynrask Racer"; // Fallback
    }
}
