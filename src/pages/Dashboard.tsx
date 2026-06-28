import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2,
  PhoneCall,
  ShoppingBag,
  MessageSquareWarning,
  Package,
  TrendingUp,
  Clock,
  ArrowLeft,
} from 'lucide-react'
import { supabase, DB } from '../lib/supabase'
import { StatusBadge } from '../components/Badge'
import { LoadingState, ErrorState } from '../components/States'
import type { Company, Call, Order, Complaint } from '../types'

export function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [companies, setCompanies] = useState<Company[]>([])
  const [calls, setCalls] = useState<Call[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [complaints, setComplaints] = useState<Complaint[]>([])

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const [companiesRes, callsRes, ordersRes, complaintsRes] = await Promise.all([
        supabase.from(DB.companies).select('*').order('created_at', { ascending: false }),
        supabase.from(DB.calls).select('*').order('created_at', { ascending: false }).limit(10),
        supabase.from(DB.orders).select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from(DB.complaints).select('*').order('created_at', { ascending: false }).limit(5),
      ])

      if (companiesRes.error) throw companiesRes.error
      if (callsRes.error) throw callsRes.error
      if (ordersRes.error) throw ordersRes.error
      if (complaintsRes.error) throw complaintsRes.error

      setCompanies(companiesRes.data || [])
      setCalls(callsRes.data || [])
      setOrders(ordersRes.data || [])
      setComplaints(complaintsRes.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={loadData} />

  const stats = [
    { label: 'الشركات', value: companies.length, icon: Building2, color: 'var(--primary-600)', bg: 'var(--primary-50)', link: '/companies' },
    { label: 'المكالمات', value: calls.length, icon: PhoneCall, color: 'var(--secondary-600)', bg: 'var(--secondary-50)', link: '/calls' },
    { label: 'الطلبات', value: orders.length, icon: ShoppingBag, color: 'var(--accent-600)', bg: 'var(--accent-50)', link: '/orders' },
    { label: 'الشكاوى', value: complaints.length, icon: MessageSquareWarning, color: 'var(--warning-600)', bg: 'var(--warning-50)', link: '/complaints' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Stats Grid */}
      <div
        className="stats-grid"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}
      >
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link
              key={stat.label}
              to={stat.link}
              className="card animate-slide-up"
              style={{
                padding: 'var(--space-6)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-4)',
                transition: 'transform 200ms ease, box-shadow 200ms ease',
              }}
            >
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: 'var(--radius-md)',
                  background: stat.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: stat.color,
                }}
              >
                <Icon size={26} />
              </div>
              <div>
                <p style={{ fontSize: '28px', fontWeight: 700, color: 'var(--neutral-900)', lineHeight: 1 }}>
                  {stat.value}
                </p>
                <p style={{ fontSize: '13px', color: 'var(--neutral-500)', marginTop: '4px' }}>{stat.label}</p>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Companies Overview */}
      <div className="card" style={{ padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--neutral-900)' }}>الشركات المسجلة</h3>
          <Link to="/companies" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--primary-600)', fontWeight: 600 }}>
            عرض الكل <ArrowLeft size={14} />
          </Link>
        </div>
        {companies.length === 0 ? (
          <p style={{ color: 'var(--neutral-500)', textAlign: 'center', padding: 'var(--space-8)' }}>
            لا توجد شركات مسجلة بعد
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {companies.map((company) => (
              <div
                key={company.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--neutral-50)',
                  border: '1px solid var(--neutral-200)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--primary-100)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--primary-700)',
                      fontWeight: 700,
                      fontSize: '14px',
                    }}
                  >
                    {company.name.charAt(0)}
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, color: 'var(--neutral-900)', fontSize: '14px' }}>{company.name}</p>
                    <p style={{ fontSize: '12px', color: 'var(--neutral-500)' }}>{company.phone_number || '—'}</p>
                  </div>
                </div>
                <StatusBadge status={company.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Calls */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-5)' }}>
        <div className="card" style={{ padding: 'var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
            <Clock size={18} color="var(--primary-600)" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--neutral-900)' }}>أحدث المكالمات</h3>
          </div>
          {calls.length === 0 ? (
            <p style={{ color: 'var(--neutral-500)', textAlign: 'center', padding: 'var(--space-6)' }}>لا مكالمات</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {calls.slice(0, 5).map((call) => (
                <div
                  key={call.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--neutral-50)',
                  }}
                >
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--neutral-800)' }}>{call.caller_phone}</p>
                    <p style={{ fontSize: '11px', color: 'var(--neutral-500)' }}>
                      {new Date(call.started_at).toLocaleString('ar-EG')}
                    </p>
                  </div>
                  <StatusBadge status={call.intent} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 'var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
            <TrendingUp size={18} color="var(--accent-600)" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--neutral-900)' }}>أحدث الطلبات</h3>
          </div>
          {orders.length === 0 ? (
            <p style={{ color: 'var(--neutral-500)', textAlign: 'center', padding: 'var(--space-6)' }}>لا طلبات</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {orders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--neutral-50)',
                  }}
                >
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--neutral-800)' }}>
                      {order.items.length} صنف — {order.total} جنيه
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--neutral-500)' }}>{order.caller_phone}</p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
