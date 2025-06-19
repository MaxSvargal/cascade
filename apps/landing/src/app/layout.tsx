'use client';
import React from 'react';
import { Provider } from 'jotai';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className="bg-neon-dark text-white">
        <Provider>
          {children}
        </Provider>
      </body>
    </html>
  );
} 