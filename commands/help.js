// commands/help.js
module.exports = {
    name: "help",
    description: "Show help information",
    async execute(sock, msg, args) {
        const helpMessage = `
❓ *HELP CENTER*

Welcome to NGX5 WhatsApp Bot!

🔹 *How to use:*
Simply type . followed by a command (e.g., .ping)

🔹 *Getting started:*
1. Use .arise to see all commands
2. Each command has a specific function
3. Some commands might require parameters

🔹 *Support:*
If you encounter any issues, please contact the bot administrator.

🔹 *Note:*
This bot only responds to commands and won't participate in regular conversations.
        `;
        
        await sock.sendMessage(msg.key.remoteJid, { 
            text: helpMessage 
        });
    }
};
