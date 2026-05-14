const API_KEY = "AIzaSyA3MBx6iMmudmoy3LgrdpUVL0Me-1N6eFE";
const MODEL = "gemini-2.0-flash-001";
const URL = "https://generativelanguage.googleapis.com/v1beta/models/" + MODEL + ":generateContent?key=" + API_KEY;

export async function generateEquationTask(level) {
    try {
        const response = await fetch(URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Lag en matteoppgave niva " + level + ". Returner JSON: {\"oppgaveTekst\": \"...\", \"xVerdi\": 5}" }] }]
            })
        });

        const data = await response.json();
        
        if (data.error) {
            console.error("Google API feil:", data.error.message);
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
    try {
        const response = await fetch(URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Navn pa racerbil, to ord." }] }]
            })
        });
        const data = await response.json();
        return data.candidates[0].content.parts[0].text.trim();
    } catch (e) {
        return "Raske Racer";
    }
}
