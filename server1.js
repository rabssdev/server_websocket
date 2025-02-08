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

let dmxData = new Array(512).fill(0); // Initialisation du tableau DMX

wss.on('connection', ws => {
    console.log("💻 Client connecté");

    // Envoyer l'état actuel des canaux DMX au nouveau client
    ws.send(JSON.stringify(dmxData));

    ws.on('message', message => {
        try {
            const receivedDMX = JSON.parse(message);
            if (Array.isArray(receivedDMX) && receivedDMX.length === 512) {
                dmxData = receivedDMX;
                console.log("📩 Nouveau signal DMX reçu");

                // Diffuser le tableau DMX mis à jour à tous les clients
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify(dmxData));
                    }
                });
            }
        } catch (error) {
            console.error("❌ Erreur de parsing du message DMX :", error);
        }
    });

    ws.on('close', () => console.log("❌ Client déconnecté"));
});
