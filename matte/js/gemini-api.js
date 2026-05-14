export async function generateEquationTask(level) {
    const apiKey = localStorage.getItem("gemini_api_key");
    if (!apiKey) return null;

    // VIKTIG: Ingen klammeparenteser rundt URL-en
    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Lag en matteoppgave niva " + level + ". Returner kun JSON: {\"oppgaveTekst\": \"...\", \"xVerdi\": 5}" }] }]
            })
        });

        const data = await response.json();
        let text = data.candidates[0].content.parts[0].text;
        let clean = text.split("```json").join("").split("
```").join("").trim();
        return JSON.parse(clean);
    } catch (error) {
        console.error("Feil i generateEquationTask:", error);
        return null;
    }
}

export async function generateCarName() {
    const apiKey = localStorage.getItem("gemini_api_key");
    if (!apiKey) return "Raske Racer";

    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Navn pa en racerbil, to korte ord." }] }]
            })
        });
        const data = await response.json();
        return data.candidates[0].content.parts[0].text.trim();
    } catch (e) {
        console.error("Feil i generateCarName:", e);
        return "Gylne Gaupe";
    }
}
