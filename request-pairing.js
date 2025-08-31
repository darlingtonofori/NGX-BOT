// request-pairing.js
const { requestPairingCode } = require("./index");

const phoneNumber = process.argv[2];

if (!phoneNumber) {
    console.log("Please provide a phone number with country code.");
    console.log("Example: node request-pairing.js 916909137213");
    process.exit(1);
}

requestPairingCode(phoneNumber).then(code => {
    if (!code) {
        console.log("Failed to get pairing code. Please try again.");
        process.exit(1);
    }
});
