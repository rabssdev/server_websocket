const WebSocket = require('ws');
const express = require('express');

const app = express();
const port = 3001;

// Servir la page HTML
app.use(express.static(__dirname));
app.listen(port, () => console.log(`📡 Serveur HTTP sur http://localhost:${port}`));

// Serveur WebSocket
const wss = new WebSocket.Server({ port: 3000 });
console.log(`✅ WebSocket DMX sur ws://localhost:3000`);

let dmxData = new Array(512).fill(0); // Canaux DMX

wss.on('connection', ws => {
    console.log("💻 Client connecté");
    ws.send(JSON.stringify({ channels: dmxData }));

    ws.on('message', async message => {
        try {
            const receivedData = JSON.parse(message);

            if (receivedData.tempo) {
                console.log(`🔊 Tempo reçu : ${receivedData.tempo} BPM`);
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ tempo: receivedData.tempo }));
                    }
                });
            }

            if (receivedData.channels) {
                let hasChanges = false;
                const changes = {};

                for (const [channel, value] of Object.entries(receivedData.channels)) {
                    const channelIndex = parseInt(channel, 10);
                    if (channelIndex >= 0 && channelIndex < 512 && dmxData[channelIndex] !== value) {
                        console.log(`🔄 Canal ${channelIndex} : ${dmxData[channelIndex]} ➝ ${value}`);
                        dmxData[channelIndex] = value;
                        changes[channelIndex] = value;
                        hasChanges = true;
                    }
                }

                if (hasChanges) {
                    wss.clients.forEach(client => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({ changes }));
                        }
                    });
                    console.log("📤 Mise à jour DMX :", changes);

                    // Poster sur http://localhost:3001
                    try {
                        const fetch = (await import('node-fetch')).default;
                        await fetch('http://localhost:3001', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ changes })
                        });
                        console.log("📨 Post envoyé à localhost:3001");
                    } catch (err) {
                        console.error("❌ Erreur d'envoi POST :", err);
                    }
                }
            }
        } catch (error) {
            console.error("❌ Erreur de parsing :", error);
        }
    });

    ws.on('close', () => console.log("❌ Client déconnecté"));
});
