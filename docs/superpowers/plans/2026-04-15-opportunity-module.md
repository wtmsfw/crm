# 销售机会模块前端 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用 React + Ant Design 实现销售机会的完整前端模块，覆盖列表、详情、表单创建/编辑、跟进记录四个页面/组件。

**Architecture:** 延续客户模块的模式：页面级 `useState + useEffect` 管理数据，表单以 Modal 组件封装，通过 `onSuccess` 回调驱动父页面刷新。所有 HTTP 调用复用 `src/services/api.ts` 中已有的函数，无需新增 API 层代码。

**Tech Stack:** React 19, TypeScript, Ant Design (antd), antd DatePicker (dayjs), React Router 7, 已有 `src/types/index.ts` 和 `src/services/api.ts`

---

## 现有可复用资源（实现时直接 import，无需改动）

**`src/types/index.ts` 中已有：**
- `Opportunity` — id, customer_id, title, stage, amount, expected_close_date?, priority, remark?, created_at, updated_at, customer_name?
- `FollowUp` — id, opportunity_id, type, content, next_plan?, created_at
- `OpportunityDetail extends Opportunity` — follow_ups: FollowUp[]
- `PaginatedResponse<T>` — items, total, page, page_size
- `Customer` — id, name（供 OpportunityForm 客户下拉使用）

**`src/services/api.ts` 中已有：**
- `getOpportunities(params)` — 返回 `PaginatedResponse<Opportunity>`
- `getOpportunity(id)` — 返回 `OpportunityDetail`
- `createOpportunity(data)` / `updateOpportunity(id, data)` / `deleteOpportunity(id)`
- `createFollowUp(data)` — 返回 `FollowUp`
- `getCustomers(params)` — 返回 `PaginatedResponse<Customer>`（OpportunityForm 客户下拉需要）

---

## File Map

### 新建文件
```
frontend/src/
├── components/
│   ├── OpportunityForm.tsx    新建/编辑机会 Modal（含客户下拉、DatePicker）
│   └── FollowUpForm.tsx       添加跟进记录 Modal
└── pages/
    ├── OpportunityList.tsx    覆盖占位页（列表 + 筛选 + 分页 + 创建/编辑/删除）
    └── OpportunityDetail.tsx  覆盖占位页（详情卡片 + 跟进 Timeline）
```

### 不需要修改的文件
- `src/types/index.ts` — 类型已完备
- `src/services/api.ts` — API 函数已完备
- `src/App.tsx` — 路由已配置 `/opportunities` 和 `/opportunities/:id`

---

## 枚举常量（所有文件共用，各自内联定义，不抽公共文件）

```typescript
// 阶段枚举及对应颜色
const STAGES = ['初步接触', '需求确认', '方案报价', '商务谈判', '赢单', '输单']
const STAGE_COLORS: Record<string, string> = {
  '初步接触': 'default',
  '需求确认': 'blue',
  '方案报价': 'orange',
  '商务谈判': 'purple',
  '赢单': 'green',
  '输单': 'red',
}

// 优先级枚举及颜色
const PRIORITIES = ['高', '中', '低']
const PRIORITY_COLORS: Record<string, string> = { '高': 'red', '中': 'orange', '低': 'default' }

// 跟进方式
const FOLLOW_TYPES = ['电话', '邮件', '拜访', '会议']
```

---

## Task 1: OpportunityForm + FollowUpForm 组件

**Files:**
- Create: `frontend/src/components/OpportunityForm.tsx`
- Create: `frontend/src/components/FollowUpForm.tsx`

### OpportunityForm 设计要点
- 打开时调用 `getCustomers({ page_size: 100 })` 加载客户列表填充下拉
- `expected_close_date` 用 antd `DatePicker`，值为 `dayjs` 对象；提交时用 `.format('YYYY-MM-DD')` 转字符串
- 编辑模式：`form.setFieldsValue` 时需把字符串日期转成 `dayjs(initial.expected_close_date)`
- `amount` 用 `InputNumber`，`min={0}`, `style={{ width: '100%' }}`

