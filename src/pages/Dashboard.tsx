import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Users,
  Headphones,
  Ticket as TicketIcon,
  Clock,
  TrendingUp,
  TrendingDown,
  Star,
  ArrowLeft,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend,
} from 'recharts'
import { supabase, DB } from '../lib/supabase'
import type { Call, Agent, Ticket as TicketType, QueueEntry } from '../types'
import { StatusBadge, PriorityBadge } from '../components/Badge'
import { LoadingState, ErrorState } from '../components/States'

interface Stats {
  totalCalls: number
  inboundCalls: number
  outboundCalls: number
  missedCalls: number
  totalCustomers: number
  onlineAgents: number
  totalAgents: number
  openTickets: number
  avgRating: number
  avgDuration: number
}

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentCalls, setRecentCalls] = useState<Call[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [tickets, setTickets] = useState<TicketType[]>([])
  const [queue, setQueue] = useState<QueueEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chartData, setChartData] = useState<{ day: string; calls: number }[]>([])
  const [typeData, setTypeData] = useState<{ name: string; value: number; color: string }[]>([])

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [callsRes, customersRes, agentsRes, ticketsRes, queueRes] = await Promise.all([
        supabase.from(DB.calls).select('*, customer:customers(*), agent:agents(*)').order('started_at', { ascending: false }).limit(50),
        supabase.from(DB.customers).select('id', { count: 'exact', head: true }),
        supabase.from(DB.agents).select('*'),
        supabase.from(DB.tickets).select('*, customer:customers(*), agent:agents(*)').order('created_at', { ascending: false }).limit(5),
        supabase.from(DB.queue).select('*, customer:customers(*)').order('created_at', { ascending: false }).limit(5),
      ])

      const calls = callsRes.data || []
      const allAgents = agentsRes.data || []

      const inbound = calls.filter((c) => c.type === 'inbound').length
      const outbound = calls.filter((c) => c.type === 'outbound').length
      const missed = calls.filter((c) => c.status === 'missed').length
      const rated = calls.filter((c) => c.rating != null)
      const avgRating = rated.length ? rated.reduce((s, c) => s + (c.rating || 0), 0) / rated.length : 0
      const completed = calls.filter((c) => c.status === 'completed')
      const avgDuration = completed.length ? completed.reduce((s, c) => s + c.duration, 0) / completed.length : 0

      setStats({
        totalCalls: calls.length,
        inboundCalls: inbound,
        outboundCalls: outbound,
        missedCalls: missed,
        totalCustomers: customersRes.count || 0,
        onlineAgents: allAgents.filter((a) => a.status === 'online').length,
        totalAgents: allAgents.length,
        openTickets: (ticketsRes.data || []).filter((t) => t.status === 'open' || t.status === 'in_progress').length,
        avgRating: Number(avgRating.toFixed(1)),
        avgDuration: Math.round(avgDuration),
      })
      setRecentCalls(calls.slice(0, 6))
      setAgents(allAgents)
      setTickets(ticketsRes.data || [])
      setQueue(queueRes.data || [])

      // Chart: calls per day (last 7 days)
      const dayMap = new Map<string, number>()
      const days: string[] = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const key = d.toLocaleDateString('ar-EG', { weekday: 'short' })
        days.push(key)
        dayMap.set(key, 0)
      }
      calls.forEach((c) => {
        const d = new Date(c.started_at)
        const key = d.toLocaleDateString('ar-EG', { weekday: 'short' })
        if (dayMap.has(key)) dayMap.set(key, (dayMap.get(key) || 0) + 1)
      })
      setChartData(days.map((day) => ({ day, calls: dayMap.get(day) || 0 })))

      // Chart: call types
      setTypeData([
        { name: 'واردة', value: inbound, color: '#3b82f6' },
        { name: 'صادرة', value: outbound, color: '#14b8a6' },
        { name: 'فائتة', value: missed, color: '#ef4444' },
        { name: 'أخرى', value: calls.length - inbound - outbound - missed, color: '#94a3b8' },
      ].filter((d) => d.value > 0))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={load} />
  if (!stats) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Stats Cards */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)' }}>
        <StatCard
          icon={<Phone size={22} />}
          label="إجمالي المكالمات"
          value={stats.totalCalls}
          color="var(--primary-600)"
          bg="var(--primary-50)"
          trend="+12%"
          trendUp
        />
        <StatCard
          icon={<Users size={22} />}
          label="إجمالي العملاء"
          value={stats.totalCustomers}
          color="var(--secondary-600)"
          bg="var(--secondary-50)"
          trend="+5%"
          trendUp
        />
        <StatCard
          icon={<Headphones size={22} />}
          label="وكلاء متصلون"
          value={`${stats.onlineAgents} / ${stats.totalAgents}`}
          color="var(--success-600)"
          bg="var(--success-50)"
        />
        <StatCard
          icon={<TicketIcon size={22} />}
          label="تذاكر مفتوحة"
          value={stats.openTickets}
          color="var(--warning-600)"
          bg="var(--warning-50)"
          trend="-3%"
        />
      </div>

      {/* Secondary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)' }} className="stats-grid">
        <MiniStat icon={<PhoneIncoming size={18} />} label="مكالمات واردة" value={stats.inboundCalls} color="var(--primary-500)" />
        <MiniStat icon={<PhoneOutgoing size={18} />} label="مكالمات صادرة" value={stats.outboundCalls} color="var(--secondary-500)" />
        <MiniStat icon={<PhoneMissed size={18} />} label="مكالمات فائتة" value={stats.missedCalls} color="var(--error-500)" />
        <MiniStat icon={<Star size={18} />} label="متوسط التقييم" value={`${stats.avgRating} / 5`} color="var(--accent-500)" />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-4)' }} className="charts-grid">
        <div className="card" style={{ padding: 'var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--neutral-800)' }}>المكالمات خلال الأسبوع</h3>
            <Link to="/reports" style={{ fontSize: '13px', color: 'var(--primary-600)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              التفاصيل <ArrowLeft size={14} />
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="callGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fontFamily: 'Cairo' }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontFamily: 'Cairo', fontSize: '13px' }} />
              <Area type="monotone" dataKey="calls" stroke="#3b82f6" strokeWidth={2} fill="url(#callGradient)" name="المكالمات" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding: 'var(--space-6)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--neutral-800)', marginBottom: 'var(--space-4)' }}>توزيع المكالمات</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={typeData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                {typeData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontFamily: 'Cairo', fontSize: '13px' }} />
              <Legend wrapperStyle={{ fontSize: '12px', fontFamily: 'Cairo' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Calls + Queue */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-4)' }} className="charts-grid">
        <div className="card" style={{ padding: 'var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--neutral-800)' }}>أحدث المكالمات</h3>
            <Link to="/calls" style={{ fontSize: '13px', color: 'var(--primary-600)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              عرض الكل <ArrowLeft size={14} />
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {recentCalls.map((call) => (
              <div
                key={call.id}
                className="animate-fade-in"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--neutral-50)',
                  transition: 'background 150ms',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--neutral-100)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--neutral-50)')}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: call.type === 'inbound' ? 'var(--primary-100)' : call.type === 'outbound' ? 'var(--secondary-100)' : 'var(--error-100)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: call.type === 'inbound' ? 'var(--primary-600)' : call.type === 'outbound' ? 'var(--secondary-600)' : 'var(--error-600)',
                    flexShrink: 0,
                  }}
                >
                  {call.type === 'inbound' ? <PhoneIncoming size={16} /> : call.type === 'outbound' ? <PhoneOutgoing size={16} /> : <PhoneMissed size={16} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--neutral-800)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {call.customer?.name || 'عميل غير معروف'}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--neutral-500)' }}>
                    {call.agent?.name || '—'} • {formatDuration(call.duration)}
                  </p>
                </div>
                <StatusBadge status={call.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--neutral-800)' }}>طابور الانتظار</h3>
            <Link to="/queue" style={{ fontSize: '13px', color: 'var(--primary-600)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              عرض <ArrowLeft size={14} />
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {queue.length === 0 && <p style={{ color: 'var(--neutral-400)', fontSize: '13px', textAlign: 'center', padding: 'var(--space-4)' }}>لا توجد مكالمات في الانتظار</p>}
            {queue.map((q) => (
              <div
                key={q.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--neutral-50)',
                }}
              >
                <Clock size={16} style={{ color: 'var(--warning-500)' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: '13px', color: 'var(--neutral-800)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {q.customer?.name || 'عميل'}
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--neutral-500)' }}>انتظار: {q.wait_time}ث</p>
                </div>
                <PriorityBadge priority={q.priority} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Agents + Tickets */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }} className="charts-grid">
        <div className="card" style={{ padding: 'var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--neutral-800)' }}>حالة الوكلاء</h3>
            <Link to="/agents" style={{ fontSize: '13px', color: 'var(--primary-600)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              عرض الكل <ArrowLeft size={14} />
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {agents.slice(0, 5).map((agent) => (
              <div key={agent.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ position: 'relative' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--primary-400), var(--secondary-400))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '14px',
                    }}
                  >
                    {agent.name.charAt(0)}
                  </div>
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      border: '2px solid white',
                      background: agent.status === 'online' ? 'var(--success-500)' : agent.status === 'busy' ? 'var(--warning-500)' : agent.status === 'break' ? 'var(--primary-500)' : 'var(--neutral-400)',
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--neutral-800)' }}>{agent.name}</p>
                  <p style={{ fontSize: '12px', color: 'var(--neutral-500)' }}>{agent.department}</p>
                </div>
                <StatusBadge status={agent.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--neutral-800)' }}>أحدث التذاكر</h3>
            <Link to="/tickets" style={{ fontSize: '13px', color: 'var(--primary-600)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              عرض الكل <ArrowLeft size={14} />
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {tickets.length === 0 && <p style={{ color: 'var(--neutral-400)', fontSize: '13px', textAlign: 'center', padding: 'var(--space-4)' }}>لا توجد تذاكر</p>}
            {tickets.map((ticket) => (
              <div key={ticket.id} style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', background: 'var(--neutral-50)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
                  <p style={{ fontWeight: 600, fontSize: '13px', color: 'var(--neutral-800)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ticket.subject}</p>
                  <PriorityBadge priority={ticket.priority} />
                </div>
                <p style={{ fontSize: '12px', color: 'var(--neutral-500)' }}>{ticket.customer?.name || '—'}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color, bg, trend, trendUp }: {
  icon: React.ReactNode
  label: string
  value: number | string
  color: string
  bg: string
  trend?: string
  trendUp?: boolean
}) {
  return (
    <div className="card animate-slide-up" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
          {icon}
        </div>
        {trend && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '12px', fontWeight: 600, color: trendUp ? 'var(--success-600)' : 'var(--error-600)' }}>
            {trendUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {trend}
          </div>
        )}
      </div>
      <div>
        <p style={{ fontSize: '28px', fontWeight: 800, color: 'var(--neutral-900)', lineHeight: 1.2 }}>{value}</p>
        <p style={{ fontSize: '13px', color: 'var(--neutral-500)', fontWeight: 500 }}>{label}</p>
      </div>
    </div>
  )
}

function MiniStat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
  return (
    <div className="card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
      <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--neutral-900)' }}>{value}</p>
        <p style={{ fontSize: '12px', color: 'var(--neutral-500)' }}>{label}</p>
      </div>
    </div>
  )
}

function formatDuration(seconds: number): string {
  if (seconds === 0) return '0ث'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}د ${s}ث` : `${s}ث`
}
