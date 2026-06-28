import { useEffect, useState, useCallback } from 'react'
import { Plus, Search, Headphones, Trash2, Phone, Mail, CreditCard as Edit3 } from 'lucide-react'
import { supabase, DB } from '../lib/supabase'
import type { Agent, Call } from '../types'
import { StatusBadge } from '../components/Badge'
import { Modal } from '../components/Modal'
import { LoadingState, ErrorState, EmptyState } from '../components/States'

export function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [calls, setCalls] = useState<Call[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editAgent, setEditAgent] = useState<Agent | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [agentsRes, callsRes] = await Promise.all([
        supabase.from(DB.agents).select('*').order('name'),
        supabase.from(DB.calls).select('id, agent_id, status, duration, rating'),
      ])
      setAgents(agentsRes.data || [])
      setCalls((callsRes.data || []) as Call[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = agents.filter((a) => {
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.department.toLowerCase().includes(search.toLowerCase()) || a.email?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || a.status === filterStatus
    return matchSearch && matchStatus
  })

  const getAgentStats = (agentId: string) => {
    const agentCalls = calls.filter((c) => c.agent_id === agentId)
    const completed = agentCalls.filter((c) => c.status === 'completed')
    const rated = agentCalls.filter((c) => c.rating != null)
    const avgRating = rated.length ? rated.reduce((s, c) => s + (c.rating || 0), 0) / rated.length : 0
    const avgDuration = completed.length ? completed.reduce((s, c) => s + c.duration, 0) / completed.length : 0
    return {
      total: agentCalls.length,
      avgRating: Number(avgRating.toFixed(1)),
      avgDuration: Math.round(avgDuration),
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الوكيل؟')) return
    const { error } = await supabase.from(DB.agents).delete().eq('id', id)
    if (error) {
      alert('حدث خطأ أثناء الحذف')
      return
    }
    setAgents(agents.filter((a) => a.id !== id))
  }

  const handleSave = async (data: Partial<Agent>) => {
    setSaving(true)
    let result
    if (editAgent) {
      result = await supabase.from(DB.agents).update({
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        department: data.department,
        status: data.status,
        extension: data.extension || null,
      }).eq('id', editAgent.id)
    } else {
      result = await supabase.from(DB.agents).insert({
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        department: data.department || 'general',
        status: data.status || 'offline',
        extension: data.extension || null,
      })
    }
    setSaving(false)
    if (result.error) {
      alert('حدث خطأ أثناء الحفظ')
      return false
    }
    setModalOpen(false)
    setEditAgent(null)
    load()
    return true
  }

  const handleStatusChange = async (agent: Agent, status: Agent['status']) => {
    const { error } = await supabase.from(DB.agents).update({ status }).eq('id', agent.id)
    if (error) {
      alert('حدث خطأ')
      return
    }
    setAgents(agents.map((a) => a.id === agent.id ? { ...a, status } : a))
  }

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={load} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div className="card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={18} style={{ position: 'absolute', right: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
          <input className="input" placeholder="بحث بالاسم أو القسم..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingRight: 'var(--space-10)' }} />
        </div>
        <select className="input" style={{ width: 'auto' }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">كل الحالات</option>
          <option value="online">متصل</option>
          <option value="busy">مشغول</option>
          <option value="break">استراحة</option>
          <option value="offline">غير متصل</option>
        </select>
        <button className="btn btn-primary" onClick={() => { setEditAgent(null); setModalOpen(true) }}>
          <Plus size={18} /> وكيل جديد
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState icon={<Headphones size={28} />} title="لا يوجد وكلاء" description="أضف وكيلاً جديداً للبدء." />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'var(--space-4)' }}>
          {filtered.map((agent, i) => {
            const stats = getAgentStats(agent.id)
            return (
              <div
                key={agent.id}
                className="card animate-slide-up"
                style={{ padding: 'var(--space-5)', animationDelay: `${i * 50}ms`, transition: 'transform 200ms, box-shadow 200ms' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)' }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <div style={{ position: 'relative' }}>
                      <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-500), var(--secondary-500))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '20px' }}>
                        {agent.name.charAt(0)}
                      </div>
                      <span style={{ position: 'absolute', bottom: '2px', left: '2px', width: '12px', height: '12px', borderRadius: '50%', border: '2px solid white', background: agent.status === 'online' ? 'var(--success-500)' : agent.status === 'busy' ? 'var(--warning-500)' : agent.status === 'break' ? 'var(--primary-500)' : 'var(--neutral-400)' }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--neutral-900)' }}>{agent.name}</h3>
                      <p style={{ fontSize: '12px', color: 'var(--neutral-500)' }}>{agent.department}</p>
                      <div style={{ marginTop: '4px' }}><StatusBadge status={agent.status} /></div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                    <button className="btn btn-ghost" onClick={() => { setEditAgent(agent); setModalOpen(true) }} aria-label="تعديل">
                      <Edit3 size={16} />
                    </button>
                    <button className="btn btn-ghost" onClick={() => handleDelete(agent.id)} aria-label="حذف" style={{ color: 'var(--error-500)' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                  {agent.email && <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '13px', color: 'var(--neutral-600)' }}><Mail size={14} style={{ color: 'var(--neutral-400)' }} /> {agent.email}</div>}
                  {agent.phone && <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '13px', color: 'var(--neutral-600)' }}><Phone size={14} style={{ color: 'var(--neutral-400)' }} /> {agent.phone}</div>}
                  {agent.extension && <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '13px', color: 'var(--neutral-600)' }}><span style={{ color: 'var(--neutral-400)' }}>تحويلة:</span> {agent.extension}</div>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                  <StatBox label="مكالمات" value={stats.total} />
                  <StatBox label="التقييم" value={stats.avgRating || '—'} />
                  <StatBox label="متوسط المدة" value={stats.avgDuration > 0 ? `${Math.floor(stats.avgDuration / 60)}د` : '—'} />
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
                  {(['online', 'busy', 'break', 'offline'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(agent, s)}
                      style={{
                        padding: 'var(--space-1) var(--space-3)',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '12px',
                        fontWeight: 600,
                        border: agent.status === s ? 'none' : '1px solid var(--neutral-200)',
                        background: agent.status === s ? 'var(--primary-600)' : 'transparent',
                        color: agent.status === s ? 'white' : 'var(--neutral-600)',
                        transition: 'all 150ms',
                      }}
                    >
                      {s === 'online' ? 'متصل' : s === 'busy' ? 'مشغول' : s === 'break' ? 'استراحة' : 'غير متصل'}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <AgentModal open={modalOpen} onClose={() => { setModalOpen(false); setEditAgent(null) }} onSave={handleSave} agent={editAgent} saving={saving} />
    </div>
  )
}

