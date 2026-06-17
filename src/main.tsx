import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
// @ts-expect-error - importing JS component in TS file
import App from '../sumi_e_blade.jsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