- [ ] **Step 1: 创建 `src/components/OpportunityForm.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { Form, Input, Select, Modal, message, InputNumber, DatePicker } from 'antd'
import dayjs from 'dayjs'
import { createOpportunity, updateOpportunity, getCustomers } from '../services/api'
import type { Opportunity, Customer } from '../types'

interface Props {
  open: boolean
  initial?: Opportunity | null
  onCancel: () => void
  onSuccess: () => void
}

const STAGE_OPTIONS = ['初步接触', '需求确认', '方案报价', '商务谈判', '赢单', '输单'].map(s => ({ value: s, label: s }))
const PRIORITY_OPTIONS = ['高', '中', '低'].map(s => ({ value: s, label: s }))

export default function OpportunityForm({ open, initial, onCancel, onSuccess }: Props) {
  const [form] = Form.useForm()
  const [customers, setCustomers] = useState<Customer[]>([])

  useEffect(() => {
    if (open) {
      getCustomers({ page_size: 100 }).then(res => setCustomers(res.items))
      form.setFieldsValue(
        initial
          ? {
              ...initial,
              expected_close_date: initial.expected_close_date
                ? dayjs(initial.expected_close_date)
                : undefined,
            }
          : { stage: '初步接触', priority: '中', amount: 0 }
      )
    } else {
      form.resetFields()
    }
  }, [open, initial, form])

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      const payload = {
        ...values,
        expected_close_date: values.expected_close_date
          ? (values.expected_close_date as dayjs.Dayjs).format('YYYY-MM-DD')
          : undefined,
      }
      if (initial) {
        await updateOpportunity(initial.id, payload)
        message.success('机会信息已更新')
      } else {
        await createOpportunity(payload)
        message.success('销售机会创建成功')
      }
      onSuccess()
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) return
      message.error('操作失败，请重试')
    }
  }

  return (
    <Modal
      title={initial ? '编辑销售机会' : '新建销售机会'}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      destroyOnClose
      okText="确认"
      cancelText="取消"
      width={560}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="title"
          label="标题"
          rules={[{ required: true, message: '请输入机会标题' }]}
        >
          <Input maxLength={200} placeholder="如：XX公司 - 年度采购项目" />
        </Form.Item>
        <Form.Item
          name="customer_id"
          label="关联客户"
          rules={[{ required: true, message: '请选择关联客户' }]}
        >
          <Select
            showSearch
            placeholder="请选择客户"
            optionFilterProp="label"
            options={customers.map(c => ({ value: c.id, label: c.name }))}
          />
        </Form.Item>
        <Form.Item name="stage" label="阶段">
          <Select options={STAGE_OPTIONS} />
        </Form.Item>
        <Form.Item name="amount" label="预估金额（元）">
          <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
        </Form.Item>
        <Form.Item name="expected_close_date" label="预计成交日期">
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="priority" label="优先级">
          <Select options={PRIORITY_OPTIONS} />
        </Form.Item>
        <Form.Item name="remark" label="备注">
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
```

- [ ] **Step 2: 创建 `src/components/FollowUpForm.tsx`**

```tsx
import { useEffect } from 'react'
import { Form, Select, Modal, message, Input } from 'antd'
import { createFollowUp } from '../services/api'

interface Props {
  open: boolean
  opportunityId: number
  onCancel: () => void
  onSuccess: () => void
}

const FOLLOW_TYPE_OPTIONS = ['电话', '邮件', '拜访', '会议'].map(s => ({ value: s, label: s }))

export default function FollowUpForm({ open, opportunityId, onCancel, onSuccess }: Props) {
  const [form] = Form.useForm()

  useEffect(() => {
    if (open) {
      form.resetFields()
    }
  }, [open, form])

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      await createFollowUp({ ...values, opportunity_id: opportunityId })
      message.success('跟进记录已添加')
      onSuccess()
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) return
      message.error('操作失败，请重试')
    }
  }

  return (
    <Modal
      title="添加跟进记录"
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      destroyOnClose
      okText="确认"
      cancelText="取消"
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="type"
          label="跟进方式"
          rules={[{ required: true, message: '请选择跟进方式' }]}
        >
          <Select options={FOLLOW_TYPE_OPTIONS} placeholder="请选择" />
        </Form.Item>
        <Form.Item
          name="content"
          label="跟进内容"
          rules={[{ required: true, message: '请填写跟进内容' }]}
        >
          <Input.TextArea rows={4} placeholder="本次跟进沟通了哪些内容？" />
        </Form.Item>
        <Form.Item name="next_plan" label="下一步计划">
          <Input.TextArea rows={3} placeholder="下一步打算如何推进？（选填）" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
```

- [ ] **Step 3: TypeScript 检查**

```bash
cd D:/datum/GitRepositry/crm-demo/frontend
npx tsc --noEmit
```

Expected: 无报错。

- [ ] **Step 4: Commit**

```bash
cd D:/datum/GitRepositry
git add crm-demo/frontend/src/components/OpportunityForm.tsx crm-demo/frontend/src/components/FollowUpForm.tsx
git commit --author="AiCoding <ai_coding@bilibili.com>" -m "feat(crm-demo): add OpportunityForm and FollowUpForm modal components"
```

