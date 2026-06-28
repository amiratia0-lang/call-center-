import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
})

export const DB = {
  providers: 'providers',
  phoneNumbers: 'phone_numbers',
  recharges: 'recharges',
  ivrCalls: 'ivr_calls',
  ivrMenu: 'ivr_menu',
}

export const EDGE_FUNCTIONS = {
  ivrHandler: `${supabaseUrl}/functions/v1/ivr-handler`,
  rechargeLookup: `${supabaseUrl}/functions/v1/recharge-lookup`,
}

export async function callEdgeFunction(url: string, body: unknown) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${supabaseAnonKey}`,
      apikey: supabaseAnonKey,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Request failed (${response.status})`)
  }

  const data = await response.json()
  if (!data.success && data.error) {
    throw new Error(data.error)
  }

  return data
}
