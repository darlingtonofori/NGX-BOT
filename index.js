const express = require('express');
const fs = require('fs');
const pino = require('pino');
const { makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// Store active pairing sessions
const pairingSessions = new Map();

// Route for the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/pair', async (req, res) => {
  try {
    const { number } = req.body;
    
    if (!number) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Create a new WhatsApp socket
    const { state, saveCreds } = await useMultiFileAuthState(`./sessions`);
    const XeonBotInc = makeWASocket({
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
      browser: ["NGX-BOT", "Chrome", "1.0.0"], // Fixed browser configuration
      auth: {
        creds: state.creds,
        keys: state.keys,
      },
    });

    // Request pairing code
    let code = await XeonBotInc.requestPairingCode(number.replace(/\D/g, ''));
    code = code?.match(/.{1,4}/g)?.join("-") || code;
    
    // Store the socket for later use
    pairingSessions.set(number, { XeonBotInc, saveCreds });

    // Listen for connection events
    XeonBotInc.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect } = update;
      
      if (connection === "open") {
        console.log("✅ NGX-BOT Connected Successfully!");
        
        // Send welcome message
        XeonBotInc.sendMessage(XeonBotInc.user.id, { 
          text: "🤖 *NGX-BOT Connected Successfully!*\n\nYour bot is now ready to use." 
        });
        
        // Clean up
        pairingSessions.delete(number);
      }
      
      if (connection === "close" && lastDisconnect.error && lastDisconnect.error.output.statusCode !== 401) {
        console.log("Connection closed. Reconnecting...");
      }
    });

    // Save credentials
    XeonBotInc.ev.on('creds.update', saveCreds);

    res.json({ success: true, pairingCode: code });
  } catch (error) {
    console.error('Pairing error:', error);
    res.status(500).json({ error: 'Failed to generate pairing code: ' + error.message });
  }
});

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'NGX-BOT Server is running' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🤖 NGX-BOT Server running on port ${PORT}`);
  console.log(`🌐 Open http://localhost:${PORT} to access the pairing panel`);
});
