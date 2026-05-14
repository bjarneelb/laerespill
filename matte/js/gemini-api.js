// js/gemini-api.js

// DIN_API_NØKKEL_HER må byttes ut med nøkkelen fra https://aistudio.google.com/
const API_KEY = "AIzaSyBIZ4HsB_TwwBvTJnYhdy5ejnmsKudO7wk"; 
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

/**
 * Genererer en tekstoppgave basert på nivået som sendes inn.
 * @param {number} level - Nivået på likningen (1-4).
 * @returns {Promise<Object|null>} - Returnerer et objekt med oppgave og fasit, eller null ved feil.
 */
export async function generateEquationTask(level) {
    const prompt = `
        Du er en pedagogisk mattelærer-KI for ungdomsskolen. 
        Lag en tekstoppgave basert på nivå ${level}.
        
        Nivåbeskrivelse for likningen:
        1: Enkel (x + a = b)
        2: Multiplikativ (ax = b)
        3: Sammensatt (ax + b = c)
        4: X på begge sider (ax + b = cx + d)

        OPPGAVETEKST:
        Lag en kort og morsom tekstoppgave på norsk. Bruk navn på kjente steder eller personer.
        Viktig: Sørget for at svaret (x) alltid blir et positivt heltall.

        SVARET SKAL KUN VÆRE I RENT JSON-FORMAT med denne strukturen:
        {
            "oppgaveTekst": "Teksten på norsk her...",
            "fasitLikning": {
                "leftX": antall x på venstre side,
                "leftNum": tallet på venstre side,
                "rightX": antall x på høyre side,
                "rightNum": tallet på høyre side
            },
            "xVerdi": selve løsningen (heltall)
        }
    `;

    try {
        const response = await fetch(`${API_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { 
                    responseMimeType: "application/json",
                    temperature: 0.7 
                }
            })
        });

        const data = await response.json();

        // Sjekk om API-et returnerte en feil (f.eks. ugyldig nøkkel)
        if (data.error) {
            console.error("API-feil fra Google:", data.error.message);
            return null;
        }

        // Sjekk om vi fikk kandidater (faktisk svar)
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            console.error("Ingen gyldig respons fra Gemini. Sjekk API-kvoter/nøkkel.", data);
            return null;
        }

        // Pakk ut teksten og konverter fra JSON-streng til et JS-objekt
        const resultText = data.candidates[0].content.parts[0].text;
        const resultObject = JSON.parse(resultText);

        console.log("KI-Oppgave generert:", resultObject);
        return resultObject;

    } catch (error) {
        console.error("Systemfeil ved kommunikasjon med Gemini:", error);
        return null;
    }
}
