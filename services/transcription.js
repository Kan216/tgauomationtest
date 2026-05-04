const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Transcribes audio (OGG format) into text using Gemini 2.5 Flash native audio support
 * @param {Buffer} audioBuffer - The audio file data
 * @returns {string|null} The transcribed text, or null if it failed
 */
async function transcribeAudio(audioBuffer) {
  try {
    const base64Audio = audioBuffer.toString('base64');
    
    const requestBody = {
      contents: [{
        parts: [
          { text: "Transcribe the speech in this audio exactly as you hear it. Do not add any extra commentary or formatting, just the pure transcription." },
          { 
            inline_data: { 
              mime_type: "audio/ogg", 
              data: base64Audio 
            } 
          }
        ]
      }]
    };
    
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('[Transcription API] Error:', errorData);
      throw new Error('Failed to transcribe audio via Gemini');
    }
    
    const data = await response.json();
    const transcript = data.candidates[0].content.parts[0].text.trim();
    
    console.log(`[Transcription API] Successfully transcribed: "${transcript}"`);
    return transcript;
    
  } catch (error) {
    console.error('[Transcription API] Error:', error.message);
    return null;
  }
}

module.exports = {
  transcribeAudio
};
