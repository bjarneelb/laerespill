export async function generateEquationTask(level) {
    const key = localStorage.getItem("gemini_api_key");
    if (!key) return null;

    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + key;

    const bodyData = {
        contents: [{
            parts: [{
                text: "Lag en enkel matteoppgave for barn niva " + level + ". Returner kun JSON: {\"oppgaveTekst\": \"...\", \"xVerdi\": 5}"
            }]
        }]
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(bodyData)
        });

        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;
        
        const cleanText = text.split("```json").join("").split("
```").join("").trim();
        return JSON.parse(cleanText);
    } catch (e) {
        console.error("API-feil:", e);
        return null;
    }
}

export async function generateCarName() {
    const key = localStorage.getItem("gemini_api_key");
    if (!key) return "Raske Racer";

    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + key;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Kort navn på racerbil." }] }]
            })
        });
        const data = await response.json();
        return data.candidates[0].content.parts[0].text.trim();
    } catch (e) {
        return "Gylne Gaupe";
    }
}
