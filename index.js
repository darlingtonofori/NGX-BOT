// index.js
const { makeWASocket, useMultiFileAuthState, delay, DisconnectReason } = require("@whiskeysockets/baileys");
const express = require("express");
const pino = require("pino");
const fs = require("fs");
const path = require("path");
const config = require("./config");

// Create Express app for web pairing
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

// Import commands
const commands = {};
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    commands[command.name] = command;
}

// Logger
const logger = pino({ level: "silent" });

// Global variables
let sock;
let pairingCode = null;
let isConnected = false;

// Function to initialize the bot
async function initializeBot() {
    const { state, saveCreds } = await useMultiFileAuthState("./data/sessions");
    
    sock = makeWASocket({
        logger,
        printQRInTerminal: false,
        auth: state,
        browser: ["NGX5 Bot", "Chrome", "1.0.0"]
    });

    // Handle authentication updates
    sock.ev.on("creds.update", saveCreds);

    // Handle connection updates
    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log("QR code generated, but we're using pairing codes");
        }
        
        if (connection === "close") {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            
            if (shouldReconnect) {
                console.log("Connection closed. Reconnecting...");
                initializeBot();
            } else {
                console.log("Connection closed. You are logged out.");
            }
            
            isConnected = false;
        } else if (connection === "open") {
            console.log("✅ Connected to WhatsApp successfully!");
            isConnected = true;
            
            // Send welcome message to self
            sock.sendMessage(sock.user.id, { 
                text: "🤖 *NGX5 Bot Connected Successfully!*\n\nType `.arise` to see all available commands." 
            });
        }
    });

    // Handle incoming messages
    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0];
        
        if (!msg.message || msg.key.remoteJid === "status@broadcast") return;
        
        const text = msg.message.conversation || 
                    (msg.message.extendedTextMessage && msg.message.extendedTextMessage.text) || 
                    "";
        
        // Check if message is a command
        if (text.startsWith(".")) {
            const command = text.slice(1).split(" ")[0].toLowerCase();
            const args = text.split(" ").slice(1);
            
            if (commands[command]) {
                try {
                    await commands[command].execute(sock, msg, args);
                } catch (error) {
                    console.error("Command error:", error);
                    await sock.sendMessage(msg.key.remoteJid, { 
                        text: "❌ An error occurred while executing the command." 
                    });
                }
            }
        }
    });
}

// Function to request pairing code
async function requestPairingCode(phoneNumber) {
    if (!sock) {
        console.log("Bot not initialized. Initializing first...");
        await initializeBot();
        await delay(3000); // Wait for initialization
    }
    
    try {
        // Remove any non-digit characters from phone number
        phoneNumber = phoneNumber.replace(/\D/g, "");
        
        // Ensure phone number has country code
        if (!phoneNumber.startsWith("")) {
            phoneNumber = "" + phoneNumber;
        }
        
        console.log(`Requesting pairing code for: ${phoneNumber}`);
        pairingCode = await sock.requestPairingCode(phoneNumber);
        
        return pairingCode;
    } catch (error) {
        console.error("Error requesting pairing code:", error);
        return null;
    }
}

// Web routes for pairing
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/pair", async (req, res) => {
    try {
        const { number } = req.body;
        
        if (!number) {
            return res.status(400).json({ error: "Phone number is required" });
        }
        
        const code = await requestPairingCode(number);
        
        if (code) {
            res.json({ success: true, pairingCode: code });
        } else {
            res.status(500).json({ error: "Failed to generate pairing code" });
        }
    } catch (error) {
        console.error("Pairing error:", error);
        res.status(500).json({ error: "Failed to generate pairing code: " + error.message });
    }
});

// Health check endpoint for Render
app.get("/health", (req, res) => {
    res.json({ status: "OK", message: "NGX5 Bot is running" });
});

// Main function
async function main() {
    console.log("🤖 Starting NGX5 WhatsApp Bot...\n");
    
    // Start the web server
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`🌐 Web pairing panel available at http://localhost:${PORT}`);
    });
    
    // Check if we already have a session
    const sessionExists = fs.existsSync("./data/sessions/creds.json");
    
    if (sessionExists) {
        console.log("📁 Existing session found. Connecting...");
        await initializeBot();
    } else {
        console.log("🆕 No existing session found.");
        console.log(`Visit http://localhost:${PORT} to pair your device`);
        
        // Initialize bot anyway for pairing
        await initializeBot();
    }
}

// Run the bot
main().catch(console.error);
