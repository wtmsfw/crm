# 前端骨架 + 客户管理模块 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 搭建 React + TypeScript + Ant Design 前端骨架，并完整实现客户管理（列表、详情、联系人 CRUD）模块。

**Architecture:** Vite SPA，所有路由嵌套在带侧边栏的 Layout 内，通过 `<Outlet />` 渲染页面。每个页面独立管理数据状态（useState + useEffect），表单通过 onSuccess 回调通知父组件刷新。所有 HTTP 请求经 `/api` 代理到后端 :8000。

**Tech Stack:** React 19, TypeScript, Ant Design (latest), @ant-design/icons, React Router 7 (react-router-dom), Axios, Vite

---

## File Map

### 新建文件

```
frontend/
├── index.html                       # Vite 入口 HTML（修改 title）
├── package.json                     # 依赖声明
├── tsconfig.json / tsconfig.app.json
├── vite.config.ts                   # Vite 配置 + /api 代理
└── src/
    ├── main.tsx                     # React 挂载入口
    ├── App.tsx                      # 路由配置（createBrowserRouter）
    ├── index.css                    # 全局样式重置（清空 Vite 默认）
    ├── types/
    │   └── index.ts                 # 所有 TS 类型定义
    ├── services/
    │   └── api.ts                   # Axios 实例 + 所有 API 函数
    ├── components/
    │   ├── Layout.tsx               # Ant Design Sider + Menu + Outlet
    │   ├── CustomerForm.tsx         # 新建/编辑客户 Modal 表单
    │   └── ContactForm.tsx          # 新建/编辑联系人 Modal 表单
    └── pages/
        ├── Dashboard.tsx            # 数据看板占位页
        ├── CustomerList.tsx         # 客户列表（搜索+筛选+分页+创建）
        ├── CustomerDetail.tsx       # 客户详情（联系人 + 机会列表）
        ├── OpportunityList.tsx      # 销售机会列表占位页
        └── OpportunityDetail.tsx    # 销售机会详情占位页
```

---

## Task 1: Vite 项目初始化 + 依赖安装 + 代理配置

**Files:**
- Create: `frontend/` (via npm create vite)
- Modify: `frontend/vite.config.ts`
- Modify: `frontend/index.html`
- Modify: `frontend/src/index.css`

- [ ] **Step 1: 初始化 Vite + React TypeScript 项目**

```bash
cd D:/datum/GitRepositry/crm-demo
npm create vite@latest frontend -- --template react-ts
```

Expected: 生成 `frontend/` 目录，含 `package.json`、`tsconfig.json`、`vite.config.ts`、`src/` 等文件。

- [ ] **Step 2: 安装基础依赖**

```bash
cd D:/datum/GitRepositry/crm-demo/frontend
npm install
npm install antd @ant-design/icons react-router-dom axios
```

Expected: `node_modules/` 生成，`package.json` 的 dependencies 中出现 antd、react-router-dom、axios。

- [ ] **Step 3: 修改 vite.config.ts，添加 /api 代理**

完整覆盖 `frontend/vite.config.ts`：

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})
```

- [ ] **Step 4: 修改 index.html，更新页面标题**

找到 `frontend/index.html` 中的 `<title>` 标签，改为：

```html
<title>CRM 系统</title>
```

- [ ] **Step 5: 清空 src/index.css（消除 Vite 默认全局样式干扰）**

将 `frontend/src/index.css` 内容替换为：

```css
* {
  box-sizing: border-box;
}
```

- [ ] **Step 6: 删除 Vite 默认的 App.css 和 src/assets 内容**

删除 `frontend/src/App.css`（若存在）。
`frontend/src/assets/` 目录保留但不需要 react.svg。

- [ ] **Step 7: 验证 dev server 可以启动**

```bash
cd D:/datum/GitRepositry/crm-demo/frontend
npm run dev
```

Expected 输出中包含：
```
  ➜  Local:   http://localhost:5173/
```

浏览器打开 `http://localhost:5173/` 应看到 Vite 默认页面（此时路由尚未配置，有报错是正常的）。验证完后 Ctrl+C 停止。

- [ ] **Step 8: Commit**

