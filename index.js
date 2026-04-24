console.log("=== BOT CRISBOT V2 START ===")

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const pino = require('pino')
const qrcode = require('qrcode-terminal')
const express = require('express')
const fs = require('fs')

if (fs.existsSync('./sessions')) {
    fs.rmSync('./sessions', { recursive: true, force: true })
    console.log(">>> SESSION LAMA DIHAPUS")
}

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('sessions')
    const sock = makeWASocket({
        logger: pino({ level: 'fatal' }),
        auth: state,
        browser: ['CrisBot', 'Chrome', '1.0.0'],
        printQRInTerminal: false,
        qrTimeout: 40000
    })

    sock.ev.on('creds.update', saveCreds)
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update
        if (qr) {
            console.log(">>> QR DITEMUKAN - SCAN SEKARANG <<<")
            console.log("SCAN QR DIBAWAH INI PAKAI WHATSAPP:")
            qrcode.generate(qr, { small: true })
        }
        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode
            console.log('>>> KONEKSI PUTUS. Reason:', reason)
            if (reason!== DisconnectReason.loggedOut) {
                console.log('>>> RECONNECT DALAM 3 DETIK...')
                setTimeout(connectToWhatsApp, 3000)
            } else {
                console.log('>>> LOGOUT. HAPUS SESSION MANUAL BUAT LOGIN LAGI')
            }
        } else if (connection === 'open') {
            console.log('>>> BOT BERHASIL NYAMBUNG KE WHATSAPP <<<')
        }
    })
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0]
        if (!msg.message || msg.key.fromMe) return
        const from = msg.key.remoteJid
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || ""
        if (text.toLowerCase() === 'ping') {
            await sock.sendMessage(from, { text: 'Pong! Bot aktif bro 🔥' })
        }
    })
}

const app = express()
const PORT = process.env.PORT || 10000
app.get('/', (req, res) => {
    res.json({ status: 'CrisBot V2 Running' })
})
app.listen(PORT, () => {
    console.log(`>>> SERVER JALAN DI PORT ${PORT} <<<`)
    connectToWhatsApp()
})
