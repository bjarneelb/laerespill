// netlify/functions/teacher-auth.js
// Verifiserer lærerpassord mot miljøvariabel og returnerer et session-token

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://bjarneelb.github.io",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function generateToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 48; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { password } = JSON.parse(event.body);
    const correct = process.env.TEACHER_PASSWORD;

    if (!correct) {
      return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: 'TEACHER_PASSWORD ikke satt i miljøvariabler' }) };
    }

    if (password === correct) {
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ ok: true, token: generateToken() }),
      };
    } else {
      return {
        statusCode: 401,
        headers: CORS_HEADERS,
        body: JSON.stringify({ ok: false, error: 'Feil passord' }),
      };
    }
  } catch (err) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