```bash
cd D:/datum/GitRepositry
git add crm-demo/frontend/
git commit --author="AiCoding <ai_coding@bilibili.com>" -m "feat(crm-demo): scaffold frontend with Vite + React TS, install antd/router/axios"
```

---

## Task 2: 类型定义 + API 服务层 + App 路由 + Layout

**Files:**
- Create: `frontend/src/types/index.ts`
- Create: `frontend/src/services/api.ts`
- Create: `frontend/src/components/Layout.tsx`
- Create: `frontend/src/pages/Dashboard.tsx`
- Create: `frontend/src/pages/OpportunityList.tsx`
- Create: `frontend/src/pages/OpportunityDetail.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/main.tsx`

- [ ] **Step 1: 创建 src/types/index.ts**

```typescript
// frontend/src/types/index.ts

export interface Customer {
  id: number
  name: string
  industry: string
  scale: string
  source: string
  status: string
  region?: string
  address?: string
  remark?: string
  created_at: string
  updated_at: string
}

export interface Contact {
  id: number
  customer_id: number
  name: string
  position?: string
  phone?: string
  email?: string
  is_primary: boolean
}

export interface Opportunity {
  id: number
  customer_id: number
  title: string
  stage: string
  amount: number
  expected_close_date?: string
  priority: string
  remark?: string
  created_at: string
  updated_at: string
  customer_name?: string
}

export interface FollowUp {
  id: number
  opportunity_id: number
  type: string
  content: string
  next_plan?: string
  created_at: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

export interface CustomerDetail extends Customer {
  contacts: Contact[]
  opportunities: Opportunity[]
}

export interface OpportunityDetail extends Opportunity {
  follow_ups: FollowUp[]
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
```

- [ ] **Step 2: 创建 src/services/api.ts**

```typescript
// frontend/src/services/api.ts
import axios from 'axios'
import type {
  Customer, Contact, Opportunity, FollowUp,
  PaginatedResponse, CustomerDetail, OpportunityDetail,
  OverviewData, IndustryData, FunnelData, TrendData,
} from '../types'

const http = axios.create({ baseURL: '/api' })

// ── Customers ──────────────────────────────────────────────
export const getCustomers = (params: {
  keyword?: string
  industry?: string
  status?: string
  page?: number
  page_size?: number
}) => http.get<PaginatedResponse<Customer>>('/customers', { params }).then(r => r.data)

export const getCustomer = (id: number) =>
  http.get<CustomerDetail>(`/customers/${id}`).then(r => r.data)

export const createCustomer = (data: Partial<Customer>) =>
  http.post<Customer>('/customers', data).then(r => r.data)

export const updateCustomer = (id: number, data: Partial<Customer>) =>
  http.put<Customer>(`/customers/${id}`, data).then(r => r.data)

export const deleteCustomer = (id: number) =>
  http.delete(`/customers/${id}`).then(r => r.data)

// ── Contacts ───────────────────────────────────────────────
export const createContact = (data: Partial<Contact>) =>
  http.post<Contact>('/contacts', data).then(r => r.data)

export const updateContact = (id: number, data: Partial<Contact>) =>
  http.put<Contact>(`/contacts/${id}`, data).then(r => r.data)

export const deleteContact = (id: number) =>
  http.delete(`/contacts/${id}`).then(r => r.data)

// ── Opportunities ──────────────────────────────────────────
export const getOpportunities = (params: {
  keyword?: string
  stage?: string
  priority?: string
  page?: number
  page_size?: number
}) => http.get<PaginatedResponse<Opportunity>>('/opportunities', { params }).then(r => r.data)

export const getOpportunity = (id: number) =>
  http.get<OpportunityDetail>(`/opportunities/${id}`).then(r => r.data)

export const createOpportunity = (data: Partial<Opportunity>) =>
  http.post<Opportunity>('/opportunities', data).then(r => r.data)

export const updateOpportunity = (id: number, data: Partial<Opportunity>) =>
  http.put<Opportunity>(`/opportunities/${id}`, data).then(r => r.data)

export const deleteOpportunity = (id: number) =>
  http.delete(`/opportunities/${id}`).then(r => r.data)

// ── Follow-ups ─────────────────────────────────────────────
export const createFollowUp = (data: Partial<FollowUp>) =>
  http.post<FollowUp>('/followups', data).then(r => r.data)

// ── Analytics ─────────────────────────────────────────────
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
```

