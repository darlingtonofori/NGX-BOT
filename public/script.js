// public/script.js
async function requestPairingCode() {
    const phoneNumber = document.getElementById('phoneNumber').value;
    const pairButton = document.getElementById('pairButton');
    const resultDiv = document.getElementById('result');
    const errorDiv = document.getElementById('error');
    
    // Basic validation
    if (!phoneNumber) {
        showError('Please enter your phone number');
        return;
    }
    
    // Clear previous results
    resultDiv.classList.add('hidden');
    errorDiv.classList.add('hidden');
    
    // Show loading state
    pairButton.disabled = true;
    pairButton.textContent = 'Generating Code...';
    
    try {
        const response = await fetch('/pair', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ number: phoneNumber })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Show pairing code
            document.getElementById('pairingCodeDisplay').textContent = data.pairingCode;
            resultDiv.classList.remove('hidden');
        } else {
            showError(data.error || 'Failed to generate pairing code');
        }
    } catch (error) {
        showError('Network error. Please try again.');
        console.error('Error:', error);
    } finally {
        // Reset button
        pairButton.disabled = false;
        pairButton.textContent = 'Generate Pairing Code';
    }
}

function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
}
