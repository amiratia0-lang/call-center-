import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { CallsPage } from './pages/Calls'
import { CustomersPage } from './pages/Customers'
import { AgentsPage } from './pages/Agents'
import { TicketsPage } from './pages/Tickets'
import { QueuePage } from './pages/Queue'
import { ReportsPage } from './pages/Reports'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/calls" element={<CallsPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/agents" element={<AgentsPage />} />
          <Route path="/tickets" element={<TicketsPage />} />
          <Route path="/queue" element={<QueuePage />} />
          <Route path="/reports" element={<ReportsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
