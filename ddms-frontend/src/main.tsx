import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { DocumentsProvider } from './contexts/DocumentsContext.tsx'
import { ToastProvider } from './contexts/ToastContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <DocumentsProvider>
    <App />
        </DocumentsProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
)
