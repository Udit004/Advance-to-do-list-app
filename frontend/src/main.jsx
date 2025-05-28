import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'




// Import Bootstrap Icons CSS (keeping this for icons)
import 'bootstrap-icons/font/bootstrap-icons.css';

import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
