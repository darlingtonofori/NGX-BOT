const settings = require('./settings');
require('./config.js');
const { isBanned } = require('./lib/isBanned.js');
const yts = require('yt-search');
const { fetchBuffer } = require('./lib/myfunc.js');
const fs = require('fs');
const fetch = require('node-fetch');
const ytdl = require('ytdl-core');
const path = require('path');
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const { addWelcome, delWelcome, isWelcomeOn, addGoodbye, delGoodBye, isGoodByeOn, isSudo } = require('./lib/index.js');
const { autotypingCommand, isAutotypingEnabled, handleAutotypingForMessage, handleAutotypingForCommand, showTypingAfterCommand } = require('./commands/autotyping.js');
const { autoreadCommand, isAutoreadEnabled, handleAutoread } = require('./commands/autoread.js');

// Command imports - FIXED WITH .js EXTENSION
const tagAllCommand = require('./commands/tagall.js');
const helpCommand = require('./commands/help.js');
const banCommand = require('./commands/ban.js');
const { promoteCommand } = require('./commands/promote.js');
const { demoteCommand } = require('./commands/demote.js');
const muteCommand = require('./commands/mute.js');
const unmuteCommand = require('./commands/unmute.js');
const stickerCommand = require('./commands/sticker.js');
const isAdmin = require('./lib/isAdmin.js');
const warnCommand = require('./commands/warn.js');
const warningsCommand = require('./commands/warnings.js');
const ttsCommand = require('./commands/tts.js');
const { tictactoeCommand, handleTicTacToeMove } = require('./commands/tictactoe.js');
const { incrementMessageCount, topMembers } = require('./commands/topmembers.js');
const ownerCommand = require('./commands/owner.js');
const deleteCommand = require('./commands/delete.js');
const { handleAntilinkCommand, handleLinkDetection } = require('./commands/antilink.js');
const { Antilink } = require('./lib/antilink.js');
const memeCommand = require('./commands/meme.js');
const tagCommand = require('./commands/tag.js');
const jokeCommand = require('./commands/joke.js');
const quoteCommand = require('./commands/quote.js');
const factCommand = require('./commands/fact.js');
const weatherCommand = require('./commands/weather.js');
const newsCommand = require('./commands/news.js');
const kickCommand = require('./commands/kick.js');
const simageCommand = require('./commands/simage.js');
const attpCommand = require('./commands/attp.js');
const { startHangman, guessLetter } = require('./commands/hangman.js');
const { startTrivia, answerTrivia } = require('./commands/trivia.js');
const { complimentCommand } = require('./commands/compliment.js');
const { insultCommand } = require('./commands/insult.js');
const { eightBallCommand } = require('./commands/eightball.js');
const { lyricsCommand } = require('./commands/lyrics.js');
const { dareCommand } = require('./commands/dare.js');
const { truthCommand } = require('./commands/truth.js');
const { clearCommand } = require('./commands/clear.js');
const pingCommand = require('./commands/ping.js');
const aliveCommand = require('./commands/alive.js');
const blurCommand = require('./commands/img-blur.js');
const welcomeCommand = require('./commands/welcome.js');
const goodbyeCommand = require('./commands/goodbye.js');
const githubCommand = require('./commands/github.js');
const { handleAntiBadwordCommand, handleBadwordDetection } = require('./lib/antibadword.js');
const antibadwordCommand = require('./commands/antibadword.js');
const { handleChatbotCommand, handleChatbotResponse } = require('./commands/chatbot.js');
const takeCommand = require('./commands/take.js');
const { flirtCommand } = require('./commands/flirt.js');
const characterCommand = require('./commands/character.js');
const wastedCommand = require('./commands/wasted.js');
const shipCommand = require('./commands/ship.js');
const groupInfoCommand = require('./commands/groupinfo.js');
const resetlinkCommand = require('./commands/resetlink.js');
const staffCommand = require('./commands/staff.js');
const unbanCommand = require('./commands/unban.js');
const emojimixCommand = require('./commands/emojimix.js');
const { handlePromotionEvent } = require('./commands/promote.js');
const { handleDemotionEvent } = require('./commands/demote.js');
const viewOnceCommand = require('./commands/viewonce.js');
const clearSessionCommand = require('./commands/clearsession.js');
const { autoStatusCommand, handleStatusUpdate } = require('./commands/autostatus.js');
const { simpCommand } = require('./commands/simp.js');
const { stupidCommand } = require('./commands/stupid.js');
const stickerTelegramCommand = require('./commands/stickertelegram.js');
const textmakerCommand = require('./commands/textmaker.js');
const { handleAntideleteCommand, handleMessageRevocation, storeMessage } = require('./commands/antidelete.js');
const clearTmpCommand = require('./commands/cleartmp.js');
const setProfilePicture = require('./commands/setpp.js');
const instagramCommand = require('./commands/instagram.js');
const facebookCommand = require('./commands/facebook.js');
const playCommand = require('./commands/play.js');
const tiktokCommand = require('./commands/tiktok.js');
const songCommand = require('./commands/song.js');
const aiCommand = require('./commands/ai.js');
const { handleTranslateCommand } = require('./commands/translate.js');
const { handleSsCommand } = require('./commands/ss.js');
const { addCommandReaction, handleAreactCommand } = require('./lib/reactions.js');
const { goodnightCommand } = require('./commands/goodnight.js');
const { shayariCommand } = require('./commands/shayari.js');
const { rosedayCommand } = require('./commands/roseday.js');
const imagineCommand = require('./commands/imagine.js');
const videoCommand = require('./commands/video.js');
const sudoCommand = require('./commands/sudo.js');
const { miscCommand, handleHeart } = require('./commands/misc.js');
const { animeCommand } = require('./commands/anime.js');
const { piesCommand, piesAlias } = require('./commands/pies.js');
const stickercropCommand = require('./commands/stickercrop.js');
const updateCommand = require('./commands/update.js');

// ... rest of your main.js file remains exactly the same ...
// ALL THE CODE BELOW THIS POINT STAYS EXACTLY AS YOU HAVE IT
// ONLY THE REQUIRE STATEMENTS ABOVE WERE MODIFIED

// Global settings
global.packname = settings.packname;
global.author = settings.author;
global.channelLink = "https://whatsapp.com/channel/0029Va90zAnIHphOuO8Msp3A";
global.ytch = "Mr Unique Hacker";

// Add this near the top of main.js with other global configurations
const channelInfo = {
    contextInfo: {
        forwardingScore: 1,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363161513685998@newsletter',
            newsletterName: 'KnightBot MD',
            serverMessageId: -1
        }
    }
};

async function handleMessages(sock, messageUpdate, printLog) {
    try {
        // ... rest of your handleMessages function remains exactly the same ...
        // ALL THE CODE INSIDE THIS FUNCTION STAYS EXACTLY AS YOU HAVE IT

// ... AND SO ON FOR THE REST OF THE FILE ...
// EVERYTHING AFTER THE REQUIRE STATEMENTS STAYS EXACTLY THE SAME
// ONLY THE REQUIRE STATEMENTS AT THE TOP WERE MODIFIED
