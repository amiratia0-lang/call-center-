import { useEffect, useState, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, RadialBarChart, RadialBar,
} from 'recharts'
import { TrendingUp, Clock, Star, Phone, Award, Activity } from 'lucide-react'
import { supabase, DB } from '../lib/supabase'
import type { Call, Agent } from '../types'
import { LoadingState, ErrorState } from '../components/States'

export function ReportsPage() {
  const [calls, setCalls] = useState<Call[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [callsRes, agentsRes] = await Promise.all([
        supabase.from(DB.calls).select('*, customer:customers(*), agent:agents(*)'),
        supabase.from(DB.agents).select('*'),
      ])
      setCalls(callsRes.data || [])
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

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={load} />

  // Agent performance
  const agentPerf = agents.map((agent) => {
    const agentCalls = calls.filter((c) => c.agent_id === agent.id)
    const completed = agentCalls.filter((c) => c.status === 'completed')
    const rated = agentCalls.filter((c) => c.rating != null)
    const avgRating = rated.length ? rated.reduce((s, c) => s + (c.rating || 0), 0) / rated.length : 0
    const avgDuration = completed.length ? completed.reduce((s, c) => s + c.duration, 0) / completed.length : 0
    return {
      name: agent.name,
      calls: agentCalls.length,
      rating: Number(avgRating.toFixed(1)),
      avgDuration: Math.round(avgDuration),
    }
  }).sort((a, b) => b.calls - a.calls)

  // Status distribution
  const statusMap = new Map<string, number>()
  calls.forEach((c) => statusMap.set(c.status, (statusMap.get(c.status) || 0) + 1))
  const statusData = Array.from(statusMap.entries()).map(([k, v]) => ({
    name: k === 'completed' ? 'مكتملة' : k === 'ongoing' ? 'جارية' : k === 'missed' ? 'فائتة' : k === 'failed' ? 'فاشلة' : 'بريد صوتي',
    value: v,
    color: k === 'completed' ? '#22c55e' : k === 'ongoing' ? '#3b82f6' : k === 'missed' ? '#ef4444' : k === 'failed' ? '#dc2626' : '#f59e0b',
  }))

  // Calls per day (last 14 days)
  const dayMap = new Map<string, { date: string; inbound: number; outbound: number }>()
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    dayMap.set(key, { date: d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }), inbound: 0, outbound: 0 })
  }
  calls.forEach((c) => {
    const key = new Date(c.started_at).toISOString().split('T')[0]
    if (dayMap.has(key)) {
      const entry = dayMap.get(key)!
      if (c.type === 'inbound') entry.inbound++
      else if (c.type === 'outbound') entry.outbound++
    }
  })
  const dailyData = Array.from(dayMap.values())

  // Rating distribution
  const ratingMap = new Map<number, number>()
  calls.filter((c) => c.rating != null).forEach((c) => ratingMap.set(c.rating!, (ratingMap.get(c.rating!) || 0) + 1))
  const ratingData = [1, 2, 3, 4, 5].map((r) => ({ rating: `${r}★`, count: ratingMap.get(r) || 0 }))

  // Summary stats
  const totalCalls = calls.length
  const completed = calls.filter((c) => c.status === 'completed')
  const avgDuration = completed.length ? completed.reduce((s, c) => s + c.duration, 0) / completed.length : 0
  const rated = calls.filter((c) => c.rating != null)
  const avgRating = rated.length ? rated.reduce((s, c) => s + (c.rating || 0), 0) / rated.length : 0
  const successRate = totalCalls ? (completed.length / totalCalls) * 100 : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)' }} className="stats-grid">
        <SummaryCard icon={<Phone size={22} />} label="إجمالي المكالمات" value={totalCalls} color="var(--primary-600)" bg="var(--primary-50)" />
        <SummaryCard icon={<Activity size={22} />} label="معدل النجاح" value={`${successRate.toFixed(0)}%`} color="var(--success-600)" bg="var(--success-50)" />
        <SummaryCard icon={<Clock size={22} />} label="متوسط المدة" value={formatDuration(Math.round(avgDuration))} color="var(--secondary-600)" bg="var(--secondary-50)" />
        <SummaryCard icon={<Star size={22} />} label="متوسط التقييم" value={`${avgRating.toFixed(1)} / 5`} color="var(--accent-600)" bg="var(--accent-50)" />
      </div>

      {/* Daily Calls Chart */}
      <div className="card" style={{ padding: 'var(--space-6)' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--neutral-800)', marginBottom: 'var(--space-4)' }}>المكالمات اليومية (آخر 14 يوم)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fontFamily: 'Cairo' }} stroke="#94a3b8" />
            <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" allowDecimals={false} />
            <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontFamily: 'Cairo', fontSize: '13px' }} />
            <Legend wrapperStyle={{ fontSize: '13px', fontFamily: 'Cairo' }} />
            <Line type="monotone" dataKey="inbound" stroke="#3b82f6" strokeWidth={2} name="واردة" dot={{ r: 3 }} />
            <Line type="monotone" dataKey="outbound" stroke="#14b8a6" strokeWidth={2} name="صادرة" dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Two column charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }} className="charts-grid">
        <div className="card" style={{ padding: 'var(--space-6)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--neutral-800)', marginBottom: 'var(--space-4)' }}>توزيع حالات المكالمات</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(entry) => `${entry.name}: ${entry.value}`}>
                {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontFamily: 'Cairo', fontSize: '13px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding: 'var(--space-6)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--neutral-800)', marginBottom: 'var(--space-4)' }}>توزيع التقييمات</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={ratingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="rating" tick={{ fontSize: 13, fontFamily: 'Cairo' }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontFamily: 'Cairo', fontSize: '13px' }} />
              <Bar dataKey="count" name="عدد المكالمات" radius={[8, 8, 0, 0]}>
                {ratingData.map((entry, i) => {
                  const colors = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e']
                  return <Cell key={i} fill={colors[i]} />
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Agent Performance */}
      <div className="card" style={{ padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
          <Award size={20} style={{ color: 'var(--primary-600)' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--neutral-800)' }}>أداء الوكلاء</h3>
        </div>
        <div className="table-wrapper" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--neutral-200)' }}>
                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: 'var(--neutral-500)' }}>الوكيل</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: 'var(--neutral-500)' }}>عدد المكالمات</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: 'var(--neutral-500)' }}>متوسط التقييم</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: 'var(--neutral-500)' }}>متوسط المدة</th>
              </tr>
            </thead>
            <tbody>
              {agentPerf.map((agent, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--neutral-100)' }}>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-400), var(--secondary-400))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '13px' }}>
                        {agent.name.charAt(0)}
                      </div>
                      <span style={{ fontWeight: 600, fontSize: '14px' }}>{agent.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--primary-600)' }}>{agent.calls}</span>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Star size={14} style={{ fill: 'var(--accent-400)', color: 'var(--accent-400)' }} />
                      <span style={{ fontSize: '14px', fontWeight: 600 }}>{agent.rating || '—'}</span>
                    </div>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <span style={{ fontSize: '14px', color: 'var(--neutral-600)' }}>{agent.avgDuration > 0 ? formatDuration(agent.avgDuration) : '—'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ icon, label, value, color, bg }: { icon: React.ReactNode; label: string; value: number | string; color: string; bg: string }) {
  return (
    <div className="card" style={{ padding: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: '24px', fontWeight: 800, color: 'var(--neutral-900)', lineHeight: 1.2 }}>{value}</p>
        <p style={{ fontSize: '13px', color: 'var(--neutral-500)' }}>{label}</p>
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
