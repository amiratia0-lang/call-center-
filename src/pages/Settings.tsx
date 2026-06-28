import { useState } from 'react'
import { Settings2, Info, Globe, Shield, Zap } from 'lucide-react'

export function SettingsPage() {
  const [settings, setSettings] = useState({
    language: 'ar',
    autoRespond: true,
    recordCalls: true,
    securityCheck: true,
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', maxWidth: '700px' }}>
      <div className="card" style={{ padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
          <Settings2 size={20} color="var(--primary-600)" />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--neutral-900)' }}>الإعدادات العامة</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <SettingRow
            icon={<Globe size={18} />}
            title="اللغة"
            description="لغة الرد الآلي والواجهة"
          >
            <select className="input" style={{ width: '150px' }} value={settings.language} onChange={(e) => setSettings({ ...settings, language: e.target.value })}>
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
          </SettingRow>

          <SettingRow
            icon={<Zap size={18} />}
            title="الرد التلقائي"
            description="تفعيل الرد الآلي على المكالمات الواردة"
          >
            <Toggle value={settings.autoRespond} onChange={(v) => setSettings({ ...settings, autoRespond: v })} />
          </SettingRow>

          <SettingRow
            icon={<Info size={18} />}
            title="تسجيل المكالمات"
            description="حفظ نص المحادثات لكل مكالمة"
          >
            <Toggle value={settings.recordCalls} onChange={(v) => setSettings({ ...settings, recordCalls: v })} />
          </SettingRow>

          <SettingRow
            icon={<Shield size={18} />}
            title="التحقق برقم الهاتف"
            description="ربط كل عملية برقم هاتف المتصل للأمان"
          >
            <Toggle value={settings.securityCheck} onChange={(v) => setSettings({ ...settings, securityCheck: v })} />
          </SettingRow>
        </div>
      </div>

      <div className="card" style={{ padding: 'var(--space-6)' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--neutral-900)', marginBottom: 'var(--space-4)' }}>عن النظام</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', fontSize: '13px', color: 'var(--neutral-600)' }}>
          <InfoRow label="الإصدار" value="3.0.0" />
          <InfoRow label="النوع" value="نظام رد آلي عالمي متعدد الشركات" />
          <InfoRow label="الخدمات المدعومة" value="شحن، مطاعم، عيادات، عام" />
          <InfoRow label="قاعدة البيانات" value="Supabase" />
        </div>
      </div>
    </div>
  )
}

function SettingRow({ icon, title, description, children }: { icon: React.ReactNode; title: string; description: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', background: 'var(--neutral-50)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <div style={{ color: 'var(--neutral-600)' }}>{icon}</div>
        <div>
          <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--neutral-900)' }}>{title}</p>
          <p style={{ fontSize: '12px', color: 'var(--neutral-500)' }}>{description}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: '44px',
        height: '24px',
        borderRadius: 'var(--radius-full)',
        background: value ? 'var(--primary-600)' : 'var(--neutral-300)',
        position: 'relative',
        transition: 'background 200ms ease',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '2px',
          right: value ? '2px' : '22px',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: 'white',
          transition: 'right 200ms ease',
        }}
      />
    </button>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--neutral-100)' }}>
      <span style={{ color: 'var(--neutral-500)' }}>{label}</span>
      <span style={{ fontWeight: 600, color: 'var(--neutral-800)' }}>{value}</span>
    </div>
  )
}