function StatBox({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={{ padding: 'var(--space-2) var(--space-3)', background: 'var(--neutral-50)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
      <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--neutral-900)' }}>{value}</p>
      <p style={{ fontSize: '11px', color: 'var(--neutral-500)' }}>{label}</p>
    </div>
  )
}

function AgentModal({ open, onClose, onSave, agent, saving }: {
  open: boolean
  onClose: () => void
  onSave: (data: Partial<Agent>) => Promise<boolean>
  agent: Agent | null
  saving: boolean
}) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'general',
    status: 'offline' as Agent['status'],
    extension: '',
  })

  useEffect(() => {
    if (agent) {
      setForm({
        name: agent.name,
        email: agent.email || '',
        phone: agent.phone || '',
        department: agent.department,
        status: agent.status,
        extension: agent.extension || '',
      })
    } else {
      setForm({ name: '', email: '', phone: '', department: 'general', status: 'offline', extension: '' })
    }
  }, [agent, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(form)
  }

  return (
    <Modal open={open} onClose={onClose} title={agent ? 'تعديل الوكيل' : 'إضافة وكيل جديد'}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div>
          <label className="label">الاسم *</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <div>
            <label className="label">البريد الإلكتروني</label>
            <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">الهاتف</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <div>
            <label className="label">القسم</label>
            <input className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="المبيعات، الدعم الفني..." />
          </div>
          <div>
            <label className="label">التحويلة</label>
            <input className="input" value={form.extension} onChange={(e) => setForm({ ...form, extension: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label">الحالة</label>
          <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Agent['status'] })}>
            <option value="online">متصل</option>
            <option value="busy">مشغول</option>
            <option value="break">استراحة</option>
            <option value="offline">غير متصل</option>
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
