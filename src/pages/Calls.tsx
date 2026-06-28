import { useEffect, useState, useCallback } from 'react'
import { Search, History, PhoneCall, PhoneIncoming, Trash2 } from 'lucide-react'
import { supabase, DB } from '../lib/supabase'
import type { IVRCall } from '../types'
import { StatusBadge } from '../components/Badge'
import { LoadingState, ErrorState, EmptyState } from '../components/States'

export function CallsPage() {
  const [calls, setCalls] = useState<IVRCall[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.from(DB.ivrCalls).select('*').order('created_at', { ascending: false })
      if (error) throw error
      setCalls(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = calls.filter((c) => {
    const matchSearch = !search || c.caller_phone.includes(search) || c.input_number?.includes(search) || c.result?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || c.status === filterStatus
    return matchSearch && matchStatus
  })

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا السجل؟')) return
    const { error } = await supabase.from(DB.ivrCalls).delete().eq('id', id)
    if (error) { alert('حدث خطأ'); return }
    setCalls(calls.filter((c) => c.id !== id))
  }

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={load} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)' }} className="stats-grid">
        <SummaryCard label="إجمالي المكالمات" value={calls.length} color="var(--primary-600)" bg="var(--primary-50)" />
        <SummaryCard label="ناجحة" value={calls.filter((c) => c.status === 'completed').length} color="var(--success-600)" bg="var(--success-50)" />
        <SummaryCard label="فاشلة" value={calls.filter((c) => c.status === 'failed').length} color="var(--error-600)" bg="var(--error-50)" />
      </div>

      {/* Toolbar */}
      <div className="card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={18} style={{ position: 'absolute', right: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
          <input className="input" placeholder="بحث برقم المتصل أو النتيجة..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingRight: 'var(--space-10)' }} />
        </div>
        <select className="input" style={{ width: 'auto' }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">كل الحالات</option>
          <option value="completed">ناجحة</option>
          <option value="failed">فاشلة</option>
          <option value="abandoned">متروكة</option>
        </select>
      </div>

      {/* Table */}
      <div className="card table-wrapper" style={{ overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <EmptyState icon={<History size={28} />} title="لا توجد مكالمات" description="لم يتم العثور على مكالمات." />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--neutral-50)', borderBottom: '2px solid var(--neutral-200)' }}>
                <Th>المتصل</Th>
                <Th>الرقم المطلوب</Th>
                <Th>الاختيار</Th>
                <Th>الرقم المُدخل</Th>
                <Th>النتيجة</Th>
                <Th>الحالة</Th>
                <Th>الوقت</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.id} className="animate-fade-in" style={{ borderBottom: '1px solid var(--neutral-100)', animationDelay: `${i * 30}ms` }} onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--neutral-50)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                  <Td><span style={{ fontWeight: 600, fontSize: '14px', fontFamily: 'monospace' }}>{c.caller_phone}</span></Td>
                  <Td><span style={{ fontSize: '13px', color: 'var(--neutral-600)', fontFamily: 'monospace' }}>{c.dialed_number || '—'}</span></Td>
                  <Td><span style={{ fontSize: '13px' }}>{c.menu_choice ? `ضغط ${c.menu_choice}` : '—'}</span></Td>
                  <Td><span style={{ fontSize: '13px', fontFamily: 'monospace', color: 'var(--neutral-600)' }}>{c.input_number || '—'}</span></Td>
                  <Td><span style={{ fontSize: '13px', color: 'var(--neutral-700)', maxWidth: '250px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.result || '—'}</span></Td>
                  <Td><StatusBadge status={c.status} /></Td>
                  <Td><span style={{ fontSize: '12px', color: 'var(--neutral-500)' }}>{formatDate(c.created_at)}</span></Td>
                  <Td>
                    <button className="btn btn-ghost" onClick={() => handleDelete(c.id)} style={{ color: 'var(--error-500)' }}>
                      <Trash2 size={16} />
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function SummaryCard({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <div className="card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
      <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-md)', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
        <PhoneCall size={20} />
      </div>
      <div>
        <p style={{ fontSize: '22px', fontWeight: 800, color: 'var(--neutral-900)' }}>{value}</p>
        <p style={{ fontSize: '12px', color: 'var(--neutral-500)' }}>{label}</p>
      </div>
    </div>
  )
}

function Th({ children }: { children?: React.ReactNode }) {
  return <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: 'var(--neutral-500)' }}>{children}</th>
}

function Td({ children }: { children?: React.ReactNode }) {
  return <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{children}</td>
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
}
