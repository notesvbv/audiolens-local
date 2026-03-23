/**
 * audiolens — /api/gemini server route
 *
 * proxies requests to google gemini flash api.
 * the api key stays server-side in GEMINI_API_KEY env var.
 *
 * receives: { text: string, docType: string }
 * returns:  { summary: string }
 */

import { NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL   = 'gemini-2.0-flash';
const GEMINI_URL     = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

export async function POST(request) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'gemini api key not configured' },
        { status: 500 }
      );
    }

    const { text, docType } = await request.json();

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: 'no text provided' },
        { status: 400 }
      );
    }

    const systemPrompt = buildPrompt(text, docType);

    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: systemPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1024,
          topP: 0.8,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('gemini api error:', err);
      return NextResponse.json(
        { error: 'gemini api request failed' },
        { status: 502 }
      );
    }

    const data = await response.json();
    const summary = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!summary) {
      return NextResponse.json(
        { error: 'gemini returned empty response' },
        { status: 502 }
      );
    }

    return NextResponse.json({ summary });

  } catch (err) {
    console.error('gemini route error:', err);
    return NextResponse.json(
      { error: 'internal server error' },
      { status: 500 }
    );
  }
}

/**
 * builds the prompt for gemini based on document type and ocr text.
 * the prompt instructs gemini to produce a concise, spoken summary
 * optimised for text-to-speech output (no markdown, no bullet points).
 */
function buildPrompt(text, docType) {
  return `You are AudioLens, a reading assistant for visually impaired users.
The user has photographed a document. Your job is to read and summarise it
in a clear, natural, spoken style that will be converted to speech.

Document type detected: ${docType || 'unknown'}
Raw OCR text extracted from the image:
---
${text}
---

Instructions:
- Summarise the key information in plain, conversational English.
- Structure your response for listening, not reading.
  Use natural pauses and transitions, not bullet points or markdown.
- Start by stating what type of document this is.
- Highlight the most important details (amounts, dates, names, actions needed).
- If the text is messy or partially illegible, mention what you could read
  and note any parts that seem unclear.
- Keep the summary concise — ideally under 30 seconds when spoken aloud.
- Do NOT use any formatting like asterisks, hashes, or bullet points.
- Write as if you are speaking directly to the person.`;
}
