interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'accent'
  children: React.ReactNode
}

export function Badge({ variant = 'neutral', children }: BadgeProps) {
  return <span className={`badge badge-${variant}`}>{children}</span>
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: BadgeProps['variant']; label: string }> = {
    // Phone number status
    available: { variant: 'info', label: 'متاح' },
    in_use: { variant: 'success', label: 'قيد الاستخدام' },
    suspended: { variant: 'error', label: 'موقوف' },
    expired: { variant: 'neutral', label: 'منتهي' },
    // Provider status
    active: { variant: 'success', label: 'نشط' },
    inactive: { variant: 'neutral', label: 'غير نشط' },
    // Recharge status
    pending: { variant: 'warning', label: 'معلق' },
    completed: { variant: 'success', label: 'مكتمل' },
    failed: { variant: 'error', label: 'فاشل' },
    refunded: { variant: 'neutral', label: 'مسترجع' },
    // IVR call status
    abandoned: { variant: 'error', label: 'متروك' },
  }
  const config = map[status] || { variant: 'neutral' as const, label: status }
  return <Badge variant={config.variant}>{config.label}</Badge>
}

export function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, { variant: BadgeProps['variant']; label: string }> = {
    low: { variant: 'neutral', label: 'منخفضة' },
    medium: { variant: 'info', label: 'متوسطة' },
    high: { variant: 'warning', label: 'عالية' },
    urgent: { variant: 'error', label: 'عاجلة' },
    normal: { variant: 'info', label: 'عادية' },
  }
  const config = map[priority] || { variant: 'neutral' as const, label: priority }
  return <Badge variant={config.variant}>{config.label}</Badge>
}
