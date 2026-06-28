import { type ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-16) var(--space-6)',
        textAlign: 'center',
      }}
    >
      {icon && (
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'var(--neutral-100)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--neutral-400)',
            marginBottom: 'var(--space-4)',
          }}
        >
          {icon}
        </div>
      )}
      <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--neutral-700)', marginBottom: 'var(--space-2)' }}>
        {title}
      </h3>
      {description && (
        <p style={{ color: 'var(--neutral-500)', maxWidth: '400px', marginBottom: 'var(--space-4)' }}>
          {description}
        </p>
      )}
      {action}
    </div>
  )
}

export function LoadingState() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 'var(--space-16)' }}>
      <div className="spinner" />
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 'var(--space-12)',
        textAlign: 'center',
      }}
    >
      <div style={{ color: 'var(--error-500)', marginBottom: 'var(--space-3)' }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
      </div>
      <p style={{ color: 'var(--error-600)', marginBottom: 'var(--space-4)' }}>{message}</p>
      {onRetry && <button className="btn btn-secondary" onClick={onRetry}>إعادة المحاولة</button>}
    </div>
  )
}
