const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// We use gemini-2.5-flash as it is fast and suitable for text parsing
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Parses natural language sales text into structured JSON data using Google Gemini
 * @param {string} text - The raw text message from the user
 * @returns {object|null} The parsed JSON data or null if parsing failed
 */
async function parseMessage(text) {
  try {
    // Get current date in Bangkok timezone (YYYY-MM-DD format)
    const bangkokDate = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });

    const systemPrompt = `
You are a sales automation assistant. Your job is to extract structured data from user messages.
Today's date in Bangkok is: ${bangkokDate}

Extract the following fields from the user's message:
- product_name (string)
- quantity (number)
- action_type (string: strictly one of "sold", "restock", "update")
- date (string: use the specific date mentioned formatted as YYYY-MM-DD, or default to "${bangkokDate}" if missing)

Respond ONLY with valid JSON. Do not include markdown formatting like \`\`\`json.
Example input: "Sold 3 Coke today"
Example output:
{
  "product_name": "Coke",
  "quantity": 3,
  "action_type": "sold",
  "date": "${bangkokDate}"
}
`;

    const requestBody = {
      system_instruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: [{
        parts: [{ text: text }]
      }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    };

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[Gemini API] Error:', errorData);
      throw new Error('Failed to generate content from Gemini');
    }

    const data = await response.json();
    
    // Extract the text response
    const outputText = data.candidates[0].content.parts[0].text;
    
    // Parse the JSON
    const parsedData = JSON.parse(outputText);
    console.log('[Gemini API] Successfully parsed:', parsedData);
    
    return parsedData;
  } catch (error) {
    console.error('[Gemini API] parseMessage error:', error.message);
    return null;
  }
}

module.exports = {
  parseMessage
};
