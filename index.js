console.log("=== BOT CRISBOT V2 PAIRING ===")

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const pino = require('pino')
const express = require('express')

// NOMOR LU UDAH GUA MASUKIN
const PHONE_NUMBER = "6285881910311"

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('sessions')
    const sock = makeWASocket({
        logger: pino({ level: 'fatal' }),
        auth: state,
        printQRInTerminal: false,
        browser: ['Ubuntu', 'Chrome', '1.0.0']
    })

    // MINTA PAIRING CODE KALO BELUM LOGIN
    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(PHONE_NUMBER)
                console.log(">>> PAIRING CODE LU: " + code)
                console.log(">>> Buka WA > Titik 3 > Perangkat Tertaut > Tautkan dengan nomor telepon")
            } catch (e) {
                console.log(">>> GAGAL MINTA CODE:", e.message)
            }
        }, 3000)
    }

    sock.ev.on('creds.update', saveCreds)
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode
            console.log('>>> KONEKSI PUTUS. Code:', reason)
            if (reason!== DisconnectReason.loggedOut) {
                console.log('>>> RECONNECT DALAM 10 DETIK...')
                setTimeout(connectToWhatsApp, 10000)
            } else {
                console.log('>>> LOGOUT. RESTART SERVICE BUAT LOGIN LAGI')
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
app.get('/', (req, res) => res.json({ status: 'CrisBot Running' }))
app.listen(PORT, () => {
    console.log(`>>> SERVER JALAN DI PORT ${PORT} <<<`)
    connectToWhatsApp()
})
