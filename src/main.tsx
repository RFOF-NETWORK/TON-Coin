import React from 'react';
import { createRoot } from 'react-dom/client';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { App } from './App';
import './style.css';
import { Buffer } from 'buffer';

globalThis.Buffer = Buffer;

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TonConnectUIProvider manifestUrl={`${window.location.origin}/tonconnect-manifest.json`} analytics={{ mode: 'off' }}>
      <App />
    </TonConnectUIProvider>
  </React.StrictMode>,
);
