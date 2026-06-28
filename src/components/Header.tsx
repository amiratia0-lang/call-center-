import { Menu } from 'lucide-react'

export function Header({
  title,
  subtitle,
  onMenuClick,
}: {
  title: string
  subtitle: string
  onMenuClick: () => void
}) {
  return (
    <header
      style={{
        background: 'var(--neutral-0)',
        borderBottom: '1px solid var(--neutral-200)',
        padding: 'var(--space-5) var(--space-6)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-4)',
        position: 'sticky',
        top: 0,
        zIndex: 30,
      }}
    >
      <button
        className="menu-toggle"
        onClick={onMenuClick}
        style={{
          display: 'none',
          padding: 'var(--space-2)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--neutral-700)',
        }}
        aria-label="القائمة"
      >
        <Menu size={24} />
      </button>
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--neutral-900)' }}>{title}</h2>
        <p style={{ fontSize: '13px', color: 'var(--neutral-500)', marginTop: '2px' }}>{subtitle}</p>
      </div>
    </header>
  )
}
