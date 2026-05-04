const TELEGRAM_API_URL = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

/**
 * Sends a text message to a specific Telegram chat
 * @param {number|string} chatId - The ID of the chat to send the message to
 * @param {string} text - The message text
 */
async function sendMessage(chatId, text) {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[Telegram API] Failed to send message:', errorData);
      throw new Error('Telegram API error');
    }

    return await response.json();
  } catch (error) {
    console.error('[Telegram API] sendMessage error:', error.message);
  }
}

/**
 * Sets the webhook URL for the Telegram Bot
 * @param {string} url - The public HTTPS URL to receive updates
 */
async function setWebhook(url) {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/setWebhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
      }),
    });

    const data = await response.json();
    console.log('[Telegram API] setWebhook response:', data);
    return data;
  } catch (error) {
    console.error('[Telegram API] setWebhook error:', error.message);
  }
}

/**
 * Downloads a file from Telegram using its file_id
 * @param {string} fileId - The Telegram file ID
 * @returns {Buffer} The downloaded file as a Buffer
 */
async function getFileBuffer(fileId) {
  try {
    // 1. Get the file path
    const response = await fetch(`${TELEGRAM_API_URL}/getFile?file_id=${fileId}`);
    const data = await response.json();
    
    if (!data.ok) {
      throw new Error(`Telegram API error: ${data.description}`);
    }
    
    const filePath = data.result.file_path;
    
    // 2. Download the file
    const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${filePath}`;
    const fileResponse = await fetch(fileUrl);
    
    if (!fileResponse.ok) {
      throw new Error('Failed to download file content from Telegram');
    }
    
    const arrayBuffer = await fileResponse.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('[Telegram API] getFileBuffer error:', error.message);
    throw error;
  }
}

module.exports = {
  sendMessage,
  setWebhook,
  getFileBuffer
};
