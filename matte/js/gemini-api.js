// js/gemini-api.js

export async function generateEquationTask(level) {
    // Henter nøkkelen du har lagret lokalt i din nettleser
    const apiKey = localStorage.getItem("gemini_api_key");
    
    if (!apiKey) {
        alert("Feil: Ingen API-nøkkel er lagret. Vennligst skriv inn nøkkelen nederst på siden.");
        return null;
    }

    // Vi bruker den nyeste stabile modellen fra listen din
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const prompt = {
        contents: [{
            parts: [{
                text: `Lag en matteoppgave for barn på nivå ${level}. Svaret x må være et heltall mellom 1 og 100. Returner kun JSON slik som dette: {"oppgaveTekst": "Hva er 10 + 5?", "xVerdi": 15}`
            }]
        }]
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(prompt)
        });

        const data = await response.json();

        if (data.error) {
            console.error("Google API Feil:", data.error.message);
            if (data.error.message.includes("API key not valid")) {
                alert("Nøkkelen er ugyldig eller sperret. Vennligst lag en ny og lagre den på nytt.");
            }
            return null;
        }

        let rawText = data.candidates[0].content.parts[0].text;
        // Renser bort eventuell markdown (```json ... 
```)
        let cleanJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
        
        return JSON.parse(cleanJson);
    } catch (error) {
        console.error("Systemfeil ved henting av oppgave:", error);
        return null;
    }
}

export async function generateCarName() {
    const apiKey = localStorage.getItem("gemini_api_key");
    if (!apiKey) return "Raske Racer";

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Lag et kult navn på en racerbil (to ord på norsk)." }] }]
            })
        });
        const data = await response.json();
        return data.candidates[0].content.parts[0].text.trim();
    } catch (e) {
        return "Lynrask Bil";
    }
}
