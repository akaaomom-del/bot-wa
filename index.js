console.log("=== BOT MULAI JALAN ===")

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const pino = require('pino')
const qrcode = require('qrcode-terminal')
const express = require('express')

console.log("=== REQUIRE BERHASIL ===")

async function start() {
    try {
        console.log("=== FUNGSI START DIPANGGIL ===")
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
                console.log("=== QR CODE DITEMUKAN ===")
                console.log('SCAN QR DIBAWAH INI PAKAI WHATSAPP')
                qrcode.generate(qr, {small: true})
            }
            
            if(connection === 'close') {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
                console.log('Koneksi putus, reconnect:', shouldReconnect)
                if(shouldReconnect) start()
            } else if(connection === 'open') {
                console.log('=== BOT NYAMBUNG KE WA ===')
            }
        })
    } catch (err) {
        console.log("=== ERROR DI START ===", err)
    }
}

const app = express()
const port = process.env.PORT || 10000

app.get('/', (req, res) => {
    res.send('Bot WA Running!')
})

app.listen(port, () => {
    console.log('=== SERVER JALAN DI PORT', port, '===')
    start()
})

console.log("=== AKHIR FILE ===")
