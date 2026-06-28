import { useEffect, useState, useCallback } from 'react'
import { PhoneCall, Phone, Plus, CreditCard as Edit3, Trash2, Play, Pause, Volume2, PhoneIncoming, PhoneOff } from 'lucide-react'
import { supabase, DB, callEdgeFunction, EDGE_FUNCTIONS } from '../lib/supabase'
import type { IVRMenuItem } from '../types'
import { Modal } from '../components/Modal'
import { LoadingState, ErrorState, EmptyState } from '../components/States'

export function IVRPage() {
  const [menuItems, setMenuItems] = useState<IVRMenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<IVRMenuItem | null>(null)
  const [saving, setSaving] = useState(false)

  // Call simulator state
  const [simOpen, setSimOpen] = useState(false)
  const [simCallerPhone, setSimCallerPhone] = useState('')
  const [simDialedNumber, setSimDialedNumber] = useState('19000')
  const [simConnected, setSimConnected] = useState(false)
  const [simMessage, setSimMessage] = useState('')
  const [simMenu, setSimMenu] = useState<{ key: string; label: string; action: string }[]>([])
  const [simChoice, setSimChoice] = useState('')
  const [simInputNumber, setSimInputNumber] = useState('')
  const [simResult, setSimResult] = useState('')
  const [simLoading, setSimLoading] = useState(false)
  const [simHistory, setSimHistory] = useState<{ step: string; message: string }[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.from(DB.ivrMenu).select('*').order('sort_order')
      if (error) throw error
      setMenuItems(data || [])
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
    if (!confirm('هل أنت متأكد من حذف هذا الخيار؟')) return
    const { error } = await supabase.from(DB.ivrMenu).delete().eq('id', id)
    if (error) { alert('حدث خطأ'); return }
    setMenuItems(menuItems.filter((m) => m.id !== id))
  }

  const handleSave = async (data: Partial<IVRMenuItem>) => {
    setSaving(true)
    let result
    if (editItem) {
      result = await supabase.from(DB.ivrMenu).update({
        key: data.key,
        label: data.label,
        voice_message: data.voice_message,
        action: data.action,
        target_key: data.target_key || null,
        is_active: data.is_active,
        sort_order: data.sort_order || 0,
      }).eq('id', editItem.id)
    } else {
      result = await supabase.from(DB.ivrMenu).insert({
        key: data.key,
        label: data.label,
        voice_message: data.voice_message,
        action: data.action || 'menu',
        target_key: data.target_key || null,
        is_active: data.is_active ?? true,
        sort_order: data.sort_order || 0,
      })
    }
    setSaving(false)
    if (result.error) { alert('حدث خطأ'); return false }
    setModalOpen(false)
    setEditItem(null)
    load()
    return true
  }

  const handleToggleActive = async (item: IVRMenuItem) => {
    const { error } = await supabase.from(DB.ivrMenu).update({ is_active: !item.is_active }).eq('id', item.id)
    if (error) { alert('حدث خطأ'); return }
    setMenuItems(menuItems.map((m) => m.id === item.id ? { ...m, is_active: !m.is_active } : m))
  }

  // Call simulator
  const startCall = async () => {
    if (!simCallerPhone) { alert('أدخل رقم المتصل'); return }
    setSimConnected(true)
    setSimHistory([])
    setSimResult('')
    setSimChoice('')
    setSimInputNumber('')
    setSimLoading(true)
    try {
      const result = await callEdgeFunction(EDGE_FUNCTIONS.ivrHandler, {
        caller_phone: simCallerPhone,
        dialed_number: simDialedNumber,
      })
      setSimMessage(result.message)
      setSimMenu(result.menu || [])
      setSimHistory([{ step: 'الاتصال', message: result.message }])
    } catch (err) {
      setSimMessage('حدث خطأ في الاتصال')
    } finally {
      setSimLoading(false)
    }
  }

  const sendChoice = async () => {
    if (!simChoice) return
    setSimLoading(true)
    try {
      const result = await callEdgeFunction(EDGE_FUNCTIONS.ivrHandler, {
        caller_phone: simCallerPhone,
        dialed_number: simDialedNumber,
        menu_choice: simChoice,
        input_number: simInputNumber || undefined,
      })
      setSimResult(result.message)
      setSimHistory([...simHistory, { step: `اختيار ${simChoice}`, message: result.message }])
      setSimChoice('')
      setSimInputNumber('')
    } catch (err) {
      setSimResult('حدث خطأ')
    } finally {
      setSimLoading(false)
    }
  }

  const endCall = () => {
    setSimConnected(false)
    setSimMessage('')
    setSimMenu([])
    setSimResult('')
    setSimChoice('')
    setSimInputNumber('')
    setSimHistory([])
  }

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={load} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Info Banner */}
      <div className="card" style={{ padding: 'var(--space-5)', background: 'linear-gradient(135deg, var(--primary-50), var(--secondary-50))', border: '1px solid var(--primary-200)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
          <PhoneCall size={24} style={{ color: 'var(--primary-600)' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--neutral-900)' }}>نظام الرد الآلي (IVR)</h3>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--neutral-600)', lineHeight: 1.6 }}>
          هنا تُعدّ قائمة الرد الآلي التي يسمعها العميل عند الاتصال. يمكنك إضافة خيارات (شحن، استعلام، دعم) وتخصيص الرسائل الصوتية. جرّب النظام عبر محاكي المكالمات.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-4)' }} className="charts-grid">
        {/* Menu Items */}
        <div className="card" style={{ padding: 'var(--space-5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--neutral-800)' }}>خيارات القائمة</h3>
            <button className="btn btn-primary" onClick={() => { setEditItem(null); setModalOpen(true) }}>
              <Plus size={18} /> خيار جديد
            </button>
          </div>

          {menuItems.length === 0 ? (
            <EmptyState icon={<PhoneCall size={28} />} title="لا توجد خيارات" description="أضف خياراً للقائمة." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {menuItems.map((item) => (
                <div key={item.id} className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', background: item.is_active ? 'var(--neutral-50)' : 'var(--neutral-100)', opacity: item.is_active ? 1 : 0.6, transition: 'all 200ms' }} onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--neutral-100)')} onMouseLeave={(e) => (e.currentTarget.style.background = item.is_active ? 'var(--neutral-50)' : 'var(--neutral-100)')}>
                  <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'var(--primary-600)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px', flexShrink: 0 }}>
                    {item.key}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--neutral-900)' }}>{item.label}</p>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--primary-100)', color: 'var(--primary-700)', fontWeight: 600 }}>
                        {actionLabel(item.action)}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--neutral-500)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.voice_message}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                    <button className="btn btn-ghost" onClick={() => handleToggleActive(item)} title={item.is_active ? 'إيقاف' : 'تفعيل'}>
                      {item.is_active ? <Pause size={16} style={{ color: 'var(--success-600)' }} /> : <Play size={16} style={{ color: 'var(--neutral-400)' }} />}
                    </button>
                    <button className="btn btn-ghost" onClick={() => { setEditItem(item); setModalOpen(true) }}>
                      <Edit3 size={16} />
                    </button>
                    <button className="btn btn-ghost" onClick={() => handleDelete(item.id)} style={{ color: 'var(--error-500)' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Call Simulator */}
        <div className="card" style={{ padding: 'var(--space-5)', position: 'sticky', top: '80px', height: 'fit-content' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
            <PhoneIncoming size={20} style={{ color: 'var(--success-600)' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--neutral-800)' }}>محاكي المكالمات</h3>
          </div>

          {!simConnected ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div>
                <label className="label">رقم المتصل</label>
                <input className="input" placeholder="01xxxxxxxxx" value={simCallerPhone} onChange={(e) => setSimCallerPhone(e.target.value)} style={{ fontFamily: 'monospace' }} />
              </div>
              <div>
                <label className="label">الرقم المطلوب</label>
                <input className="input" value={simDialedNumber} onChange={(e) => setSimDialedNumber(e.target.value)} style={{ fontFamily: 'monospace' }} />
              </div>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={startCall}>
                <PhoneIncoming size={18} /> اتصال
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {/* Call status */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-3)', background: 'var(--success-50)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--success-500)', animation: 'pulse 1.5s infinite' }} />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--success-700)' }}>متصل</span>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--neutral-500)' }}>{simCallerPhone}</span>
              </div>

              {/* Voice message */}
              {simMessage && (
                <div style={{ padding: 'var(--space-3)', background: 'var(--primary-50)', borderRadius: 'var(--radius-md)', display: 'flex', gap: 'var(--space-2)' }}>
                  <Volume2 size={18} style={{ color: 'var(--primary-600)', flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ fontSize: '13px', color: 'var(--neutral-700)', lineHeight: 1.5 }}>{simMessage}</p>
                </div>
              )}

              {/* Menu choices */}
              {simMenu.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)' }}>
                  {simMenu.map((m) => (
                    <button key={m.key} onClick={() => setSimChoice(m.key)} style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: simChoice === m.key ? '2px solid var(--primary-600)' : '1px solid var(--neutral-200)', background: simChoice === m.key ? 'var(--primary-50)' : 'transparent', fontSize: '12px', fontWeight: 600, color: 'var(--neutral-700)', cursor: 'pointer' }}>
                      {m.key} - {m.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Input for recharge/balance */}
              {simChoice && (
                <div>
                  <label className="label">أدخل رقم الهاتف</label>
                  <input className="input" placeholder="رقم الهاتف..." value={simInputNumber} onChange={(e) => setSimInputNumber(e.target.value)} style={{ fontFamily: 'monospace' }} />
                </div>
              )}

              <button className="btn btn-primary" onClick={sendChoice} disabled={simLoading || !simChoice}>
                {simLoading ? <div className="spinner" /> : <Phone size={16} />}
                إرسال
              </button>

              {/* Result */}
              {simResult && (
                <div style={{ padding: 'var(--space-3)', background: 'var(--neutral-50)', borderRadius: 'var(--radius-md)', fontSize: '13px', color: 'var(--neutral-700)' }}>
                  <strong>النتيجة:</strong> {simResult}
                </div>
              )}

              {/* History */}
              {simHistory.length > 0 && (
                <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  {simHistory.map((h, i) => (
                    <div key={i} style={{ padding: 'var(--space-2)', background: 'var(--neutral-50)', borderRadius: 'var(--radius-sm)', fontSize: '12px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--primary-600)' }}>{h.step}:</span>{' '}
                      <span style={{ color: 'var(--neutral-600)' }}>{h.message}</span>
                    </div>
                  ))}
                </div>
              )}

              <button className="btn btn-danger" style={{ width: '100%' }} onClick={endCall}>
                <PhoneOff size={16} /> إنهاء المكالمة
              </button>
            </div>
          )}
        </div>
      </div>

      <IVRModal open={modalOpen} onClose={() => { setModalOpen(false); setEditItem(null) }} onSave={handleSave} item={editItem} saving={saving} />
    </div>
  )
}