- [ ] **Step 3: 创建 src/components/Layout.tsx**

```tsx
// frontend/src/components/Layout.tsx
import { Layout as AntLayout, Menu } from 'antd'
import {
  DashboardOutlined,
  TeamOutlined,
  TrophyOutlined,
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'

const { Sider, Content } = AntLayout

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()

  const selectedKey = location.pathname.startsWith('/customers')
    ? '/customers'
    : location.pathname.startsWith('/opportunities')
    ? '/opportunities'
    : '/dashboard'

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider width={200} theme="dark">
        <div
          style={{
            height: 48,
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 16,
            color: 'white',
            fontSize: 16,
            fontWeight: 'bold',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          CRM 系统
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          onClick={({ key }) => navigate(key)}
          items={[
            { key: '/dashboard', icon: <DashboardOutlined />, label: '数据看板' },
            { key: '/customers', icon: <TeamOutlined />, label: '客户管理' },
            { key: '/opportunities', icon: <TrophyOutlined />, label: '销售机会' },
          ]}
        />
      </Sider>
      <AntLayout>
        <Content
          style={{
            padding: 24,
            background: '#f0f2f5',
            minHeight: '100vh',
          }}
        >
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  )
}
```

- [ ] **Step 4: 创建占位页面**

```tsx
// frontend/src/pages/Dashboard.tsx
export default function Dashboard() {
  return <div style={{ padding: 24 }}>数据看板（即将完成）</div>
}
```

```tsx
// frontend/src/pages/OpportunityList.tsx
export default function OpportunityList() {
  return <div style={{ padding: 24 }}>销售机会列表（即将完成）</div>
}
```

```tsx
// frontend/src/pages/OpportunityDetail.tsx
export default function OpportunityDetail() {
  return <div style={{ padding: 24 }}>销售机会详情（即将完成）</div>
}
```

- [ ] **Step 5: 覆盖 src/App.tsx**

```tsx
// frontend/src/App.tsx
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import CustomerList from './pages/CustomerList'
import CustomerDetail from './pages/CustomerDetail'
import OpportunityList from './pages/OpportunityList'
import OpportunityDetail from './pages/OpportunityDetail'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'customers', element: <CustomerList /> },
      { path: 'customers/:id', element: <CustomerDetail /> },
      { path: 'opportunities', element: <OpportunityList /> },
      { path: 'opportunities/:id', element: <OpportunityDetail /> },
      { path: '*', element: <Navigate to="/dashboard" replace /> },
    ],
  },
])

export default function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <RouterProvider router={router} />
    </ConfigProvider>
  )
}
```

注意：`CustomerList` 和 `CustomerDetail` 将在 Task 3-5 中创建。此时 `App.tsx` 中的 import 语句会导致 TS 编译错误，需在 Task 4/5 完成后才能正常运行。

- [ ] **Step 6: 覆盖 src/main.tsx**

```tsx
// frontend/src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 7: Commit**

```bash
cd D:/datum/GitRepositry
git add crm-demo/frontend/src/
git commit --author="AiCoding <ai_coding@bilibili.com>" -m "feat(crm-demo): add types, API service, Layout, routing skeleton"
```

---

## Task 3: CustomerForm + ContactForm 组件

**Files:**
- Create: `frontend/src/components/CustomerForm.tsx`
- Create: `frontend/src/components/ContactForm.tsx`

- [ ] **Step 1: 创建 src/components/CustomerForm.tsx**

```tsx
// frontend/src/components/CustomerForm.tsx
import { useEffect } from 'react'
import { Form, Input, Select, Modal, message } from 'antd'
import { createCustomer, updateCustomer } from '../services/api'
import type { Customer } from '../types'

interface Props {
  open: boolean
  initial?: Customer | null
  onCancel: () => void
  onSuccess: () => void
}

const STATUS_OPTIONS = ['潜在', '活跃', '成交', '流失'].map(s => ({ value: s, label: s }))

