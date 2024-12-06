import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary';
import { APILoadingProvider } from './components/APILoadingProvider';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <APILoadingProvider>
        <App />
      </APILoadingProvider>
    </ErrorBoundary>
  </StrictMode>
);