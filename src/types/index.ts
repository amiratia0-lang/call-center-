export interface Provider {
  id: string
  name: string
  code: string
  api_url: string | null
  api_key: string | null
  status: 'active' | 'inactive'
  logo: string | null
  created_at: string
}

export interface PhoneNumber {
  id: string
  number: string
  country: string
  provider_id: string | null
  balance: number
  status: 'available' | 'in_use' | 'suspended' | 'expired'
  owner_name: string | null
  owner_phone: string | null
  notes: string | null
  created_at: string
  provider?: Provider | null
}

export interface Recharge {
  id: string
  phone_number: string
  amount: number
  provider_id: string | null
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  reference: string | null
  provider_response: string | null
  customer_phone: string | null
  notes: string | null
  created_at: string
  provider?: Provider | null
}

export interface IVRCall {
  id: string
  caller_phone: string
  dialed_number: string | null
  menu_choice: string | null
  input_number: string | null
  result: string | null
  duration: number
  status: 'completed' | 'failed' | 'abandoned'
  created_at: string
}

export interface IVRMenuItem {
  id: string
  key: string
  label: string
  voice_message: string
  action: 'menu' | 'recharge' | 'balance' | 'support' | 'repeat'
  target_key: string | null
  is_active: boolean
  sort_order: number
  created_at: string
}
