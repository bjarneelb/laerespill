export async function generateEquationTask(level) {
    const apiKey = localStorage.getItem("gemini_api_key");
    if (!apiKey) return null;

    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey;

    const promptText = "Lag en matteoppgave for barn niva " + level + ". Svaret x ma vare et heltall. Returner kun JSON: {\"oppgaveTekst\": \"...\", \"xVerdi\": 5}";

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }]
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);

        let text = data.candidates[0].content.parts[0].text;
        // En enkel og trygg måte å vaske JSON-teksten på
        const cleanText = text.replace(/```json/g, "").replace(/
```/g, "").trim();
        return JSON.parse(cleanText);
    } catch (error) {
        console.error("API-feil:", error);
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
        return "Gylne Gaupe";
    }
}
