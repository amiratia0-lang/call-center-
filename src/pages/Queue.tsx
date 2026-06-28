import { useEffect, useState, useCallback } from 'react'
import { ListOrdered, Clock, Phone, User, Trash2, PhoneCall } from 'lucide-react'
import { supabase, DB } from '../lib/supabase'
import type { QueueEntry, Customer } from '../types'
import { StatusBadge, PriorityBadge } from '../components/Badge'
import { LoadingState, ErrorState, EmptyState } from '../components/States'

export function QueuePage() {
  const [queue, setQueue] = useState<QueueEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.from(DB.queue).select('*, customer:customers(*)').order('created_at', { ascending: false })
      if (error) throw error
      setQueue(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleStatusChange = async (entry: QueueEntry, status: QueueEntry['status']) => {
    const { error } = await supabase.from(DB.queue).update({ status }).eq('id', entry.id)
    if (error) {
      alert('حدث خطأ')
      return
    }
    setQueue(queue.map((q) => q.id === entry.id ? { ...q, status } : q))
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الإدخال؟')) return
    const { error } = await supabase.from(DB.queue).delete().eq('id', id)
    if (error) {
      alert('حدث خطأ')
      return
    }
    setQueue(queue.filter((q) => q.id !== id))
  }

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={load} />

  const waiting = queue.filter((q) => q.status === 'waiting')
  const answered = queue.filter((q) => q.status === 'answered')
  const abandoned = queue.filter((q) => q.status === 'abandoned')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)' }} className="stats-grid">
        <SummaryCard label="في الانتظار" value={waiting.length} color="var(--warning-600)" bg="var(--warning-50)" icon={<Clock size={22} />} />
        <SummaryCard label="تم الرد" value={answered.length} color="var(--success-600)" bg="var(--success-50)" icon={<PhoneCall size={22} />} />
        <SummaryCard label="متروكة" value={abandoned.length} color="var(--error-600)" bg="var(--error-50)" icon={<Phone size={22} />} />
      </div>

      {/* Queue List */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--neutral-200)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <ListOrdered size={20} style={{ color: 'var(--primary-600)' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--neutral-800)' }}>طابور المكالمات</h3>
        </div>

        {queue.length === 0 ? (
          <EmptyState icon={<ListOrdered size={28} />} title="الطابور فارغ" description="لا توجد مكالمات في الطابور حالياً." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {queue.map((entry, i) => (
              <div
                key={entry.id}
                className="animate-slide-in-right"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-4)',
                  padding: 'var(--space-4) var(--space-5)',
                  borderBottom: '1px solid var(--neutral-100)',
                  transition: 'background 150ms',
                  animationDelay: `${i * 40}ms`,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--neutral-50)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: entry.status === 'waiting' ? 'var(--warning-100)' : entry.status === 'answered' ? 'var(--success-100)' : 'var(--error-100)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: entry.status === 'waiting' ? 'var(--warning-600)' : entry.status === 'answered' ? 'var(--success-600)' : 'var(--error-600)',
                    flexShrink: 0,
                  }}
                >
                  {entry.status === 'waiting' ? <Clock size={18} className="animate-pulse-soft" /> : entry.status === 'answered' ? <PhoneCall size={18} /> : <Phone size={18} />}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--neutral-800)' }}>{entry.customer?.name || 'عميل غير معروف'}</span>
                    <PriorityBadge priority={entry.priority} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', fontSize: '12px', color: 'var(--neutral-500)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> {entry.wait_time} ثانية
                    </span>
                    <span>{formatDate(entry.created_at)}</span>
                  </div>
                </div>

                <StatusBadge status={entry.status} />

                <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                  {entry.status === 'waiting' && (
                    <button className="btn btn-primary" style={{ padding: 'var(--space-2) var(--space-4)', fontSize: '13px' }} onClick={() => handleStatusChange(entry, 'answered')}>
                      <PhoneCall size={14} /> رد
                    </button>
                  )}
                  <button className="btn btn-ghost" onClick={() => handleDelete(entry.id)} aria-label="حذف" style={{ color: 'var(--error-500)' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SummaryCard({ label, value, color, bg, icon }: { label: string; value: number; color: string; bg: string; icon: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: '28px', fontWeight: 800, color: 'var(--neutral-900)', lineHeight: 1.2 }}>{value}</p>
        <p style={{ fontSize: '13px', color: 'var(--neutral-500)' }}>{label}</p>
      </div>
    </div>
  )
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
}
