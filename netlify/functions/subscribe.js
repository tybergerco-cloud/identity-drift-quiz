// Netlify Function: subscribe.js
//
// This runs on Netlify's servers, never in the visitor's browser \u2014 which is why
// it's safe to keep your Kit API key here (as an environment variable) instead of
// in the quiz's HTML/JS.
//
// SETUP:
// 1. In your Netlify site dashboard: Site configuration -> Environment variables
//    -> Add a variable named KIT_API_KEY, value = your Kit V4 API key
//    (Kit dashboard -> Account Settings -> Developer -> API Keys)
// 2. Deploy this file at: netlify/functions/subscribe.js (same relative path as this repo)
// 3. That's it \u2014 Netlify auto-detects and deploys functions in that folder.
//
// The quiz page calls this at /.netlify/functions/subscribe instead of calling
// Kit directly, so your API key is never exposed in the page source.

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const { email, first_name, form_id } = payload;

  if (!email || !form_id) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing email or form_id' }) };
  }

  const apiKey = process.env.KIT_API_KEY;
  if (!apiKey) {
    console.error('KIT_API_KEY environment variable is not set on this Netlify site.');
    return { statusCode: 500, body: JSON.stringify({ error: 'Server not configured' }) };
  }

  try {
    const kitResponse = await fetch(`https://api.kit.com/v4/forms/${form_id}/subscribers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Kit-Api-Key': apiKey,
      },
      body: JSON.stringify({
        email_address: email,
        first_name: first_name || undefined,
      }),
    });

    const data = await kitResponse.json().catch(() => ({}));

    if (!kitResponse.ok) {
      console.error('Kit API error:', kitResponse.status, data);
      return { statusCode: kitResponse.status, body: JSON.stringify(data) };
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error('Failed to reach Kit API:', err);
    return { statusCode: 502, body: JSON.stringify({ error: 'Failed to reach Kit' }) };
  }
};