export default function CustomerForm({ open, initial, onCancel, onSuccess }: Props) {
  const [form] = Form.useForm()

  useEffect(() => {
    if (open) {
      form.setFieldsValue(initial ?? { status: '潜在' })
    } else {
      form.resetFields()
    }
  }, [open, initial, form])

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      if (initial) {
        await updateCustomer(initial.id, values)
        message.success('客户信息已更新')
      } else {
        await createCustomer(values)
        message.success('客户创建成功')
      }
      onSuccess()
    } catch (err: unknown) {
      // validateFields 失败时 antd 会自动显示字段错误，无需额外处理
      if (err && typeof err === 'object' && 'errorFields' in err) return
      message.error('操作失败，请重试')
    }
  }

  return (
    <Modal
      title={initial ? '编辑客户' : '新建客户'}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      destroyOnClose
      okText="确认"
      cancelText="取消"
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="name"
          label="名称"
          rules={[{ required: true, message: '请输入客户名称' }]}
        >
          <Input maxLength={100} placeholder="客户公司名称" />
        </Form.Item>
        <Form.Item
          name="industry"
          label="行业"
          rules={[{ required: true, message: '请输入行业' }]}
        >
          <Input maxLength={50} placeholder="如：互联网、金融、制造业" />
        </Form.Item>
        <Form.Item
          name="scale"
          label="规模"
          rules={[{ required: true, message: '请输入规模' }]}
        >
          <Input maxLength={20} placeholder="如：1-50人、50-200人" />
        </Form.Item>
        <Form.Item
          name="source"
          label="来源"
          rules={[{ required: true, message: '请输入来源渠道' }]}
        >
          <Input maxLength={50} placeholder="如：官网、转介绍、展会" />
        </Form.Item>
        <Form.Item name="status" label="状态">
          <Select options={STATUS_OPTIONS} />
        </Form.Item>
        <Form.Item name="region" label="地区">
          <Input maxLength={100} />
        </Form.Item>
        <Form.Item name="address" label="详细地址">
          <Input maxLength={200} />
        </Form.Item>
        <Form.Item name="remark" label="备注">
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
```

- [ ] **Step 2: 创建 src/components/ContactForm.tsx**

```tsx
// frontend/src/components/ContactForm.tsx
import { useEffect } from 'react'
import { Form, Input, Switch, Modal, message } from 'antd'
import { createContact, updateContact } from '../services/api'
import type { Contact } from '../types'

interface Props {
  open: boolean
  customerId: number
  initial?: Contact | null
  onCancel: () => void
  onSuccess: () => void
}

export default function ContactForm({ open, customerId, initial, onCancel, onSuccess }: Props) {
  const [form] = Form.useForm()

  useEffect(() => {
    if (open) {
      form.setFieldsValue(initial ?? { is_primary: false })
    } else {
      form.resetFields()
    }
  }, [open, initial, form])

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      if (initial) {
        await updateContact(initial.id, values)
        message.success('联系人信息已更新')
      } else {
        await createContact({ ...values, customer_id: customerId })
        message.success('联系人添加成功')
      }
      onSuccess()
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) return
      message.error('操作失败，请重试')
    }
  }

  return (
    <Modal
      title={initial ? '编辑联系人' : '添加联系人'}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      destroyOnClose
      okText="确认"
      cancelText="取消"
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="name"
          label="姓名"
          rules={[{ required: true, message: '请输入姓名' }]}
        >
          <Input maxLength={50} />
        </Form.Item>
        <Form.Item name="position" label="职位">
          <Input maxLength={50} />
        </Form.Item>
        <Form.Item name="phone" label="电话">
          <Input maxLength={20} />
        </Form.Item>
        <Form.Item name="email" label="邮箱">
          <Input maxLength={100} />
        </Form.Item>
        <Form.Item name="is_primary" label="设为主要联系人" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  )
}
```

- [ ] **Step 3: Commit**

```bash
cd D:/datum/GitRepositry
git add crm-demo/frontend/src/components/CustomerForm.tsx crm-demo/frontend/src/components/ContactForm.tsx
git commit --author="AiCoding <ai_coding@bilibili.com>" -m "feat(crm-demo): add CustomerForm and ContactForm modal components"
```

---

## Task 4: CustomerList 页面

**Files:**
- Create: `frontend/src/pages/CustomerList.tsx`

功能：客户列表 + 关键词搜索 + 行业输入筛选 + 状态下拉筛选 + 分页 + 新建/编辑/删除。

- [ ] **Step 1: 创建 src/pages/CustomerList.tsx**

```tsx
// frontend/src/pages/CustomerList.tsx
import { useState, useEffect, useCallback } from 'react'
import {
  Table, Button, Input, Select, Space,
  Popconfirm, message, Tag, Card,
} from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import type { ColumnsType } from 'antd/es/table'
import type { Customer } from '../types'
import { getCustomers, deleteCustomer } from '../services/api'
import CustomerForm from '../components/CustomerForm'

