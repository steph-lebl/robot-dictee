const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');
const path = require('path');

const client = new textToSpeech.TextToSpeechClient();

const words = ['salade', 'sec', 'sèche', 'secouer'];
const outputDir = path.join(__dirname, 'audio', 'theme-1-semaine-1');

async function generateAudio(word) {
  const request = {
    input: { text: word },
    voice: { languageCode: 'fr-CA', ssmlGender: 'FEMALE' },
    audioConfig: { audioEncoding: 'MP3', speakingRate: 0.85 },
  };

  const [response] = await client.synthesizeSpeech(request);

  const safeName = word.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const filePath = path.join(outputDir, `${safeName}.mp3`);
  fs.writeFileSync(filePath, response.audioContent, 'binary');
  console.log(`Generated: ${filePath}`);
}

async function main() {
  for (const word of words) {
    await generateAudio(word);
  }
  console.log('Done!');
}

main().catch(console.error);
