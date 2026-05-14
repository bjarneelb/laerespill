// BYTT UT DENNE MED DIN NYE NØKKEL
const API_KEY = "AIzaSyDfC_RgtMDw-t7Ihj4cf_lzSAClJq_b96M"; 

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/";
const MODEL = "models/gemini-1.5-flash:generateContent";

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
    var fullUrl = BASE_URL + MODEL + "?key=" + API_KEY;
    var prompt = "Lag en matteoppgave niva " + level + ". Svaret x ma vare et heltall. Returner kun JSON: {\"oppgaveTekst\": \"...\", \"xVerdi\": 5}";

    try {
        var response = await fetch(fullUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!response.ok) {
            var err = await response.json();
            console.error("API Feil:", err);
            return null;
        }

        var data = await response.json();
        var rawText = data.candidates[0].content.parts[0].text;
        return JSON.parse(cleanGeminiText(rawText));
    } catch (error) {
        console.error("Systemfeil:", error);
        return null;
    }
}

export async function generateCarName() {
    var fullUrl = BASE_URL + MODEL + "?key=" + API_KEY;
    var prompt = "Navn pa racerbil, to ord.";
    try {
        var response = await fetch(fullUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });
        var data = await response.json();
        return data.candidates[0].content.parts[0].text.trim();
    } catch (e) {
        return "Gylne Gaupe";
    }
}
