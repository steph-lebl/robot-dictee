# Product Requirements Document: Robot Dictee

## 1. Overview

**Product Name:** Robot Dictee
**Author:** Stephane Leblanc
**License:** MIT (2021)
**Live URL:** https://steph-lebl.github.io/robot-dictee/

Robot Dictee is a client-side Progressive Web Application (PWA) that enables autonomous French dictation practice with real-time automatic correction. Users listen to words spoken aloud via text-to-speech, type what they hear, and receive immediate visual feedback on spelling accuracy.

## 2. Problem Statement

Students learning French spelling need a way to practice dictation exercises independently, without requiring a teacher or parent to read text aloud and manually check answers. Traditional dictation practice depends on another person being available, limiting how often students can practice.

## 3. Target Users

- French language students (primarily elementary/secondary level)
- Self-directed learners practicing French spelling and phonetics
- Parents/teachers looking for an autonomous practice tool for students

## 4. Goals & Success Metrics

| Goal | Metric |
|------|--------|
| Enable autonomous dictation practice | Users can complete full dictation sessions without external help |
| Provide immediate feedback | Mistakes are highlighted in real-time as words are typed |
| Support mobile usage | App is installable as a PWA on iOS and Android |
| Cover curriculum-aligned content | 23 predefined dictations organized by theme and week |

## 5. Features

### 5.1 Dictation Selection

- **Predefined Dictations:** Library of 23 lesson sets organized across 6 themes (phonetic patterns, adjectives, verbs, consonants, vowel combinations, nasal sounds), each containing 15-25 words
- **Custom Dictations:** Users can input their own text to create a personalized dictation exercise
- Entry point is the "New Dictation" page displayed on launch

### 5.2 Active Dictation Session

- **Text-to-Speech Playback:** On starting a dictation, the first 5 words are spoken aloud in Canadian French (`fr-CA`) at a reduced speech rate (0.6x) for clarity
- **Word-by-Word Input:** Users type one word at a time; pressing space or enter commits the current word and advances
- **Rolling Audio Segments:** Each word triggers playback of the next 5-word window, providing continuous context
- **Repeat Functionality:** A "Repeat" button (or pressing Enter on an empty input) replays the current segment
- **Punctuation Pronunciation:** Punctuation marks are spoken by name in French (e.g., `.` becomes "point", `?` becomes "point d'interrogation", `,` becomes "virgule")

### 5.3 Real-Time Correction & Feedback

- **Color-Coded Results:**
  - Correct words displayed in green
  - Mistakes displayed in a highlighted box showing expected (green) vs. actual (red) text
- **Performance Summary:** On completion, displays whether no mistakes were made or the average number of words per mistake
- **Immediate Validation:** Each word is validated the moment it is committed (on space/enter)

### 5.4 Text Normalization

Input text is normalized before creating a dictation:
- Whitespace trimming and collapsing (multiple spaces, double newlines)
- Apostrophe and quote normalization (smart quotes to straight quotes)
- Em-dash replacement with hyphens
- Ellipsis character replacement with three dots

### 5.5 Progressive Web App

- Installable on mobile devices (fullscreen display mode)
- PWA manifest with app name, icon (64x64), and start URL
- Installation instructions provided for iOS (Safari) and Android (Chrome)

### 5.6 Information Pages

- **Mobile How-To:** Step-by-step instructions for installing the PWA on iOS and Android
- **About:** Credits for design, QA, and icon sources

## 6. Architecture & Tech Stack

### 6.1 Architecture Pattern

MVVM (Model-View-ViewModel) using Knockout.js for reactive data binding.

### 6.2 Technology

| Layer | Technology |
|-------|-----------|
| View | HTML5, CSS3, Knockout.js data-binding directives |
| ViewModel | Knockout.js observables and computed properties (`viewModel.js`) |
| Model | Vanilla JavaScript modules (`model/` directory) |
| Text-to-Speech | Web Speech API (`SpeechSynthesisUtterance`) |
| Array Operations | LINQ.js |
| Testing | Jasmine 3.6.0 |

### 6.3 Dependencies (CDN)

