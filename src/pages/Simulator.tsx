import { useEffect, useState, useRef } from 'react'
import { Phone, PhoneCall, Send, User, Bot, Loader as Loader2 } from 'lucide-react'
import { supabase, DB, EDGE_FUNCTIONS, callEdgeFunction } from '../lib/supabase'
import type { Company } from '../types'

interface Message {
  role: 'system' | 'user'
  text: string
}

export function SimulatorPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompany, setSelectedCompany] = useState('')
  const [callerPhone, setCallerPhone] = useState('')
  const [callActive, setCallActive] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [callId, setCallId] = useState<string | null>(null)
  const [intent, setIntent] = useState('')
  const [orderItems, setOrderItems] = useState<{ name: string; qty: number }[]>([])
  const [address, setAddress] = useState('')
  const [complaintSubject, setComplaintSubject] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadCompanies()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadCompanies() {
    try {
      const { data } = await supabase.from(DB.companies).select('*').eq('status', 'active').order('name')
      setCompanies(data || [])
      if (data && data.length > 0) setSelectedCompany(data[0].id)
    } catch (err) {
      // ignore
    }
  }

  async function startCall() {
    if (!selectedCompany || !callerPhone) return
    setLoading(true)
    setCallActive(true)
    setMessages([])
    setOrderItems([])
    setAddress('')
    setComplaintSubject('')
    setIntent('')
    try {
      const res = await callEdgeFunction(EDGE_FUNCTIONS.ivrHandler, {
        company_id: selectedCompany,
        caller_phone: callerPhone,
        action: 'start',
      })
      setCallId(res.call_id)
      setMessages([{ role: 'system', text: res.message }])
    } catch (err) {
      setMessages([{ role: 'system', text: `خطأ: ${err instanceof Error ? err.message : 'حدث خطأ'}` }])
    } finally {
      setLoading(false)
    }
  }

  function endCall() {
    setCallActive(false)
    setMessages((prev) => [...prev, { role: 'system', text: 'انتهت المكالمة.' }])
    setCallId(null)
  }

  async function send() {
    if (!input.trim() || loading) return
    const userText = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', text: userText }])
    setLoading(true)

    try {
      // Determine action based on current state
      let action = 'intent'
      let body: Record<string, unknown> = {
        company_id: selectedCompany,
        caller_phone: callerPhone,
        action: 'intent',
        input: userText,
      }

      // If we already have an intent, route accordingly
      if (intent === 'tracking') {
        body = { ...body, action: 'tracking', input: userText }
      } else if (intent === 'complaint') {
        // First message after complaint intent = subject
        if (!complaintSubject) {
          setComplaintSubject(userText)
          body = { ...body, action: 'complaint', complaint_subject: userText, complaint_description: '' }
        } else {
          body = { ...body, action: 'complaint', complaint_subject: complaintSubject, complaint_description: userText }
        }
      } else if (intent === 'order') {
        // Parse order items from user input (simple: "2 شاورما عربي" or "شاورما عربي")
        const parsed = parseOrderInput(userText)
        if (parsed.length > 0) {
          const newItems = [...orderItems, ...parsed]
          setOrderItems(newItems)
          body = { ...body, action: 'order_add', items: newItems }
        } else if (userText.includes('لا') || userText.toLowerCase().includes('confirm') || userText.includes('تأكيد') || userText.includes('نعم')) {
          if (userText.includes('لا') === false && (userText.includes('تأكيد') || userText.toLowerCase() === 'confirm')) {
            body = { ...body, action: 'order_confirm', items: orderItems, address: address || undefined }
          } else if (userText.includes('لا')) {
            // Ask for address
            body = { ...body, action: 'intent', input: 'تأكيد الطلب' }
          } else {
            body = { ...body, action: 'order_add', items: orderItems }
          }
        } else {
          // Treat as address
          setAddress(userText)
          body = { ...body, action: 'order_confirm', items: orderItems, address: userText }
        }
      } else if (intent === 'info') {
        body = { ...body, action: 'info', input: userText }
      }

      const res = await callEdgeFunction(EDGE_FUNCTIONS.ivrHandler, body)
      if (res.intent && res.intent !== 'unknown') setIntent(res.intent)
      if (res.call_id) setCallId(res.call_id)
      setMessages((prev) => [...prev, { role: 'system', text: res.message }])
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'system', text: `خطأ: ${err instanceof Error ? err.message : 'حدث خطأ'}` }])
    } finally {
      setLoading(false)
    }
  }

  function parseOrderInput(text: string): { name: string; qty: number }[] {
    // Try to match "2 شاورما عربي" or "شاورما عربي"
    const match = text.match(/^(\d+)\s*(.+)/)
    if (match) {
      return [{ name: match[2].trim(), qty: parseInt(match[1]) }]
    }
    // If it looks like a food item (not "نعم" or "لا")
    if (!['نعم', 'لا', 'تأكيد', 'confirm'].includes(text.trim())) {
      return [{ name: text.trim(), qty: 1 }]
    }
    return []
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', maxWidth: '700px', margin: '0 auto' }}>
      {/* Phone Setup */}
      {!callActive && (
        <div className="card" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary-500), var(--secondary-500))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              margin: '0 auto var(--space-5)',
            }}
          >
            <PhoneCall size={36} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--neutral-900)', marginBottom: 'var(--space-2)' }}>
            محاكي المكالمات
          </h2>
          <p style={{ color: 'var(--neutral-500)', fontSize: '14px', marginBottom: 'var(--space-6)' }}>
            جرّب الرد الآلي كأنك متصل حقيقي. اختر شركة وأدخل رقم هاتفك للبدء.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', maxWidth: '400px', margin: '0 auto' }}>
            <div>
              <label className="label">الشركة</label>
              <select className="input" value={selectedCompany} onChange={(e) => setSelectedCompany(e.target.value)}>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">رقم هاتفك (للأمان)</label>
              <input className="input" value={callerPhone} onChange={(e) => setCallerPhone(e.target.value)} placeholder="+201111111111" />
            </div>
            <button className="btn btn-primary" onClick={startCall} disabled={!selectedCompany || !callerPhone} style={{ padding: 'var(--space-4) var(--space-6)', fontSize: '16px' }}>
              <Phone size={20} /> ابدأ المكالمة
            </button>
          </div>
        </div>
      )}

      {/* Active Call */}
      {callActive && (
        <>
          <div className="card" style={{ padding: 'var(--space-4) var(--space-5)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--success-500)', animation: 'pulse 2s infinite' }} />
              <span style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>مكالمة جارية</span>
              <span style={{ fontSize: '13px', color: 'var(--neutral-500)' }}>{callerPhone}</span>
            </div>
            <button className="btn btn-danger" onClick={endCall} style={{ padding: 'var(--space-2) var(--space-4)' }}>
              إنهاء المكالمة
            </button>
          </div>

          <div
            className="card"
            style={{
              padding: 'var(--space-5)',
              minHeight: '400px',
              maxHeight: '500px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
              background: 'var(--neutral-50)',
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 'var(--space-2)',
                  alignItems: 'flex-start',
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: msg.role === 'user' ? 'var(--primary-100)' : 'var(--secondary-100)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: msg.role === 'user' ? 'var(--primary-700)' : 'var(--secondary-700)',
                  }}
                >
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div
                  style={{
                    background: msg.role === 'user' ? 'var(--primary-600)' : 'var(--neutral-0)',
                    color: msg.role === 'user' ? 'white' : 'var(--neutral-800)',
                    padding: 'var(--space-3) var(--space-4)',
                    borderRadius: 'var(--radius-lg)',
                    maxWidth: '75%',
                    fontSize: '14px',
                    lineHeight: 1.6,
                    border: msg.role === 'user' ? 'none' : '1px solid var(--neutral-200)',
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--secondary-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--secondary-700)' }}>
                  <Bot size={16} />
                </div>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: 'var(--neutral-400)' }} />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <input
              className="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="اكتب ردك..."
              disabled={loading}
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary" onClick={send} disabled={loading || !input.trim()}>
              <Send size={18} />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
