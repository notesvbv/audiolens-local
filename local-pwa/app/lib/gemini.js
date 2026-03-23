/**
 * audiolens — gemini client helper
 *
 * calls our own /api/gemini server route which proxies to
 * google's gemini flash api. this keeps the api key server-side.
 *
 * the llm adds contextual understanding on top of raw ocr text.
 * for example, if the doc type is "invoice" and the ocr text
 * contains line items, gemini summarises it in a user-friendly way.
 */

/**
 * sends raw ocr text + doc type to gemini for contextual summary.
 * @param {string} text — raw ocr text from easyocr
 * @param {string} docType — classification result (e.g. 'invoice', 'letter')
 * @returns {Promise<string>} — contextual summary for tts
 */
export async function contextualise(text, docType) {
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, docType }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'gemini request failed');
  }

  const data = await response.json();
  return data.summary;
}
