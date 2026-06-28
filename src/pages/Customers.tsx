import { useEffect, useState, useCallback } from 'react'
import { Plus, Search, Users, Trash2, Phone, Mail, Building2, CreditCard as Edit3, X } from 'lucide-react'
import { supabase, DB } from '../lib/supabase'
import type { Customer } from '../types'
import { StatusBadge } from '../components/Badge'
import { Modal } from '../components/Modal'
import { LoadingState, ErrorState, EmptyState } from '../components/States'

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.from(DB.customers).select('*').order('created_at', { ascending: false })
      if (error) throw error
      setCustomers(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = customers.filter((c) => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search) || c.email?.toLowerCase().includes(search.toLowerCase()) || c.company?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || c.status === filterStatus
    return matchSearch && matchStatus
  })

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العميل؟')) return
    const { error } = await supabase.from(DB.customers).delete().eq('id', id)
    if (error) {
      alert('حدث خطأ أثناء الحذف')
      return
    }
    setCustomers(customers.filter((c) => c.id !== id))
  }

  const handleSave = async (data: Partial<Customer>) => {
    setSaving(true)
    let result
    if (editCustomer) {
      result = await supabase.from(DB.customers).update({
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        company: data.company || null,
        status: data.status,
        notes: data.notes || null,
      }).eq('id', editCustomer.id)
    } else {
      result = await supabase.from(DB.customers).insert({
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        company: data.company || null,
        status: data.status || 'active',
        notes: data.notes || null,
      })
    }
    setSaving(false)
    if (result.error) {
      alert('حدث خطأ أثناء الحفظ')
      return false
    }
    setModalOpen(false)
    setEditCustomer(null)
    load()
    return true
  }

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={load} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div className="card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={18} style={{ position: 'absolute', right: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
          <input className="input" placeholder="بحث بالاسم أو الهاتف أو البريد..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingRight: 'var(--space-10)' }} />
        </div>
        <select className="input" style={{ width: 'auto' }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">كل الحالات</option>
          <option value="active">نشط</option>
          <option value="inactive">غير نشط</option>
          <option value="vip">مميز</option>
          <option value="blacklist">قائمة سوداء</option>
        </select>
        <button className="btn btn-primary" onClick={() => { setEditCustomer(null); setModalOpen(true) }}>
          <Plus size={18} /> عميل جديد
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState icon={<Users size={28} />} title="لا يوجد عملاء" description="لم يتم العثور على عملاء. أضف عميلاً جديداً للبدء." />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
          {filtered.map((customer, i) => (
            <div
              key={customer.id}
              className="card animate-slide-up"
              style={{ padding: 'var(--space-5)', animationDelay: `${i * 50}ms`, transition: 'transform 200ms, box-shadow 200ms' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-400), var(--secondary-400))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '18px' }}>
                    {customer.name.charAt(0)}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--neutral-900)' }}>{customer.name}</h3>
                    <StatusBadge status={customer.status} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                  <button className="btn btn-ghost" onClick={() => { setEditCustomer(customer); setModalOpen(true) }} aria-label="تعديل">
                    <Edit3 size={16} />
                  </button>
                  <button className="btn btn-ghost" onClick={() => handleDelete(customer.id)} aria-label="حذف" style={{ color: 'var(--error-500)' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <InfoRow icon={<Phone size={14} />} value={customer.phone} />
                {customer.email && <InfoRow icon={<Mail size={14} />} value={customer.email} />}
                {customer.company && <InfoRow icon={<Building2 size={14} />} value={customer.company} />}
              </div>

              {customer.notes && (
                <div style={{ marginTop: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--neutral-50)', borderRadius: 'var(--radius-md)', fontSize: '13px', color: 'var(--neutral-600)' }}>
                  {customer.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <CustomerModal open={modalOpen} onClose={() => { setModalOpen(false); setEditCustomer(null) }} onSave={handleSave} customer={editCustomer} saving={saving} />
    </div>
  )
}

function InfoRow({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '13px', color: 'var(--neutral-600)' }}>
      <span style={{ color: 'var(--neutral-400)' }}>{icon}</span>
      {value}
    </div>
  )
}

function CustomerModal({ open, onClose, onSave, customer, saving }: {
  open: boolean
  onClose: () => void
  onSave: (data: Partial<Customer>) => Promise<boolean>
  customer: Customer | null
  saving: boolean
}) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    status: 'active' as Customer['status'],
    notes: '',
  })

  useEffect(() => {
    if (customer) {
      setForm({
        name: customer.name,
        phone: customer.phone,
        email: customer.email || '',
        company: customer.company || '',
        status: customer.status,
        notes: customer.notes || '',
      })
    } else {
      setForm({ name: '', phone: '', email: '', company: '', status: 'active', notes: '' })
    }
  }, [customer, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(form)
  }

  return (
    <Modal open={open} onClose={onClose} title={customer ? 'تعديل العميل' : 'إضافة عميل جديد'}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <div>
            <label className="label">الاسم *</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">الهاتف *</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <div>
            <label className="label">البريد الإلكتروني</label>
            <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">الشركة</label>
            <input className="input" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label">الحالة</label>
          <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Customer['status'] })}>
            <option value="active">نشط</option>
            <option value="inactive">غير نشط</option>
            <option value="vip">مميز</option>
            <option value="blacklist">قائمة سوداء</option>
          </select>
        </div>
        <div>
          <label className="label">ملاحظات</label>
          <textarea className="input" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="ملاحظات عن العميل..." />
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>إلغاء</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'جاري الحفظ...' : 'حفظ'}</button>
        </div>
      </form>
    </Modal>
  )
}
