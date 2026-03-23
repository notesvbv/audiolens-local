'use client';

/**
 * audiolens — main page
 *
 * orchestrates the full pipeline:
 * 1. user captures/uploads a document image
 * 2. classify — identifies document type via dit-base
 * 3. ocr — extracts text via easyocr
 * 4. contextualise — gemini flash summarises for spoken output
 * 5. speak — kokoro converts summary to speech
 * 6. auto-plays the audio result
 *
 * all steps are announced to screen readers.
 */

import { useState, useCallback } from 'react';
import Camera from './components/Camera';
import StatusBar from './components/StatusBar';
import ResultsPanel from './components/ResultsPanel';
import { classify, ocr, speak } from './lib/gradio';
import { contextualise } from './lib/gemini';
import { announce } from './lib/announce';

export default function Home() {
  const [step, setStep]       = useState(null);
  const [error, setError]     = useState(null);
  const [results, setResults] = useState(null);
  const [processing, setProcessing] = useState(false);

  // -- run the full pipeline when an image is captured --
  const handleCapture = useCallback(async (imageBlob) => {
    setProcessing(true);
    setError(null);
    setResults(null);

    try {
      // step 1: classify
      setStep('classify');
      announce('Classifying document type');
      const classifyResult = await classify(imageBlob);

      if (classifyResult.error) {
        throw new Error(classifyResult.error);
      }

      const docType    = classifyResult.doc_type;
      const confidence = classifyResult.confidence;

      announce(`Document classified as ${docType.replace(/_/g, ' ')}`);

      // step 2: ocr
      setStep('ocr');
      announce('Reading text from document');
      const rawText = await ocr(imageBlob);

      if (!rawText || rawText.startsWith('error:')) {
        throw new Error(rawText || 'ocr returned no text');
      }

      announce('Text extracted. Now understanding the content.');

      // step 3: contextualise via gemini
      setStep('contextualise');
      announce('Understanding document content');
      let summary;
      try {
        summary = await contextualise(rawText, docType);
      } catch (geminiErr) {
        // if gemini fails, fall back to raw text
        console.warn('gemini failed, using raw text:', geminiErr);
        summary = rawText;
      }

      // step 4: speak
      setStep('speak');
      announce('Generating audio. Your summary will play shortly.');
      const audioData = await speak(summary);

      // extract the audio url from gradio response
      let audioUrl = null;
      if (audioData) {
        audioUrl = audioData.url || audioData;
      }

      // done — show results
      setStep(null);
      setResults({
        docType,
        confidence,
        rawText,
        summary,
        audioUrl,
      });
      announce('Processing complete. Audio summary is now playing.');

    } catch (err) {
      console.error('pipeline error:', err);
      setStep(null);
      setError(err.message || 'something went wrong. please try again.');
      announce(`Error: ${err.message || 'something went wrong'}`);
    } finally {
      setProcessing(false);
    }
  }, []);

  // -- reset everything for a new scan --
  const handleReset = useCallback(() => {
    setStep(null);
    setError(null);
    setResults(null);
    setProcessing(false);
    announce('Ready to scan a new document.');
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center safe-area-inset">
      {/* -- header -- */}
      <header className="w-full max-w-sm mx-auto px-4 pt-12 pb-6 text-center">
        <h1 className="text-mobile-2xl font-bold text-al-text tracking-tight">
          Audio<span className="text-al-primary">Lens</span>
        </h1>
        <p className="text-mobile-sm text-al-muted mt-1">
          {results
            ? 'Here\'s what we found'
            : processing
              ? 'Processing your document...'
              : 'Point your camera at any document'}
        </p>
      </header>

      {/* -- main content -- */}
      <div className="flex-1 w-full flex flex-col items-center justify-start gap-5 pb-8">
        {/* camera — hidden when showing results */}
        {!results && (
          <Camera onCapture={handleCapture} disabled={processing} />
        )}

        {/* status bar — visible during processing */}
        <StatusBar currentStep={step} error={error} />

        {/* results panel — visible after processing */}
        <ResultsPanel results={results} onPlayAgain={handleReset} />
      </div>

      {/* -- footer -- */}
      <footer className="w-full text-center py-4 text-mobile-sm text-al-muted/50">
        AudioLens • CM3070 Final Project
      </footer>
    </div>
  );
}
