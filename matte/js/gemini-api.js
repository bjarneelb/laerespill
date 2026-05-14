// js/gemini-api.js

const API_KEY = "AIzaSyBIZ4HsB_TwwBvTJnYhdy5ejnmsKudO7wk"; 
const API_URL = "[https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent](https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent)";

/**
 * Hjelpefunksjon for å vaske JSON-respons fra Gemini.
 * Fjerner ```json og ``` hvis modellen legger det til.
 */
function cleanGeminiResponse(text) {
    // Vi bruker split/join i stedet for regex for å unngå "missing /" feil
    return text
        .split("```json").join("")
        .split("
```").join("")
        .trim();
}

export async function generateEquationTask(level) {
    const prompt = `
        Lag en tekstoppgave i matematikk på norsk for nivå ${level}.
        Nivå 1: x + a = b, Nivå 2: ax = b, Nivå 3: ax + b = c, Nivå 4: ax + b = cx + d.
        Svaret x MÅ være et positivt heltall.
        Returner KUN rå JSON slik:
        {"oppgaveTekst": "Her er oppgaven...", "xVerdi": 5}
    `;

    try {
        const response = await fetch(`${API_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1000,
                }
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        
        const rawText = data.candidates[0].content.parts[0].text;
        const cleanedText = cleanGeminiResponse(rawText);
        
        return JSON.parse(cleanedText);
    } catch (error) {
        console.error("Gemini API feil (Oppgave):", error);
        return null;
    }
}

export async function generateCarName() {
    const prompt = `Lag et tøft navn på en racerbil (to ord på norsk, f.eks. 'Gylne Gaupe'). Returner kun navnet.`;
    
    try {
        const response = await fetch(`${API_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        
        return data.candidates[0].content.parts[0].text.trim();
    } catch (error) {
        console.error("Gemini API feil (Navn):", error);
        return "Raske Racer"; // Fallback-navn hvis API feiler
    }
}
