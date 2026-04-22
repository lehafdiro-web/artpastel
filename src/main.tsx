import React from 'react';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { inject } from '@vercel/analytics';

import { createRoot } from 'react-dom/client';

inject();

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </React.StrictMode>
  );
}
