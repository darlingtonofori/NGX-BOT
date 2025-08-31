// commands/ping.js
module.exports = {
    name: "ping",
    description: "Check bot responsiveness",
    async execute(sock, msg, args) {
        const start = Date.now();
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "🏓 Pong!" 
        });
        const end = Date.now();
        await sock.sendMessage(msg.key.remoteJid, { 
            text: `⏱️ Response time: ${end - start}ms` 
        });
    }
};
