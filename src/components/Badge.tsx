interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'accent'
  children: React.ReactNode
}

export function Badge({ variant = 'neutral', children }: BadgeProps) {
  return <span className={`badge badge-${variant}`}>{children}</span>
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: BadgeProps['variant']; label: string }> = {
    // Company / general status
    active: { variant: 'success', label: 'نشط' },
    inactive: { variant: 'neutral', label: 'غير نشط' },
    // Call status
    completed: { variant: 'success', label: 'مكتمل' },
    ongoing: { variant: 'info', label: 'جارية' },
    abandoned: { variant: 'error', label: 'متروك' },
    failed: { variant: 'error', label: 'فاشل' },
    // Intent
    tracking: { variant: 'info', label: 'تتبع شحنة' },
    order: { variant: 'accent', label: 'طلب طعام' },
    complaint: { variant: 'warning', label: 'شكوى' },
    info: { variant: 'neutral', label: 'استفسار' },
    unknown: { variant: 'neutral', label: 'غير محدد' },
    // Order status
    new: { variant: 'info', label: 'جديد' },
    preparing: { variant: 'warning', label: 'قيد التحضير' },
    delivered: { variant: 'success', label: 'تم التوصيل' },
    cancelled: { variant: 'error', label: 'ملغي' },
    // Complaint status
    open: { variant: 'warning', label: 'مفتوحة' },
    in_progress: { variant: 'info', label: 'قيد المعالجة' },
    resolved: { variant: 'success', label: 'تم الحل' },
    closed: { variant: 'neutral', label: 'مغلقة' },
    // Shipment status
    pending: { variant: 'warning', label: 'قيد الانتظار' },
    in_transit: { variant: 'info', label: 'في الطريق' },
    out_for_delivery: { variant: 'accent', label: 'خارج للتوصيل' },
    returned: { variant: 'error', label: 'تم الإرجاع' },
  }
  const config = map[status] || { variant: 'neutral' as const, label: status }
  return <Badge variant={config.variant}>{config.label}</Badge>
}

export function IndustryBadge({ industry }: { industry: string }) {
  const map: Record<string, { variant: BadgeProps['variant']; label: string }> = {
    shipping: { variant: 'info', label: 'شحن' },
    restaurant: { variant: 'accent', label: 'مطعم' },
    clinic: { variant: 'success', label: 'عيادة' },
    general: { variant: 'neutral', label: 'عام' },
  }
  const config = map[industry] || { variant: 'neutral' as const, label: industry }
  return <Badge variant={config.variant}>{config.label}</Badge>
}
