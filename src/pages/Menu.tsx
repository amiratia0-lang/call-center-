import { useEffect, useState } from 'react'
import { Plus, UtensilsCrossed, Trash2, Pencil } from 'lucide-react'
import { supabase, DB } from '../lib/supabase'
import { Modal } from '../components/Modal'
import { LoadingState, ErrorState, EmptyState } from '../components/States'
import type { MenuItem, Company } from '../types'

export function MenuPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [items, setItems] = useState<MenuItem[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompany, setSelectedCompany] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<MenuItem | null>(null)
  const [form, setForm] = useState({ name: '', description: '', price: '', category: '', is_available: true, sort_order: 0 })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadCompanies()
  }, [])

  useEffect(() => {
    if (selectedCompany) loadItems()
  }, [selectedCompany])

  async function loadCompanies() {
    try {
      const { data, error } = await supabase.from(DB.companies).select('*').order('name')
      if (error) throw error
      setCompanies(data || [])
      if (data && data.length > 0 && !selectedCompany) setSelectedCompany(data[0].id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }

  async function loadItems() {
    setLoading(true)
    try {
      const { data, error } = await supabase.from(DB.menuItems).select('*').eq('company_id', selectedCompany).order('sort_order')
      if (error) throw error
      setItems(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }

  function openAdd() {
    setEditing(null)
    setForm({ name: '', description: '', price: '', category: '', is_available: true, sort_order: 0 })
    setModalOpen(true)
  }

  function openEdit(item: MenuItem) {
    setEditing(item)
    setForm({ name: item.name, description: item.description || '', price: String(item.price), category: item.category, is_available: item.is_available, sort_order: item.sort_order })
    setModalOpen(true)
  }

  async function save() {
    setSaving(true)
    try {
      const payload = {
        company_id: selectedCompany,
        name: form.name,
        description: form.description || null,
        price: Number(form.price) || 0,
        category: form.category || 'general',
        is_available: form.is_available,
        sort_order: form.sort_order,
      }
      if (editing) {
        const { error } = await supabase.from(DB.menuItems).update(payload).eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from(DB.menuItems).insert(payload)
        if (error) throw error
      }
      setModalOpen(false)
      await loadItems()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    if (!confirm('حذف هذا الصنف؟')) return
    try {
      const { error } = await supabase.from(DB.menuItems).delete().eq('id', id)
      if (error) throw error
      await loadItems()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ')
    }
  }

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={loadItems} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-4)' }}>
        <select className="input" style={{ maxWidth: '300px' }} value={selectedCompany} onChange={(e) => setSelectedCompany(e.target.value)}>
          {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button className="btn btn-primary" onClick={openAdd} disabled={!selectedCompany}>
          <Plus size={18} /> إضافة صنف
        </button>
      </div>

      {items.length === 0 ? (
        <div className="card">
          <EmptyState icon={<UtensilsCrossed size={32} />} title="لا أصناف" description="أضف أصناف للمنيو" />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-4)' }}>
          {items.map((item) => (
            <div key={item.id} className="card animate-slide-up" style={{ padding: 'var(--space-5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--neutral-900)' }}>{item.name}</h3>
                  <p style={{ fontSize: '12px', color: 'var(--neutral-500)' }}>{item.category}</p>
                </div>
                <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary-600)' }}>{item.price} جنيه</span>
              </div>
              {item.description && (
                <p style={{ fontSize: '13px', color: 'var(--neutral-600)', marginBottom: 'var(--space-3)', lineHeight: 1.5 }}>{item.description}</p>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: item.is_available ? 'var(--success-100)' : 'var(--neutral-100)', color: item.is_available ? 'var(--success-700)' : 'var(--neutral-500)' }}>
                  {item.is_available ? 'متاح' : 'غير متاح'}
                </span>
                <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                  <button className="btn btn-ghost" onClick={() => openEdit(item)}><Pencil size={14} /></button>
                  <button className="btn btn-ghost" onClick={() => remove(item.id)}><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'تعديل صنف' : 'إضافة صنف'} size="md">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <label className="label">الاسم</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="شاورما عربي" />
          </div>
          <div>
            <label className="label">الوصف</label>
            <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div>
              <label className="label">السعر (جنيه)</label>
              <input type="number" className="input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
            <div>
              <label className="label">التصنيف</label>
              <input className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="ساندويتشات" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '14px', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.is_available} onChange={(e) => setForm({ ...form, is_available: e.target.checked })} />
              متاح
            </label>
          </div>
          <button className="btn btn-primary" onClick={save} disabled={saving || !form.name}>
            {saving ? 'جاري الحفظ...' : 'حفظ'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
