# AudioLens PWA

Context-aware reading assistant for visually impaired users.
Built as part of CM3070 Final Project.

## Architecture

```
User captures image (phone camera)
        ↓
  [1] Classify → DIT-base (HF Space)
  [2] OCR → EasyOCR (HF Space)
  [3] Contextualise → Gemini Flash (server-side proxy)
  [4] Speak → Kokoro TTS (HF Space)
        ↓
Audio summary auto-plays
```

## Setup

```bash
# install dependencies
npm install

# create env file with your gemini key
cp .env.example .env.local
# edit .env.local and add your GEMINI_API_KEY

# run dev server
npm run dev
```

Open `http://localhost:3000` on your phone (same wifi network).

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to vercel.com → New Project → Import your repo
3. Add environment variable: `GEMINI_API_KEY` = your key
4. Deploy

## Backend

The HF Space backend runs at:
`https://vaibreact-audiolens-backend.hf.space`

Endpoints (via Gradio API):
- `/call/classify` — document type classification
- `/call/ocr` — text extraction
- `/call/speak` — text to speech
- `/call/health` — health check
