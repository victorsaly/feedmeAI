import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";

import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'

import "./main.css"
import "./styles/theme.css"
import "./index.css"

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <App />
   </ErrorBoundary>
)

/*
 * Offline, and installable.
 *
 * Registered after load so it never competes with the first paint, and only
 * in a built app — a service worker in front of the dev server hands you
 * yesterday's bundle and is a bad afternoon. A new version takes over on the
 * next launch rather than swapping the page out from under someone mid-recipe.
 */
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* blocked, unsupported, or a private window: the app works online */
    })
  })
}
