// pairing-server.js
const express = require('express');
const { makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// Store active pairing sessions
const pairingSessions = new Map();

// Routes
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
    const { state, saveCreds } = await useMultiFileAuthState('./data/sessions');
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false
    });

    // Store the socket for later use
    pairingSessions.set(number, { sock, saveCreds });

    // Request pairing code
    const pairingCode = await sock.requestPairingCode(number.replace(/\D/g, ''));
    
    // Listen for connection events
    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', (update) => {
      if (update.connection === 'open') {
        // Send welcome message when connected
        sock.sendMessage(sock.user.id, { 
          text: '🤖 *NGX5 Bot Connected Successfully!*\n\nType `.arise` to see all available commands.' 
        });
        
        // Clean up
        pairingSessions.delete(number);
      }
    });

    res.json({ success: true, pairingCode });
  } catch (error) {
    console.error('Pairing error:', error);
    res.status(500).json({ error: 'Failed to generate pairing code' });
  }
});

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'NGX5 Bot Server is running' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Pairing server running on port ${PORT}`);
});
