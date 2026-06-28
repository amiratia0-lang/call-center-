import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Smartphone, Zap, PhoneCall, TrendingUp, TrendingDown, Clock, ArrowLeft, CircleCheck as CheckCircle2, Circle as XCircle, CircleAlert as AlertCircle } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from 'recharts'
import { supabase, DB } from '../lib/supabase'
import type { PhoneNumber, Recharge, IVRCall, Provider } from '../types'
import { StatusBadge } from '../components/Badge'
import { LoadingState, ErrorState } from '../components/States'

interface Stats {
  totalNumbers: number
  activeNumbers: number
  totalRecharges: number
  completedRecharges: number
  pendingRecharges: number
  totalRevenue: number
  totalCalls: number
  completedCalls: number
}

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentRecharges, setRecentRecharges] = useState<Recharge[]>([])
  const [recentCalls, setRecentCalls] = useState<IVRCall[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chartData, setChartData] = useState<{ day: string; recharges: number }[]>([])
  const [statusData, setStatusData] = useState<{ name: string; value: number; color: string }[]>([])
  const [providerData, setProviderData] = useState<{ name: string; count: number }[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [numbersRes, rechargesRes, callsRes, providersRes] = await Promise.all([
        supabase.from(DB.phoneNumbers).select('*, provider:providers(*)'),
        supabase.from(DB.recharges).select('*, provider:providers(*)').order('created_at', { ascending: false }).limit(50),
        supabase.from(DB.ivrCalls).select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from(DB.providers).select('*'),
      ])

      const numbers = numbersRes.data || []
      const recharges = rechargesRes.data || []
      const calls = callsRes.data || []
      const allProviders = providersRes.data || []

      const completedRecharges = recharges.filter((r) => r.status === 'completed')
      const totalRevenue = completedRecharges.reduce((s, r) => s + Number(r.amount), 0)

      setStats({
        totalNumbers: numbers.length,
        activeNumbers: numbers.filter((n) => n.status === 'in_use' || n.status === 'available').length,
        totalRecharges: recharges.length,
        completedRecharges: completedRecharges.length,
        pendingRecharges: recharges.filter((r) => r.status === 'pending').length,
        totalRevenue,
        totalCalls: calls.length,
        completedCalls: calls.filter((c) => c.status === 'completed').length,
      })
      setRecentRecharges(recharges.slice(0, 6))
      setRecentCalls(calls.slice(0, 6))
      setProviders(allProviders)

      // Chart: recharges per day (last 7 days)
      const dayMap = new Map<string, number>()
      const days: string[] = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const key = d.toLocaleDateString('ar-EG', { weekday: 'short' })
        days.push(key)
        dayMap.set(key, 0)
      }
      recharges.forEach((r) => {
        const d = new Date(r.created_at)
        const key = d.toLocaleDateString('ar-EG', { weekday: 'short' })
        if (dayMap.has(key)) dayMap.set(key, (dayMap.get(key) || 0) + 1)
      })
      setChartData(days.map((day) => ({ day, recharges: dayMap.get(day) || 0 })))

      // Chart: recharge status distribution
      const statusMap = new Map<string, { count: number; color: string }>()
      statusMap.set('completed', { count: 0, color: '#22c55e' })
      statusMap.set('pending', { count: 0, color: '#f59e0b' })
      statusMap.set('failed', { count: 0, color: '#ef4444' })
      statusMap.set('refunded', { count: 0, color: '#94a3b8' })
      recharges.forEach((r) => {
        const entry = statusMap.get(r.status)
        if (entry) entry.count++
      })
      setStatusData(Array.from(statusMap.entries())
        .map(([k, v]) => ({
          name: k === 'completed' ? 'مكتمل' : k === 'pending' ? 'معلق' : k === 'failed' ? 'فاشل' : 'مسترجع',
          value: v.count,
          color: v.color,
        }))
        .filter((d) => d.value > 0))

      // Chart: recharges per provider
      const provMap = new Map<string, number>()
      recharges.forEach((r) => {
        const name = r.provider?.name || 'غير محدد'
        provMap.set(name, (provMap.get(name) || 0) + 1)
      })
      setProviderData(Array.from(provMap.entries()).map(([name, count]) => ({ name, count })))
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
  if (!stats) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Stats Cards */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)' }}>
        <StatCard icon={<Smartphone size={22} />} label="إجمالي الأرقام" value={stats.totalNumbers} color="var(--primary-600)" bg="var(--primary-50)" trend={`${stats.activeNumbers} نشط`} />
        <StatCard icon={<Zap size={22} />} label="عمليات الشحن" value={stats.totalRecharges} color="var(--secondary-600)" bg="var(--secondary-50)" trend={`${stats.completedRecharges} مكتمل`} />
        <StatCard icon={<PhoneCall size={22} />} label="مكالمات واردة" value={stats.totalCalls} color="var(--accent-600)" bg="var(--accent-50)" trend={`${stats.completedCalls} نجاح`} />
        <StatCard icon={<TrendingUp size={22} />} label="إجمالي الإيرادات" value={`${stats.totalRevenue} ج`} color="var(--success-600)" bg="var(--success-50)" trend="+15%" trendUp />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-4)' }} className="charts-grid">
        <div className="card" style={{ padding: 'var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--neutral-800)' }}>عمليات الشحن الأسبوعية</h3>
            <Link to="/recharges" style={{ fontSize: '13px', color: 'var(--primary-600)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              التفاصيل <ArrowLeft size={14} />
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="rechargeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#14b8a6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fontFamily: 'Cairo' }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontFamily: 'Cairo', fontSize: '13px' }} />
              <Area type="monotone" dataKey="recharges" stroke="#14b8a6" strokeWidth={2} fill="url(#rechargeGradient)" name="عمليات الشحن" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding: 'var(--space-6)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--neutral-800)', marginBottom: 'var(--space-4)' }}>حالة الشحنات</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontFamily: 'Cairo', fontSize: '13px' }} />
              <Legend wrapperStyle={{ fontSize: '12px', fontFamily: 'Cairo' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Provider Chart */}
      {providerData.length > 0 && (
        <div className="card" style={{ padding: 'var(--space-6)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--neutral-800)', marginBottom: 'var(--space-4)' }}>الشحنات حسب المزود</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={providerData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fontFamily: 'Cairo' }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontFamily: 'Cairo', fontSize: '13px' }} />
              <Bar dataKey="count" name="عدد الشحنات" radius={[8, 8, 0, 0]} fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }} className="charts-grid">
        <div className="card" style={{ padding: 'var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--neutral-800)' }}>أحدث عمليات الشحن</h3>
            <Link to="/recharges" style={{ fontSize: '13px', color: 'var(--primary-600)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              عرض الكل <ArrowLeft size={14} />
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {recentRecharges.map((r) => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', background: 'var(--neutral-50)' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: r.status === 'completed' ? 'var(--success-100)' : r.status === 'pending' ? 'var(--warning-100)' : 'var(--error-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: r.status === 'completed' ? 'var(--success-600)' : r.status === 'pending' ? 'var(--warning-600)' : 'var(--error-600)', flexShrink: 0 }}>
                  {r.status === 'completed' ? <CheckCircle2 size={18} /> : r.status === 'pending' ? <Clock size={18} /> : <XCircle size={18} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--neutral-800)' }}>{r.phone_number}</p>
                  <p style={{ fontSize: '12px', color: 'var(--neutral-500)' }}>{r.provider?.name || '—'} • {r.amount} جنيه</p>
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--neutral-800)' }}>أحدث المكالمات</h3>
            <Link to="/calls" style={{ fontSize: '13px', color: 'var(--primary-600)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              عرض الكل <ArrowLeft size={14} />
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {recentCalls.map((c) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', background: 'var(--neutral-50)' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: c.status === 'completed' ? 'var(--primary-100)' : 'var(--error-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.status === 'completed' ? 'var(--primary-600)' : 'var(--error-600)', flexShrink: 0 }}>
                  <PhoneCall size={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--neutral-800)' }}>{c.caller_phone}</p>
                  <p style={{ fontSize: '12px', color: 'var(--neutral-500)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.result || `اختيار: ${c.menu_choice || '—'}`}
                  </p>
                </div>
                <StatusBadge status={c.status} />
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '12px', fontWeight: 600, color: trendUp ? 'var(--success-600)' : 'var(--neutral-500)' }}>
            {trendUp ? <TrendingUp size={14} /> : null}
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
