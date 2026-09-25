import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Catch and suppress benign Vite HMR WebSocket connection errors in sandbox/iFrame environment
window.addEventListener('unhandledrejection', (event) => {
  if (
    event.reason &&
    (event.reason?.message?.includes('WebSocket') ||
      event.reason?.toString?.().includes('WebSocket'))
  ) {
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

