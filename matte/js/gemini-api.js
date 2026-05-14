const API_KEY = "AIzaSyBIZ4HsB_TwwBvTJnYhdy5ejnmsKudO7wk";
const API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent";

function cleanGeminiText(t) {
    if (!t) return "";
    let cleaned = t;
    // Vi bruker split/join i stedet for replace/regex for å unngå "/" feil
    cleaned = cleaned.split("```json").join("");
    cleaned = cleaned.split("
```JSON").join("");
    cleaned = cleaned.split("```").join("");
    return cleaned.trim();
}

export async function generateEquationTask(level) {
    const prompt = "Lag en matteoppgave i JSON-format for niva " + level + ". Svaret x ma vare et positivt heltall. Format: {\"oppgaveTekst\": \"...\", \"xVerdi\": 5}";

    try {
        const response = await fetch(API_URL + "?key=" + API_KEY, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.7 }
            })
        });

        const data = await response.json();
        if (!data.candidates || !data.candidates[0]) return null;

        const rawText = data.candidates[0].content.parts[0].text;
        const finalJson = cleanGeminiText(rawText);
        
        return JSON.parse(finalJson);
    } catch (error) {
        console.error("Feil ved oppgave:", error);
        return null;
    }
}

export async function generateCarName() {
    const prompt = "Lag et navn pa en racerbil (to ord pa norsk). Returner kun navnet.";
    
    try {
        const response = await fetch(API_URL + "?key=" + API_KEY, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });
        const data = await response.json();
        if (!data.candidates || !data.candidates[0]) return "Raske Racer";
        
        return data.candidates[0].content.parts[0].text.trim();
    } catch (error) {
        console.error("Feil ved navn:", error);
        return "Lynrask Bil";
    }
}
