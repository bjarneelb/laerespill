const API_KEY = "AIzaSyBIZ4HsB_TwwBvTJnYhdy5ejnmsKudO7wk";
// Vi prøver gemini-1.0-pro som er den eldste og mest stabile "legacy" modellen
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

function cleanGeminiText(t) {
    if (!t) return "";
    var cleaned = t;
    var b = String.fromCharCode(96);
    var tag = b + b + b;
    cleaned = cleaned.split(tag + "json").join("");
    cleaned = cleaned.split(tag + "JSON").join("");
    cleaned = cleaned.split(tag).join("");
    return cleaned.trim();
}

export async function generateEquationTask(level) {
    var prompt = "Lag en enkel matteoppgave for barn niva " + level + ". Svaret x ma vare et heltall. Returner kun JSON: {\"oppgaveTekst\": \"tekst\", \"xVerdi\": 5}";

    try {
        var response = await fetch(API_URL + "?key=" + API_KEY, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!response.ok) {
            console.error("API Status: " + response.status);
            // Hvis gemini-pro også gir 404, prøver vi en siste nød-løsning
            return null;
        }

        var data = await response.json();
        var rawText = data.candidates[0].content.parts[0].text;
        return JSON.parse(cleanGeminiText(rawText));
    } catch (error) {
        console.error("Kritisk feil:", error);
        return null;
    }
}

export async function generateCarName() {
    var prompt = "Navn pa racerbil, to ord.";
    try {
        var response = await fetch(API_URL + "?key=" + API_KEY, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });
        var data = await response.json();
        return data.candidates[0].content.parts[0].text.trim();
    } catch (e) {
        return "Lynrask Leopard";
    }
}
