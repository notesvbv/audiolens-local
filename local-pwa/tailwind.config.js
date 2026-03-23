/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        'al-bg':      '#0a0a0f',
        'al-surface': '#141420',
        'al-border':  '#2a2a3d',
        'al-primary': '#4a9eff',
        'al-accent':  '#22d3ee',
        'al-text':    '#f0f0f5',
        'al-muted':   '#8888a0',
        'al-success': '#34d399',
        'al-error':   '#f87171',
        'al-warning': '#fbbf24',
      },
      fontFamily: {
        display: ['"DM Sans"', 'system-ui', 'sans-serif'],
        body:    ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'mobile-sm':   ['1rem',   { lineHeight: '1.5' }],
        'mobile-base': ['1.125rem', { lineHeight: '1.6' }],
        'mobile-lg':   ['1.375rem', { lineHeight: '1.4' }],
        'mobile-xl':   ['1.75rem',  { lineHeight: '1.3' }],
        'mobile-2xl':  ['2.25rem',  { lineHeight: '1.2' }],
      },
      spacing: {
        'touch': '3rem',
        'touch-lg': '4rem',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan-line': 'scanLine 2s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        scanLine: {
          '0%, 100%': { transform: 'translateY(0%)' },
          '50%': { transform: 'translateY(100%)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
