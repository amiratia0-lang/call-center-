import { useEffect, useState, useCallback } from 'react'
import { Plus, Search, Ticket, Trash2, CreditCard as Edit3, Clock, User, Headphones } from 'lucide-react'
import { supabase, DB } from '../lib/supabase'
import type { Ticket as TicketType, Customer, Agent } from '../types'
import { StatusBadge, PriorityBadge } from '../components/Badge'
import { Modal } from '../components/Modal'
import { LoadingState, ErrorState, EmptyState } from '../components/States'

export function TicketsPage() {
  const [tickets, setTickets] = useState<TicketType[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editTicket, setEditTicket] = useState<TicketType | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [ticketsRes, customersRes, agentsRes] = await Promise.all([
        supabase.from(DB.tickets).select('*, customer:customers(*), agent:agents(*)').order('created_at', { ascending: false }),
        supabase.from(DB.customers).select('*').order('name'),
        supabase.from(DB.agents).select('*').order('name'),
      ])
      setTickets(ticketsRes.data || [])
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

  const filtered = tickets.filter((t) => {
    const matchSearch = !search || t.subject.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase()) || t.customer?.name?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || t.status === filterStatus
    const matchPriority = filterPriority === 'all' || t.priority === filterPriority
    return matchSearch && matchStatus && matchPriority
  })

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه التذكرة؟')) return
    const { error } = await supabase.from(DB.tickets).delete().eq('id', id)
    if (error) {
      alert('حدث خطأ أثناء الحذف')
      return
    }
    setTickets(tickets.filter((t) => t.id !== id))
  }

  const handleSave = async (data: Partial<TicketType>) => {
    setSaving(true)
    let result
    if (editTicket) {
      result = await supabase.from(DB.tickets).update({
        subject: data.subject,
        description: data.description || null,
        priority: data.priority,
        status: data.status,
        customer_id: data.customer_id || null,
        agent_id: data.agent_id || null,
        updated_at: new Date().toISOString(),
      }).eq('id', editTicket.id)
    } else {
      result = await supabase.from(DB.tickets).insert({
        subject: data.subject,
        description: data.description || null,
        priority: data.priority || 'medium',
        status: data.status || 'open',
        customer_id: data.customer_id || null,
        agent_id: data.agent_id || null,
      })
    }
    setSaving(false)
    if (result.error) {
      alert('حدث خطأ أثناء الحفظ')
      return false
    }
    setModalOpen(false)
    setEditTicket(null)
    load()
    return true
  }

  const handleStatusChange = async (ticket: TicketType, status: TicketType['status']) => {
    const { error } = await supabase.from(DB.tickets).update({ status, updated_at: new Date().toISOString() }).eq('id', ticket.id)
    if (error) {
      alert('حدث خطأ')
      return
    }
    setTickets(tickets.map((t) => t.id === ticket.id ? { ...t, status } : t))
  }

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={load} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div className="card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={18} style={{ position: 'absolute', right: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
          <input className="input" placeholder="بحث بالموضوع أو الوصف..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingRight: 'var(--space-10)' }} />
        </div>
        <select className="input" style={{ width: 'auto' }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">كل الحالات</option>
          <option value="open">مفتوحة</option>
          <option value="in_progress">قيد المعالجة</option>
          <option value="resolved">محلولة</option>
          <option value="closed">مغلقة</option>
        </select>
        <select className="input" style={{ width: 'auto' }} value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
          <option value="all">كل الأولويات</option>
          <option value="low">منخفضة</option>
          <option value="medium">متوسطة</option>
          <option value="high">عالية</option>
          <option value="urgent">عاجلة</option>
        </select>
        <button className="btn btn-primary" onClick={() => { setEditTicket(null); setModalOpen(true) }}>
          <Plus size={18} /> تذكرة جديدة
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState icon={<Ticket size={28} />} title="لا توجد تذاكر" description="لم يتم العثور على تذاكر مطابقة." />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {filtered.map((ticket, i) => (
            <div
              key={ticket.id}
              className="card animate-slide-up"
              style={{ padding: 'var(--space-5)', animationDelay: `${i * 40}ms`, transition: 'transform 200ms, box-shadow 200ms' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--neutral-900)' }}>{ticket.subject}</h3>
                    <PriorityBadge priority={ticket.priority} />
                    <StatusBadge status={ticket.status} />
                  </div>
                  {ticket.description && <p style={{ fontSize: '14px', color: 'var(--neutral-600)', marginBottom: 'var(--space-3)' }}>{ticket.description}</p>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap', fontSize: '12px', color: 'var(--neutral-500)' }}>
                    {ticket.customer && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <User size={14} /> {ticket.customer.name}
                      </span>
                    )}
                    {ticket.agent && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Headphones size={14} /> {ticket.agent.name}
                      </span>
                    )}
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={14} /> {formatDate(ticket.created_at)}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <select
                    value={ticket.status}
                    onChange={(e) => handleStatusChange(ticket, e.target.value as TicketType['status'])}
                    style={{
                      padding: 'var(--space-2) var(--space-3)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--neutral-200)',
                      fontSize: '13px',
                      fontWeight: 600,
                      background: 'var(--neutral-50)',
                      color: 'var(--neutral-700)',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="open">مفتوحة</option>
                    <option value="in_progress">قيد المعالجة</option>
                    <option value="resolved">محلولة</option>
                    <option value="closed">مغلقة</option>
                  </select>
                  <button className="btn btn-ghost" onClick={() => { setEditTicket(ticket); setModalOpen(true) }} aria-label="تعديل">
                    <Edit3 size={16} />
                  </button>
                  <button className="btn btn-ghost" onClick={() => handleDelete(ticket.id)} aria-label="حذف" style={{ color: 'var(--error-500)' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <TicketModal open={modalOpen} onClose={() => { setModalOpen(false); setEditTicket(null) }} onSave={handleSave} ticket={editTicket} customers={customers} agents={agents} saving={saving} />
    </div>
  )
}

function TicketModal({ open, onClose, onSave, ticket, customers, agents, saving }: {
  open: boolean
  onClose: () => void
  onSave: (data: Partial<TicketType>) => Promise<boolean>
  ticket: TicketType | null
  customers: Customer[]
  agents: Agent[]
  saving: boolean
}) {
  const [form, setForm] = useState({
    subject: '',
    description: '',
    priority: 'medium' as TicketType['priority'],
    status: 'open' as TicketType['status'],
    customer_id: '',
    agent_id: '',
  })

  useEffect(() => {
    if (ticket) {
      setForm({
        subject: ticket.subject,
        description: ticket.description || '',
        priority: ticket.priority,
        status: ticket.status,
        customer_id: ticket.customer_id || '',
        agent_id: ticket.agent_id || '',
      })
    } else {
      setForm({ subject: '', description: '', priority: 'medium', status: 'open', customer_id: '', agent_id: '' })
    }
  }, [ticket, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(form)
  }

  return (
    <Modal open={open} onClose={onClose} title={ticket ? 'تعديل التذكرة' : 'إضافة تذكرة جديدة'}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div>
          <label className="label">الموضوع *</label>
          <input className="input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
        </div>
        <div>
          <label className="label">الوصف</label>
          <textarea className="input" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="تفاصيل التذكرة..." />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <div>
            <label className="label">الأولوية</label>
            <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as TicketType['priority'] })}>
              <option value="low">منخفضة</option>
              <option value="medium">متوسطة</option>
              <option value="high">عالية</option>
              <option value="urgent">عاجلة</option>
            </select>
          </div>
          <div>
            <label className="label">الحالة</label>
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as TicketType['status'] })}>
              <option value="open">مفتوحة</option>
              <option value="in_progress">قيد المعالجة</option>
              <option value="resolved">محلولة</option>
              <option value="closed">مغلقة</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <div>
            <label className="label">العميل</label>
            <select className="input" value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })}>
              <option value="">بدون عميل</option>
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
