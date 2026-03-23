'use client';

/**
 * audiolens — status bar component
 *
 * shows the current pipeline step with visual + audio feedback.
 * each step is announced to screen readers via aria-live region.
 *
 * steps: classify → ocr → contextualise → speak
 */

const STEPS = [
  { key: 'classify',      label: 'Classifying',    icon: '🔍' },
  { key: 'ocr',           label: 'Reading text',   icon: '📝' },
  { key: 'contextualise', label: 'Understanding',  icon: '🧠' },
  { key: 'speak',         label: 'Generating audio', icon: '🔊' },
];

export default function StatusBar({ currentStep, error }) {
  if (!currentStep && !error) return null;

  const stepIndex = STEPS.findIndex(s => s.key === currentStep);

  return (
    <div
      className="w-full max-w-sm mx-auto px-4 animate-fade-in"
      role="status"
      aria-label={error ? `Error: ${error}` : `Processing: ${STEPS[stepIndex]?.label || ''}`}
    >
      {error ? (
        <div className="bg-al-error/10 border border-al-error/30 rounded-xl px-4 py-3">
          <p className="text-al-error text-mobile-sm text-center">{error}</p>
        </div>
      ) : (
        <div className="bg-al-surface border border-al-border rounded-xl px-4 py-3">
          {/* progress dots */}
          <div className="flex items-center justify-center gap-2 mb-3">
            {STEPS.map((step, i) => (
              <div key={step.key} className="flex items-center gap-2">
                <div
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    i < stepIndex
                      ? 'bg-al-success'
                      : i === stepIndex
                        ? 'bg-al-primary animate-pulse-slow'
                        : 'bg-al-border'
                  }`}
                  aria-hidden="true"
                />
                {i < STEPS.length - 1 && (
                  <div
                    className={`w-6 h-0.5 transition-all duration-300 ${
                      i < stepIndex ? 'bg-al-success' : 'bg-al-border'
                    }`}
                    aria-hidden="true"
                  />
                )}
              </div>
            ))}
          </div>

          {/* current step label */}
          <p className="text-center text-mobile-base status-processing">
            <span aria-hidden="true">{STEPS[stepIndex]?.icon} </span>
            {STEPS[stepIndex]?.label || 'Processing'}...
          </p>
        </div>
      )}
    </div>
  );
}
