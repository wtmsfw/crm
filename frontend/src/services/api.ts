import axios from 'axios'
import type {
  Customer,
  Contact,
  Opportunity,
  FollowUp,
  PaginatedResponse,
  OverviewData,
  IndustryData,
  FunnelData,
  TrendData,
} from '../types'

const http = axios.create({ baseURL: '/api' })

// ---- Customers ----
export const getCustomers = (params?: Record<string, any>) =>
  http.get<PaginatedResponse<Customer>>('/customers', { params }).then(r => r.data)

export const getCustomer = (id: number) =>
  http.get<Customer & { contacts: Contact[]; opportunities: Opportunity[] }>(
    `/customers/${id}`
  ).then(r => r.data)

export const createCustomer = (data: Partial<Customer>) =>
  http.post<Customer>('/customers', data).then(r => r.data)

export const updateCustomer = (id: number, data: Partial<Customer>) =>
  http.put<Customer>(`/customers/${id}`, data).then(r => r.data)

export const deleteCustomer = (id: number) =>
  http.delete(`/customers/${id}`)

// ---- Contacts ----
export const getContacts = (customerId: number) =>
  http.get<Contact[]>(`/customers/${customerId}/contacts`).then(r => r.data)

export const createContact = (data: Partial<Contact>) =>
  http.post<Contact>('/contacts', data).then(r => r.data)

export const updateContact = (id: number, data: Partial<Contact>) =>
  http.put<Contact>(`/contacts/${id}`, data).then(r => r.data)

export const deleteContact = (id: number) =>
  http.delete(`/contacts/${id}`)

// ---- Opportunities ----
export const getOpportunities = (params?: Record<string, any>) =>
  http.get<PaginatedResponse<Opportunity>>('/opportunities', { params }).then(r => r.data)

export const getOpportunity = (id: number) =>
  http.get<Opportunity & { follow_ups: FollowUp[] }>(
    `/opportunities/${id}`
  ).then(r => r.data)

export const createOpportunity = (data: Partial<Opportunity>) =>
  http.post<Opportunity>('/opportunities', data).then(r => r.data)

export const updateOpportunity = (id: number, data: Partial<Opportunity>) =>
  http.put<Opportunity>(`/opportunities/${id}`, data).then(r => r.data)

export const deleteOpportunity = (id: number) =>
  http.delete(`/opportunities/${id}`)

// ---- FollowUps ----
export const getFollowUps = (opportunityId: number) =>
  http.get<FollowUp[]>(`/opportunities/${opportunityId}/followups`).then(r => r.data)

export const createFollowUp = (data: Partial<FollowUp>) =>
  http.post<FollowUp>('/followups', data).then(r => r.data)

// ---- Analytics ----
export const getOverview = () =>
  http.get<OverviewData>('/analytics/overview').then(r => r.data)

export const getCustomerIndustry = () =>
  http.get<IndustryData[]>('/analytics/customer-industry').then(r => r.data)

export const getSalesFunnel = () =>
  http.get<FunnelData[]>('/analytics/sales-funnel').then(r => r.data)

export const getAmountTrend = () =>
  http.get<TrendData[]>('/analytics/amount-trend').then(r => r.data)

export const getCustomerGrowth = () =>
  http.get<TrendData[]>('/analytics/customer-growth').then(r => r.data)
