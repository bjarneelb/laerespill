export async function generateEquationTask(level) {
    const key = localStorage.getItem("gemini_api_key");
    if (!key) return null;

    const url =
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + key;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text:
                                    'Lag en enkel matteoppgave niva ' +
                                    level +
                                    '. Returner kun JSON: {"oppgaveTekst": "...", "xVerdi": 5}'
                            }
                        ]
                    }
                ]
            })
        });

        const data = await response.json();
        let rawText = data.candidates[0].content.parts[0].text;

        let vask1 = rawText.split("```json").join("");
        let vask2 = vask1.split("\n```").join("");
        let ferdigTekst = vask2.trim();

        return JSON.parse(ferdigTekst);
    } catch (e) {
        console.error("API-feil:", e);
        return null;
    }
}