---

## Task 2: OpportunityList 页面

**Files:**
- Modify: `frontend/src/pages/OpportunityList.tsx` （覆盖占位页）

功能：列表 + 关键词搜索（按标题）+ 阶段下拉筛选 + 优先级下拉筛选 + 分页 + 新建/编辑/删除。列表每行显示 `customer_name`。

- [ ] **Step 1: 覆盖 `src/pages/OpportunityList.tsx`**

```tsx
import { useState, useEffect, useCallback } from 'react'
import { Table, Button, Input, Select, Space, Popconfirm, message, Tag, Card } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import type { ColumnsType } from 'antd/es/table'
import type { Opportunity } from '../types'
import { getOpportunities, deleteOpportunity } from '../services/api'
import OpportunityForm from '../components/OpportunityForm'

const STAGE_COLORS: Record<string, string> = {
  '初步接触': 'default',
  '需求确认': 'blue',
  '方案报价': 'orange',
  '商务谈判': 'purple',
  '赢单': 'green',
  '输单': 'red',
}
const PRIORITY_COLORS: Record<string, string> = { '高': 'red', '中': 'orange', '低': 'default' }

const STAGE_OPTIONS = ['初步接触', '需求确认', '方案报价', '商务谈判', '赢单', '输单'].map(s => ({ value: s, label: s }))
const PRIORITY_OPTIONS = ['高', '中', '低'].map(s => ({ value: s, label: s }))

export default function OpportunityList() {
  const navigate = useNavigate()
  const [data, setData] = useState<Opportunity[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [stage, setStage] = useState('')
  const [priority, setPriority] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Opportunity | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getOpportunities({
        keyword: keyword || undefined,
        stage: stage || undefined,
        priority: priority || undefined,
        page,
        page_size: 20,
      })
      setData(res.items)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }, [keyword, stage, priority, page])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id: number) => {
    await deleteOpportunity(id)
    message.success('销售机会已删除')
    load()
  }

  const openCreate = () => { setEditing(null); setFormOpen(true) }
  const openEdit = (record: Opportunity) => { setEditing(record); setFormOpen(true) }

  const columns: ColumnsType<Opportunity> = [
    {
      title: '标题',
      dataIndex: 'title',
      render: (v: string, r: Opportunity) => (
        <a onClick={() => navigate(`/opportunities/${r.id}`)}>{v}</a>
      ),
    },
    { title: '关联客户', dataIndex: 'customer_name' },
    {
      title: '阶段',
      dataIndex: 'stage',
      render: (v: string) => <Tag color={STAGE_COLORS[v] ?? 'default'}>{v}</Tag>,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      render: (v: number) => `¥${v.toLocaleString()}`,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      render: (v: string) => <Tag color={PRIORITY_COLORS[v] ?? 'default'}>{v}</Tag>,
    },
    { title: '预计成交', dataIndex: 'expected_close_date' },
    {
      title: '操作',
      width: 120,
      render: (_: unknown, r: Opportunity) => (
        <Space>
          <a onClick={() => openEdit(r)}>编辑</a>
          <Popconfirm
            title="确认删除该销售机会？"
            description="删除后将同步删除所有跟进记录。"
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
      title="销售机会"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          新建机会
        </Button>
      }
    >
      <Space style={{ marginBottom: 16 }} wrap>
        <Input.Search
          placeholder="搜索机会标题"
          allowClear
          style={{ width: 200 }}
          onSearch={v => { setKeyword(v); setPage(1) }}
          onChange={e => { if (!e.target.value) { setKeyword(''); setPage(1) } }}
        />
        <Select
          placeholder="阶段筛选"
          allowClear
          style={{ width: 140 }}
          value={stage || undefined}
          options={STAGE_OPTIONS}
          onChange={v => { setStage(v ?? ''); setPage(1) }}
        />
        <Select
          placeholder="优先级筛选"
          allowClear
          style={{ width: 120 }}
          value={priority || undefined}
          options={PRIORITY_OPTIONS}
          onChange={v => { setPriority(v ?? ''); setPage(1) }}
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

      <OpportunityForm
        open={formOpen}
        initial={editing}
        onCancel={() => setFormOpen(false)}
        onSuccess={() => { setFormOpen(false); load() }}
      />
    </Card>
  )
}
```

- [ ] **Step 2: TypeScript 检查**

```bash
cd D:/datum/GitRepositry/crm-demo/frontend
npx tsc --noEmit
```

