import './globals.css';

export const metadata = {
  title: 'AudioLens',
  description: 'Context-aware reading assistant for visually impaired users',
  manifest: '/manifest.json',
  themeColor: '#0a0a0f',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AudioLens',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="antialiased">
        {/* live region for screen reader announcements */}
        <div
          id="sr-announcer"
          role="status"
          aria-live="assertive"
          aria-atomic="true"
          className="sr-only"
          style={{
            position: 'absolute',
            width: '1px',
            height: '1px',
            padding: 0,
            margin: '-1px',
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            borderWidth: 0,
          }}
        />
        <main className="min-h-[100dvh] flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
