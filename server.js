// server.js
const WebSocket = require('ws');
const express = require('express');

const app = express();
const port = 3001;

// Servir la page HTML sur http://localhost:3001
app.use(express.static(__dirname));
app.listen(port, () => console.log(`📡 Serveur HTTP lancé sur http://localhost:${port}`));

// WebSocket Server sur ws://localhost:3000
const wss = new WebSocket.Server({ port: 3000 });
console.log(`✅ Serveur WebSocket démarré sur ws://localhost:3000`);

wss.on('connection', ws => {
    console.log("💻 Client connecté");

    ws.on('message', message => {
        console.log(`📩 Message reçu : ${message}`);

        // Envoyer le message à tous les clients (y compris Unity)
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    ws.on('close', () => console.log("❌ Client déconnecté"));
});
