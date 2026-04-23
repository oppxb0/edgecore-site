exports.handler = async function(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: "API key not configured" }) };
  }

  try {
    const { text } = JSON.parse(event.body);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1000,
        system: `You are an order data extraction engine. Extract structured order information from the provided text and return ONLY a valid JSON object — no markdown, no explanation, no backticks.

Return this exact structure:
{
  "customer_name": "string or null",
  "company": "string or null",
  "contact_phone": "string or null",
  "po_number": "string or null",
  "order_date": "string or null",
  "requested_delivery": "string or null",
  "payment_terms": "string or null",
  "ship_to": {
    "street": "string or null",
    "city": "string or null",
    "state": "string or null",
    "zip": "string or null",
    "attention": "string or null",
    "instructions": "string or null"
  },
  "line_items": [
    {
      "description": "string",
      "sku": "string or null",
      "quantity": "number or null",
      "unit": "string or null"
    }
  ],
  "flags": ["array of strings describing missing or ambiguous information that would prevent order processing"]
}

Rules:
- Use null for any field not found in the text
- flags should list anything that would block order fulfillment
- Be literal, do not invent data
- quantities should be numbers not strings`,
        messages: [{ role: "user", content: text }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: data.error?.message || "API error" })
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: data.content[0].text
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
