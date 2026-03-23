'use client';

/**
 * audiolens — camera component
 *
 * handles document image capture via phone camera or file upload.
 * mobile-first with large touch targets for accessibility.
 * uses rear camera by default (environment facing).
 */

import { useRef, useState, useCallback, useEffect } from 'react';

export default function Camera({ onCapture, disabled }) {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const fileRef   = useRef(null);

  const [stream, setStream]       = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [mode, setMode]           = useState('idle'); // idle | camera | preview
  const [previewUrl, setPreviewUrl] = useState(null);

  // -- start camera --
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width:  { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }

      setStream(mediaStream);
      setCameraReady(true);
      setMode('camera');
    } catch (err) {
      console.error('camera error:', err);
      setCameraError('could not access camera. please use file upload instead.');
      setMode('idle');
    }
  }, []);

  // -- stop camera --
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraReady(false);
  }, [stream]);

  // -- capture photo from video stream --
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video  = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setPreviewUrl(url);
          setMode('preview');
          stopCamera();
          onCapture(blob);
        }
      },
      'image/jpeg',
      0.9
    );
  }, [stopCamera, onCapture]);

  // -- handle file upload --
  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setMode('preview');
    stopCamera();
    onCapture(file);
  }, [stopCamera, onCapture]);

  // -- reset to idle --
  const reset = useCallback(() => {
    stopCamera();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setMode('idle');
    setCameraError(null);
  }, [stopCamera, previewUrl]);

  // -- cleanup on unmount --
  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, []);

  // -- idle state: big scan button --
  if (mode === 'idle') {
    return (
      <div className="flex flex-col items-center gap-5 w-full px-4">
        {/* main scan button */}
        <button
          onClick={startCamera}
          disabled={disabled}
          aria-label="Open camera to scan a document"
          className="btn-ripple w-full max-w-sm aspect-square rounded-2xl
            bg-gradient-to-br from-al-primary/20 to-al-accent/10
            border-2 border-al-primary/40 hover:border-al-primary/70
            flex flex-col items-center justify-center gap-4
            transition-all duration-300 active:scale-[0.97]
            disabled:opacity-40 disabled:pointer-events-none"
        >
          {/* camera icon */}
          <svg
            width="72" height="72" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round"
            className="text-al-primary"
            aria-hidden="true"
          >
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          <span className="text-mobile-xl font-semibold text-al-text">
            Scan Document
          </span>
          <span className="text-mobile-sm text-al-muted">
            tap to open camera
          </span>
        </button>

        {/* file upload alternative */}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={disabled}
          aria-label="Upload a document image from your phone"
          className="btn-ripple w-full max-w-sm h-touch-lg rounded-xl
            bg-al-surface border border-al-border
            flex items-center justify-center gap-3
            text-mobile-base text-al-muted hover:text-al-text
            transition-all duration-200 active:scale-[0.98]
            disabled:opacity-40 disabled:pointer-events-none"
        >
          <svg
            width="24" height="24" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Upload from gallery
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
          aria-hidden="true"
        />

        {cameraError && (
          <p role="alert" className="text-al-error text-mobile-sm text-center px-4">
            {cameraError}
          </p>
        )}
      </div>
    );
  }

  // -- camera viewfinder --
  if (mode === 'camera') {
    return (
      <div className="relative w-full max-w-sm mx-auto">
        <div className="viewfinder-frame rounded-2xl overflow-hidden bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full aspect-[3/4] object-cover"
            aria-label="Camera viewfinder. Point at document and tap capture."
          />
        </div>

        {/* capture button */}
        <div className="flex items-center justify-center gap-6 mt-5">
          <button
            onClick={reset}
            aria-label="Cancel and go back"
            className="btn-ripple w-14 h-14 rounded-full
              bg-al-surface border border-al-border
              flex items-center justify-center
              transition-all active:scale-95"
          >
            <svg
              width="24" height="24" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <button
            onClick={capturePhoto}
            disabled={!cameraReady}
            aria-label="Capture document photo"
            className="btn-ripple w-20 h-20 rounded-full
              bg-al-primary border-4 border-al-text/20
              flex items-center justify-center
              transition-all active:scale-90
              disabled:opacity-40"
          >
            <div className="w-14 h-14 rounded-full bg-white/90" />
          </button>

          {/* spacer for centering */}
          <div className="w-14 h-14" />
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  // -- preview state --
  if (mode === 'preview') {
    return (
      <div className="relative w-full max-w-sm mx-auto">
        <div className="rounded-2xl overflow-hidden border border-al-border">
          <img
            src={previewUrl}
            alt="Captured document preview"
            className="w-full aspect-[3/4] object-cover"
          />
        </div>

        {/* retake button */}
        {!disabled && (
          <div className="flex justify-center mt-4">
            <button
              onClick={reset}
              aria-label="Retake photo or scan another document"
              className="btn-ripple px-6 h-touch rounded-xl
                bg-al-surface border border-al-border
                text-mobile-base text-al-muted hover:text-al-text
                transition-all active:scale-[0.98]"
            >
              Scan another
            </button>
          </div>
        )}
      </div>
    );
  }

  return null;
}
