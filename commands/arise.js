// commands/arise.js
module.exports = {
    name: "arise",
    description: "Show all available commands",
    async execute(sock, msg, args) {
        const commandList = `
╔══════════════════════════════╗
║            🤖 NGX5 BOT       ║
╠══════════════════════════════╣
║                              ║
║  📱 *DEVICE MANAGEMENT*      ║
║                              ║
║  .ping      - Check bot status
║  .status    - System status
║  .restart   - Restart bot
║  .logout    - Logout device
║                              ║
║  🛠️ *UTILITIES*              ║
║                              ║
║  .help      - Show help
║  .info      - Bot information
║  .time      - Current time
║                              ║
║  🎉 *FUN COMMANDS*           ║
║                              ║
║  .joke      - Tell a joke
║  .quote     - Random quote
║  .fact      - Interesting fact
║                              ║
╚══════════════════════════════╝

Type .<command> to use any feature
        `;
        
        await sock.sendMessage(msg.key.remoteJid, { 
            text: commandList 
        });
    }
};
