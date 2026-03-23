
# AudioLens Local

Local fallback setup for AudioLens — runs entirely on your machine when the cloud-deployed versions hit rate limits or GPU quota restrictions.

AudioLens is deployed on HuggingFace Spaces (backend) and Vercel (PWA). Both services have usage limits — HuggingFace imposes a daily ZeroGPU quota and the Gemini API has per-minute rate caps. When these limits are exceeded during testing, development, or demonstration, this local setup lets you continue working without interruption.

## When to Use This

- The HuggingFace Space returns a "GPU quota exceeded" error.
- The Gemini API returns a "RESOURCE_EXHAUSTED" or rate limit error.
- You need unlimited testing during development or evaluation.
- You want to demonstrate AudioLens without depending on external services.

## How to Run

Open two terminal windows:

**Terminal 1 — Backend:**
```bash
cd local-backend-huggingface
conda activate audiolens
python app.py
```
Runs at `http://localhost:7860`.

**Terminal 2 — PWA:**
```bash
cd local-pwa
npm install
cp .env.example .env.local   # add your GEMINI_API_KEY
npm run dev
```
Runs at `http://localhost:3001`. To test on your phone, open `http://YOUR_MACHINE_IP:3001` on the same WiFi network.

## Differences from Deployed Versions

- **Backend:** Uses MPS (Apple Silicon) or CPU instead of CUDA. No GPU quota limits.
- **PWA:** Identical functionality but points to `localhost:7860` instead of the HuggingFace Space. Runs on port 3001 to avoid conflicts with the cloud PWA.
- **Gemini API:** Still calls the external Gemini API for contextual summarisation. If Gemini is also rate-limited, the PWA falls back to raw OCR text with browser text-to-speech.
