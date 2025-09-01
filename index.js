<!DOCTYPE html>
<html>
<head>
    <title>NGX5 Bot - Pairing</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0; 
            padding: 20px; 
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .container { 
            background: white; 
            padding: 30px; 
            border-radius: 15px; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            text-align: center;
            max-width: 500px;
            width: 100%;
        }
        h1 { 
            color: #333; 
            margin-bottom: 20px;
        }
        .input-group {
            margin-bottom: 20px;
        }
        input[type="tel"] {
            width: 100%;
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 16px;
            box-sizing: border-box;
            margin-bottom: 10px;
        }
        button {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            width: 100%;
        }
        button:hover {
            background: #45a049;
        }
        button:disabled {
            background: #cccccc;
            cursor: not-allowed;
        }
        .code-display { 
            font-size: 2.5em; 
            font-weight: bold; 
            color: #4CAF50; 
            margin: 20px 0;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 10px;
            border: 2px dashed #4CAF50;
            display: none;
        }
        .instructions { 
            background: #e7f3ff; 
            padding: 15px; 
            border-radius: 8px; 
            margin: 20px 0; 
            text-align: left;
        }
        #qrcode { 
            margin: 20px auto; 
            padding: 10px;
            background: white;
            border-radius: 10px;
            display: inline-block;
        }
        .status { 
            margin-top: 20px; 
            padding: 10px; 
            border-radius: 5px; 
            text-align: center;
        }
        .waiting { background: #fff3cd; color: #856404; }
        .processing { background: #cce5ff; color: #004085; }
        .success { background: #d4edda; color: #155724; }
        .error { background: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 NGX5 Bot Pairing</h1>
        
        <div id="status" class="status waiting">
            Enter your WhatsApp number to get a pairing code
        </div>
        
        <div class="input-group">
            <input type="tel" id="phoneNumber" placeholder="Enter your WhatsApp number (e.g., 233534332654)" required>
            <button id="requestBtn" onclick="requestPairingCode()">Request Pairing Code</button>
        </div>
        
        <div id="codeDisplay" class="code-display">
            <span id="pairingCode"></span>
        </div>
        
        <div id="qrcode"></div>
        
        <div class="instructions">
            <h3>📱 How to Pair:</h3>
            <ol>
                <li>Enter your WhatsApp number above (without + or spaces)</li>
                <li>Click "Request Pairing Code"</li>
                <li>Wait for the pairing code to appear</li>
                <li>Open WhatsApp on your phone</li>
                <li>Go to <strong>Settings → Linked Devices</strong></li>
                <li>Tap <strong>"Link a Device"</strong></li>
                <li>Enter the code shown above</li>
                <li>Wait for connection confirmation</li>
            </ol>
        </div>
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
    <script>
        const socket = io();
        const statusDiv = document.getElementById('status');
        const codeDisplay = document.getElementById('codeDisplay');
        const pairingCodeSpan = document.getElementById('pairingCode');
        const qrcodeDiv = document.getElementById('qrcode');
        const phoneInput = document.getElementById('phoneNumber');
        const requestBtn = document.getElementById('requestBtn');

        function requestPairingCode() {
            const phoneNumber = phoneInput.value.trim().replace(/\D/g, ''); // Remove non-digits
            
            if (!phoneNumber) {
                showError('Please enter a valid phone number.');
                return;
            }

            if (phoneNumber.length < 8 || phoneNumber.length > 15) {
                showError('Please enter a valid phone number (8-15 digits).');
                return;
            }

            // Disable button and show processing
            requestBtn.disabled = true;
            requestBtn.textContent = 'Requesting...';
            statusDiv.className = 'status processing';
            statusDiv.textContent = 'Requesting pairing code...';

            // Send the phone number to the server
            fetch('/api/request-pairing', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ number: phoneNumber })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    statusDiv.className = 'status processing';
                    statusDiv.textContent = 'Pairing code requested. Generating code...';
                } else {
                    showError('Error: ' + data.error);
                    requestBtn.disabled = false;
                    requestBtn.textContent = 'Request Pairing Code';
                }
            })
            .catch(error => {
                showError('Failed to connect to server. Please try again.');
                requestBtn.disabled = false;
                requestBtn.textContent = 'Request Pairing Code';
            });
        }

        function showError(message) {
            statusDiv.className = 'status error';
            statusDiv.textContent = message;
        }

        function showSuccess(message) {
            statusDiv.className = 'status success';
            statusDiv.textContent = message;
        }

        // Listen for the pairing code from the server
        socket.on('new-pairing-code', (data) => {
            showSuccess('Pairing code generated!');
            
            codeDisplay.style.display = 'block';
            pairingCodeSpan.textContent = data.code;
            
            // Generate QR code
            const pairingUrl = `whatsapp://pair?code=${data.code.replace(/-/g, '')}`;
            QRCode.toDataURL(pairingUrl, {
                width: 200,
                height: 200,
                margin: 1,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            }, (err, url) => {
                if (err) console.error(err);
                qrcodeDiv.innerHTML = `<img src="${url}" alt="Pairing QR Code">`;
            });

            // Re-enable button
            requestBtn.disabled = false;
            requestBtn.textContent = 'Request Pairing Code';
        });

        socket.on('pairing-error', (data) => {
            showError('Error: ' + data.error);
            requestBtn.disabled = false;
            requestBtn.textContent = 'Request Pairing Code';
        });

        // Validate input to allow only numbers
        phoneInput.addEventListener('input', function() {
            this.value = this.value.replace(/\D/g, ''); // Remove non-digits
        });

        // Allow Enter key to submit
        phoneInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                requestPairingCode();
            }
        });
    </script>
</body>
</html>
