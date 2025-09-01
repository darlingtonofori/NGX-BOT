/**
 * Knight Bot - A WhatsApp Bot
 * Copyright (c) 2024 Professor
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the MIT License.
 * 
 * Credits:
 * - Baileys Library by @adiwajshing
 * - Pair Code implementation inspired by TechGod143 & DGXEON
 */
require('./settings')
const { Boom } = require('@hapi/boom')
const fs = require('fs')
const chalk = require('chalk')
const FileType = require('file-type')
const path = require('path')
const axios = require('axios')
const { handleMessages, handleGroupParticipantUpdate, handleStatus } = require('./main');
const PhoneNumber = require('awesome-phonenumber')
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./lib/exif')
const { smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, fetch, await, sleep, reSize } = require('./lib/myfunc')
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    generateForwardMessageContent,
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    generateMessageID,
    downloadContentFromMessage,
    jidDecode,
    proto,
    jidNormalizedUser,
    makeCacheableSignalKeyStore,
    delay
} = require("@whiskeysockets/baileys")
const NodeCache = require("node-cache")
// Using a lightweight persisted store instead of makeInMemoryStore (compat across versions)
const pino = require("pino")
const readline = require("readline")
const { parsePhoneNumber } = require("libphonenumber-js")
const { PHONENUMBER_MCC } = require('@whiskeysockets/baileys/lib/Utils/generics')
const { rmSync, existsSync } = require('fs')
const { join } = require('path')

// Web server for pairing page
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const QRCode = require('qrcode');

// Initialize web server
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));
app.use(express.json());

// Store pairing codes and user numbers
const activePairingCodes = new Map();
const userNumbers = new Map();

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pairing.html'));
});

app.get('/api/pairing-code', (req, res) => {
    const code = req.query.code;
    const number = req.query.number;
    if (code && number) {
        activePairingCodes.set(code, { 
            timestamp: Date.now(),
            number: number 
        });
        userNumbers.set(number, code);
        io.emit('new-pairing-code', { code, number });
        res.json({ success: true, code, number });
    } else {
        res.json({ success: false, error: 'No code or number provided' });
    }
});

