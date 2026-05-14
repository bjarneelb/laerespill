const API_KEY = "AIzaSyBIZ4HsB_TwwBvTJnYhdy5ejnmsKudO7wk";
const API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent";

function cleanGeminiText(t) {
    if (!t) return "";
    var cleaned = t;
    // Vi bruker String.fromCharCode(96) for å representere backtick (`)
    // På denne måten slipper vi å skrive tegnet i selve koden.
    var b = String.fromCharCode(96);
    var tag = b + b + b;
    
    cleaned = cleaned.split(tag + "json").join("");
    cleaned = cleaned.split(tag + "JSON").join("");
    cleaned = cleaned.split(tag).join("");
    
    return cleaned.trim();
}

export async function generateEquationTask(level) {
    var prompt = "Lag en matteoppgave i JSON-format for niva " + level + ". Svaret x ma vare et positivt heltall. Format: {\"oppgaveTekst\": \"...\", \"xVerdi\": 5}";

    try {
        var response = await fetch(API_URL + "?key=" + API_KEY, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.7 }
            })
        });

        var data = await response.json();
        if (!data.candidates || !data.candidates[0]) return null;

        var rawText = data.candidates[0].content.parts[0].text;
        var finalJson = cleanGeminiText(rawText);
        
        return JSON.parse(finalJson);
    } catch (error) {
        console.error("Feil ved oppgave:", error);
        return null;
    }
}

export async function generateCarName() {
    var prompt = "Lag et navn pa en racerbil (to ord pa norsk). Returner kun navnet.";
    
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
        console.error("Feil ved navn:", error);
        return "Lynrask Bil";
    }
}
