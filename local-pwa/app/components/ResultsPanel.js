'use client';

/**
 * audiolens — results panel component
 *
 * displays the pipeline results after processing completes.
 * auto-plays the audio summary for hands-free accessibility.
 * shows doc type, confidence, raw text, contextual summary.
 */

import { useRef, useEffect, useState } from 'react';

export default function ResultsPanel({ results, onPlayAgain }) {
  const audioRef = useRef(null);
  const [audioReady, setAudioReady] = useState(false);
  const [isPlaying, setIsPlaying]   = useState(false);
  const [expanded, setExpanded]     = useState(false);

  const { docType, confidence, rawText, summary, audioUrl } = results || {};

  // -- auto-play audio when results arrive --
  useEffect(() => {
    if (audioUrl && audioRef.current) {
      setAudioReady(true);
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, [audioUrl]);

  if (!results) return null;

  const confidencePercent = Math.round((confidence || 0) * 100);

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto px-4 animate-slide-up">
      {/* -- doc type badge -- */}
      <div className="bg-al-surface border border-al-border rounded-xl p-4 mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-mobile-sm text-al-muted">Document type</span>
          <span className="text-mobile-sm text-al-muted">
            {confidencePercent}% confidence
          </span>
        </div>
        <p className="text-mobile-xl font-semibold text-al-primary capitalize">
          {docType?.replace(/_/g, ' ') || 'unknown'}
        </p>
      </div>

      {/* -- audio player -- */}
      {audioUrl && (
        <div className="bg-al-surface border border-al-border rounded-xl p-4 mb-3">
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            onError={() => setIsPlaying(false)}
            preload="auto"
          />

          <div className="flex items-center gap-3">
            <button
              onClick={handlePlayPause}
              aria-label={isPlaying ? 'Pause audio summary' : 'Play audio summary'}
              className="btn-ripple w-14 h-14 rounded-full
                bg-al-primary flex items-center justify-center
                flex-shrink-0 transition-all active:scale-90"
            >
              {isPlaying ? (
                <svg width="24" height="24" viewBox="0 0 24 24"
                  fill="white" aria-hidden="true">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24"
                  fill="white" aria-hidden="true">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              )}
            </button>

            <div className="flex-1 min-w-0">
              <p className="text-mobile-base font-medium text-al-text">
                Audio summary
              </p>
              <p className="text-mobile-sm text-al-muted">
                {isPlaying ? 'Playing...' : 'Tap to play'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* -- contextual summary -- */}
      {summary && (
        <div className="bg-al-surface border border-al-border rounded-xl p-4 mb-3">
          <p className="text-mobile-sm text-al-muted mb-2">Summary</p>
          <p className="text-mobile-base text-al-text leading-relaxed">
            {summary}
          </p>
        </div>
      )}

      {/* -- raw text (collapsible) -- */}
      {rawText && (
        <div className="bg-al-surface border border-al-border rounded-xl overflow-hidden mb-3">
          <button
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            aria-controls="raw-text-content"
            className="w-full px-4 py-3 flex items-center justify-between
              text-mobile-sm text-al-muted hover:text-al-text transition-colors"
          >
            <span>Raw OCR text</span>
            <svg
              width="20" height="20" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"
              className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
              aria-hidden="true"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {expanded && (
            <div
              id="raw-text-content"
              className="px-4 pb-4 border-t border-al-border/50 pt-3"
            >
              <p className="text-mobile-sm text-al-text/80 whitespace-pre-wrap break-words">
                {rawText}
              </p>
            </div>
          )}
        </div>
      )}

      {/* -- scan another -- */}
      <button
        onClick={onPlayAgain}
        aria-label="Scan another document"
        className="btn-ripple w-full h-touch-lg rounded-xl
          bg-al-primary/10 border border-al-primary/30
          text-mobile-base font-medium text-al-primary
          flex items-center justify-center gap-2
          transition-all active:scale-[0.98] mt-2"
      >
        <svg
          width="20" height="20" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
        Scan another document
      </button>
    </div>
  );
}
