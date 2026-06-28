import { Menu, Bell, Search } from 'lucide-react'

interface HeaderProps {
  title: string
  subtitle?: string
  onMenuClick: () => void
}

export function Header({ title, subtitle, onMenuClick }: HeaderProps) {
  return (
    <header
      style={{
        background: 'var(--neutral-0)',
        borderBottom: '1px solid var(--neutral-200)',
        padding: 'var(--space-4) var(--space-6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-4)',
        position: 'sticky',
        top: 0,
        zIndex: 30,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        <button
          className="btn btn-ghost menu-toggle"
          onClick={onMenuClick}
          aria-label="القائمة"
          style={{ display: 'none' }}
        >
          <Menu size={22} />
        </button>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--neutral-900)' }}>{title}</h1>
          {subtitle && <p style={{ fontSize: '13px', color: 'var(--neutral-500)' }}>{subtitle}</p>}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <div
          style={{
            position: 'relative',
            display: 'none',
          }}
          className="search-box"
        >
          <Search
            size={18}
            style={{
              position: 'absolute',
              right: 'var(--space-3)',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--neutral-400)',
            }}
          />
          <input
            className="input"
            placeholder="بحث..."
            style={{ paddingRight: 'var(--space-10)', width: '240px' }}
          />
        </div>
        <button className="btn btn-ghost" style={{ position: 'relative' }} aria-label="الإشعارات">
          <Bell size={20} />
          <span
            style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              width: '8px',
              height: '8px',
              background: 'var(--error-500)',
              borderRadius: '50%',
              border: '2px solid var(--neutral-0)',
            }}
          />
        </button>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary-500), var(--secondary-500))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 700,
            fontSize: '14px',
          }}
        >
          م
        </div>
      </div>
    </header>
  )
}