Expected: 无报错。

- [ ] **Step 3: Commit**

```bash
cd D:/datum/GitRepositry
git add crm-demo/frontend/src/pages/OpportunityList.tsx
git commit --author="AiCoding <ai_coding@bilibili.com>" -m "feat(crm-demo): add OpportunityList page with search, filter, pagination"
```

---

## Task 3: OpportunityDetail 页面

**Files:**
- Modify: `frontend/src/pages/OpportunityDetail.tsx` （覆盖占位页）

功能：机会信息卡（含返回/编辑/删除）+ 跟进记录 Timeline（时间倒序，含跟进方式徽章、内容、下一步计划）+ "添加跟进"按钮弹出 FollowUpForm。

### 跟进 Timeline 设计
- 使用 antd `Timeline` 组件，`mode="left"`
- 每条 item 的 `dot` 为带色圆圈，颜色区分跟进方式：电话=blue、邮件=orange、拜访=green、会议=purple
- item 内容显示：**[跟进方式]** 时间 \n 内容 \n （如有）下一步计划（灰色）

- [ ] **Step 1: 覆盖 `src/pages/OpportunityDetail.tsx`**

```tsx
import { useState, useEffect, useCallback } from 'react'
import {
  Card, Descriptions, Button, Space,
  Popconfirm, message, Tag, Spin, Timeline, Typography,
} from 'antd'
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  PhoneOutlined,
  MailOutlined,
  TeamOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import type { OpportunityDetail as OpportunityDetailType } from '../types'
import { getOpportunity, deleteOpportunity } from '../services/api'
import OpportunityForm from '../components/OpportunityForm'
import FollowUpForm from '../components/FollowUpForm'

const { Text } = Typography

const STAGE_COLORS: Record<string, string> = {
  '初步接触': 'default',
  '需求确认': 'blue',
  '方案报价': 'orange',
  '商务谈判': 'purple',
  '赢单': 'green',
  '输单': 'red',
}
const PRIORITY_COLORS: Record<string, string> = { '高': 'red', '中': 'orange', '低': 'default' }

const FOLLOW_TYPE_DOTS: Record<string, { color: string; icon: React.ReactNode }> = {
  '电话': { color: 'blue', icon: <PhoneOutlined /> },
  '邮件': { color: 'orange', icon: <MailOutlined /> },
  '拜访': { color: 'green', icon: <TeamOutlined /> },
  '会议': { color: 'purple', icon: <VideoCameraOutlined /> },
}

export default function OpportunityDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [opp, setOpp] = useState<OpportunityDetailType | null>(null)
  const [loading, setLoading] = useState(false)
  const [oppFormOpen, setOppFormOpen] = useState(false)
  const [followUpFormOpen, setFollowUpFormOpen] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      setOpp(await getOpportunity(Number(id)))
    } catch {
      message.error('销售机会不存在或加载失败')
      navigate('/opportunities')
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  useEffect(() => { load() }, [load])

  const handleDelete = async () => {
    if (!opp) return
    await deleteOpportunity(opp.id)
    message.success('销售机会已删除')
    navigate('/opportunities')
  }

  if (loading && !opp) {
    return (
      <div style={{ textAlign: 'center', paddingTop: 100 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!opp) return null

  const timelineItems = [...opp.follow_ups]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map(fu => {
      const dot = FOLLOW_TYPE_DOTS[fu.type] ?? { color: 'gray', icon: null }
      return {
        color: dot.color,
        dot: dot.icon,
        children: (
          <div>
            <div>
              <Tag color={dot.color}>{fu.type}</Tag>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {fu.created_at.replace('T', ' ').slice(0, 16)}
              </Text>
            </div>
            <div style={{ marginTop: 4 }}>{fu.content}</div>
            {fu.next_plan && (
              <div style={{ marginTop: 4 }}>
                <Text type="secondary">下一步：{fu.next_plan}</Text>
              </div>
            )}
          </div>
        ),
      }
    })

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={16}>
      {/* 顶部操作栏 */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/opportunities')}>
          返回列表
        </Button>
        <Space>
          <Button icon={<EditOutlined />} onClick={() => setOppFormOpen(true)}>
            编辑
          </Button>
          <Popconfirm
            title="确认删除？"
            description="将级联删除所有跟进记录，不可恢复。"
            onConfirm={handleDelete}
            okText="确认删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      </div>

      {/* 机会基本信息 */}
      <Card loading={loading}>
        <Descriptions title={opp.title} column={{ xs: 1, sm: 2, md: 3 }} bordered>
          <Descriptions.Item label="关联客户">
            <a onClick={() => navigate(`/customers/${opp.customer_id}`)}>
              {opp.customer_name}
            </a>
          </Descriptions.Item>
          <Descriptions.Item label="阶段">
            <Tag color={STAGE_COLORS[opp.stage] ?? 'default'}>{opp.stage}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="优先级">
            <Tag color={PRIORITY_COLORS[opp.priority] ?? 'default'}>{opp.priority}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="预估金额">
            {`¥${opp.amount.toLocaleString()}`}
          </Descriptions.Item>
          <Descriptions.Item label="预计成交">
            {opp.expected_close_date ?? '—'}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {opp.created_at.replace('T', ' ').slice(0, 16)}
          </Descriptions.Item>
          {opp.remark && (
            <Descriptions.Item label="备注" span={3}>{opp.remark}</Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* 跟进记录 */}
      <Card
        title={`跟进记录（${opp.follow_ups.length}）`}
        extra={
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => setFollowUpFormOpen(true)}
          >
            添加跟进
          </Button>
        }
      >
        {opp.follow_ups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#999' }}>
            暂无跟进记录，点击右上角"添加跟进"开始记录
          </div>
        ) : (
          <Timeline mode="left" items={timelineItems} style={{ marginTop: 16 }} />
        )}
      </Card>

      {/* 弹窗 */}
      <OpportunityForm
        open={oppFormOpen}
        initial={opp}
        onCancel={() => setOppFormOpen(false)}
        onSuccess={() => { setOppFormOpen(false); load() }}
      />
      <FollowUpForm
        open={followUpFormOpen}
        opportunityId={Number(id)}
        onCancel={() => setFollowUpFormOpen(false)}
        onSuccess={() => { setFollowUpFormOpen(false); load() }}
      />
    </Space>
  )
}
```

