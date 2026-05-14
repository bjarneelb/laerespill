// js/gemini-api.js

const API_KEY = "AIzaSyBIZ4HsB_TwwBvTJnYhdy5ejnmsKudO7wk"; 
const API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent";

export async function generateEquationTask(level) {
    const prompt = `
        Du er en pedagogisk mattelærer-KI. 
        Lag en tekstoppgave på norsk basert på nivå ${level}.
        
        Nivåbeskrivelse:
        1: Enkel (x + a = b)
        2: Multiplikativ (ax = b)
        3: Sammensatt (ax + b = c)
        4: X på begge sider (ax + b = cx + d)

        Viktig: Svaret (x) må bli et positivt heltall.
        Returner KUN JSON.

        Struktur:
        {
            "oppgaveTekst": "Teksten her...",
            "fasitLikning": {
                "leftX": antall x venstre,
                "leftNum": tall venstre,
                "rightX": antall x høyre,
                "rightNum": tall høyre
            },
            "xVerdi": løsningen
        }
    `;

    try {
        const response = await fetch(`${API_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { 
                    // Vi fjerner responseMimeType midlertidig for å sikre kompatibilitet
                    // og bruker standardinnstillinger som fungerer overalt
                    temperature: 0.7,
                    topP: 0.95,
                    topK: 40,
                    maxOutputTokens: 1024,
                }
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error("API-feil fra Google:", data.error.message);
            return null;
        }

        if (!data.candidates || !data.candidates[0]) {
            console.error("Ingen respons fra Gemini:", data);
            return null;
        }

        let resultText = data.candidates[0].content.parts[0].text;
        
        // VASKING AV SVAR: Gemini legger av og til til ```json ... 
``` rundt koden.
        // Vi fjerner dette for å unngå JSON-krasj.
        resultText = resultText.replace(/```json/g, "").replace(/```/g, "").trim();
        
        return JSON.parse(resultText);

    } catch (error) {
        console.error("Systemfeil ved henting av KI-oppgave:", error);
        return null;
    }
}
