export async function generateEquationTask(level) {
    // Henter nøkkelen du har lagret i nettleseren
    const apiKey = localStorage.getItem("gemini_api_key");
    
    if (!apiKey) {
        alert("Ingen API-nøkkel funnet! Vennligst skriv den inn i boksen.");
        return null;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `Lag en matteoppgave niva ${level}. Returner KUN JSON: {"oppgaveTekst": "...", "xVerdi": 5}` }] }]
            })
        });

        const data = await response.json();
        if (data.error) {
            if (data.error.message.includes("leaked")) {
                alert("Denne nøkkelen er sperret. Lag en ny i Google AI Studio.");
            }
            console.error("API feil:", data.error);
            return null;
        }

        let rawText = data.candidates[0].content.parts[0].text;
        let cleanJson = rawText.replace(/```json/g, "").replace(/
```/g, "").trim();
        return JSON.parse(cleanJson);
    } catch (error) {
        console.error("Systemfeil:", error);
        return null;
    }
}

export async function generateCarName() {
    const apiKey = localStorage.getItem("gemini_api_key");
    if (!apiKey) return "Raske Rev";

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Navn på racerbil, to ord." }] }]
            })
        });
        const data = await response.json();
        return data.candidates[0].content.parts[0].text.trim();
    } catch (e) {
        return "Gylne Gaupe";
    }
}
