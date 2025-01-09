const express = require('express');
const fs = require('fs-extra');
const { exec } = require("child_process");
const pino = require("pino");
const { Boom } = require("@hapi/boom");
const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    delay, 
    makeCacheableSignalKeyStore, 
    Browsers, 
    DisconnectReason 
} = require("@whiskeysockets/baileys");

let router = express.Router();

// Ensure auth info directory is empty if it exists
if (fs.existsSync('./auth_info_baileys')) {
    fs.emptyDirSync(__dirname + '/auth_info_baileys');
}

router.get('/', async (req, res) => {
    let num = req.query.number;

    async function SUHAIL() {
        const { state, saveCreds } = await useMultiFileAuthState(`./auth_info_baileys`);
        
        try {
            let Smd = makeWASocket({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
                },
                printQRInTerminal: false,
                logger: pino({ level: "fatal" }).child({ level: "fatal" }),
                browser: Browsers.ubuntu("Chrome"),
            });

            // If credentials are not registered, request pairing code
            if (!Smd.authState.creds.registered) {
                await delay(1500);
                num = num.replace(/[^0-9]/g, '');
                const code = await Smd.requestPairingCode(num);
                if (!res.headersSent) {
                    await res.send({ code });
                }
            }

            Smd.ev.on('creds.update', saveCreds);
            Smd.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect } = s;

                if (connection === "open") {
                    try {
                        await delay(10000);
                        const credsPath = './auth_info_baileys/creds.json';

                        if (fs.existsSync(credsPath)) {
                            const creds = fs.readFileSync(credsPath, 'utf-8');
                            let user = Smd.user.id;

                            try {
                                const parsedCreds = JSON.parse(creds);

                                // Check if creds are valid
                                if (parsedCreds.myAppStateKeyId && parsedCreds.lastAccountSyncTimestamp) {
                                    // Send creds along with image
                                    const imageLink = 'https://i.ibb.co/mykykgr/599055d0af0ce71e675a0c54176461fc.jpg';  // Replace with your actual image link
                                    await Smd.sendMessage(user, {
                                        image: { url: imageLink }, 
                                        caption: creds 
                                    });
                                    console.log("Credentials sent with image successfully!");
                                } else {
                                    console.log("Invalid credentials, skipping send.");
                                }
                            } catch (e) {
                                console.log("Error parsing credentials:", e);
                            }

                            // Clean up after sending
                            await delay(1000);
                            if (fs.existsSync(credsPath)) {
                                fs.emptyDirSync(__dirname + '/auth_info_baileys');
                            }
                        }
                    } catch (e) {
                        console.log("Error during message send:", e);
                    }

                    await delay(100);
                    // Empty the directory once everything is successfully handled
                    await fs.emptyDirSync(__dirname + '/auth_info_baileys');
                }

                if (connection === "close") {
                    let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
                    if (reason === DisconnectReason.connectionClosed) {
                        console.log("Connection closed!");
                    } else if (reason === DisconnectReason.connectionLost) {
                        console.log("Connection Lost from Server!");
                    } else if (reason === DisconnectReason.restartRequired) {
                        console.log("Restart Required, Restarting...");
                        SUHAIL().catch(err => console.log(err));
                    } else if (reason === DisconnectReason.timedOut) {
                        console.log("Connection TimedOut!");
                    } else {
                        console.log('Connection closed with bot. Please run again.');
                        console.log(reason);
                        await delay(5000);
                        exec('pm2 restart qasim');
                    }
                }
            });

        } catch (err) {
            console.log("Error in SUHAIL function:", err);
            exec('pm2 restart qasim');
            console.log("Service restarted due to error");
            SUHAIL();
            await fs.emptyDirSync(__dirname + '/auth_info_baileys');
            if (!res.headersSent) {
                await res.send({ code: "Try After Few Minutes" });
            }
        }
    }

    await SUHAIL();
});

module.exports = router;
