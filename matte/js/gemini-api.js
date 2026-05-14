const API_KEY = "AIzaSyBIZ4HsB_TwwBvTJnYhdy5ejnmsKudO7wk";
// Oppdatert URL: Vi må legge til ":generateContent" direkte i strengen før nøkkelen
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

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
    var prompt = "Lag en tekstoppgave i matematikk på norsk for niva " + level + ". Svaret x ma vare et positivt heltall. Returner KUN JSON: {\"oppgaveTekst\": \"...\", \"xVerdi\": 5}";

    try {
        var response = await fetch(API_URL + "?key=" + API_KEY, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!response.ok) {
            var errData = await response.json();
            console.error("Google API feilkode:", response.status, errData);
            return null;
        }

        var data = await response.json();
        if (!data.candidates || !data.candidates[0]) return null;

        var rawText = data.candidates[0].content.parts[0].text;
        var finalJson = cleanGeminiText(rawText);
        
        return JSON.parse(finalJson);
    } catch (error) {
        console.error("Systemfeil ved oppgave:", error);
        return null;
    }
}

export async function generateCarName() {
    var prompt = "Lag et navn på en racerbil (to ord på norsk). Returner kun navnet.";
    
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
        console.error("Systemfeil ved navn:", error);
        return "Lynrask Bil";
    }
}
