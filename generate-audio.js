const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');
const path = require('path');

const client = new textToSpeech.TextToSpeechClient();

// Load predefined dictations
// Execute the IIFE with a mock global to extract the data
const mockGlobal = { robotDictee: {} };
const code = fs.readFileSync(path.join(__dirname, 'predefinedDictations.js'), 'utf8');
// The IIFE uses (this), so we need to call with the right `this` context
const fn = new Function(code);
fn.call(mockGlobal);
const dictations = mockGlobal.robotDictee.predefinedDictations;

function titleToFolder(title) {
  return title
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s*-\s*/g, '-')
    .replace(/\s+/g, '-');
}

function wordToFilename(word) {
  return word
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['']/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

async function generateAudio(word, outputDir) {
  const request = {
    input: { text: word },
    voice: { languageCode: 'fr-CA', ssmlGender: 'FEMALE' },
    audioConfig: { audioEncoding: 'MP3', speakingRate: 0.85 },
  };

  const [response] = await client.synthesizeSpeech(request);

  const safeName = wordToFilename(word);
  const filePath = path.join(outputDir, `${safeName}.mp3`);
  fs.writeFileSync(filePath, response.audioContent, 'binary');
  console.log(`  Generated: ${safeName}.mp3`);
  return { word, safeName, filePath };
}

async function main() {
  for (const dictation of dictations) {
    const folder = titleToFolder(dictation.title);
    const outputDir = path.join(__dirname, 'audio', folder);
    fs.mkdirSync(outputDir, { recursive: true });

    const words = dictation.text.split('\n').map(w => w.trim()).filter(Boolean);
    console.log(`\n${dictation.title} (${words.length} mots) -> audio/${folder}/`);

    const audioMap = {};
    for (const word of words) {
      const { safeName } = await generateAudio(word, outputDir);
      audioMap[word] = `audio/${folder}/${safeName}.mp3`;
    }

    dictation.audioMap = audioMap;
  }

  // Write updated predefinedDictations.js with audioMap entries
  const output = `(function (global) {
  global.robotDictee.predefinedDictations = ${JSON.stringify(dictations, null, 4)};
})(this)
`;
  fs.writeFileSync(path.join(__dirname, 'predefinedDictations.js'), output, 'utf8');
  console.log('\nUpdated predefinedDictations.js with audioMap entries.');
  console.log('Done!');
}

main().catch(console.error);
