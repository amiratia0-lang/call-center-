import { useEffect, useState } from 'react'
import { PhoneCall, Search } from 'lucide-react'
import { supabase, DB } from '../lib/supabase'
import { StatusBadge } from '../components/Badge'
import { LoadingState, ErrorState, EmptyState } from '../components/States'
import { Modal } from '../components/Modal'
import type { Call, Company } from '../types'

export function CallsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [calls, setCalls] = useState<(Call & { companies: Pick<Company, 'name'> })[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Call | null>(null)

  useEffect(() => {
    loadCalls()
  }, [])

  async function loadCalls() {
    setLoading(true)
    setError('')
    try {
      const { data, error } = await supabase
        .from(DB.calls)
        .select('*, companies(name)')
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) throw error
      setCalls(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }

  const filtered = calls.filter(
    (c) => !search || c.caller_phone.includes(search) || c.intent.includes(search),
  )

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={loadCalls} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ position: 'relative', maxWidth: '400px' }}>
        <Search size={16} style={{ position: 'absolute', right: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
        <input
          className="input"
          style={{ paddingRight: 'var(--space-10)' }}
          placeholder="ابحث برقم الهاتف أو النوع..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState icon={<PhoneCall size={32} />} title="لا مكالمات" description="لم يتم تسجيل أي مكالمات بعد" />
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-wrapper" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--neutral-50)', borderBottom: '1px solid var(--neutral-200)' }}>
                  <th style={thStyle}>الشركة</th>
                  <th style={thStyle}>رقم المتصل</th>
                  <th style={thStyle}>النوع</th>
                  <th style={thStyle}>الحالة</th>
                  <th style={thStyle}>المدة</th>
                  <th style={thStyle}>الوقت</th>
                  <th style={thStyle}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((call) => (
                  <tr key={call.id} style={{ borderBottom: '1px solid var(--neutral-100)' }}>
                    <td style={tdStyle}>{call.companies?.name || '—'}</td>
                    <td style={tdStyle}>{call.caller_phone}</td>
                    <td style={tdStyle}><StatusBadge status={call.intent} /></td>
                    <td style={tdStyle}><StatusBadge status={call.status} /></td>
                    <td style={tdStyle}>{call.duration}s</td>
                    <td style={tdStyle}>{new Date(call.started_at).toLocaleString('ar-EG')}</td>
                    <td style={tdStyle}>
                      <button className="btn btn-ghost" onClick={() => setSelected(call)}>عرض</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title="تفاصيل المكالمة" size="lg">
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--neutral-500)', marginBottom: '4px' }}>رقم المتصل</p>
                <p style={{ fontWeight: 600 }}>{selected.caller_phone}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--neutral-500)', marginBottom: '4px' }}>النوع</p>
                <StatusBadge status={selected.intent} />
              </div>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--neutral-500)', marginBottom: '4px' }}>الحالة</p>
                <StatusBadge status={selected.status} />
              </div>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--neutral-500)', marginBottom: '4px' }}>المدة</p>
                <p style={{ fontWeight: 600 }}>{selected.duration} ثانية</p>
              </div>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: 'var(--neutral-500)', marginBottom: 'var(--space-2)' }}>نص المحادثة</p>
              <div
                style={{
                  background: 'var(--neutral-50)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-4)',
                  fontSize: '13px',
                  lineHeight: 1.8,
                  whiteSpace: 'pre-wrap',
                  color: 'var(--neutral-700)',
                  maxHeight: '300px',
                  overflowY: 'auto',
                }}
              >
                {selected.transcript || 'لا يوجد نص مسجل'}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

const thStyle: React.CSSProperties = {
  textAlign: 'right',
  padding: 'var(--space-3) var(--space-4)',
  fontSize: '12px',
  fontWeight: 600,
  color: 'var(--neutral-600)',
  whiteSpace: 'nowrap',
}

const tdStyle: React.CSSProperties = {
  padding: 'var(--space-3) var(--space-4)',
  fontSize: '13px',
  color: 'var(--neutral-800)',
  whiteSpace: 'nowrap',
}
