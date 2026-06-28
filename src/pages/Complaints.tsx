import { useEffect, useState } from 'react'
import { MessageSquareWarning, Search } from 'lucide-react'
import { supabase, DB } from '../lib/supabase'
import { StatusBadge } from '../components/Badge'
import { LoadingState, ErrorState, EmptyState } from '../components/States'
import type { Complaint, Company } from '../types'

export function ComplaintsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [complaints, setComplaints] = useState<(Complaint & { companies: Pick<Company, 'name'> })[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadComplaints()
  }, [])

  async function loadComplaints() {
    setLoading(true)
    setError('')
    try {
      const { data, error } = await supabase
        .from(DB.complaints)
        .select('*, companies(name)')
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) throw error
      setComplaints(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(id: string, status: Complaint['status']) {
    try {
      const { error } = await supabase.from(DB.complaints).update({ status }).eq('id', id)
      if (error) throw error
      await loadComplaints()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ')
    }
  }

  const filtered = complaints.filter((c) => !search || c.caller_phone.includes(search) || c.subject.includes(search))

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={loadComplaints} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ position: 'relative', maxWidth: '400px' }}>
        <Search size={16} style={{ position: 'absolute', right: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
        <input className="input" style={{ paddingRight: 'var(--space-10)' }} placeholder="ابحث برقم الهاتف أو الموضوع..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState icon={<MessageSquareWarning size={32} />} title="لا شكاوى" description="لم يتم تسجيل أي شكاوى بعد" />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {filtered.map((complaint) => (
            <div key={complaint.id} className="card animate-slide-up" style={{ padding: 'var(--space-5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '4px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--neutral-900)' }}>{complaint.subject}</h3>
                    <StatusBadge status={complaint.status} />
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--neutral-500)' }}>
                    {complaint.companies?.name} — {complaint.caller_phone} — {new Date(complaint.created_at).toLocaleString('ar-EG')}
                  </p>
                </div>
                <select
                  className="input"
                  style={{ fontSize: '12px', padding: 'var(--space-2)', width: '140px' }}
                  value={complaint.status}
                  onChange={(e) => updateStatus(complaint.id, e.target.value as Complaint['status'])}
                >
                  <option value="open">مفتوحة</option>
                  <option value="in_progress">قيد المعالجة</option>
                  <option value="resolved">تم الحل</option>
                  <option value="closed">مغلقة</option>
                </select>
              </div>
              {complaint.description && (
                <p style={{ fontSize: '13px', color: 'var(--neutral-700)', background: 'var(--neutral-50)', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', lineHeight: 1.6 }}>
                  {complaint.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
