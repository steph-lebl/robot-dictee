const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');
const path = require('path');

const client = new textToSpeech.TextToSpeechClient();

const word = 'brouillon';
const outputDir = path.join(__dirname, 'audio', 'test-brouillon');
fs.mkdirSync(outputDir, { recursive: true });

const voices = [
  { name: 'fr-CA-Standard-A', label: 'standard-a' },
  { name: 'fr-CA-Standard-C', label: 'standard-c' },
  { name: 'fr-CA-Wavenet-A', label: 'wavenet-a' },
  { name: 'fr-CA-Wavenet-C', label: 'wavenet-c' },
  { name: 'fr-CA-Neural2-A', label: 'neural2-a' },
  { name: 'fr-CA-Neural2-C', label: 'neural2-c' },
  { name: 'fr-CA-Journey-F', label: 'journey-f' },
  { name: 'fr-CA-Journey-D', label: 'journey-d' },
  { name: 'fr-CA-Studio-O', label: 'studio-o' },
];

async function main() {
  for (const voice of voices) {
    try {
      const request = {
        input: { text: word },
        voice: { languageCode: 'fr-CA', name: voice.name },
        audioConfig: { audioEncoding: 'MP3', speakingRate: 0.85 },
      };

      const [response] = await client.synthesizeSpeech(request);
      const filePath = path.join(outputDir, `${word}-${voice.label}.mp3`);
      fs.writeFileSync(filePath, response.audioContent, 'binary');
      console.log(`OK  ${voice.name} -> ${voice.label}.mp3`);
    } catch (err) {
      console.log(`FAIL ${voice.name} -> ${err.message.split('\n')[0]}`);
    }
  }

  console.log(`\nFichiers générés dans: audio/test-brouillon/`);
}

main().catch(console.error);
