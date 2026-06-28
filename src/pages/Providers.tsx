import { useEffect, useState, useCallback } from 'react'
import { Plus, Building2, Trash2, CreditCard as Edit3, Link, Key, CircleCheck as CheckCircle2, Circle as XCircle } from 'lucide-react'
import { supabase, DB } from '../lib/supabase'
import type { Provider } from '../types'
import { StatusBadge } from '../components/Badge'
import { Modal } from '../components/Modal'
import { LoadingState, ErrorState, EmptyState } from '../components/States'

export function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editProvider, setEditProvider] = useState<Provider | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.from(DB.providers).select('*').order('name')
      if (error) throw error
      setProviders(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المزود؟')) return
    const { error } = await supabase.from(DB.providers).delete().eq('id', id)
    if (error) { alert('حدث خطأ'); return }
    setProviders(providers.filter((p) => p.id !== id))
  }

  const handleSave = async (data: Partial<Provider>) => {
    setSaving(true)
    let result
    if (editProvider) {
      result = await supabase.from(DB.providers).update({
        name: data.name,
        code: data.code,
        api_url: data.api_url || null,
        api_key: data.api_key || null,
        status: data.status,
      }).eq('id', editProvider.id)
    } else {
      result = await supabase.from(DB.providers).insert({
        name: data.name,
        code: data.code,
        api_url: data.api_url || null,
        api_key: data.api_key || null,
        status: data.status || 'active',
      })
    }
    setSaving(false)
    if (result.error) { alert('حدث خطأ: ' + result.error.message); return false }
    setModalOpen(false)
    setEditProvider(null)
    load()
    return true
  }

  const handleToggleStatus = async (provider: Provider) => {
    const newStatus = provider.status === 'active' ? 'inactive' : 'active'
    const { error } = await supabase.from(DB.providers).update({ status: newStatus }).eq('id', provider.id)
    if (error) { alert('حدث خطأ'); return }
    setProviders(providers.map((p) => p.id === provider.id ? { ...p, status: newStatus } : p))
  }

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={load} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div className="card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: '14px', color: 'var(--neutral-600)' }}>
          المزودون هم شركات الاتصالات التي تُنفّذ عمليات الشحن (فودافون، أورانج، اتصالات...). أضف مزوداً واربطه بـ API الخاص به.
        </p>
        <button className="btn btn-primary" onClick={() => { setEditProvider(null); setModalOpen(true) }}>
          <Plus size={18} /> مزود جديد
        </button>
      </div>

      {providers.length === 0 ? (
        <div className="card">
          <EmptyState icon={<Building2 size={28} />} title="لا يوجد مزودين" description="أضف مزوداً للبدء." />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'var(--space-4)' }}>
          {providers.map((p, i) => (
            <div key={p.id} className="card animate-slide-up" style={{ padding: 'var(--space-5)', animationDelay: `${i * 50}ms`, transition: 'transform 200ms' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)' }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, var(--primary-500), var(--secondary-500))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '20px', fontWeight: 700 }}>
                    {p.name.charAt(0)}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--neutral-900)' }}>{p.name}</h3>
                    <p style={{ fontSize: '12px', color: 'var(--neutral-500)', fontFamily: 'monospace' }}>{p.code}</p>
                    <div style={{ marginTop: '4px' }}><StatusBadge status={p.status} /></div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                  <button className="btn btn-ghost" onClick={() => handleToggleStatus(p)} title={p.status === 'active' ? 'إيقاف' : 'تفعيل'}>
                    {p.status === 'active' ? <CheckCircle2 size={16} style={{ color: 'var(--success-600)' }} /> : <XCircle size={16} style={{ color: 'var(--neutral-400)' }} />}
                  </button>
                  <button className="btn btn-ghost" onClick={() => { setEditProvider(p); setModalOpen(true) }}>
                    <Edit3 size={16} />
                  </button>
                  <button className="btn btn-ghost" onClick={() => handleDelete(p.id)} style={{ color: 'var(--error-500)' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {p.api_url && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '13px', color: 'var(--neutral-600)' }}>
                    <Link size={14} style={{ color: 'var(--neutral-400)' }} />
                    <span style={{ fontFamily: 'monospace', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.api_url}</span>
                  </div>
                )}
                {p.api_key && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '13px', color: 'var(--neutral-600)' }}>
                    <Key size={14} style={{ color: 'var(--neutral-400)' }} />
                    <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>••••••••••••</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ProviderModal open={modalOpen} onClose={() => { setModalOpen(false); setEditProvider(null) }} onSave={handleSave} provider={editProvider} saving={saving} />
    </div>
  )
}

function ProviderModal({ open, onClose, onSave, provider, saving }: {
  open: boolean
  onClose: () => void
  onSave: (data: Partial<Provider>) => Promise<boolean>
  provider: Provider | null
  saving: boolean
}) {
  const [form, setForm] = useState({
    name: '',
    code: '',
    api_url: '',
    api_key: '',
    status: 'active' as Provider['status'],
  })

  useEffect(() => {
    if (provider) {
      setForm({
        name: provider.name,
        code: provider.code,
        api_url: provider.api_url || '',
        api_key: provider.api_key || '',
        status: provider.status,
      })
    } else {
      setForm({ name: '', code: '', api_url: '', api_key: '', status: 'active' })
    }
  }, [provider, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(form)
  }

  return (
    <Modal open={open} onClose={onClose} title={provider ? 'تعديل المزود' : 'إضافة مزود جديد'}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-4)' }}>
          <div>
            <label className="label">الاسم *</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">الكود *</label>
            <input className="input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toLowerCase() })} required placeholder="vodafone" style={{ fontFamily: 'monospace' }} />
          </div>
        </div>
        <div>
          <label className="label">API URL</label>
          <input className="input" value={form.api_url} onChange={(e) => setForm({ ...form, api_url: e.target.value })} placeholder="https://api.provider.com/recharge" style={{ fontFamily: 'monospace' }} />
        </div>
        <div>
          <label className="label">API Key</label>
          <input className="input" type="password" value={form.api_key} onChange={(e) => setForm({ ...form, api_key: e.target.value })} placeholder="مفتاح API الخاص بالمزود" style={{ fontFamily: 'monospace' }} />
        </div>
        <div>
          <label className="label">الحالة</label>
          <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Provider['status'] })}>
            <option value="active">نشط</option>
            <option value="inactive">غير نشط</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>إلغاء</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'جاري الحفظ...' : 'حفظ'}</button>
        </div>
      </form>
    </Modal>
  )
}
