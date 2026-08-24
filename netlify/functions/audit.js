// Uses Groq's free API tier (no card required, standard key format).
// Includes console logging so errors show up clearly in Netlify's
// function logs for debugging.
exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const { prompt } = JSON.parse(event.body);

    console.log("GROQ_API_KEY present:", !!process.env.GROQ_API_KEY);
    console.log("GROQ_API_KEY starts with:", (process.env.GROQ_API_KEY || "").slice(0, 5));

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    console.log("Groq response status:", response.status);

    const data = await response.json();
    console.log("Groq response body:", JSON.stringify(data).slice(0, 500));

    const text =
      (data.choices &&
        data.choices[0] &&
        data.choices[0].message &&
        data.choices[0].message.content) ||
      "";

    if (!text) {
      // Surface the actual Groq error to the browser instead of hiding it
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: [
            {
              type: "text",
              text: JSON.stringify({
                score: 0,
                strengths: [],
                fixes: ["DEBUG: " + JSON.stringify(data).slice(0, 300)],
                price_note: "debug mode - see fixes above",
              }),
            },
          ],
        }),
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: [{ type: "text", text }] }),
    };
  } catch (err) {
    console.log("Function crashed:", err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
