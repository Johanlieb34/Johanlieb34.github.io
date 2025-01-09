const express = require('express');
const fs = require('fs-extra');
const { exec } = require("child_process");
const pino = require("pino");
const { Boom } = require("@hapi/boom");
const { default: makeWASocket, useMultiFileAuthState, delay, makeCacheableSignalKeyStore, Browsers, DisconnectReason } = require("@whiskeysockets/baileys");

let router = express.Router();

const MESSAGE = `
*SESSION GENERATED SUCCESSFULLY* ✅

*꧁༺ӄɨռɢ ʝօɦǟռ༻꧂🗽⃢⃢🗿* 🌟
https://github.com/Johanlieb34/TojiMd

*꧁༺ӄɨռɢ ʝօɦǟռ༻꧂🗽⃢⃢🗿* 💭
https://t.me/johanlieb35
https://whatsapp.com/channel/0029Vail87sIyPtQoZ2egl1h

*Yᴏᴜ-ᴛᴜʙᴇ ᴛᴜᴛᴏʀɪᴀʟꜱ* 🎉
https://youtube.com/@almightyk1ngj0han
*TOJI-MD--WHATSAPP-BOT* 🍼
`;

router.get('/', async (req, res) => {
    const num = req.query.number.replace(/[^0-9]/g, '');

    async function initializeConnection() {
        const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');
        const Smd = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' })),
            },
            printQRInTerminal: false,
            logger: pino({ level: 'fatal' }),
            browser: Browsers.macOS('Safari'),
        });

        Smd.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === 'open') {
                try {
                    const creds = fs.readFileSync('./auth_info_baileys/creds.json', 'utf-8');
                    const user = Smd.user.id;

                    await Smd.sendMessage(user, { text: MESSAGE });
                    await delay(1000);
                    await Smd.sendMessage(user, { text: creds });

                    // Clear auth folder after sending creds
                    await fs.emptyDir('./auth_info_baileys');
                } catch (error) {
                    console.error('Error sending message:', error);
                }
            } else if (connection === 'close') {
                const reason = new Boom(lastDisconnect?.error)?.output.statusCode;
                if (reason === DisconnectReason.loggedOut) {
                    console.log('Logged out. Clearing session.');
                    await fs.emptyDir('./auth_info_baileys');
                }
            }
        });

        Smd.ev.on('creds.update', saveCreds);

        if (!Smd.authState.creds.registered) {
            const code = await Smd.requestPairingCode(num);
            if (!res.headersSent) {
                res.send({ code });
            }
        }
    }

    try {
        await initializeConnection();
    } catch (error) {
        console.error('Error initializing connection:', error);
        if (!res.headersSent) {
            res.send({ error: 'Failed to generate session. Try again later.' });
        }
    }
});

module.exports = router;