const STATUS_COLORS: Record<string, string> = {
  潜在: 'blue',
  活跃: 'green',
  成交: 'purple',
  流失: 'red',
}

const STATUS_OPTIONS = ['潜在', '活跃', '成交', '流失'].map(s => ({ value: s, label: s }))

export default function CustomerList() {
  const navigate = useNavigate()
  const [data, setData] = useState<Customer[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [industry, setIndustry] = useState('')
  const [status, setStatus] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getCustomers({
        keyword: keyword || undefined,
        industry: industry || undefined,
        status: status || undefined,
        page,
        page_size: 20,
      })
      setData(res.items)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }, [keyword, industry, status, page])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id: number) => {
    await deleteCustomer(id)
    message.success('客户已删除')
    load()
  }

  const openCreate = () => { setEditing(null); setFormOpen(true) }
  const openEdit = (record: Customer) => { setEditing(record); setFormOpen(true) }

  const columns: ColumnsType<Customer> = [
    {
      title: '客户名称',
      dataIndex: 'name',
      render: (v: string, r: Customer) => (
        <a onClick={() => navigate(`/customers/${r.id}`)}>{v}</a>
      ),
    },
    { title: '行业', dataIndex: 'industry' },
    { title: '规模', dataIndex: 'scale' },
    { title: '来源', dataIndex: 'source' },
    {
      title: '状态',
      dataIndex: 'status',
      render: (v: string) => (
        <Tag color={STATUS_COLORS[v] ?? 'default'}>{v}</Tag>
      ),
    },
    { title: '地区', dataIndex: 'region' },
    {
      title: '操作',
      width: 120,
      render: (_: unknown, r: Customer) => (
        <Space>
          <a onClick={() => openEdit(r)}>编辑</a>
          <Popconfirm
            title="确认删除该客户？"
            description="删除后将同步删除关联的联系人和销售机会。"
            onConfirm={() => handleDelete(r.id)}
            okText="确认"
            cancelText="取消"
          >
            <a style={{ color: '#ff4d4f' }}>删除</a>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Card
      title="客户列表"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          新建客户
        </Button>
      }
    >
      <Space style={{ marginBottom: 16 }} wrap>
        <Input.Search
          placeholder="搜索客户名称"
          allowClear
          style={{ width: 200 }}
          onSearch={v => { setKeyword(v); setPage(1) }}
          onChange={e => { if (!e.target.value) { setKeyword(''); setPage(1) } }}
        />
        <Input
          placeholder="行业筛选"
          allowClear
          style={{ width: 160 }}
          value={industry}
          onChange={e => { setIndustry(e.target.value); setPage(1) }}
        />
        <Select
          placeholder="状态筛选"
          allowClear
          style={{ width: 120 }}
          value={status || undefined}
          options={STATUS_OPTIONS}
          onChange={v => { setStatus(v ?? ''); setPage(1) }}
        />
      </Space>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={data}
        columns={columns}
        pagination={{
          current: page,
          pageSize: 20,
          total,
          onChange: p => setPage(p),
          showTotal: t => `共 ${t} 条`,
          showSizeChanger: false,
        }}
      />

      <CustomerForm
        open={formOpen}
        initial={editing}
        onCancel={() => setFormOpen(false)}
        onSuccess={() => { setFormOpen(false); load() }}
      />
    </Card>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd D:/datum/GitRepositry
git add crm-demo/frontend/src/pages/CustomerList.tsx
git commit --author="AiCoding <ai_coding@bilibili.com>" -m "feat(crm-demo): add CustomerList page with search, filter, pagination"
```

---

## Task 5: CustomerDetail 页面

**Files:**
- Create: `frontend/src/pages/CustomerDetail.tsx`

功能：客户基本信息卡片 + 编辑/删除 + 联系人表格（增删改）+ 关联机会表格（点击跳转）。

- [ ] **Step 1: 创建 src/pages/CustomerDetail.tsx**

```tsx
// frontend/src/pages/CustomerDetail.tsx
import { useState, useEffect, useCallback } from 'react'
import {
  Card, Descriptions, Table, Button, Space,
  Popconfirm, message, Tag, Spin,
} from 'antd'
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import type { ColumnsType } from 'antd/es/table'
import type { Contact, Opportunity, CustomerDetail as CustomerDetailType } from '../types'
import { getCustomer, deleteCustomer, deleteContact } from '../services/api'
import CustomerForm from '../components/CustomerForm'
import ContactForm from '../components/ContactForm'

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState<CustomerDetailType | null>(null)
  const [loading, setLoading] = useState(false)
  const [customerFormOpen, setCustomerFormOpen] = useState(false)
  const [contactFormOpen, setContactFormOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      setCustomer(await getCustomer(Number(id)))
    } catch {
      message.error('客户不存在或加载失败')
      navigate('/customers')
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  useEffect(() => { load() }, [load])

  const handleDeleteCustomer = async () => {
    if (!customer) return
    await deleteCustomer(customer.id)
    message.success('客户已删除')
    navigate('/customers')
  }

  const handleDeleteContact = async (contactId: number) => {
    await deleteContact(contactId)
    message.success('联系人已删除')
    load()
  }

  const openEditContact = (c: Contact) => { setEditingContact(c); setContactFormOpen(true) }
  const openAddContact = () => { setEditingContact(null); setContactFormOpen(true) }

  const contactColumns: ColumnsType<Contact> = [
    { title: '姓名', dataIndex: 'name' },
    { title: '职位', dataIndex: 'position' },
    { title: '电话', dataIndex: 'phone' },
    { title: '邮箱', dataIndex: 'email' },
    {
      title: '主要联系人',
      dataIndex: 'is_primary',
      width: 100,
      render: (v: boolean) => v ? <Tag color="blue">是</Tag> : <span style={{ color: '#999' }}>否</span>,
    },
    {
      title: '操作',
      width: 120,
      render: (_: unknown, r: Contact) => (
        <Space>
          <a onClick={() => openEditContact(r)}>编辑</a>
          <Popconfirm
            title="确认删除联系人？"
            onConfirm={() => handleDeleteContact(r.id)}
            okText="确认"
            cancelText="取消"
          >
            <a style={{ color: '#ff4d4f' }}>删除</a>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const oppColumns: ColumnsType<Opportunity> = [
    {
      title: '标题',
      dataIndex: 'title',
      render: (v: string, r: Opportunity) => (
        <a onClick={() => navigate(`/opportunities/${r.id}`)}>{v}</a>
      ),
    },
    { title: '阶段', dataIndex: 'stage' },
    {
      title: '金额',
      dataIndex: 'amount',
      render: (v: number) => `¥${v.toLocaleString()}`,
    },
    { title: '优先级', dataIndex: 'priority' },
    { title: '预计成交', dataIndex: 'expected_close_date' },
  ]

  if (loading && !customer) {
    return (
      <div style={{ textAlign: 'center', paddingTop: 100 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!customer) return null

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={16}>
      {/* 顶部操作栏 */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/customers')}>
          返回列表
        </Button>
        <Space>
          <Button icon={<EditOutlined />} onClick={() => setCustomerFormOpen(true)}>
            编辑
          </Button>
          <Popconfirm
            title="确认删除？"
            description="将级联删除所有联系人、销售机会及跟进记录，不可恢复。"
            onConfirm={handleDeleteCustomer}
            okText="确认删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      </div>

      {/* 客户基本信息 */}
      <Card loading={loading}>
        <Descriptions title={customer.name} column={{ xs: 1, sm: 2, md: 3 }} bordered>
          <Descriptions.Item label="行业">{customer.industry}</Descriptions.Item>
          <Descriptions.Item label="规模">{customer.scale}</Descriptions.Item>
          <Descriptions.Item label="来源">{customer.source}</Descriptions.Item>
          <Descriptions.Item label="状态">{customer.status}</Descriptions.Item>
          <Descriptions.Item label="地区">{customer.region ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="地址">{customer.address ?? '—'}</Descriptions.Item>
          {customer.remark && (
            <Descriptions.Item label="备注" span={3}>{customer.remark}</Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* 联系人列表 */}
      <Card
        title={`联系人（${customer.contacts.length}）`}
        extra={
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={openAddContact}
          >
            添加联系人
          </Button>
        }
      >
        <Table
          rowKey="id"
          dataSource={customer.contacts}
          columns={contactColumns}
          pagination={false}
          size="small"
          locale={{ emptyText: '暂无联系人，点击右上角添加' }}
        />
      </Card>

      {/* 关联销售机会 */}
      <Card title={`销售机会（${customer.opportunities.length}）`}>
        <Table
          rowKey="id"
          dataSource={customer.opportunities}
          columns={oppColumns}
          pagination={false}
          size="small"
          locale={{ emptyText: '暂无关联销售机会' }}
        />
      </Card>

      {/* 表单弹窗 */}
      <CustomerForm
        open={customerFormOpen}
        initial={customer}
        onCancel={() => setCustomerFormOpen(false)}
        onSuccess={() => { setCustomerFormOpen(false); load() }}
      />
      <ContactForm
        open={contactFormOpen}
        customerId={Number(id)}
        initial={editingContact}
        onCancel={() => setContactFormOpen(false)}
        onSuccess={() => { setContactFormOpen(false); load() }}
      />
    </Space>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd D:/datum/GitRepositry
git add crm-demo/frontend/src/pages/CustomerDetail.tsx
git commit --author="AiCoding <ai_coding@bilibili.com>" -m "feat(crm-demo): add CustomerDetail page with contacts and opportunities"
```

---

## Task 6: 启动验证

**验证前端可以正常运行，客户管理流程走通。**

前置条件：后端须在 `:8000` 运行。
```bash
cd D:/datum/GitRepositry/crm-demo/backend
py -3 -m uvicorn app.main:app --reload --port 8000
```

- [ ] **Step 1: 启动前端 dev server**

```bash
cd D:/datum/GitRepositry/crm-demo/frontend
npm run dev
```

Expected:
```
  VITE v6.x  ready in xxx ms
  ➜  Local:   http://localhost:5173/
```

- [ ] **Step 2: 验证路由跳转**

浏览器打开 `http://localhost:5173/`，Expected: 自动跳转到 `/dashboard`，左侧侧边栏显示"CRM 系统"logo + 三个菜单项（数据看板、客户管理、销售机会）。

- [ ] **Step 3: 验证客户列表**

点击侧边栏"客户管理"，Expected:
- URL 变为 `/customers`
- 表格加载 20 条种子客户数据（total 提示"共 21 条"，因 Task 10 测试时新建了一条）
- 状态列显示彩色 Tag

- [ ] **Step 4: 验证搜索筛选**

在搜索框输入"星"后按回车，Expected: 表格只显示包含"星"的客户（如"星辰科技"）。

- [ ] **Step 5: 验证新建客户**

点击"新建客户"，填写必填字段（名称、行业、规模、来源），点击确认。Expected: Modal 关闭，表格刷新，新客户出现在列表中，message 提示"客户创建成功"。

- [ ] **Step 6: 验证客户详情**

点击任意客户名称，Expected:
- URL 变为 `/customers/{id}`
- 页面显示客户 Descriptions 信息卡
- 联系人表格有数据
- 销售机会表格有数据（可点击标题跳转到占位页面）

- [ ] **Step 7: 验证添加联系人**

在客户详情页点击"添加联系人"，填写姓名，点击确认。Expected: 联系人出现在表格中，message 提示"联系人添加成功"。

- [ ] **Step 8: 验证编辑/删除**

- 编辑客户：点击"编辑"，修改备注，确认，页面刷新显示新备注。
- 删除联系人：Popconfirm 二次确认后删除，联系人从表格中消失。

- [ ] **Step 9: Final Commit**

```bash
cd D:/datum/GitRepositry
git add crm-demo/
git commit --author="AiCoding <ai_coding@bilibili.com>" -m "feat(crm-demo): complete frontend scaffold and customer management module"
```
