export interface Customer {
  id: number
  name: string
  industry: string
  scale: string
  source: string
  status: string
  region: string | null
  address: string | null
  remark: string | null
  created_at: string
  updated_at: string
}

export interface Contact {
  id: number
  customer_id: number
  name: string
  position: string | null
  phone: string | null
  email: string | null
  is_primary: boolean
}

export interface Opportunity {
  id: number
  customer_id: number
  title: string
  stage: string
  amount: number
  expected_close_date: string | null
  priority: string
  remark: string | null
  created_at: string
  updated_at: string
  customer_name?: string
}

export interface FollowUp {
  id: number
  opportunity_id: number
  type: string
  content: string
  next_plan: string | null
  created_at: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

export interface OverviewData {
  total_customers: number
  active_opportunities: number
  new_customers_this_month: number
  total_amount: number
}

export interface IndustryData {
  industry: string
  count: number
}

export interface FunnelData {
  stage: string
  count: number
  amount: number
}

export interface TrendData {
  month: string
  amount?: number
  count?: number
}
