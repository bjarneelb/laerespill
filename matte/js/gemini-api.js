// js/gemini-api.js

const API_KEY = "AIzaSyBIZ4HsB_TwwBvTJnYhdy5ejnmsKudO7wk";
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

export async function generateEquationTask(level) {
    const prompt = `
        Du er en mattelærer-KI. Lag en tekstoppgave basert på nivå ${level}.
        Nivåbeskrivelse:
        1: Enkel (x + a = b)
        2: Multiplikativ (ax = b)
        3: Sammensatt (ax + b = c)
        4: X på begge sider (ax + b = cx + d)

        Svaret SKAL være i JSON-format med nøyaktig denne strukturen:
        {
            "oppgaveTekst": "Teksten her...",
            "fasitLikning": {
                "leftX": antall x på venstre side,
                "leftNum": tallet på venstre side,
                "rightX": antall x på høyre side,
                "rightNum": tallet på høyre side
            },
            "xVerdi": selve løsningen (heltall)
        }
        Viktig: Bruk kun heltall i oppgavene.
    `;

    try {
        const response = await fetch(`${API_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            })
        });

        const data = await response.json();
        // Pakker ut JSON-svaret fra Gemini
        const resultText = data.candidates[0].content.parts[0].text;
        return JSON.parse(resultText);
    } catch (error) {
        console.error("Feil ved henting fra Gemini:", error);
        return null;
    }
}
