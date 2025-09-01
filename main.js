const settings = require('./settings.js');
const fs = require('fs');
const path = require('path');

// Global settings
global.packname = settings.packname || "NGX5 BOT";
global.author = settings.author || "MR UNIQUE HACKER";
global.channelLink = "https://whatsapp.com/channel/0029Va90zAnIHphOuO8Msp3A";
global.ytch = "Mr Unique Hacker";
global.whatsappchat = "https://wa.me/+233534332654";

const channelInfo = {
    contextInfo: {
        forwardingScore: 1,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363161513685998@newsletter',
            newsletterName: 'NGX5 BOT',
            serverMessageId: -1
        }
    }
};

// Safe require function with fallbacks
function safeRequire(modulePath, fallback = null) {
    try {
        if (fs.existsSync(require.resolve(modulePath))) {
            return require(modulePath);
        }
    } catch (error) {
        console.log(`⚠️  Module not found: ${modulePath}`);
    }
    return fallback;
}

// Dynamic command loader
const commands = {};
const commandsDir = path.join(__dirname, 'commands');

function loadCommand(commandName, fallback = null) {
    try {
        const commandPath = path.join(commandsDir, `${commandName}.js`);
        if (fs.existsSync(commandPath)) {
            commands[commandName] = require(commandPath);
            console.log(`✅ Loaded command: ${commandName}`);
            return true;
        } else {
            console.log(`⚠️  Command file not found: ${commandName}.js`);
            if (fallback) commands[commandName] = { client: fallback };
            return false;
        }
    } catch (error) {
        console.log(`❌ Error loading ${commandName}:`, error.message);
        if (fallback) commands[commandName] = { client: fallback };
        return false;
    }
}

// Load essential commands with fallbacks
loadCommand('help', async (sock, m) => {
    const helpText = `🤖 *NGX5 BOT - COMMAND MENU* 🤖
📚 *General Commands:*
• .help - Show this menu
• .info - Bot information
• .owner - Contact owner
• .ping - Check bot speed
🌐 *Contact Owner:* ${global.whatsappchat}`;
    await sock.sendMessage(m.from, { text: helpText, ...channelInfo });
});

loadCommand('owner', async (sock, m) => {
    const ownerText = `👑 *BOT OWNER INFORMATION* 👑
🤖 *Bot Name:* NGX5 BOT
👤 *Owner:* MR UNIQUE HACKER
📞 *WhatsApp:* +233534332654
🌐 *Contact Link:* ${global.whatsappchat}`;
    await sock.sendMessage(m.from, { text: ownerText, ...channelInfo });
});

loadCommand('ping', async (sock, m) => {
    const start = Date.now();
    await sock.sendMessage(m.from, { text: 'Pong! 🏓', ...channelInfo });
    const latency = Date.now() - start;
    await sock.sendMessage(m.from, { text: `⚡ *Latency:* ${latency}ms`, ...channelInfo });
});

loadCommand('info', async (sock, m) => {
    const infoText = `🤖 *NGX5 BOT INFORMATION* 🤖
• *Name:* NGX5 Bot
• *Version:* 1.0.0
• *Creator:* MR UNIQUE HACKER
• *Platform:* WhatsApp
• *Status:* Online ✅
🌐 *Contact:* ${global.whatsappchat}`;
    await sock.sendMessage(m.from, { text: infoText, ...channelInfo });
});

// Load other commands without fallbacks (they'll be handled gracefully)
const otherCommands = [
    'sticker', 'tagall', 'ban', 'mute', 'unmute', 'promote', 'demote', 
    'warn', 'warnings', 'tts', 'tictactoe', 'topmembers', 'delete',
    'antilink', 'meme', 'tag', 'joke', 'quote', 'fact', 'weather', 'news',
    'kick', 'simage', 'attp', 'hangman', 'trivia', 'compliment', 'insult',
    'eightball', 'lyrics', 'dare', 'truth', 'clear', 'alive', 'blur',
    'welcome', 'goodbye', 'github', 'antibadword', 'chatbot', 'take',
    'flirt', 'character', 'wasted', 'ship', 'groupinfo', 'resetlink',
    'staff', 'emojimix', 'viewonce', 'clearsession', 'autostatus', 'simp',
    'stupid', 'stickertelegram', 'textmaker', 'antidelete', 'cleartmp',
    'setpp', 'instagram', 'facebook', 'play', 'tiktok', 'song', 'ai',
    'translate', 'ss', 'sudo', 'goodnight', 'shayari', 'roseday', 'imagine',
    'video', 'misc', 'anime', 'pies', 'stickercrop', 'update'
];

