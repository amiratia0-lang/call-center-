export interface Company {
  id: string
  name: string
  industry: 'shipping' | 'restaurant' | 'clinic' | 'general'
  phone_number: string | null
  greeting: string
  status: 'active' | 'inactive'
  created_at: string
}

export interface MenuItem {
  id: string
  company_id: string
  name: string
  description: string | null
  price: number
  category: string
  is_available: boolean
  sort_order: number
  created_at: string
}

export interface Caller {
  id: string
  company_id: string
  phone: string
  name: string | null
  address: string | null
  created_at: string
}

export interface Call {
  id: string
  company_id: string
  caller_id: string | null
  caller_phone: string
  intent: 'tracking' | 'order' | 'complaint' | 'info' | 'unknown'
  status: 'completed' | 'ongoing' | 'abandoned' | 'failed'
  duration: number
  transcript: string | null
  started_at: string
  created_at: string
}

export interface OrderItem {
  name: string
  price: number
  qty: number
}

export interface Order {
  id: string
  company_id: string
  caller_id: string | null
  caller_phone: string
  items: OrderItem[]
  total: number
  address: string | null
  status: 'new' | 'preparing' | 'delivered' | 'cancelled'
  call_id: string | null
  created_at: string
}

export interface Complaint {
  id: string
  company_id: string
  caller_id: string | null
  caller_phone: string
  subject: string
  description: string | null
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  call_id: string | null
  created_at: string
}

export interface Shipment {
  id: string
  company_id: string
  tracking_number: string
  caller_phone: string
  status: 'pending' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'returned'
  origin: string | null
  destination: string | null
  estimated_delivery: string | null
  created_at: string
}
