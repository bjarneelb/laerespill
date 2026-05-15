// netlify/functions/ai-proxy.js
// Sikker proxy mellom spillet og Anthropic API.
// Maks 60 kall per minutt totalt (nok for en hel klasse).

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

// Enkel in-memory rate limiter
let callTimestamps = [];
const MAX_CALLS_PER_MINUTE = 60;

function isRateLimited() {
  const now = Date.now();
  const oneMinuteAgo = now - 60 * 1000;
  callTimestamps = callTimestamps.filter(t => t > oneMinuteAgo);
  if (callTimestamps.length >= MAX_CALLS_PER_MINUTE) return true;
  callTimestamps.push(now);
  return false;
}

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS_HEADERS, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: CORS_HEADERS, body: "Method Not Allowed" };
  }

  if (isRateLimited()) {
    return {
      statusCode: 429,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "For mange forespørsler – vent litt og prøv igjen!" }),
    };
  }

  try {
    const body = JSON.parse(event.body);

    // Videresend til Anthropic – nøkkelen hentes fra miljøvariabel (aldri i koden)
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
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
      return { statusCode: response.status, headers: CORS_HEADERS, body: err };
    }

    const data = await response.json();
    return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify(data) };

  } catch (err) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
