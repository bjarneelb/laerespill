const API_KEY = "AIzaSyBIZ4HsB_TwwBvTJnYhdy5ejnmsKudO7wk";
// Vi bruker v1beta her da den ofte er mer tilgivende på regionsinnstillinger
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
    var prompt = "Lag en matteoppgave for barn. Niva " + level + ". Returner KUN JSON: {\"oppgaveTekst\": \"...\", \"xVerdi\": 5}";

    try {
        // Vi legger API-nøkkelen i URL-en på den mest standardiserte måten
        var urlWithKey = API_URL + "?key=" + API_KEY;
        
        var response = await fetch(urlWithKey, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });

        if (!response.ok) {
            console.error("API Status: " + response.status);
            // Logger hele feilmeldingen fra Google for å se hva som faktisk skjer
            var errorDetail = await response.json();
            console.log("Google detaljer:", errorDetail);
            return null;
        }

        var data = await response.json();
        var rawText = data.candidates[0].content.parts[0].text;
        var finalJson = cleanGeminiText(rawText);
        
        return JSON.parse(finalJson);
    } catch (error) {
        console.error("Kritisk feil:", error);
        return null;
    }
}

export async function generateCarName() {
    // Vi bruker nøyaktig samme logikk her
    var prompt = "Navn på racerbil, to ord.";
    try {
        var urlWithKey = API_URL + "?key=" + API_KEY;
        var response = await fetch(urlWithKey, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });
        var data = await response.json();
        return data.candidates[0].content.parts[0].text.trim();
    } catch (e) {
        return "Kjappe Krokodille";
    }
}
