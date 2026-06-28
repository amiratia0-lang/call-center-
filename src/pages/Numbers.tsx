import { useEffect, useState, useCallback } from 'react'
import { Plus, Search, Smartphone, Trash2, CreditCard as Edit3, Phone, User, Wallet, Zap } from 'lucide-react'
import { supabase, DB, callEdgeFunction, EDGE_FUNCTIONS } from '../lib/supabase'
import type { PhoneNumber, Provider } from '../types'
import { StatusBadge } from '../components/Badge'
import { Modal } from '../components/Modal'
import { LoadingState, ErrorState, EmptyState } from '../components/States'

export function NumbersPage() {
  const [numbers, setNumbers] = useState<PhoneNumber[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editNumber, setEditNumber] = useState<PhoneNumber | null>(null)
  const [saving, setSaving] = useState(false)
  const [lookupOpen, setLookupOpen] = useState(false)
  const [lookupNumber, setLookupNumber] = useState('')
  const [lookupResult, setLookupResult] = useState<any>(null)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [numbersRes, providersRes] = await Promise.all([
        supabase.from(DB.phoneNumbers).select('*, provider:providers(*)').order('created_at', { ascending: false }),
        supabase.from(DB.providers).select('*').order('name'),
      ])
      setNumbers(numbersRes.data || [])
      setProviders(providersRes.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = numbers.filter((n) => {
    const matchSearch = !search || n.number.includes(search) || n.owner_name?.toLowerCase().includes(search.toLowerCase()) || n.owner_phone?.includes(search)
    const matchStatus = filterStatus === 'all' || n.status === filterStatus
    return matchSearch && matchStatus
  })

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الرقم؟')) return
    const { error } = await supabase.from(DB.phoneNumbers).delete().eq('id', id)
    if (error) { alert('حدث خطأ'); return }
    setNumbers(numbers.filter((n) => n.id !== id))
  }

  const handleSave = async (data: Partial<PhoneNumber>) => {
    setSaving(true)
    let result
    if (editNumber) {
      result = await supabase.from(DB.phoneNumbers).update({
        number: data.number,
        country: data.country,
        provider_id: data.provider_id || null,
        balance: data.balance || 0,
        status: data.status,
        owner_name: data.owner_name || null,
        owner_phone: data.owner_phone || null,
        notes: data.notes || null,
      }).eq('id', editNumber.id)
    } else {
      result = await supabase.from(DB.phoneNumbers).insert({
        number: data.number,
        country: data.country || 'EG',
        provider_id: data.provider_id || null,
        balance: data.balance || 0,
        status: data.status || 'available',
        owner_name: data.owner_name || null,
        owner_phone: data.owner_phone || null,
        notes: data.notes || null,
      })
    }
    setSaving(false)
    if (result.error) { alert('حدث خطأ'); return false }
    setModalOpen(false)
    setEditNumber(null)
    load()
    return true
  }

  const handleLookup = async () => {
    if (!lookupNumber) return
    setLookupLoading(true)
    setLookupError(null)
    setLookupResult(null)
    try {
      const result = await callEdgeFunction(EDGE_FUNCTIONS.rechargeLookup, { phone_number: lookupNumber })
      setLookupResult(result)
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setLookupLoading(false)
    }
  }

  const handleQuickRecharge = async (phoneNumber: string, amount: number) => {
    const provider = numbers.find((n) => n.number === phoneNumber)?.provider
    const { error } = await supabase.from(DB.recharges).insert({
      phone_number: phoneNumber,
      amount,
      provider_id: provider?.id || null,
      status: 'completed',
      reference: `REF${Date.now()}`,
      notes: 'شحن سريع من صفحة الأرقام',
    })
    if (error) { alert('حدث خطأ'); return }
    // Update balance
    await supabase.from(DB.phoneNumbers).update({ balance: (numbers.find((n) => n.number === phoneNumber)?.balance || 0) + amount }).eq('number', phoneNumber)
    alert(`تم شحن ${amount} جنيه للرقم ${phoneNumber}`)
    load()
  }

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={load} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Toolbar */}
      <div className="card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={18} style={{ position: 'absolute', right: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
          <input className="input" placeholder="بحث برقم الهاتف أو المالك..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingRight: 'var(--space-10)' }} />
        </div>
        <select className="input" style={{ width: 'auto' }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">كل الحالات</option>
          <option value="available">متاح</option>
          <option value="in_use">قيد الاستخدام</option>
          <option value="suspended">موقوف</option>
          <option value="expired">منتهي الصلاحية</option>
        </select>
        <button className="btn btn-secondary" onClick={() => setLookupOpen(true)}>
          <Search size={18} /> بحث عن رقم
        </button>
        <button className="btn btn-primary" onClick={() => { setEditNumber(null); setModalOpen(true) }}>
          <Plus size={18} /> رقم جديد
        </button>
      </div>

      {/* Numbers Grid */}
      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState icon={<Smartphone size={28} />} title="لا توجد أرقام" description="أضف رقماً جديداً للبدء." />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
          {filtered.map((num, i) => (
            <div
              key={num.id}
              className="card animate-slide-up"
              style={{ padding: 'var(--space-5)', animationDelay: `${i * 50}ms`, transition: 'transform 200ms, box-shadow 200ms' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-500), var(--secondary-500))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    <Smartphone size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--neutral-900)', fontFamily: 'monospace', letterSpacing: '0.5px' }}>{num.number}</h3>
                    <StatusBadge status={num.status} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                  <button className="btn btn-ghost" onClick={() => { setEditNumber(num); setModalOpen(true) }} aria-label="تعديل">
                    <Edit3 size={16} />
                  </button>
                  <button className="btn btn-ghost" onClick={() => handleDelete(num.id)} aria-label="حذف" style={{ color: 'var(--error-500)' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                <InfoRow icon={<Wallet size={14} />} label="الرصيد" value={`${num.balance} جنيه`} />
                {num.provider && <InfoRow icon={<Phone size={14} />} label="المزود" value={num.provider.name} />}
                {num.owner_name && <InfoRow icon={<User size={14} />} label="المالك" value={num.owner_name} />}
                {num.owner_phone && <InfoRow icon={<Phone size={14} />} label="هاتف المالك" value={num.owner_phone} />}
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button className="btn btn-primary" style={{ flex: 1, fontSize: '13px' }} onClick={() => handleQuickRecharge(num.number, 50)}>
                  <Zap size={14} /> شحن 50 ج
                </button>
                <button className="btn btn-secondary" style={{ flex: 1, fontSize: '13px' }} onClick={() => handleQuickRecharge(num.number, 100)}>
                  <Zap size={14} /> شحن 100 ج
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <NumberModal open={modalOpen} onClose={() => { setModalOpen(false); setEditNumber(null) }} onSave={handleSave} number={editNumber} providers={providers} saving={saving} />

      {/* Lookup Modal */}
      <Modal open={lookupOpen} onClose={() => { setLookupOpen(false); setLookupResult(null); setLookupNumber(''); setLookupError(null) }} title="البحث عن رقم للشحن">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <p style={{ fontSize: '14px', color: 'var(--neutral-600)' }}>
            أدخل رقم الهاتف للبحث عنه في قاعدة البيانات أو لدى المزود الخارجي.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <input
              className="input"
              placeholder="رقم الهاتف..."
              value={lookupNumber}
              onChange={(e) => setLookupNumber(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
              style={{ fontFamily: 'monospace' }}
            />
            <button className="btn btn-primary" onClick={handleLookup} disabled={lookupLoading}>
              {lookupLoading ? <div className="spinner" /> : <Search size={18} />}
              بحث
            </button>
          </div>

          {lookupError && (
            <div style={{ padding: 'var(--space-3)', background: 'var(--error-50)', borderRadius: 'var(--radius-md)', color: 'var(--error-700)', fontSize: '14px' }}>
              {lookupError}
            </div>
          )}

          {lookupResult && (
            <div style={{ padding: 'var(--space-4)', background: 'var(--neutral-50)', borderRadius: 'var(--radius-md)' }}>
              {lookupResult.found ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                    <CheckCircle2Icon />
                    <span style={{ fontWeight: 700, color: 'var(--success-700)' }}>تم العثور على الرقم</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <ResultRow label="الرقم" value={lookupResult.data.number} />
                    <ResultRow label="الرصيد" value={`${lookupResult.data.balance} جنيه`} />
                    <ResultRow label="الحالة" value={lookupResult.data.status} />
                    <ResultRow label="المزود" value={lookupResult.data.provider || '—'} />
                    {lookupResult.data.owner_name && <ResultRow label="المالك" value={lookupResult.data.owner_name} />}
                  </div>
                  {lookupResult.recent_recharges?.length > 0 && (
                    <div style={{ marginTop: 'var(--space-3)' }}>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--neutral-700)', marginBottom: 'var(--space-2)' }}>آخر عمليات الشحن:</p>
                      {lookupResult.recent_recharges.map((r: any) => (
                        <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--neutral-200)', fontSize: '13px' }}>
                          <span>{r.amount} جنيه</span>
                          <StatusBadge status={r.status} />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                    <AlertCircleIcon />
                    <span style={{ fontWeight: 700, color: 'var(--warning-600)' }}>الرقم غير موجود محلياً</span>
                  </div>
                  {lookupResult.external_lookup && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      <ResultRow label="البحث الخارجي" value="متاح" />
                      <ResultRow label="الرصيد التقريبي" value={`${lookupResult.external_lookup.simulated_balance} جنيه`} />
                      <ResultRow label="المزودين المتاحين" value={lookupResult.external_lookup.providers.join('، ')} />
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '13px' }}>
      <span style={{ color: 'var(--neutral-400)' }}>{icon}</span>
      <span style={{ color: 'var(--neutral-500)', minWidth: '80px' }}>{label}:</span>
      <span style={{ color: 'var(--neutral-800)', fontWeight: 600 }}>{value}</span>
    </div>
  )
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
      <span style={{ color: 'var(--neutral-500)' }}>{label}</span>
      <span style={{ color: 'var(--neutral-800)', fontWeight: 600 }}>{value}</span>
    </div>
  )
}

function CheckCircle2Icon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success-600)" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
}

function AlertCircleIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--warning-600)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
}

function NumberModal({ open, onClose, onSave, number, providers, saving }: {
  open: boolean
  onClose: () => void
  onSave: (data: Partial<PhoneNumber>) => Promise<boolean>
  number: PhoneNumber | null
  providers: Provider[]
  saving: boolean
}) {
  const [form, setForm] = useState({
    number: '',
    country: 'EG',
    provider_id: '',
    balance: 0,
    status: 'available' as PhoneNumber['status'],
    owner_name: '',
    owner_phone: '',
    notes: '',
  })

  useEffect(() => {
    if (number) {
      setForm({
        number: number.number,
        country: number.country,
        provider_id: number.provider_id || '',
        balance: number.balance,
        status: number.status,
        owner_name: number.owner_name || '',
        owner_phone: number.owner_phone || '',
        notes: number.notes || '',
      })
    } else {
      setForm({ number: '', country: 'EG', provider_id: '', balance: 0, status: 'available', owner_name: '', owner_phone: '', notes: '' })
    }
  }, [number, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(form)
  }

  return (
    <Modal open={open} onClose={onClose} title={number ? 'تعديل الرقم' : 'إضافة رقم جديد'}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-4)' }}>
          <div>
            <label className="label">رقم الهاتف *</label>
            <input className="input" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} required style={{ fontFamily: 'monospace' }} />
          </div>
          <div>
            <label className="label">الدولة</label>
            <input className="input" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <div>
            <label className="label">المزود</label>
            <select className="input" value={form.provider_id} onChange={(e) => setForm({ ...form, provider_id: e.target.value })}>
              <option value="">بدون مزود</option>
              {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">الرصيد</label>
            <input className="input" type="number" step="0.01" value={form.balance} onChange={(e) => setForm({ ...form, balance: Number(e.target.value) })} />
          </div>
        </div>
        <div>
          <label className="label">الحالة</label>
          <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as PhoneNumber['status'] })}>
            <option value="available">متاح</option>
            <option value="in_use">قيد الاستخدام</option>
            <option value="suspended">موقوف</option>
            <option value="expired">منتهي الصلاحية</option>
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <div>
            <label className="label">اسم المالك</label>
            <input className="input" value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} />
          </div>
          <div>
            <label className="label">هاتف المالك</label>
            <input className="input" value={form.owner_phone} onChange={(e) => setForm({ ...form, owner_phone: e.target.value })} style={{ fontFamily: 'monospace' }} />
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
