import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'لوحة التحكم', subtitle: 'نظرة عامة على عمليات الشحن والمكالمات' },
  '/numbers': { title: 'أرقام الهواتف', subtitle: 'إدارة مخزون أرقام الهواتف' },
  '/recharges': { title: 'عمليات الشحن', subtitle: 'سجل عمليات شحن الأرقام' },
  '/ivr': { title: 'الرد الآلي', subtitle: 'إعداد قائمة الرد الآلي (IVR)' },
  '/calls': { title: 'سجل المكالمات', subtitle: 'سجل مكالمات الرد الآلي الواردة' },
  '/providers': { title: 'المزودين', subtitle: 'إدارة مزودي خدمات الشحن' },
  '/settings': { title: 'الإعدادات', subtitle: 'إعدادات النظام' },
}

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const meta = pageMeta[location.pathname] || { title: 'شحن أرقام', subtitle: '' }

  return (
    <div style={{ minHeight: '100vh' }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content" style={{ marginRight: '260px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header title={meta.title} subtitle={meta.subtitle} onMenuClick={() => setSidebarOpen(true)} />
        <main style={{ flex: 1, padding: 'var(--space-6)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
