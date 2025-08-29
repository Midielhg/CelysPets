import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Global error handlers to catch all unhandled errors
window.addEventListener('error', (event) => {
  console.error('🚨 Global Error:', event.error);
  console.error('🚨 Error details:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error?.stack
  });
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled Promise Rejection:', event.reason);
  console.error('🚨 Promise:', event.promise);
});

// React error boundary fallback
window.addEventListener('beforeunload', () => {
  console.log('🔄 Page unloading...');
});

console.log('🚀 Application starting...');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
