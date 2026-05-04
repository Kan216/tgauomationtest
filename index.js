require('dotenv').config();
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Import routes
const webhookRoute = require('./routes/webhook');

// Basic health check endpoint
app.get('/', (req, res) => {
  res.send('Telegram Sales Automation System is running!');
});

// Register routes
app.use('/webhook', webhookRoute);

const telegramService = require('./services/telegram');
// Setup endpoint to easily configure webhook
app.get('/setup', async (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).send('Please provide a URL: /setup?url=https://your-ngrok-url.ngrok.app/webhook');
  }
  
  const result = await telegramService.setWebhook(url);
  res.json(result);
});

// Start the server
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  
  // Auto-setup webhook if running on Railway
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    const webhookUrl = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}/webhook`;
    console.log(`[Railway] Auto-configuring webhook to: ${webhookUrl}`);
    try {
      await telegramService.setWebhook(webhookUrl);
    } catch (err) {
      console.error('[Railway] Failed to auto-configure webhook:', err);
    }
  }
});
