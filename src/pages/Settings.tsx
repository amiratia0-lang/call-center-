import { Settings, Phone, Volume2, Zap, Save } from 'lucide-react'
import { useState } from 'react'

export function SettingsPage() {
  const [settings, setSettings] = useState({
    companyName: 'شحن أرقام',
    defaultCurrency: 'جنيه',
    ivrNumber: '19000',
    autoRecharge: true,
    notifyOnFail: true,
    maxRechargeAmount: 500,
    minRechargeAmount: 5,
  })
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div className="card" style={{ padding: 'var(--space-5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-md)', background: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-600)' }}>
            <Settings size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--neutral-900)' }}>الإعدادات العامة</h3>
            <p style={{ fontSize: '13px', color: 'var(--neutral-500)' }}>إعدادات النظام الأساسية</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <div>
            <label className="label">اسم الشركة</label>
            <input className="input" value={settings.companyName} onChange={(e) => setSettings({ ...settings, companyName: e.target.value })} />
          </div>
          <div>
            <label className="label">العملة</label>
            <input className="input" value={settings.defaultCurrency} onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value })} />
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 'var(--space-5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-md)', background: 'var(--secondary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--secondary-600)' }}>
            <Phone size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--neutral-900)' }}>إعدادات الرد الآلي</h3>
            <p style={{ fontSize: '13px', color: 'var(--neutral-500)' }}>رقم الاستقبال والسلوك الافتراضي</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <div>
            <label className="label">رقم الاستقبال</label>
            <input className="input" value={settings.ivrNumber} onChange={(e) => setSettings({ ...settings, ivrNumber: e.target.value })} style={{ fontFamily: 'monospace' }} />
          </div>
          <div>
            <label className="label">الحد الأقصى للشحن (جنيه)</label>
            <input className="input" type="number" value={settings.maxRechargeAmount} onChange={(e) => setSettings({ ...settings, maxRechargeAmount: Number(e.target.value) })} />
          </div>
        </div>

        <div style={{ marginTop: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <ToggleRow
            icon={<Zap size={18} />}
            label="الشحن التلقائي"
            description="تنفيذ عمليات الشحن تلقائياً عند تأكيدها"
            checked={settings.autoRecharge}
            onChange={(v) => setSettings({ ...settings, autoRecharge: v })}
          />
          <ToggleRow
            icon={<Volume2 size={18} />}
            label="إشعار عند فشل الشحن"
            description="إرسال إشعار عند فشل أي عملية شحن"
            checked={settings.notifyOnFail}
            onChange={(v) => setSettings({ ...settings, notifyOnFail: v })}
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={handleSave}>
          <Save size={18} /> {saved ? 'تم الحفظ!' : 'حفظ الإعدادات'}
        </button>
      </div>
    </div>
  )
}

function ToggleRow({ icon, label, description, checked, onChange }: {
  icon: React.ReactNode
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-3)', background: 'var(--neutral-50)', borderRadius: 'var(--radius-md)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <div style={{ color: 'var(--neutral-500)' }}>{icon}</div>
        <div>
          <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--neutral-800)' }}>{label}</p>
          <p style={{ fontSize: '12px', color: 'var(--neutral-500)' }}>{description}</p>
        </div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: '44px',
          height: '24px',
          borderRadius: 'var(--radius-full)',
          background: checked ? 'var(--success-500)' : 'var(--neutral-300)',
          position: 'relative',
          transition: 'background 200ms',
          cursor: 'pointer',
        }}
      >
        <span style={{
          position: 'absolute',
          top: '2px',
          right: checked ? '2px' : '22px',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: 'white',
          transition: 'right 200ms',
          boxShadow: 'var(--shadow-sm)',
        }} />
      </button>
    </div>
  )
}
