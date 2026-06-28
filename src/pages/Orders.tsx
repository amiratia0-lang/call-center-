import { useEffect, useState } from 'react'
import { ShoppingBag, Search } from 'lucide-react'
import { supabase, DB } from '../lib/supabase'
import { StatusBadge } from '../components/Badge'
import { LoadingState, ErrorState, EmptyState } from '../components/States'
import { Modal } from '../components/Modal'
import type { Order, Company } from '../types'

export function OrdersPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [orders, setOrders] = useState<(Order & { companies: Pick<Company, 'name'> })[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Order | null>(null)

  useEffect(() => {
    loadOrders()
  }, [])

  async function loadOrders() {
    setLoading(true)
    setError('')
    try {
      const { data, error } = await supabase
        .from(DB.orders)
        .select('*, companies(name)')
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) throw error
      setOrders(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(id: string, status: Order['status']) {
    try {
      const { error } = await supabase.from(DB.orders).update({ status }).eq('id', id)
      if (error) throw error
      await loadOrders()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ')
    }
  }

  const filtered = orders.filter((o) => !search || o.caller_phone.includes(search))

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={loadOrders} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ position: 'relative', maxWidth: '400px' }}>
        <Search size={16} style={{ position: 'absolute', right: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
        <input className="input" style={{ paddingRight: 'var(--space-10)' }} placeholder="ابحث برقم الهاتف..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState icon={<ShoppingBag size={32} />} title="لا طلبات" description="لم يتم تسجيل أي طلبات بعد" />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'var(--space-4)' }}>
          {filtered.map((order) => (
            <div key={order.id} className="card animate-slide-up" style={{ padding: 'var(--space-5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                <div>
                  <p style={{ fontSize: '13px', color: 'var(--neutral-500)' }}>{order.companies?.name}</p>
                  <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--neutral-900)' }}>{order.caller_phone}</p>
                </div>
                <StatusBadge status={order.status} />
              </div>

              <div style={{ background: 'var(--neutral-50)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                {order.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '2px 0' }}>
                    <span>{item.qty}× {item.name}</span>
                    <span style={{ color: 'var(--neutral-600)' }}>{item.price * item.qty} جنيه</span>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid var(--neutral-200)', marginTop: 'var(--space-2)', paddingTop: 'var(--space-2)', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '14px' }}>
                  <span>الإجمالي</span>
                  <span style={{ color: 'var(--primary-600)' }}>{order.total} جنيه</span>
                </div>
              </div>

              {order.address && (
                <p style={{ fontSize: '12px', color: 'var(--neutral-500)', marginBottom: 'var(--space-3)' }}>
                  العنوان: {order.address}
                </p>
              )}

              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <select
                  className="input"
                  style={{ fontSize: '12px', padding: 'var(--space-2)' }}
                  value={order.status}
                  onChange={(e) => updateStatus(order.id, e.target.value as Order['status'])}
                >
                  <option value="new">جديد</option>
                  <option value="preparing">قيد التحضير</option>
                  <option value="delivered">تم التوصيل</option>
                  <option value="cancelled">ملغي</option>
                </select>
                <button className="btn btn-secondary" onClick={() => setSelected(order)}>تفاصيل</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title="تفاصيل الطلب" size="md">
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <p style={{ fontSize: '12px', color: 'var(--neutral-500)' }}>رقم الهاتف</p>
              <p style={{ fontWeight: 600 }}>{selected.caller_phone}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: 'var(--neutral-500)', marginBottom: 'var(--space-2)' }}>الأصناف</p>
              {selected.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--neutral-100)' }}>
                  <span>{item.qty}× {item.name} ({item.price} جنيه)</span>
                  <span style={{ fontWeight: 600 }}>{item.price * item.qty} جنيه</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginTop: 'var(--space-3)', fontSize: '16px' }}>
                <span>الإجمالي</span>
                <span style={{ color: 'var(--primary-600)' }}>{selected.total} جنيه</span>
              </div>
            </div>
            {selected.address && (
              <div>
                <p style={{ fontSize: '12px', color: 'var(--neutral-500)' }}>العنوان</p>
                <p>{selected.address}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