otherCommands.forEach(cmd => loadCommand(cmd));

// Safe require for lib files
const libs = {
    isBanned: safeRequire('./lib/isBanned.js', { isBanned: () => false }),
    isAdmin: safeRequire('./lib/isAdmin.js', { isAdmin: async () => ({ isSenderAdmin: false, isBotAdmin: false }) }),
    isSudo: safeRequire('./lib/index.js', { isSudo: () => false }),
    myfunc: safeRequire('./lib/myfunc.js', { fetchBuffer: () => null }),
    antilink: safeRequire('./lib/antilink.js', { Antilink: async () => {} }),
    antibadword: safeRequire('./lib/antibadword.js', { handleAntiBadwordCommand: async () => {}, handleBadwordDetection: async () => {} }),
    reactions: safeRequire('./lib/reactions.js', { addCommandReaction: async () => {}, handleAreactCommand: async () => {} })
};

// Safe require for command modules with multiple exports
const multiExportCommands = {
    autotyping: safeRequire('./commands/autotyping.js', { 
        autotypingCommand: async () => {}, 
        isAutotypingEnabled: () => false,
        handleAutotypingForMessage: async () => {},
        handleAutotypingForCommand: async () => {},
        showTypingAfterCommand: async () => {}
    }),
    autoread: safeRequire('./commands/autoread.js', {
        autoreadCommand: async () => {},
        isAutoreadEnabled: () => false,
        handleAutoread: async () => {}
    }),
    promote: safeRequire('./commands/promote.js', {
        promoteCommand: async () => {},
        handlePromotionEvent: async () => {}
    }),
    demote: safeRequire('./commands/demote.js', {
        demoteCommand: async () => {},
        handleDemotionEvent: async () => {}
    }),
    tictactoe: safeRequire('./commands/tictactoe.js', {
        tictactoeCommand: async () => {},
        handleTicTacToeMove: async () => {}
    }),
    topmembers: safeRequire('./commands/topmembers.js', {
        incrementMessageCount: () => {},
        topMembers: async () => {}
    }),
    antilink: safeRequire('./commands/antilink.js', {
        handleAntilinkCommand: async () => {},
        handleLinkDetection: async () => {}
    }),
    hangman: safeRequire('./commands/hangman.js', {
        startHangman: async () => {},
        guessLetter: async () => {}
    }),
    trivia: safeRequire('./commands/trivia.js', {
        startTrivia: async () => {},
        answerTrivia: async () => {}
    }),
    chatbot: safeRequire('./commands/chatbot.js', {
        handleChatbotCommand: async () => {},
        handleChatbotResponse: async () => {}
    }),
    antidelete: safeRequire('./commands/antidelete.js', {
        handleAntideleteCommand: async () => {},
        handleMessageRevocation: async () => {},
        storeMessage: () => {}
    }),
    autostatus: safeRequire('./commands/autostatus.js', {
        autoStatusCommand: async () => {},
        handleStatusUpdate: async () => {}
    }),
    translate: safeRequire('./commands/translate.js', {
        handleTranslateCommand: async () => {}
    }),
    ss: safeRequire('./commands/ss.js', {
        handleSsCommand: async () => {}
    }),
    misc: safeRequire('./commands/misc.js', {
        miscCommand: async () => {},
        handleHeart: async () => {}
    }),
    anime: safeRequire('./commands/anime.js', {
        animeCommand: async () => {}
    }),
    pies: safeRequire('./commands/pies.js', {
        piesCommand: async () => {},
        piesAlias: async () => {}
    })
};

