import { useEffect, useState, useCallback } from 'react'
import { Plus, Search, Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, Trash2, Star, Filter } from 'lucide-react'
import { supabase, DB } from '../lib/supabase'
import type { Call, Customer, Agent } from '../types'
import { StatusBadge } from '../components/Badge'
import { Modal } from '../components/Modal'
import { LoadingState, ErrorState, EmptyState } from '../components/States'

export function CallsPage() {
  const [calls, setCalls] = useState<Call[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [callsRes, customersRes, agentsRes] = await Promise.all([
        supabase.from(DB.calls).select('*, customer:customers(*), agent:agents(*)').order('started_at', { ascending: false }),
        supabase.from(DB.customers).select('*').order('name'),
        supabase.from(DB.agents).select('*').order('name'),
      ])
      setCalls(callsRes.data || [])
      setCustomers(customersRes.data || [])
      setAgents(agentsRes.data || [])
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
    const matchSearch = !search || c.customer?.name?.toLowerCase().includes(search.toLowerCase()) || c.agent?.name?.toLowerCase().includes(search.toLowerCase()) || c.notes?.toLowerCase().includes(search.toLowerCase())
    const matchType = filterType === 'all' || c.type === filterType
    const matchStatus = filterStatus === 'all' || c.status === filterStatus
    return matchSearch && matchType && matchStatus
  })

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المكالمة؟')) return
    const { error } = await supabase.from(DB.calls).delete().eq('id', id)
    if (error) {
      alert('حدث خطأ أثناء الحذف')
      return
    }
    setCalls(calls.filter((c) => c.id !== id))
  }

  const handleAdd = async (data: Partial<Call>) => {
    setSaving(true)
    const { error } = await supabase.from(DB.calls).insert({
      customer_id: data.customer_id,
      agent_id: data.agent_id,
      type: data.type || 'inbound',
      status: data.status || 'completed',
      duration: data.duration || 0,
      rating: data.rating || null,
      notes: data.notes || null,
    })
    setSaving(false)
    if (error) {
      alert('حدث خطأ أثناء الإضافة')
      return false
    }
    setModalOpen(false)
    load()
    return true
  }

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={load} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Toolbar */}
      <div className="card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={18} style={{ position: 'absolute', right: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
          <input className="input" placeholder="بحث بالعميل أو الوكيل أو الملاحظات..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingRight: 'var(--space-10)' }} />
        </div>
        <select className="input" style={{ width: 'auto' }} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="all">كل الأنواع</option>
          <option value="inbound">واردة</option>
          <option value="outbound">صادرة</option>
          <option value="missed">فائتة</option>
          <option value="transferred">محولة</option>
        </select>
        <select className="input" style={{ width: 'auto' }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">كل الحالات</option>
          <option value="completed">مكتملة</option>
          <option value="ongoing">جارية</option>
          <option value="missed">فائتة</option>
          <option value="failed">فاشلة</option>
          <option value="voicemail">بريد صوتي</option>
        </select>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <Plus size={18} /> مكالمة جديدة
        </button>
      </div>

      {/* Table */}
      <div className="card table-wrapper" style={{ overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Phone size={28} />}
            title="لا توجد مكالمات"
            description="لم يتم العثور على مكالمات مطابقة. جرب تغيير عوامل التصفية أو أضف مكالمة جديدة."
          />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--neutral-50)', borderBottom: '2px solid var(--neutral-200)' }}>
                <Th>النوع</Th>
                <Th>العميل</Th>
                <Th>الوكيل</Th>
                <Th>الحالة</Th>
                <Th>المدة</Th>
                <Th>التقييم</Th>
                <Th>الوقت</Th>
                <Th>ملاحظات</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((call, i) => (
                <tr
                  key={call.id}
                  className="animate-fade-in"
                  style={{
                    borderBottom: '1px solid var(--neutral-100)',
                    transition: 'background 150ms',
                    animationDelay: `${i * 30}ms`,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--neutral-50)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <div style={{ color: call.type === 'inbound' ? 'var(--primary-600)' : call.type === 'outbound' ? 'var(--secondary-600)' : 'var(--error-600)' }}>
                        {call.type === 'inbound' ? <PhoneIncoming size={16} /> : call.type === 'outbound' ? <PhoneOutgoing size={16} /> : <PhoneMissed size={16} />}
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>
                        {call.type === 'inbound' ? 'واردة' : call.type === 'outbound' ? 'صادرة' : call.type === 'missed' ? 'فائتة' : 'محولة'}
                      </span>
                    </div>
                  </Td>
                  <Td><span style={{ fontWeight: 600, fontSize: '14px' }}>{call.customer?.name || '—'}</span></Td>
                  <Td><span style={{ fontSize: '13px', color: 'var(--neutral-600)' }}>{call.agent?.name || '—'}</span></Td>
                  <Td><StatusBadge status={call.status} /></Td>
                  <Td><span style={{ fontSize: '13px', color: 'var(--neutral-600)' }}>{formatDuration(call.duration)}</span></Td>
                  <Td>
                    {call.rating ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <Star size={14} style={{ fill: 'var(--accent-400)', color: 'var(--accent-400)' }} />
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>{call.rating}</span>
                      </div>
                    ) : <span style={{ color: 'var(--neutral-300)' }}>—</span>}
                  </Td>
                  <Td><span style={{ fontSize: '12px', color: 'var(--neutral-500)' }}>{formatDate(call.started_at)}</span></Td>
                  <Td><span style={{ fontSize: '13px', color: 'var(--neutral-600)', maxWidth: '200px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{call.notes || '—'}</span></Td>
                  <Td>
                    <button className="btn btn-ghost" onClick={() => handleDelete(call.id)} aria-label="حذف" style={{ color: 'var(--error-500)' }}>
                      <Trash2 size={16} />
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <CallModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleAdd} customers={customers} agents={agents} saving={saving} />
    </div>
  )
}

function CallModal({ open, onClose, onSave, customers, agents, saving }: {
  open: boolean
  onClose: () => void
  onSave: (data: Partial<Call>) => Promise<boolean>
  customers: Customer[]
  agents: Agent[]
  saving: boolean
}) {
  const [form, setForm] = useState({
    customer_id: '',
    agent_id: '',
    type: 'inbound' as Call['type'],
    status: 'completed' as Call['status'],
    duration: 0,
    rating: 0,
    notes: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...form,
      duration: Number(form.duration),
      rating: form.rating ? Number(form.rating) : null,
    })
  }

  return (
    <Modal open={open} onClose={onClose} title="إضافة مكالمة جديدة">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <div>
            <label className="label">العميل</label>
            <select className="input" value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })} required>
              <option value="">اختر العميل</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">الوكيل</label>
            <select className="input" value={form.agent_id} onChange={(e) => setForm({ ...form, agent_id: e.target.value })}>
              <option value="">بدون وكيل</option>
              {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <div>
            <label className="label">النوع</label>
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Call['type'] })}>
              <option value="inbound">واردة</option>
              <option value="outbound">صادرة</option>
              <option value="missed">فائتة</option>
              <option value="transferred">محولة</option>
            </select>
          </div>
          <div>
            <label className="label">الحالة</label>
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Call['status'] })}>
              <option value="completed">مكتملة</option>
              <option value="ongoing">جارية</option>
              <option value="missed">فائتة</option>
              <option value="failed">فاشلة</option>
              <option value="voicemail">بريد صوتي</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <div>
            <label className="label">المدة (بالثواني)</label>
            <input className="input" type="number" min={0} value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">التقييم (1-5)</label>
            <select className="input" value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}>
              <option value={0}>بدون تقييم</option>
              <option value={1}>1 - سيء</option>
              <option value={2}>2 - مقبول</option>
              <option value={3}>3 - جيد</option>
              <option value={4}>4 - جيد جداً</option>
              <option value={5}>5 - ممتاز</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label">ملاحظات</label>
          <textarea className="input" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="ملاحظات المكالمة..." />
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>إلغاء</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'جاري الحفظ...' : 'حفظ'}</button>
        </div>
      </form>
    </Modal>
  )
}

function Th({ children }: { children?: React.ReactNode }) {
  return <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{children}</th>
}

function Td({ children }: { children?: React.ReactNode }) {
  return <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{children}</td>
}

function formatDuration(seconds: number): string {
  if (seconds === 0) return '0ث'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}د ${s}ث` : `${s}ث`
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
}
