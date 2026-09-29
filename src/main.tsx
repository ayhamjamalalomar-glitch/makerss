import React from 'react'
import ReactDOM from 'react-dom/client'
import { MotionConfig } from 'framer-motion'
import App from './App'
import { AuthProvider } from './lib/auth'
import { LangProvider } from './lib/i18n'
import { RouterProvider } from './lib/router'
import { ToastProvider } from './lib/toast'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LangProvider>
      <RouterProvider>
        <AuthProvider>
          {/* Animations follow the visitor's "reduce motion" setting. */}
          <MotionConfig reducedMotion="user">
            <ToastProvider>
              <App />
            </ToastProvider>
          </MotionConfig>
        </AuthProvider>
      </RouterProvider>
    </LangProvider>
  </React.StrictMode>,
)
