import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AuthProvider } from './lib/auth'
import { LangProvider } from './lib/i18n'
import { RouterProvider } from './lib/router'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LangProvider>
      <RouterProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </RouterProvider>
    </LangProvider>
  </React.StrictMode>,
)
