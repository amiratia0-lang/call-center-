import { useEffect, useState, useCallback } from 'react'
import { Plus, Search, Zap, Trash2, CircleCheck as CheckCircle2, Circle as XCircle, Clock, RotateCcw } from 'lucide-react'
import { supabase, DB } from '../lib/supabase'
import type { Recharge, Provider, PhoneNumber } from '../types'
import { StatusBadge } from '../components/Badge'
import { Modal } from '../components/Modal'
import { LoadingState, ErrorState, EmptyState } from '../components/States'

export function RechargesPage() {
  const [recharges, setRecharges] = useState<Recharge[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [numbers, setNumbers] = useState<PhoneNumber[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [rechargesRes, providersRes, numbersRes] = await Promise.all([
        supabase.from(DB.recharges).select('*, provider:providers(*)').order('created_at', { ascending: false }),
        supabase.from(DB.providers).select('*').order('name'),
        supabase.from(DB.phoneNumbers).select('*').order('number'),
      ])
      setRecharges(rechargesRes.data || [])
      setProviders(providersRes.data || [])
      setNumbers(numbersRes.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = recharges.filter((r) => {
    const matchSearch = !search || r.phone_number.includes(search) || r.reference?.toLowerCase().includes(search.toLowerCase()) || r.customer_phone?.includes(search)
    const matchStatus = filterStatus === 'all' || r.status === filterStatus
    return matchSearch && matchStatus
  })

  const totalAmount = filtered.filter((r) => r.status === 'completed').reduce((s, r) => s + Number(r.amount), 0)

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه العملية؟')) return
    const { error } = await supabase.from(DB.recharges).delete().eq('id', id)
    if (error) { alert('حدث خطأ'); return }
    setRecharges(recharges.filter((r) => r.id !== id))
  }

  const handleStatusChange = async (recharge: Recharge, status: Recharge['status']) => {
    const { error } = await supabase.from(DB.recharges).update({ status }).eq('id', recharge.id)
    if (error) { alert('حدث خطأ'); return }
    // If completed, update phone balance
    if (status === 'completed' && recharge.status !== 'completed') {
      const phone = numbers.find((n) => n.number === recharge.phone_number)
      if (phone) {
        await supabase.from(DB.phoneNumbers).update({ balance: phone.balance + Number(recharge.amount) }).eq('id', phone.id)
      }
    }
    setRecharges(recharges.map((r) => r.id === recharge.id ? { ...r, status } : r))
    load()
  }

  const handleSave = async (data: Partial<Recharge>) => {
    setSaving(true)
    const { error } = await supabase.from(DB.recharges).insert({
      phone_number: data.phone_number,
      amount: data.amount,
      provider_id: data.provider_id || null,
      status: data.status || 'pending',
      reference: `REF${Date.now()}`,
      customer_phone: data.customer_phone || null,
      notes: data.notes || null,
    })
    setSaving(false)
    if (error) { alert('حدث خطأ'); return false }
    setModalOpen(false)
    load()
    return true
  }

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={load} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)' }} className="stats-grid">
        <SummaryCard label="إجمالي العمليات" value={filtered.length} color="var(--primary-600)" bg="var(--primary-50)" icon={<Zap size={20} />} />
        <SummaryCard label="مكتملة" value={filtered.filter((r) => r.status === 'completed').length} color="var(--success-600)" bg="var(--success-50)" icon={<CheckCircle2 size={20} />} />
        <SummaryCard label="معلقة" value={filtered.filter((r) => r.status === 'pending').length} color="var(--warning-600)" bg="var(--warning-50)" icon={<Clock size={20} />} />
        <SummaryCard label="إجمالي المبلغ" value={`${totalAmount} ج`} color="var(--secondary-600)" bg="var(--secondary-50)" icon={<Zap size={20} />} />
      </div>

      {/* Toolbar */}
      <div className="card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={18} style={{ position: 'absolute', right: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
          <input className="input" placeholder="بحث برقم الهاتف أو المرجع..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingRight: 'var(--space-10)' }} />
        </div>
        <select className="input" style={{ width: 'auto' }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">كل الحالات</option>
          <option value="completed">مكتملة</option>
          <option value="pending">معلقة</option>
          <option value="failed">فاشلة</option>
          <option value="refunded">مسترجعة</option>
        </select>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <Plus size={18} /> عملية شحن
        </button>
      </div>

      {/* Table */}
      <div className="card table-wrapper" style={{ overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <EmptyState icon={<Zap size={28} />} title="لا توجد عمليات شحن" description="لم يتم العثور على عمليات مطابقة." />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--neutral-50)', borderBottom: '2px solid var(--neutral-200)' }}>
                <Th>رقم الهاتف</Th>
                <Th>المبلغ</Th>
                <Th>المزود</Th>
                <Th>المرجع</Th>
                <Th>الحالة</Th>
                <Th>التاريخ</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.id} className="animate-fade-in" style={{ borderBottom: '1px solid var(--neutral-100)', animationDelay: `${i * 30}ms` }} onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--neutral-50)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                  <Td><span style={{ fontWeight: 600, fontSize: '14px', fontFamily: 'monospace' }}>{r.phone_number}</span></Td>
                  <Td><span style={{ fontWeight: 700, color: 'var(--primary-600)' }}>{r.amount} ج</span></Td>
                  <Td><span style={{ fontSize: '13px', color: 'var(--neutral-600)' }}>{r.provider?.name || '—'}</span></Td>
                  <Td><span style={{ fontSize: '12px', color: 'var(--neutral-500)', fontFamily: 'monospace' }}>{r.reference || '—'}</span></Td>
                  <Td><StatusBadge status={r.status} /></Td>
                  <Td><span style={{ fontSize: '12px', color: 'var(--neutral-500)' }}>{formatDate(r.created_at)}</span></Td>
                  <Td>
                    <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                      {r.status === 'pending' && (
                        <>
                          <button className="btn btn-ghost" onClick={() => handleStatusChange(r, 'completed')} title="تأكيد" style={{ color: 'var(--success-600)' }}>
                            <CheckCircle2 size={16} />
                          </button>
                          <button className="btn btn-ghost" onClick={() => handleStatusChange(r, 'failed')} title="رفض" style={{ color: 'var(--error-600)' }}>
                            <XCircle size={16} />
                          </button>
                        </>
                      )}
                      {r.status === 'completed' && (
                        <button className="btn btn-ghost" onClick={() => handleStatusChange(r, 'refunded')} title="استرجاع" style={{ color: 'var(--warning-600)' }}>
                          <RotateCcw size={16} />
                        </button>
                      )}
                      <button className="btn btn-ghost" onClick={() => handleDelete(r.id)} style={{ color: 'var(--error-500)' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <RechargeModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} providers={providers} numbers={numbers} saving={saving} />
    </div>
  )
}

function SummaryCard({ label, value, color, bg, icon }: { label: string; value: number | string; color: string; bg: string; icon: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
      <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-md)', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
        {icon}
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

function RechargeModal({ open, onClose, onSave, providers, numbers, saving }: {
  open: boolean
  onClose: () => void
  onSave: (data: Partial<Recharge>) => Promise<boolean>
  providers: Provider[]
  numbers: PhoneNumber[]
  saving: boolean
}) {
  const [form, setForm] = useState({
    phone_number: '',
    amount: 50,
    provider_id: '',
    status: 'pending' as Recharge['status'],
    customer_phone: '',
    notes: '',
  })

  useEffect(() => {
    if (open) setForm({ phone_number: '', amount: 50, provider_id: '', status: 'pending', customer_phone: '', notes: '' })
  }, [open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(form)
  }

  const handleNumberSelect = (num: string) => {
    setForm({ ...form, phone_number: num })
    const phone = numbers.find((n) => n.number === num)
    if (phone?.provider_id) setForm((prev) => ({ ...prev, provider_id: phone.provider_id! }))
  }

  return (
    <Modal open={open} onClose={onClose} title="إضافة عملية شحن">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div>
          <label className="label">رقم الهاتف *</label>
          <input className="input" list="numbers-list" value={form.phone_number} onChange={(e) => handleNumberSelect(e.target.value)} required placeholder="أدخل أو اختر رقم..." style={{ fontFamily: 'monospace' }} />
          <datalist id="numbers-list">
            {numbers.map((n) => <option key={n.id} value={n.number} />)}
          </datalist>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <div>
            <label className="label">المبلغ (جنيه) *</label>
            <input className="input" type="number" min="1" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} required />
          </div>
          <div>
            <label className="label">المزود</label>
            <select className="input" value={form.provider_id} onChange={(e) => setForm({ ...form, provider_id: e.target.value })}>
              <option value="">بدون مزود</option>
              {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <div>
            <label className="label">هاتف العميل</label>
            <input className="input" value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} style={{ fontFamily: 'monospace' }} />
          </div>
          <div>
            <label className="label">الحالة</label>
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Recharge['status'] })}>
              <option value="pending">معلقة</option>
              <option value="completed">مكتملة</option>
              <option value="failed">فاشلة</option>
              <option value="refunded">مسترجعة</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label">ملاحظات</label>
          <textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>إلغاء</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'جاري الحفظ...' : 'حفظ'}</button>
        </div>
      </form>
    </Modal>
  )
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
}
