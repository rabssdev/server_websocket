import librosa
import asyncio
import websockets
from flask import Flask, request
from pydub import AudioSegment
import numpy as np
import os
import subprocess

app = Flask(__name__)

# Vérifier si ffmpeg est installé
def check_ffmpeg():
    try:
        subprocess.run(["ffmpeg", "-version"], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        print("✅ ffmpeg est installé et accessible.")
    except Exception as e:
        print("❌ ffmpeg n'est pas installé ou accessible. Veuillez l'installer et l'ajouter à votre PATH.")
        exit(1)

# Charger la musique et extraire le tempo
def get_tempo(file_path):
    try:
        audio = AudioSegment.from_file(file_path)
        y = np.array(audio.get_array_of_samples()).astype(np.float32) / 32768.0  # Convertir en float32
        sr = audio.frame_rate
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
        return tempo
    except Exception as e:
        print(f"❌ Erreur lors de l'analyse du fichier : {e}")
        return None

# Endpoint pour recevoir le fichier
@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return "Aucun fichier reçu", 400
    file = request.files['file']
    file_path = os.path.join(os.getcwd(), "music.mp3")
    file.save(file_path)
    print(f"🎵 Fichier reçu, analyse en cours... Chemin du fichier : {file_path}")

    # Vérifier si le fichier a été correctement sauvegardé
    if not os.path.exists(file_path):
        print("❌ Le fichier n'a pas été sauvegardé correctement.")
        return "Erreur lors de la sauvegarde du fichier", 500

    # Démarrer l'analyse et l'envoi WebSocket
    asyncio.run(send_tempo(file_path))
    return "Fichier reçu et analyse en cours...", 200

# WebSocket vers Node.js
async def send_tempo(file_path):
    tempo = get_tempo(file_path)
    if tempo is None:
        return

    print(f"🔊 Tempo détecté : {tempo} BPM")

    async with websockets.connect("ws://localhost:3000") as websocket:
        await websocket.send(f'{{"tempo": {tempo}}}')
        print(f"📤 Tempo envoyé : {tempo} BPM")

# Lancer le serveur Flask
if __name__ == '__main__':
    check_ffmpeg()
    app.run(host="0.0.0.0", port=5000, debug=True)
