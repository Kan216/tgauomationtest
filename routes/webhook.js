const express = require('express');
const router = express.Router();

const telegramService = require('../services/telegram');
const geminiService = require('../services/gemini');
const sheetsService = require('../services/sheets');
const transcriptionService = require('../services/transcription');

// POST /webhook - Receives updates from Telegram
router.post('/', async (req, res) => {
  try {
    const update = req.body;
    
    // Telegram sends the message inside the update object
    if (update && update.message) {
      const message = update.message;
      const chatId = message.chat.id;
      
      // Determine if it's a text or voice message
      if (message.text) {
        console.log(`[Webhook] Received text message: "${message.text}" from ${message.from?.username || message.from?.id}`);
        
        // Send a temporary acknowledgment
        await telegramService.sendMessage(chatId, `Analyzing: "${message.text}"...`);
        
        // Parse with Gemini
        const parsedData = await geminiService.parseMessage(message.text);
        
        if (parsedData) {
          // Save to Google Sheets
          const success = await sheetsService.saveToSheet(parsedData);
          
          if (success) {
            const sheetName = parsedData.action_type === 'sold' ? 'Daily Sales' : 'Inventory';
            const replyText = `✅ Success!\nAdded **${parsedData.quantity}x ${parsedData.product_name}** to the _${sheetName}_ sheet.`;
            await telegramService.sendMessage(chatId, replyText);
          } else {
            await telegramService.sendMessage(chatId, `⚠️ AI parsed the message correctly, but I failed to save it to Google Sheets. Check server logs.`);
          }
        } else {
          await telegramService.sendMessage(chatId, `❌ Sorry, I couldn't understand that message.`);
        }
      } else if (message.voice) {
        console.log(`[Webhook] Received voice message. Duration: ${message.voice.duration}s, file_id: ${message.voice.file_id}`);
        await telegramService.sendMessage(chatId, `🎤 Listening to your voice message...`);
        
        try {
          const audioBuffer = await telegramService.getFileBuffer(message.voice.file_id);
          const transcript = await transcriptionService.transcribeAudio(audioBuffer);
          
          if (transcript) {
            await telegramService.sendMessage(chatId, `📝 Transcript: "${transcript}"\nProcessing...`);
            
            // Now feed the transcript to the existing Gemini parser
            const parsedData = await geminiService.parseMessage(transcript);
            
            if (parsedData) {
              // Save to Google Sheets
              const success = await sheetsService.saveToSheet(parsedData);
              
              if (success) {
                const sheetName = parsedData.action_type === 'sold' ? 'Daily Sales' : 'Inventory';
                const replyText = `✅ Success!\nAdded **${parsedData.quantity}x ${parsedData.product_name}** to the _${sheetName}_ sheet.`;
                await telegramService.sendMessage(chatId, replyText);
              } else {
                await telegramService.sendMessage(chatId, `⚠️ AI parsed the message correctly, but I failed to save it to Google Sheets. Check server logs.`);
              }
            } else {
              await telegramService.sendMessage(chatId, `❌ Sorry, I couldn't extract sales data from the transcript.`);
            }
          } else {
            await telegramService.sendMessage(chatId, `❌ Failed to transcribe the audio.`);
          }
        } catch (err) {
          console.error('[Webhook] Voice processing error:', err);
          await telegramService.sendMessage(chatId, `❌ An error occurred while processing your voice message.`);
        }
      } else {
        console.log('[Webhook] Received an unsupported message type.');
      }
    }

    // Always respond with 200 OK so Telegram knows we received it
    res.status(200).send('OK');
  } catch (error) {
    console.error('[Webhook] Error processing update:', error);
    // Even on error, it's generally good to send 200 to Telegram to prevent retries of bad payloads
    // unless we specifically want a retry. Let's send 200 for now.
    res.status(200).send('OK');
  }
});

module.exports = router;