async function handleMessages(sock, messageUpdate, printLog) {
    try {
        const { messages, type } = messageUpdate;
        if (type !== 'notify') return;

        const message = messages[0];
        if (!message?.message) return;

        // Handle autoread functionality
        if (multiExportCommands.autoread && multiExportCommands.autoread.handleAutoread) {
            await multiExportCommands.autoread.handleAutoread(sock, message);
        }

        // Store message for antidelete feature
        if (multiExportCommands.antidelete && multiExportCommands.antidelete.storeMessage) {
            multiExportCommands.antidelete.storeMessage(message);
        }

        const chatId = message.key.remoteJid;
        const senderId = message.key.participant || message.key.remoteJid;
        const isGroup = chatId.endsWith('@g.us');
        const senderIsSudo = libs.isSudo ? await libs.isSudo.isSudo(senderId) : false;

        const userMessage = (
            message.message?.conversation?.trim() ||
            message.message?.extendedTextMessage?.text?.trim() ||
            message.message?.imageMessage?.caption?.trim() ||
            message.message?.videoMessage?.caption?.trim() ||
            ''
        ).toLowerCase().replace(/\.\s+/g, '.').trim();

        const rawText = message.message?.conversation?.trim() ||
            message.message?.extendedTextMessage?.text?.trim() ||
            message.message?.imageMessage?.caption?.trim() ||
            message.message?.videoMessage?.caption?.trim() ||
            '';

        if (userMessage.startsWith('.')) {
            console.log(`📝 Command used in ${isGroup ? 'group' : 'private'}: ${userMessage}`);
        }

        // Check if user is banned
        if (libs.isBanned && libs.isBanned.isBanned(senderId) && !userMessage.startsWith('.unban')) {
            if (Math.random() < 0.1) {
                await sock.sendMessage(chatId, {
                    text: '❌ You are banned from using the bot. Contact an admin to get unbanned.',
                    ...channelInfo
                });
            }
            return;
        }

        // Basic command handling
        if (userMessage.startsWith('.help') || userMessage === '.menu') {
            if (commands.help) {
                await commands.help.client(sock, message);
            } else {
                const helpText = `🤖 *NGX5 BOT - COMMAND MENU* 🤖
📚 *Available Commands:*
• .help - Show this menu
• .owner - Contact owner
• .ping - Check bot speed
• .info - Bot information
🌐 *Contact:* ${global.whatsappchat}`;
                await sock.sendMessage(chatId, { text: helpText, ...channelInfo });
            }
            return;
        }

        if (userMessage === '.owner') {
            if (commands.owner) {
                await commands.owner.client(sock, message);
            } else {
                const ownerText = `👑 *BOT OWNER* 👑
🤖 *Bot Name:* NGX5 BOT
👤 *Owner:* MR UNIQUE HACKER
📞 *WhatsApp:* +233534332654
🌐 *Contact:* ${global.whatsappchat}`;
                await sock.sendMessage(chatId, { text: ownerText, ...channelInfo });
            }
            return;
        }

        if (userMessage === '.ping') {
            if (commands.ping) {
                await commands.ping.client(sock, message);
            } else {
                const start = Date.now();
                await sock.sendMessage(chatId, { text: 'Pong! 🏓', ...channelInfo });
                const latency = Date.now() - start;
                await sock.sendMessage(chatId, { text: `⚡ *Latency:* ${latency}ms`, ...channelInfo });
            }
            return;
        }

        if (userMessage === '.info') {
            if (commands.info) {
                await commands.info.client(sock, message);
            } else {
                const infoText = `🤖 *NGX5 BOT INFO* 🤖
• *Name:* NGX5 Bot
• *Version:* 1.0.0
• *Creator:* MR UNIQUE HACKER
• *Status:* Online ✅
🌐 *Contact:* ${global.whatsappchat}`;
                await sock.sendMessage(chatId, { text: infoText, ...channelInfo });
            }
            return;
        }

        // Add more command handlers as needed...

        // Default response for unrecognized commands
        if (userMessage.startsWith('.')) {
            await sock.sendMessage(chatId, {
                text: '❌ Command not available yet. Use .help to see available commands.',
                ...channelInfo
            });
        }

    } catch (error) {
        console.error('❌ Error in message handler:', error.message);
    }
}

async function handleGroupParticipantUpdate(sock, update) {
    try {
        const { id, participants, action } = update;
        if (!id.endsWith('@g.us')) return;

        console.log(`Group update: ${action} for ${participants.length} participants`);

        // Basic group event handling
        if (action === 'add') {
            for (const participant of participants) {
                await sock.sendMessage(id, {
                    text: `Welcome @${participant.split('@')[0]} to the group! 🎉`,
                    mentions: [participant],
                    ...channelInfo
                });
            }
        } else if (action === 'remove') {
            for (const participant of participants) {
                await sock.sendMessage(id, {
                    text: `Goodbye @${participant.split('@')[0]} 👋`,
                    mentions: [participant],
                    ...channelInfo
                });
            }
        }

    } catch (error) {
        console.error('Error in handleGroupParticipantUpdate:', error.message);
    }
}

async function handleStatus(sock, status) {
    console.log('Status update received');
}

module.exports = {
    handleMessages,
    handleGroupParticipantUpdate,
    handleStatus
};