function actionLabel(action: string): string {
  const map: Record<string, string> = {
    menu: 'قائمة',
    recharge: 'شحن',
    balance: 'استعلام',
    support: 'دعم',
    repeat: 'تكرار',
  }
  return map[action] || action
}

function IVRModal({ open, onClose, onSave, item, saving }: {
  open: boolean
  onClose: () => void
  onSave: (data: Partial<IVRMenuItem>) => Promise<boolean>
  item: IVRMenuItem | null
  saving: boolean
}) {
  const [form, setForm] = useState({
    key: '',
    label: '',
    voice_message: '',
    action: 'menu' as IVRMenuItem['action'],
    target_key: '',
    is_active: true,
    sort_order: 0,
  })

  useEffect(() => {
    if (item) {
      setForm({
        key: item.key,
        label: item.label,
        voice_message: item.voice_message,
        action: item.action,
        target_key: item.target_key || '',
        is_active: item.is_active,
        sort_order: item.sort_order,
      })
    } else {
      setForm({ key: '', label: '', voice_message: '', action: 'menu', target_key: '', is_active: true, sort_order: 0 })
    }
  }, [item, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(form)
  }

  return (
    <Modal open={open} onClose={onClose} title={item ? 'تعديل الخيار' : 'إضافة خيار جديد'}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-4)' }}>
          <div>
            <label className="label">المفتاح *</label>
            <input className="input" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} required placeholder="0, 1, 2..." maxLength={2} />
          </div>
          <div>
            <label className="label">العنوان *</label>
            <input className="input" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} required />
          </div>
        </div>
        <div>
          <label className="label">الرسالة الصوتية *</label>
          <textarea className="input" rows={3} value={form.voice_message} onChange={(e) => setForm({ ...form, voice_message: e.target.value })} required placeholder="النص الذي يسمعه المتصل..." />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <div>
            <label className="label">الإجراء</label>
            <select className="input" value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value as IVRMenuItem['action'] })}>
              <option value="menu">قائمة</option>
              <option value="recharge">شحن رصيد</option>
              <option value="balance">استعلام عن الرصيد</option>
              <option value="support">دعم فني</option>
              <option value="repeat">تكرار القائمة</option>
            </select>
          </div>
          <div>
            <label className="label">ترتيب العرض</label>
            <input className="input" type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
          </div>
        </div>
        {form.action === 'repeat' && (
          <div>
            <label className="label">المفتاح الهدف</label>
            <input className="input" value={form.target_key} onChange={(e) => setForm({ ...form, target_key: e.target.value })} placeholder="مفتاح القائمة المراد تكرارها" />
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} id="active" />
          <label htmlFor="active" style={{ fontSize: '14px', color: 'var(--neutral-700)', cursor: 'pointer' }}>تفعيل هذا الخيار</label>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>إلغاء</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'جاري الحفظ...' : 'حفظ'}</button>
        </div>
      </form>
    </Modal>
  )
}
