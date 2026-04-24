console.log("=== BOT CRISBOT V2 START ===")

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const pino = require('pino')
const qrcode = require('qrcode-terminal')
const express = require('express')
const fs = require('fs')

async function connectToWhatsApp() {
    // HAPUS SESSION KALO ADA TAPI INVALID
    const { state: checkState } = await useMultiFileAuthState('sessions')
    if (!checkState.creds.registered && fs.existsSync('./sessions')) {
        fs.rmSync('./sessions', { recursive: true, force: true })
        console.log(">>> SESSION INVALID DIHAPUS - QR BAKAL MUNCUL")
    }

    // BIKIN STATE BARU SETELAH DIHAPUS
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
            console.log('>>> KONEKSI PUTUS. Code:', reason)

            if (reason === 405) {
                console.log('>>> ERROR 405: SESSION BENTROK. HAPUS MANUAL...')
                if (fs.existsSync('./sessions')) {
                    fs.rmSync('./sessions', { recursive: true, force: true })
                }
            }

            if (reason!== DisconnectReason.loggedOut) {
                console.log('>>> RECONNECT DALAM 5 DETIK...')
                setTimeout(connectToWhatsApp, 5000)
            } else {
                console.log('>>> LOGOUT. SCAN QR LAGI BUAT LOGIN')
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
