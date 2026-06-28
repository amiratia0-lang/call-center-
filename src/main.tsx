import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { NumbersPage } from './pages/Numbers'
import { RechargesPage } from './pages/Recharges'
import { IVRPage } from './pages/IVR'
import { CallsPage } from './pages/Calls'
import { ProvidersPage } from './pages/Providers'
import { SettingsPage } from './pages/Settings'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/numbers" element={<NumbersPage />} />
          <Route path="/recharges" element={<RechargesPage />} />
          <Route path="/ivr" element={<IVRPage />} />
          <Route path="/calls" element={<CallsPage />} />
          <Route path="/providers" element={<ProvidersPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
