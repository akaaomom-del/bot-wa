const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const pino = require('pino')
const qrcode = require('qrcode-terminal')

async function start() {
    const { state, saveCreds } = await useMultiFileAuthState('session')
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: false,
        browser: ['Mac OS', 'Chrome', '110.0.0']
    })

    sock.ev.on('creds.update', saveCreds)
    sock.ev.on('connection.update', (u) => {
        const { connection, lastDisconnect, qr } = u
        if(qr) {
            console.clear()
            console.log('SCAN QR DIBAWAH INI PAKE WA NOMOR 6285881910311:')
            qrcode.generate(qr, {small: true})
        }
        if(connection === 'open') console.log('BOT UDAH NYAMBUNG BRO!')
        if(connection === 'close') {
            if(lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) start()
        }
    })
}
start()
