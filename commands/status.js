// commands/status.js
module.exports = {
    name: "status",
    description: "Show system status",
    async execute(sock, msg, args) {
        const os = require("os");
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        
        const statusMessage = `
📊 *SYSTEM STATUS*

🤖 Bot: Online
🕒 Uptime: ${hours}h ${minutes}m ${seconds}s
💾 Memory: ${(os.freemem() / 1024 / 1024 / 1024).toFixed(2)}GB free of ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)}GB
📶 CPU: ${os.cpus()[0].model}
        `;
        
        await sock.sendMessage(msg.key.remoteJid, { 
            text: statusMessage 
        });
    }
};
