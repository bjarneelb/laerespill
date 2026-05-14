export async function generateEquationTask(level) {
    const apiKey = localStorage.getItem("gemini_api_key");
    if (!apiKey) return null;

    // URL-en SKAL starte direkte med hermetegn og https. Ingen [ ] eller andre tegn.
    try {
        const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Lag en matteoppgave niva " + level + ". Svaret x ma vare et heltall. Returner kun JSON: {\"oppgaveTekst\": \"...\", \"xVerdi\": 5}" }] }]
            })
        });

        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;
        const clean = text.split("```json").join("").split("
```").join("").trim();
        return JSON.parse(clean);
    } catch (error) {
        console.error("Feil i API-kall:", error);
        return null;
    }
}

export async function generateCarName() {
    const apiKey = localStorage.getItem("gemini_api_key");
    if (!apiKey) return "Raske Racer";

    try {
        const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Navn pa en racerbil, to korte ord." }] }]
            })
        });
        const data = await response.json();
        return data.candidates[0].content.parts[0].text.trim();
    } catch (e) {
        return "Lynrask Rev";
    }
}
