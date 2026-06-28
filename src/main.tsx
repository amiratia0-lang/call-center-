import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { CompaniesPage } from './pages/Companies'
import { CallsPage } from './pages/Calls'
import { OrdersPage } from './pages/Orders'
import { ComplaintsPage } from './pages/Complaints'
import { ShipmentsPage } from './pages/Shipments'
import { MenuPage } from './pages/Menu'
import { SimulatorPage } from './pages/Simulator'
import { SettingsPage } from './pages/Settings'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/companies" element={<CompaniesPage />} />
          <Route path="/calls" element={<CallsPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/complaints" element={<ComplaintsPage />} />
          <Route path="/shipments" element={<ShipmentsPage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/simulator" element={<SimulatorPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
