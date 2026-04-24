const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const pino = require('pino')
const qrcode = require('qrcode-terminal')
const express = require('express')

async function start() {
    const { state, saveCreds } = await useMultiFileAuthState('sessions')
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        browser: ['Chrome (Linux)', '', '']
    })

    sock.ev.on('creds.update', saveCreds)
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update
        if(qr) {
            console.log('SCAN QR DIBAWAH INI PAKAI WHATSAPP')
            qrcode.generate(qr, {small: true})
        }
        if(connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
            if(shouldReconnect) start()
        } else if(connection === 'open') {
            console.log('Bot nyambung bro!')
        }
    })
}

// Web server dummy biar Render Free gak error
const app = express()
const port = process.env.PORT || 10000
app.get('/', (req, res) => res.send('Bot WA Running!'))
app.listen(port, () => {
    console.log('Server jalan di port', port)
    start() // Panggil bot setelah server nyala
})
