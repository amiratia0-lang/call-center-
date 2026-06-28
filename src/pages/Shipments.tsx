import { useEffect, useState } from 'react'
import { Package, Plus, Search, Trash2 } from 'lucide-react'
import { supabase, DB } from '../lib/supabase'
import { StatusBadge } from '../components/Badge'
import { LoadingState, ErrorState, EmptyState } from '../components/States'
import { Modal } from '../components/Modal'
import type { Shipment, Company } from '../types'

export function ShipmentsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [shipments, setShipments] = useState<(Shipment & { companies: Pick<Company, 'name'> })[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({
    company_id: '',
    tracking_number: '',
    caller_phone: '',
    status: 'pending',
    origin: '',
    destination: '',
    estimated_delivery: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const [shipRes, compRes] = await Promise.all([
        supabase.from(DB.shipments).select('*, companies(name)').order('created_at', { ascending: false }).limit(100),
        supabase.from(DB.companies).select('*').eq('industry', 'shipping').order('name'),
      ])
      if (shipRes.error) throw shipRes.error
      if (compRes.error) throw compRes.error
      setShipments(shipRes.data || [])
      setCompanies(compRes.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }

  async function save() {
    setSaving(true)
    try {
      const { error } = await supabase.from(DB.shipments).insert({
        company_id: form.company_id,
        tracking_number: form.tracking_number.toUpperCase(),
        caller_phone: form.caller_phone,
        status: form.status,
        origin: form.origin || null,
        destination: form.destination || null,
        estimated_delivery: form.estimated_delivery || null,
      })
      if (error) throw error
      setModalOpen(false)
      setForm({ company_id: '', tracking_number: '', caller_phone: '', status: 'pending', origin: '', destination: '', estimated_delivery: '' })
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    if (!confirm('حذف هذه الشحنة؟')) return
    try {
      const { error } = await supabase.from(DB.shipments).delete().eq('id', id)
      if (error) throw error
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ')
    }
  }

  async function updateStatus(id: string, status: Shipment['status']) {
    try {
      const { error } = await supabase.from(DB.shipments).update({ status }).eq('id', id)
      if (error) throw error
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ')
    }
  }

  const filtered = shipments.filter(
    (s) => !search || s.tracking_number.toLowerCase().includes(search.toLowerCase()) || s.caller_phone.includes(search),
  )

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={loadData} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-4)' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={16} style={{ position: 'absolute', right: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
          <input className="input" style={{ paddingRight: 'var(--space-10)' }} placeholder="ابحث برقم الشحنة أو الهاتف..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <Plus size={18} /> إضافة شحنة
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState icon={<Package size={32} />} title="لا شحنات" description="لم يتم تسجيل أي شحنات بعد" />
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-wrapper" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--neutral-50)', borderBottom: '1px solid var(--neutral-200)' }}>
                  <th style={thStyle}>رقم الشحنة</th>
                  <th style={thStyle}>الشركة</th>
                  <th style={thStyle}>هاتف المستلم</th>
                  <th style={thStyle}>من</th>
                  <th style={thStyle}>إلى</th>
                  <th style={thStyle}>الحالة</th>
                  <th style={thStyle}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ship) => (
                  <tr key={ship.id} style={{ borderBottom: '1px solid var(--neutral-100)' }}>
                    <td style={{ ...tdStyle, fontWeight: 700, color: 'var(--primary-700)' }}>{ship.tracking_number}</td>
                    <td style={tdStyle}>{ship.companies?.name}</td>
                    <td style={tdStyle}>{ship.caller_phone}</td>
                    <td style={tdStyle}>{ship.origin || '—'}</td>
                    <td style={tdStyle}>{ship.destination || '—'}</td>
                    <td style={tdStyle}>
                      <select
                        className="input"
                        style={{ fontSize: '12px', padding: 'var(--space-1) var(--space-2)', width: '130px' }}
                        value={ship.status}
                        onChange={(e) => updateStatus(ship.id, e.target.value as Shipment['status'])}
                      >
                        <option value="pending">قيد الانتظار</option>
                        <option value="in_transit">في الطريق</option>
                        <option value="out_for_delivery">خارج للتوصيل</option>
                        <option value="delivered">تم التوصيل</option>
                        <option value="returned">تم الإرجاع</option>
                      </select>
                    </td>
                    <td style={tdStyle}>
                      <button className="btn btn-ghost" onClick={() => remove(ship.id)}><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="إضافة شحنة" size="md">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <label className="label">الشركة</label>
            <select className="input" value={form.company_id} onChange={(e) => setForm({ ...form, company_id: e.target.value })}>
              <option value="">اختر شركة</option>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">رقم الشحنة</label>
            <input className="input" value={form.tracking_number} onChange={(e) => setForm({ ...form, tracking_number: e.target.value })} placeholder="ARMX001" />
          </div>
          <div>
            <label className="label">هاتف المستلم (للأمان)</label>
            <input className="input" value={form.caller_phone} onChange={(e) => setForm({ ...form, caller_phone: e.target.value })} placeholder="+201111111111" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div>
              <label className="label">من</label>
              <input className="input" value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} />
            </div>
            <div>
              <label className="label">إلى</label>
              <input className="input" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">موعد التسليم المتوقع</label>
            <input type="date" className="input" value={form.estimated_delivery} onChange={(e) => setForm({ ...form, estimated_delivery: e.target.value })} />
          </div>
          <button className="btn btn-primary" onClick={save} disabled={saving || !form.company_id || !form.tracking_number || !form.caller_phone}>
            {saving ? 'جاري الحفظ...' : 'حفظ'}
          </button>
        </div>
      </Modal>
    </div>
  )
}

const thStyle: React.CSSProperties = { textAlign: 'right', padding: 'var(--space-3) var(--space-4)', fontSize: '12px', fontWeight: 600, color: 'var(--neutral-600)', whiteSpace: 'nowrap' }
const tdStyle: React.CSSProperties = { padding: 'var(--space-3) var(--space-4)', fontSize: '13px', color: 'var(--neutral-800)', whiteSpace: 'nowrap' }