- Knockout.js v3.5.1 (CloudFlare CDN)
- LINQ.js v2.2.0.2 (CloudFlare CDN)
- PWA Compat polyfill (jsDelivr)

### 6.4 Key Characteristics

- No build process - pure client-side JavaScript
- No backend or database - entirely static
- IIFE module pattern for namespace encapsulation
- No transpiler or bundler required

## 7. Data Models

### 7.1 Dictation

Top-level orchestrator that parses input text and manages session state.

| Property | Type | Description |
|----------|------|-------------|
| paragraphs | Paragraph[] | Parsed paragraph objects |
| isStarted | Computed Boolean | True when currentWordIndex > 0 |
| isFinished | Computed Boolean | True when all words are committed |
| noMistakes | Computed Boolean | True when zero errors in session |
| avgNumOfWordsForOneMistake | Number | Performance metric |

### 7.2 Paragraph

Container that splits text into segments based on punctuation delimiters.

### 7.3 Segment

A clause or sentence delimited by punctuation (`.`, `?`, `!`, `,`). Responsible for generating rolling 5-word audio windows.

### 7.4 Word

| Property | Type | Description |
|----------|------|-------------|
| expected | String | The correct spelling |
| actual | Observable String | What the user typed |
| isCommitted | Computed Boolean | Whether the word has been submitted |
| isMistake | Computed Boolean | Whether actual !== expected |
| segmentToSay | String | Next 5 words with pronounced punctuation |
| sizeOfSegmentToSay | Number | Word count in the segment to speak |

## 8. User Flows

### 8.1 Primary Flow: Complete a Dictation

1. User opens the app (lands on "New Dictation" page)
2. User selects a predefined dictation or enters custom text
3. User clicks "Start" to begin the session
4. App speaks the first 5 words aloud
5. User types the first word and presses space
6. App validates the word, displays color-coded feedback, and speaks the next segment
7. User continues typing words until all words are completed
8. App displays performance summary (no mistakes or mistake ratio)

### 8.2 Secondary Flow: Repeat Audio

1. During an active dictation, user clicks "Repeat" or presses Enter with an empty input
2. App replays the current 5-word segment

### 8.3 Secondary Flow: Install as PWA

1. User navigates to the "Mobile How-To" page
2. User follows platform-specific instructions to add the app to their home screen

## 9. Configuration

Configurable elements in `model/config.js`:

- **Segment delimiters:** Characters that split text into segments (`. ? ! ,`)
- **Punctuation pronunciation map:** Mapping of symbols to their spoken French equivalents (16 symbols supported including parentheses, brackets, braces, guillemets, dollar sign, etc.)

## 10. Test Coverage

Unit tests via Jasmine (`model/spec/`):

- **Dictation parsing tests (12):** Paragraph splitting, whitespace handling, empty paragraph filtering, segment delimiter recognition, special character normalization
- **Segment tests (7):** 5-word window generation, rolling segments, partial segments, symbol pronunciation, edge cases

## 11. Browser Compatibility

| Platform | Requirement |
|----------|------------|
| Desktop | Modern browsers with Web Speech API (Chrome, Firefox, Safari, Edge) |
| Mobile | iOS Safari, Chrome Android |
| APIs | Web Speech API (SpeechSynthesis) |
| JavaScript | ES5+ |

## 12. Constraints & Limitations

- **No persistence:** Progress and results are not saved between sessions
- **No user accounts:** No authentication or personalization
- **Browser-dependent TTS:** Voice quality and availability varies by browser and OS
- **Single language:** Hardcoded to Canadian French (`fr-CA`)
- **No offline support:** Depends on CDN for Knockout.js and LINQ.js (no service worker)
- **No analytics:** No tracking of long-term performance trends

## 13. Future Extension Opportunities

The current architecture supports the following potential enhancements:

- Additional languages (configurable TTS `lang` parameter)
- Custom pronunciation rules (extensible `config.js`)
- Additional predefined dictation sets (append to `predefinedDictations.js`)
- Alternative TTS engines (replaceable `speechSynthesisTextToSpeechEngine.js`)
- Difficulty levels (variable segment sizes)
- Progress persistence (local storage or backend integration)
- Performance analytics and history tracking
