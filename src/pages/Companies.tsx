import { useEffect, useState } from 'react'
import { Plus, Building2, Phone, Trash2, Pencil } from 'lucide-react'
import { supabase, DB } from '../lib/supabase'
import { Modal } from '../components/Modal'
import { StatusBadge, IndustryBadge } from '../components/Badge'
import { LoadingState, ErrorState, EmptyState } from '../components/States'
import type { Company } from '../types'

export function CompaniesPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [companies, setCompanies] = useState<Company[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Company | null>(null)
  const [form, setForm] = useState({ name: '', industry: 'general', phone_number: '', greeting: '', status: 'active' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadCompanies()
  }, [])

  async function loadCompanies() {
    setLoading(true)
    setError('')
    try {
      const { data, error } = await supabase.from(DB.companies).select('*').order('created_at', { ascending: false })
      if (error) throw error
      setCompanies(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }

  function openAdd() {
    setEditing(null)
    setForm({ name: '', industry: 'general', phone_number: '', greeting: 'مرحباً بك، كيف يمكنني مساعدتك؟', status: 'active' })
    setModalOpen(true)
  }

  function openEdit(company: Company) {
    setEditing(company)
    setForm({
      name: company.name,
      industry: company.industry,
      phone_number: company.phone_number || '',
      greeting: company.greeting,
      status: company.status,
    })
    setModalOpen(true)
  }

  async function save() {
    setSaving(true)
    try {
      if (editing) {
        const { error } = await supabase.from(DB.companies).update(form).eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from(DB.companies).insert(form)
        if (error) throw error
      }
      setModalOpen(false)
      await loadCompanies()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذه الشركة؟ سيتم حذف كل بياناتها.')) return
    try {
      const { error } = await supabase.from(DB.companies).delete().eq('id', id)
      if (error) throw error
      await loadCompanies()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ')
    }
  }

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={loadCompanies} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ color: 'var(--neutral-500)', fontSize: '14px' }}>{companies.length} شركة مسجلة</p>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={18} /> إضافة شركة
        </button>
      </div>

      {companies.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Building2 size={32} />}
            title="لا توجد شركات"
            description="ابدأ بإضافة أول شركة لاستخدام مركز الاتصال الذكي"
            action={<button className="btn btn-primary" onClick={openAdd}><Plus size={18} /> إضافة شركة</button>}
          />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
          {companies.map((company) => (
            <div key={company.id} className="card animate-slide-up" style={{ padding: 'var(--space-5)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: 'var(--radius-md)',
                      background: 'linear-gradient(135deg, var(--primary-500), var(--secondary-500))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '18px',
                    }}
                  >
                    {company.name.charAt(0)}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--neutral-900)' }}>{company.name}</h3>
                    <div style={{ marginTop: '4px' }}>
                      <IndustryBadge industry={company.industry} />
                    </div>
                  </div>
                </div>
                <StatusBadge status={company.status} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)', fontSize: '13px', color: 'var(--neutral-600)' }}>
                <Phone size={14} />
                {company.phone_number || 'لا يوجد رقم'}
              </div>

              <p style={{ fontSize: '12px', color: 'var(--neutral-500)', marginBottom: 'var(--space-4)', lineHeight: 1.6, background: 'var(--neutral-50)', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)' }}>
                {company.greeting}
              </p>

              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => openEdit(company)}>
                  <Pencil size={14} /> تعديل
                </button>
                <button className="btn btn-danger" onClick={() => remove(company.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'تعديل شركة' : 'إضافة شركة'} size="md">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <label className="label">اسم الشركة</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="مثال: أرامكس للشحن" />
          </div>
          <div>
            <label className="label">نوع النشاط</label>
            <select className="input" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })}>
              <option value="general">عام</option>
              <option value="shipping">شحن</option>
              <option value="restaurant">مطعم</option>
              <option value="clinic">عيادة</option>
            </select>
          </div>
          <div>
            <label className="label">رقم الهاتف</label>
            <input className="input" value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} placeholder="+201000000000" />
          </div>
          <div>
            <label className="label">رسالة الترحيب (الرد الآلي)</label>
            <textarea className="input" rows={3} value={form.greeting} onChange={(e) => setForm({ ...form, greeting: e.target.value })} />
          </div>
          <div>
            <label className="label">الحالة</label>
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">نشط</option>
              <option value="inactive">غير نشط</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={save} disabled={saving || !form.name}>
            {saving ? 'جاري الحفظ...' : 'حفظ'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
