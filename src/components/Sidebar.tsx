import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Phone, Users, Headphones, Ticket, ListOrdered, ChartBar as BarChart3, PhoneCall } from 'lucide-react'

const navItems = [
  { to: '/', label: 'لوحة التحكم', icon: LayoutDashboard, end: true },
  { to: '/calls', label: 'المكالمات', icon: Phone },
  { to: '/customers', label: 'العملاء', icon: Users },
  { to: '/agents', label: 'الوكلاء', icon: Headphones },
  { to: '/tickets', label: 'التذاكر', icon: Ticket },
  { to: '/queue', label: 'طابور المكالمات', icon: ListOrdered },
  { to: '/reports', label: 'التقارير', icon: BarChart3 },
]

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {open && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.5)',
            zIndex: 40,
            display: 'none',
          }}
          className="sidebar-overlay"
        />
      )}
      <aside
        className="sidebar"
        style={{
          width: '260px',
          background: 'var(--neutral-900)',
          color: 'var(--neutral-300)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          bottom: 0,
          right: 0,
          zIndex: 50,
          transition: 'transform 250ms ease',
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: 'var(--space-6)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            borderBottom: '1px solid var(--neutral-800)',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--primary-500), var(--secondary-500))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            <PhoneCall size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '16px', fontWeight: 700, color: 'white' }}>مركز الاتصالات</h1>
            <p style={{ fontSize: '11px', color: 'var(--neutral-500)' }}>نظام إدارة متكامل</p>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: 'var(--space-4)', overflowY: 'auto' }}>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-3)',
                      padding: 'var(--space-3) var(--space-4)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '14px',
                      fontWeight: 600,
                      transition: 'all 150ms ease',
                      color: isActive ? 'white' : 'var(--neutral-400)',
                      background: isActive ? 'var(--primary-600)' : 'transparent',
                    })}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget
                      if (!el.classList.contains('active')) {
                        el.style.background = 'var(--neutral-800)'
                        el.style.color = 'white'
                      }
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget
                      if (!el.classList.contains('active')) {
                        el.style.background = 'transparent'
                        el.style.color = 'var(--neutral-400)'
                      }
                    }}
                  >
                    <Icon size={18} />
                    {item.label}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div
          style={{
            padding: 'var(--space-4)',
            borderTop: '1px solid var(--neutral-800)',
            fontSize: '12px',
            color: 'var(--neutral-500)',
            textAlign: 'center',
          }}
        >
          إصدار 1.0.0
        </div>
      </aside>
    </>
  )
}
