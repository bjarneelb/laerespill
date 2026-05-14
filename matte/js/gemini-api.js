const API_KEY = "AIzaSyDfC_RgtMDw-t7Ihj4cf_lzSAClJq_b96M";
// Vi bruker v1beta og den faktiske modellen fra listen din
const MODEL_NAME = "gemini-2.0-flash"; 
const URL = "https://generativelanguage.googleapis.com/v1beta/models/" + MODEL_NAME + ":generateContent?key=" + API_KEY;

export async function generateEquationTask(level) {
    try {
        const response = await fetch(URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Lag en matteoppgave niva " + level + ". Returner KUN JSON: {\"oppgaveTekst\": \"...\", \"xVerdi\": 5}" }] }]
            })
        });

        const data = await response.json();
        
        if (data.error) {
            console.error("Google-feil:", data.error.message);
            return null;
        }

        let rawText = data.candidates[0].content.parts[0].text;
        // Renser bort markdown-formatering
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
                contents: [{ parts: [{ text: "Navn på racerbil, to korte ord på norsk." }] }]
            })
        });
        const data = await response.json();
        return data.candidates[0].content.parts[0].text.trim();
    } catch (e) {
        return "Raske Rev";
    }
}
