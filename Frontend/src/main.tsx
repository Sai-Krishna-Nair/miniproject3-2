import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from './context/AuthContext'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'

// Register service worker for PWA functionality (caching, offline, etc.)
if ('serviceWorker' in navigator) {
  registerSW({ immediate: true })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