app.post('/api/request-pairing', async (req, res) => {
    try {
        const { number } = req.body;
        if (!number) {
            return res.json({ success: false, error: 'Phone number required' });
        }

        // Clean and validate number
        const cleanNumber = number.replace(/[^0-9]/g, '');
        const pn = require('awesome-phonenumber');
        if (!pn('+' + cleanNumber).isValid()) {
            return res.json({ success: false, error: 'Invalid phone number format' });
        }

        // Store the number for later use
        userNumbers.set(cleanNumber, 'pending');
        io.emit('number-submitted', { number: cleanNumber, status: 'pending' });
        
        res.json({ success: true, message: 'Number received, pairing will start soon', number: cleanNumber });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

io.on('connection', (socket) => {
    console.log('User connected to pairing page');
    
    socket.on('request-pairing', (data) => {
        console.log('Pairing requested for:', data.number);
        io.emit('pairing-requested', { number: data.number });
    });
    
    socket.on('disconnect', () => {
        console.log('User disconnected from pairing page');
    });
});

const WEB_PORT = process.env.PORT || 3000;
server.listen(WEB_PORT, () => {
    console.log(chalk.blue(`🌐 Pairing server running on port ${WEB_PORT}`));
    console.log(chalk.blue(`📱 Open your Render URL to view pairing page`));
});

// Simple store with persistence
const STORE_FILE = './baileys_store.json'
const store = {
    messages: {},
    contacts: {},
    chats: {},
    readFromFile(filePath = STORE_FILE) {
        try {
            if (fs.existsSync(filePath)) {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
                this.messages = data.messages || {}
                this.contacts = data.contacts || {}
                this.chats = data.chats || {}
            }
        } catch (e) {
            console.warn('Failed to read store file:', e.message)
        }
    },
    writeToFile(filePath = STORE_FILE) {
        try {
            const data = JSON.stringify({ messages: this.messages, contacts: this.contacts, chats: this.chats })
            fs.writeFileSync(filePath, data)
        } catch (e) {
            console.warn('Failed to write store file:', e.message)
        }
    },
    bind(ev) {
        ev.on('messages.upsert', ({ messages }) => {
            messages.forEach(msg => {
                if (msg.key && msg.key.remoteJid) {
                    const jid = msg.key.remoteJid
                    this.messages[jid] = this.messages[jid] || {}
                    this.messages[jid][msg.key.id] = msg
                }
            })
        })
        ev.on('contacts.update', (contacts) => {
            contacts.forEach(contact => {
                if (contact.id) {
                    this.contacts[contact.id] = contact
                }
            })
        })
        ev.on('chats.set', (chats) => {
            this.chats = chats
        })
    },
    async loadMessage(jid, id) {
        return this.messages[jid]?.[id] || null
    }
}

store.readFromFile(STORE_FILE)
setInterval(() => store.writeToFile(STORE_FILE), 10_000)

// REMOVED the fixed phone number - users will input their own
let phoneNumber = process.env.PHONE_NUMBER || null;
let owner = JSON.parse(fs.readFileSync('./data/owner.json'))

global.botname = "NGX5 BOT"
global.themeemoji = "•"

const settings = require('./settings')
// Enable pairing code mode by default for web interface
const pairingCode = process.argv.includes("--pairing-code") || true;
const useMobile = process.argv.includes("--mobile")

// Only create readline interface if we're in an interactive environment
const rl = process.stdin.isTTY ? readline.createInterface({ input: process.stdin, output: process.stdout }) : null
const question = (text) => {
    if (rl) {
        return new Promise((resolve) => rl.question(text, resolve))
    } else {
        // In non-interactive environment, return null to use web interface
        return Promise.resolve(null);
    }
}


async function startNGX5Bot() {
    let { version, isLatest } = await fetchLatestBaileysVersion()
    const { state, saveCreds } = await useMultiFileAuthState(`./session`)
    const msgRetryCounterCache = new NodeCache()

    const NGX5 = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: !pairingCode,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
        },
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: true,
        syncFullHistory: true,
        getMessage: async (key) => {
            let jid = jidNormalizedUser(key.remoteJid)
            let msg = await store.loadMessage(jid, key.id)
            return msg?.message || ""
        },
        msgRetryCounterCache,
        defaultQueryTimeoutMs: undefined,
    })

    store.bind(NGX5.ev)

    // Message handling
    NGX5.ev.on('messages.upsert', async chatUpdate => {
        try {
            const mek = chatUpdate.messages[0]
            if (!mek.message) return
            mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
            if (mek.key && mek.key.remoteJid === 'status@broadcast') {
                await handleStatus(NGX5, chatUpdate);
                return;
            }
            if (!NGX5.public && !mek.key.fromMe && chatUpdate.type === 'notify') return
            if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return

            try {
                await handleMessages(NGX5, chatUpdate, true)
            } catch (err) {
                console.error("Error in handleMessages:", err)
                // Only try to send error message if we have a valid chatId
                if (mek.key && mek.key.remoteJid) {
                    await NGX5.sendMessage(mek.key.remoteJid, {
                        text: '❌ An error occurred while processing your message.',
                        contextInfo: {
                            forwardingScore: 1,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: '120363161513685998@newsletter',
                                newsletterName: 'NGX5-BOT.Inc',
                                serverMessageId: -1
                            }
                        }
                    }).catch(console.error);
                }
            }
        } catch (err) {
            console.error("Error in messages.upsert:", err)
        }
    })

    // Add these event handlers for better functionality
    NGX5.decodeJid = (jid) => {
        if (!jid) return jid
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {}
            return decode.user && decode.server && decode.user + '@' + decode.server || jid
        } else return jid
    }

    NGX5.ev.on('contacts.update', update => {
        for (let contact of update) {
            let id = NGX5.decodeJid(contact.id)
            if (store && store.contacts) store.contacts[id] = { id, name: contact.notify }
        }
    })

    NGX5.getName = (jid, withoutContact = false) => {
        id = NGX5.decodeJid(jid)
        withoutContact = NGX5.withoutContact || withoutContact
        let v
        if (id.endsWith("@g.us")) return new Promise(async (resolve) => {
            v = store.contacts[id] || {}
            if (!(v.name || v.subject)) v = NGX5.groupMetadata(id) || {}
            resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international'))
        })
        else v = id === '0@s.whatsapp.net' ? {
            id,
            name: 'WhatsApp'
        } : id === NGX5.decodeJid(NGX5.user.id) ?
            NGX5.user :
            (store.contacts[id] || {})
        return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
    }

    NGX5.public = true

    NGX5.serializeM = (m) => smsg(NGX5, m, store)

    // Handle pairing code via web interface
    if (pairingCode && !NGX5.authState.creds.registered) {
        if (useMobile) throw new Error('Cannot use pairing code with mobile api')

        console.log(chalk.green('🤖 Pairing mode enabled'));
        console.log(chalk.blue('📱 Users can input their numbers on the web interface'));

        // Check for pending pairing requests every 5 seconds
        setInterval(async () => {
            for (const [number, status] of userNumbers.entries()) {
                if (status === 'pending') {
                    try {
                        console.log(chalk.yellow(`🔄 Processing pairing request for: ${number}`));
                        
                        // Clean the phone number
                        const cleanNumber = number.replace(/[^0-9]/g, '');

                        // Validate the phone number
                        const pn = require('awesome-phonenumber');
                        if (!pn('+' + cleanNumber).isValid()) {
                            console.log(chalk.red(`❌ Invalid number: ${cleanNumber}`));
                            userNumbers.set(number, 'invalid');
                            continue;
                        }

                        let code = await NGX5.requestPairingCode(cleanNumber);
                        code = code?.match(/.{1,4}/g)?.join("-") || code;
                        
                        // Send to web interface
                        try {
                            const RENDER_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${WEB_PORT}`;
                            await axios.get(`${RENDER_URL}/api/pairing-code?code=${code}&number=${cleanNumber}`);
                            console.log(chalk.green(`✅ Pairing code sent for: ${cleanNumber}`));
                            userNumbers.set(number, 'sent');
                        } catch (webError) {
                            console.log(chalk.yellow(`⚠️ Web server error, showing in logs for: ${cleanNumber}`));
                            console.log(chalk.black(chalk.bgGreen(`Pairing Code for ${cleanNumber}: `)), chalk.black(chalk.white(code)));
                            userNumbers.set(number, 'sent');
                        }
                        
                    } catch (error) {
                        console.error(chalk.red(`Error requesting pairing code for ${number}:`), error);
                        userNumbers.set(number, 'error');
                    }
                }
            }
        }, 5000);
    }

    // Connection handling
    NGX5.ev.on('connection.update', async (s) => {
        const { connection, lastDisconnect } = s
        if (connection == "open") {
            console.log(chalk.magenta(` `))
            console.log(chalk.yellow(`🌿Connected to => ` + JSON.stringify(NGX5.user, null, 2)))

            const botNumber = NGX5.user.id.split(':')[0] + '@s.whatsapp.net';
            await NGX5.sendMessage(botNumber, {
                text: `🤖 NGX5-BOT.Inc Connected Successfully!\n\n⏰ Time: ${new Date().toLocaleString()}\n✅ Status: Online and Ready!`,
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363161513685998@newsletter',
                        newsletterName: 'NGX5-BOT.Inc',
                        serverMessageId: -1
                    }
                }
            });

            await delay(1999)
            console.log(chalk.yellow(`\n\n                  ${chalk.bold.blue(`[ ${global.botname || 'NGX5 BOT'} ]`)}\n\n`))
            console.log(chalk.cyan(`< ================================================== >`))
            console.log(chalk.magenta(`\n${global.themeemoji || '•'} YT CHANNEL: MR UNIQUE HACKER`))
            console.log(chalk.magenta(`${global.themeemoji || '•'} GITHUB: mrunqiuehacker`))
            console.log(chalk.magenta(`${global.themeemoji || '•'} WA NUMBER: ${owner}`))
            console.log(chalk.magenta(`${global.themeemoji || '•'} CREDIT: MR UNIQUE HACKER`))
            console.log(chalk.green(`${global.themeemoji || '•'} 🤖 NGX5-BOT.Inc Connected Successfully! ✅`))
        }
        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode
            if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
                try {
                    rmSync('./session', { recursive: true, force: true })
                } catch { }
                console.log(chalk.red('Session logged out. Please re-authenticate.'))
                startNGX5Bot()
            } else {
                startNGX5Bot()
            }
        }
    })

    NGX5.ev.on('creds.update', saveCreds)

    NGX5.ev.on('group-participants.update', async (update) => {
        await handleGroupParticipantUpdate(NGX5, update);
    });

    NGX5.ev.on('messages.upsert', async (m) => {
        if (m.messages[0].key && m.messages[0].key.remoteJid === 'status@broadcast') {
            await handleStatus(NGX5, m);
        }
    });

    NGX5.ev.on('status.update', async (status) => {
        await handleStatus(NGX5, status);
    });

    NGX5.ev.on('messages.reaction', async (status) => {
        await handleStatus(NGX5, status);
    });

    return NGX5
}


// Start the bot with error handling
startNGX5Bot().catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
})
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err)
})

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err)
})

let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.redBright(`Update ${__filename}`))
    delete require.cache[file]
    require(file)
})
