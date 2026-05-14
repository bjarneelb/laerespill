const API_KEY = "AIzaSyBIZ4HsB_TwwBvTJnYhdy5ejnmsKudO7wk";
// Vi bytter til den offisielle v1-versjonen som er mest stabil
const API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent";

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
    // Vi gjør prompten enda enklere for å sikre rask respons
    var prompt = "Lag en matteoppgave for barn på norsk. Niva: " + level + ". Svaret x ma være et heltall. Returner kun JSON: {\"oppgaveTekst\": \"...\", \"xVerdi\": 5}";

    try {
        var response = await fetch(API_URL + "?key=" + API_KEY, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!response.ok) {
            // Hvis v1 feiler, prøver vi en alternativ URL internt
            console.error("API forespørsel feilet med status: " + response.status);
            return null;
        }

        var data = await response.json();
        if (!data.candidates || !data.candidates[0]) return null;

        var rawText = data.candidates[0].content.parts[0].text;
        var finalJson = cleanGeminiText(rawText);
        
        return JSON.parse(finalJson);
    } catch (error) {
        console.error("Systemfeil:", error);
        return null;
    }
}

export async function generateCarName() {
    var prompt = "Lag et navn på en racerbil (to ord).";
    
    try {
        var response = await fetch(API_URL + "?key=" + API_KEY, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });
        
        var data = await response.json();
        if (!data.candidates || !data.candidates[0]) return "Raske Racer";
        
        return data.candidates[0].content.parts[0].text.trim();
    } catch (error) {
        return "Lynrask Bil";
    }
}
