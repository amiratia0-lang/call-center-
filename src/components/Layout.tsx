import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'لوحة التحكم', subtitle: 'نظرة عامة على أداء مركز الاتصالات' },
  '/calls': { title: 'المكالمات', subtitle: 'إدارة سجل المكالمات' },
  '/customers': { title: 'العملاء', subtitle: 'إدارة قاعدة بيانات العملاء' },
  '/agents': { title: 'الوكلاء', subtitle: 'إدارة موظفي مركز الاتصالات' },
  '/tickets': { title: 'التذاكر', subtitle: 'إدارة تذاكر الدعم' },
  '/queue': { title: 'طابور المكالمات', subtitle: 'المكالمات الواردة في الانتظار' },
  '/reports': { title: 'التقارير', subtitle: 'تحليلات وإحصائيات الأداء' },
}

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const meta = pageMeta[location.pathname] || { title: 'مركز الاتصالات', subtitle: '' }

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
