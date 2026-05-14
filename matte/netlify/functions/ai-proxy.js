// netlify/functions/ai-proxy.js
// Sikker proxy mellom spillet og Anthropic API.
// API-nøkkelen er aldri synlig for elevene.

export async function handler(event) {
  // Kun POST-forespørsler
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // CORS-headers – tillat kall fra ditt eget domene
  const headers = {
    "Access-Control-Allow-Origin": "*",   // bytt til ditt domene i produksjon, f.eks. "https://mittspill.netlify.app"
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  // Håndter preflight-forespørsel fra nettleser
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const body = JSON.parse(event.body);

    // Videresend til Anthropic – nøkkelen hentes fra miljøvariabel (aldri i koden)
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,   // satt i Netlify-dashbordet
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 600,
        messages: body.messages,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return { statusCode: response.status, headers, body: err };
    }

    const data = await response.json();
    return { statusCode: 200, headers, body: JSON.stringify(data) };

  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
