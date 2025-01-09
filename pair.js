const express = require('express');
const fs = require('fs-extra');
const { exec } = require("child_process");
let router = express.Router();
const pino = require("pino");
const { Boom } = require("@hapi/boom");
const MESSAGE = process.env.MESSAGE || `
*SESSION GENERATED SUCCESSFULY* ✅

*꧁༺ӄɨռɢ ʝօɦǟռ༻꧂🗽⃢⃢🗿* 🌟
https://github.com/Johanlieb34/KIWIMD

*꧁༺ӄɨռɢ ʝօɦǟռ༻꧂🗽⃢⃢🗿* 💭
https://t.me/johanlieb35
https://whatsapp.com/channel/0029Vail87sIyPtQoZ2egl1h

*Yᴏᴜ-ᴛᴜʙᴇ ᴛᴜᴛᴏʀɪᴀʟꜱ* 🎉
https://youtube.com/@almightyk1ngj0han
*KWI💕-MD--WHATTSAPP-BOT* 🍼
`;

const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers,
    DisconnectReason
} = require("@whiskeysockets/baileys");

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
                browser: Browsers.macOS("Safari"),
            });

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
                        if (fs.existsSync('./auth_info_baileys/creds.json')) {
                            const creds = fs.readFileSync('./auth_info_baileys/creds.json', 'utf-8');
                            let user = Smd.user.id;

                            // Define the initial message with the links and text
                            const initialMessage = `
*SESSION GENERATED SUCCESSFULY* ✅

*꧁༺ӄɨռɢ ʝօɦǟռ༻꧂🗽⃢⃢🗿* 🌟
https://github.com/Johanlieb34/TojiMd

*꧁༺ӄɨռɢ ʝօɦǟռ༻꧂🗽⃢⃢🗿* 💭
https://t.me/johanlieb35
https://whatsapp.com/channel/0029Vail87sIyPtQoZ2egl1h

*Yᴏᴜ-ᴛᴜʙᴇ ᴛᴜᴛᴏʀɪᴀʟꜱ* 🎉
https://youtube.com/@almightyk1ngj0han
*TOJI-MD--WHATTSAPP-BOT* 🍼
`;

                            // Send the initial message to the user
                            let msgsss = await Smd.sendMessage(user, { text: initialMessage });

                            // Wait for a moment before sending the creds content
                            await delay(1000);

                            // Now send the creds.json content in a separate message
                            await Smd.sendMessage(user, { text: creds });

                            await delay(1000);
                            try { await fs.emptyDirSync(__dirname + '/auth_info_baileys'); } catch (e) {}
                        }

                    } catch (e) {
                        console.log("Error during message send: ", e);
                    }

                    await delay(100);
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
            console.log("Error in SUHAIL function: ", err);
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
