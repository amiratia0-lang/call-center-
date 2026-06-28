import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'لوحة التحكم', subtitle: 'نظرة عامة على مركز الاتصال الذكي' },
  '/companies': { title: 'الشركات', subtitle: 'إدارة الشركات المسجلة على المنصة' },
  '/calls': { title: 'المكالمات', subtitle: 'سجل المكالمات الواردة عبر الرد الآلي' },
  '/orders': { title: 'الطلبات', subtitle: 'طلبات المطاعم المسجلة عبر الهاتف' },
  '/complaints': { title: 'الشكاوى', subtitle: 'شكاوى العملاء المسجلة عبر الرد الآلي' },
  '/shipments': { title: 'الشحنات', subtitle: 'سجل شحنات شركات الشحن' },
  '/menu': { title: 'المنيو', subtitle: 'إدارة منيو المطاعم والخدمات' },
  '/simulator': { title: 'محاكي المكالمات', subtitle: 'جرّب الرد الآلي كأنك متصل حقيقي' },
  '/settings': { title: 'الإعدادات', subtitle: 'إعدادات النظام' },
}

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const meta = pageMeta[location.pathname] || { title: 'مركز الاتصال', subtitle: '' }

  return (
    <div style={{ minHeight: '100vh' }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div
        className="main-content"
        style={{
          marginRight: '260px',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Header title={meta.title} subtitle={meta.subtitle} onMenuClick={() => setSidebarOpen(true)} />
        <main style={{ flex: 1, padding: 'var(--space-6)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
