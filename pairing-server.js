const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const QRCode = require('qrcode');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));
app.use(express.json());

// Store pairing codes
const activePairingCodes = new Map();

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pairing.html'));
});

app.get('/api/pairing-code', (req, res) => {
    const code = req.query.code;
    if (code) {
        activePairingCodes.set(code, { timestamp: Date.now() });
        io.emit('new-pairing-code', { code });
        res.json({ success: true, code });
    } else {
        res.json({ success: false, error: 'No code provided' });
    }
});

io.on('connection', (socket) => {
    console.log('User connected to pairing page');
    
    socket.on('disconnect', () => {
        console.log('User disconnected from pairing page');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Pairing server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} to view pairing page`);
});
