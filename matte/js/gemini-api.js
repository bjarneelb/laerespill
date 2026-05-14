export async function generateEquationTask(level) {
    const key = localStorage.getItem("gemini_api_key");
    if (!key) return null;

    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + key;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: 'Lag en enkel matteoppgave niva ' + level + '. Svaret x ma vare et heltall. Returner KUN JSON: {"oppgaveTekst": "Hva er 5 + 5?", "xVerdi": 10}'
                    }]
                }]
            })
        });

        const data = await response.json();

        // Sjekk om Google nektet oss adgang (429)
        if (data.error) {
            console.error("Google API-feil:", data.error.message);
            return { oppgaveTekst: "Systemet hviler litt (429). Vent 10 sek og prøv igjen!", xVerdi: 0 };
        }

        // Sjekk om vi faktisk fikk kandidater
        if (!data.candidates || !data.candidates[0]) {
            return { oppgaveTekst: "Fant ingen oppgave. Prøv igjen.", xVerdi: 0 };
        }

        let rawText = data.candidates[0].content.parts[0].text;
        let start = rawText.indexOf('{');
        let end = rawText.lastIndexOf('}');
        
        if (start === -1 || end === -1) throw new Error("Ugyldig format");
        
        return JSON.parse(rawText.substring(start, end + 1));

    } catch (e) {
        console.error("Systemfeil:", e);
        return { oppgaveTekst: "Reven sover... (Feil)", xVerdi: 0 };
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
        
        // Robust sjekk for bilnavn
        if (data.candidates && data.candidates[0]) {
            return data.candidates[0].content.parts[0].text.trim();
        }
        return "Lynrask Rev";
    } catch (e) {
        return "Gylne Gaupe";
    }
}
