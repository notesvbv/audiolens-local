/**
 * audiolens — gradio client wrapper (LOCAL)
 *
 * connects to the LOCAL hf backend running on mac at localhost:7860
 */

import { Client } from '@gradio/client';

const HF_SPACE = 'http://localhost:7860';

let clientInstance = null;

async function getClient() {
  if (!clientInstance) {
    clientInstance = await Client.connect(HF_SPACE);
  }
  return clientInstance;
}

export class QuotaError extends Error {
  constructor(message) {
    super(message);
    this.name = 'QuotaError';
  }
}

function checkQuota(err) {
  const msg = (err?.message || err?.toString() || '').toLowerCase();
  if (
    msg.includes('gpu quota') ||
    msg.includes('quota exceeded') ||
    msg.includes('exceeded your gpu') ||
    msg.includes('cuda error')
  ) {
    throw new QuotaError('gpu quota exceeded');
  }
  throw err;
}

export async function classify(imageBlob) {
  const client = await getClient();
  try {
    const result = await client.predict('/classify', { image: imageBlob });
    return result.data[0];
  } catch (err) {
    checkQuota(err);
  }
}

export async function ocr(imageBlob) {
  const client = await getClient();
  const result = await client.predict('/ocr', { image: imageBlob });
  return result.data[0];
}

export async function speak(text, voice = 'bf_emma') {
  const client = await getClient();
  try {
    const result = await client.predict('/speak', { text, voice });
    return result.data[0];
  } catch (err) {
    checkQuota(err);
  }
}

export async function health() {
  const client = await getClient();
  const result = await client.predict('/health', {});
  return result.data[0];
}