- [ ] **Step 2: TypeScript 检查**

```bash
cd D:/datum/GitRepositry/crm-demo/frontend
npx tsc --noEmit
```

Expected: 无报错。

- [ ] **Step 3: Commit**

```bash
cd D:/datum/GitRepositry
git add crm-demo/frontend/src/pages/OpportunityDetail.tsx
git commit --author="AiCoding <ai_coding@bilibili.com>" -m "feat(crm-demo): add OpportunityDetail page with follow-up timeline"
```

---

## Task 4: 启动验证

前置：后端在 `:8000` 运行，前端 dev server 在 `:5173` 运行。

- [ ] **Step 1: 确认 TS 零错误**

```bash
cd D:/datum/GitRepositry/crm-demo/frontend
npx tsc --noEmit
```

Expected: 无输出（零错误）。

- [ ] **Step 2: 启动 dev server（若未在运行）**

```bash
cd D:/datum/GitRepositry/crm-demo/frontend
npm run dev
```

- [ ] **Step 3: 验证机会列表**

浏览器访问 `http://localhost:5173/opportunities`。

Expected:
- 侧边栏"销售机会"高亮
- 表格加载 30 条种子数据（total 提示"共 30 条"）
- 阶段列显示彩色 Tag，优先级列显示彩色 Tag
- 关联客户列显示客户名称

- [ ] **Step 4: 验证筛选**

选择"阶段筛选"→"赢单"，Expected: 只显示赢单阶段的机会。

- [ ] **Step 5: 验证新建机会**

点击"新建机会"，Expected:
- Modal 打开，"关联客户"下拉有数据（从后端加载的 20 个客户）
- 填写标题、选择客户、点击确认 → message 提示"销售机会创建成功"，列表刷新

- [ ] **Step 6: 验证机会详情**

点击任意机会标题，Expected:
- URL 变为 `/opportunities/{id}`
- 机会信息 Descriptions 卡片正常展示，关联客户为可点击链接
- 跟进记录 Timeline 有数据（种子数据有跟进记录）
- 每条跟进显示方式 Tag + 时间 + 内容 + 下一步计划

- [ ] **Step 7: 验证添加跟进**

点击"添加跟进"，选择方式、填写内容，确认。Expected: Timeline 顶部新增一条记录，message 提示"跟进记录已添加"。

- [ ] **Step 8: 验证关联客户跳转**

在机会详情点击"关联客户"名称链接，Expected: 跳转到 `/customers/{customer_id}` 详情页。

- [ ] **Step 9: Final Commit**

```bash
cd D:/datum/GitRepositry
git status
git commit --author="AiCoding <ai_coding@bilibili.com>" -m "feat(crm-demo): complete opportunity module frontend" --allow-empty
```

（如无未提交变更则跳过此步）
