export interface Customer {
  id: string
  name: string
  phone: string
  email: string | null
  company: string | null
  status: 'active' | 'inactive' | 'vip' | 'blacklist'
  notes: string | null
  created_at: string
}

export interface Agent {
  id: string
  name: string
  email: string | null
  phone: string | null
  department: string
  status: 'online' | 'busy' | 'offline' | 'break'
  avatar: string | null
  extension: string | null
  created_at: string
}

export interface Call {
  id: string
  customer_id: string | null
  agent_id: string | null
  type: 'inbound' | 'outbound' | 'missed' | 'transferred'
  status: 'completed' | 'ongoing' | 'missed' | 'failed' | 'voicemail'
  duration: number
  rating: number | null
  notes: string | null
  started_at: string
  created_at: string
  customer?: Customer | null
  agent?: Agent | null
}

export interface Ticket {
  id: string
  subject: string
  description: string | null
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  customer_id: string | null
  agent_id: string | null
  created_at: string
  updated_at: string
  customer?: Customer | null
  agent?: Agent | null
}

export interface QueueEntry {
  id: string
  customer_id: string | null
  priority: 'low' | 'normal' | 'high' | 'urgent'
  status: 'waiting' | 'answered' | 'abandoned'
  wait_time: number
  created_at: string
  customer?: Customer | null
}
