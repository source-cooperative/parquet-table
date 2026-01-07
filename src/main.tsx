import 'hightable/src/HighTable.css'
import 'hyperparam/global.css'
import 'hyperparam/hyperparam.css'
import './styles/index.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App.tsx'

const app = document.getElementById('app')
if (!app) throw new Error('missing app element')

createRoot(app).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
