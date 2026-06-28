interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'accent'
  children: React.ReactNode
}

export function Badge({ variant = 'neutral', children }: BadgeProps) {
  return <span className={`badge badge-${variant}`}>{children}</span>
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: BadgeProps['variant']; label: string }> = {
    active: { variant: 'success', label: 'نشط' },
    inactive: { variant: 'neutral', label: 'غير نشط' },
    vip: { variant: 'accent', label: 'مميز' },
    blacklist: { variant: 'error', label: 'قائمة سوداء' },
    online: { variant: 'success', label: 'متصل' },
    busy: { variant: 'warning', label: 'مشغول' },
    offline: { variant: 'neutral', label: 'غير متصل' },
    break: { variant: 'info', label: 'استراحة' },
    completed: { variant: 'success', label: 'مكتملة' },
    ongoing: { variant: 'info', label: 'جارية' },
    missed: { variant: 'error', label: 'فائتة' },
    failed: { variant: 'error', label: 'فاشلة' },
    voicemail: { variant: 'warning', label: 'بريد صوتي' },
    open: { variant: 'info', label: 'مفتوحة' },
    in_progress: { variant: 'warning', label: 'قيد المعالجة' },
    resolved: { variant: 'success', label: 'محلولة' },
    closed: { variant: 'neutral', label: 'مغلقة' },
    waiting: { variant: 'warning', label: 'في الانتظار' },
    answered: { variant: 'success', label: 'تم الرد' },
    abandoned: { variant: 'error', label: 'متروكة' },
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
