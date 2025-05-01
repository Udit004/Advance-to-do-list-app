import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Import our styles
import './index.css'

// Import Bootstrap JS
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'bootstrap/dist/css/bootstrap.min.css';

import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
