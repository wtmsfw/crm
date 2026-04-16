# 数据看板模块 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用 React + Ant Design + @ant-design/charts 实现数据看板页面，展示 5 张图表/统计卡片，消费后端已实现的 5 个 analytics 接口。

**Backend status:** 后端 `analytics.py` 已完整实现，**无需任何后端改动**：
- `GET /api/analytics/overview` → `OverviewData`
- `GET /api/analytics/customer-industry` → `IndustryData[]`
- `GET /api/analytics/sales-funnel` → `FunnelData[]`（固定 6 个阶段，含赢单/输单）
- `GET /api/analytics/amount-trend` → `TrendData[]`（最近 180 天，按月聚合）
- `GET /api/analytics/customer-growth` → `TrendData[]`（最近 180 天，按月聚合）

**Tech Stack:** React 19, TypeScript, Ant Design 6, @ant-design/charts 2.x (新增依赖), React Router 7

---

## 现有可复用资源（实现时直接 import，无需改动）

**`src/types/index.ts` 中已有：**
- `OverviewData` — total_customers, active_opportunities, new_customers_this_month, total_amount
- `IndustryData` — industry, count
- `FunnelData` — stage, count, amount
- `TrendData` — month, amount?, count?

**`src/services/api.ts` 中已有：**
- `getOverview()` / `getCustomerIndustry()` / `getSalesFunnel()` / `getAmountTrend()` / `getCustomerGrowth()`

---

## 页面布局设计

```
┌──────────┬──────────┬──────────┬──────────┐
│ 客户总数  │ 跟进中    │ 本月新增  │ 预估总金额│  ← Row 1: 4 统计卡片（各占 6 列）
└──────────┴──────────┴──────────┴──────────┘
┌────────────────────┬───────────────────────┐
│   客户行业分布       │   销售漏斗（按阶段）    │  ← Row 2: Pie(10列) + Column(14列)
│   (Pie chart)      │   (Column chart)      │
└────────────────────┴───────────────────────┘
┌────────────────────┬───────────────────────┐
│   预估金额趋势       │   新增客户趋势         │  ← Row 3: Line(12列) + Line(12列)
│   (Line chart)     │   (Line chart)        │
└────────────────────┴───────────────────────┘
```

---

## File Map

### 修改文件
```
frontend/
├── package.json                   新增 @ant-design/charts 依赖（npm install 后自动更新）
└── src/pages/Dashboard.tsx        覆盖占位页（核心实现）
```

### 不需要修改的文件
- `src/types/index.ts` — 类型已完备
- `src/services/api.ts` — API 函数已完备
- `src/App.tsx` — 路由已配置 `/dashboard`
- `backend/` — 所有接口已实现

---

## @ant-design/charts 2.x API 说明

v2 基于 G2 5.x 重写，核心组件 props：

```typescript
// Pie
<Pie data={arr} angleField="count" colorField="industry" height={280} />

// Column
<Column data={arr} xField="stage" yField="count" height={280} />

// Line
<Line data={arr} xField="month" yField="amount" height={260} point={{ size: 4 }} />
```

每个组件均支持 `loading` 属性；图表容器需设置固定 `height`，否则高度为 0。

---

## Task 1: 安装 @ant-design/charts 依赖

- [ ] **Step 1: npm install**

```bash
cd D:/datum/GitRepositry/crm-demo/frontend
npm install @ant-design/charts@^2
```

Expected: `package.json` 的 `dependencies` 中新增 `"@ant-design/charts": "^2.x.x"`，`node_modules/@ant-design/charts` 存在。

- [ ] **Step 2: 验证安装**

```bash
cd D:/datum/GitRepositry/crm-demo/frontend
node -e "require('@ant-design/charts'); console.log('ok')"
```

Expected: 输出 `ok`。

---

## Task 2: Dashboard 页面实现

**Files:**
- Modify: `frontend/src/pages/Dashboard.tsx`（覆盖占位页）

### 实现要点

1. **并行请求**：5 个接口用 `Promise.all` 同时发起，`loading` 状态统一控制
2. **空数据保护**：趋势图若返回空数组（刚建数据库）则显示"暂无数据"占位文字，不渲染图表
3. **金额格式化**：overview 总金额用 `Statistic` 的 `formatter` 或 `prefix="¥"` + `precision={0}`
4. **Row/Col gutter**：行间用 `[16, 16]` gutter（水平+垂直间距）

- [ ] **Step 1: 覆盖 `src/pages/Dashboard.tsx`**

```tsx
import { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, Spin, Empty } from 'antd'
import {
  UserOutlined,
  ThunderboltOutlined,
  RiseOutlined,
  DollarOutlined,
} from '@ant-design/icons'
import { Pie, Column, Line } from '@ant-design/charts'
import {
  getOverview,
  getCustomerIndustry,
  getSalesFunnel,
  getAmountTrend,
  getCustomerGrowth,
} from '../services/api'
import type { OverviewData, IndustryData, FunnelData, TrendData } from '../types'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [industryData, setIndustryData] = useState<IndustryData[]>([])
  const [funnelData, setFunnelData] = useState<FunnelData[]>([])
  const [amountTrend, setAmountTrend] = useState<TrendData[]>([])
  const [customerGrowth, setCustomerGrowth] = useState<TrendData[]>([])

  useEffect(() => {
    Promise.all([
      getOverview(),
      getCustomerIndustry(),
      getSalesFunnel(),
      getAmountTrend(),
      getCustomerGrowth(),
    ])
      .then(([ov, industry, funnel, amount, growth]) => {
        setOverview(ov)
        setIndustryData(industry)
        setFunnelData(funnel)
        setAmountTrend(amount)
        setCustomerGrowth(growth)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', paddingTop: 100 }}>
        <Spin size="large" tip="加载中..." />
      </div>
    )
  }

  return (
    <div style={{ padding: '0 4px' }}>
      {/* Row 1: 统计卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="客户总数"
              value={overview?.total_customers ?? 0}
              prefix={<UserOutlined />}
              suffix="家"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="跟进中机会"
              value={overview?.active_opportunities ?? 0}
              prefix={<ThunderboltOutlined />}
              suffix="个"
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="本月新增客户"
              value={overview?.new_customers_this_month ?? 0}
              prefix={<RiseOutlined />}
              suffix="家"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="预估总金额"
              value={overview?.total_amount ?? 0}
              prefix={<DollarOutlined />}
              precision={0}
              formatter={v => `¥${Number(v).toLocaleString()}`}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Row 2: 行业分布 + 销售漏斗 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={10}>
          <Card title="客户行业分布">
            {industryData.length === 0 ? (
              <Empty description="暂无数据" style={{ padding: '40px 0' }} />
            ) : (
              <Pie
                data={industryData}
                angleField="count"
                colorField="industry"
                height={280}
                legend={{ position: 'bottom' }}
                label={{ text: 'industry', position: 'outside' }}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} md={14}>
          <Card title="销售漏斗（各阶段机会数）">
            {funnelData.every(d => d.count === 0) ? (
              <Empty description="暂无数据" style={{ padding: '40px 0' }} />
            ) : (
              <Column
                data={funnelData}
                xField="stage"
                yField="count"
                height={280}
                label={{ position: 'top' }}
                axis={{ x: { title: false }, y: { title: false } }}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Row 3: 趋势图 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}>
          <Card title="近 6 个月预估金额趋势">
            {amountTrend.length === 0 ? (
              <Empty description="暂无数据" style={{ padding: '40px 0' }} />
            ) : (
              <Line
                data={amountTrend}
                xField="month"
                yField="amount"
                height={260}
                point={{ size: 4 }}
                axis={{ x: { title: false }, y: { title: false } }}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="近 6 个月新增客户趋势">
            {customerGrowth.length === 0 ? (
              <Empty description="暂无数据" style={{ padding: '40px 0' }} />
            ) : (
              <Line
                data={customerGrowth}
                xField="month"
                yField="count"
                height={260}
                point={{ size: 4 }}
                axis={{ x: { title: false }, y: { title: false } }}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}
```

- [ ] **Step 2: TypeScript 检查**

```bash
cd D:/datum/GitRepositry/crm-demo/frontend
npx tsc --noEmit
```

Expected: 无报错。若 `@ant-design/charts` 有 TS 类型 issue，记录原因并修正。

- [ ] **Step 3: Commit**

```bash
cd D:/datum/GitRepositry
git add crm-demo/frontend/src/pages/Dashboard.tsx crm-demo/frontend/package.json crm-demo/frontend/package-lock.json
git commit --author="AiCoding <ai_coding@bilibili.com>" -m "feat(crm-demo): add Dashboard page with analytics charts"
```

---

## Task 3: 启动验证

前置：后端在 `:8000` 运行，前端 dev server 在 `:5173` 运行。

- [ ] **Step 1: 启动后端（若未在运行）**

```bash
cd D:/datum/GitRepositry/crm-demo/backend
py -3 -m uvicorn app.main:app --reload --port 8000
```

- [ ] **Step 2: 启动前端 dev server（若未在运行）**

```bash
cd D:/datum/GitRepositry/crm-demo/frontend
npm run dev
```

- [ ] **Step 3: 验证统计卡片**

浏览器访问 `http://localhost:5173/dashboard`。

Expected:
- 侧边栏"数据看板"高亮
- 顶部 4 张卡片显示数字（客户总数约 20，跟进中机会 > 0，本月新增根据种子数据，总金额 > 0）
- 无报错，无 `NaN` 或 `undefined`

- [ ] **Step 4: 验证图表渲染**

Expected:
- 行业分布 Pie chart 有扇形且有 legend
- 销售漏斗 Column chart 显示 6 个阶段柱形
- 两张趋势折线图有折线（种子数据跨越近 6 个月）

- [ ] **Step 5: Final commit（若有未提交变更）**

```bash
cd D:/datum/GitRepositry
git status
```

如有未提交文件则：
```bash
git add crm-demo/
git commit --author="AiCoding <ai_coding@bilibili.com>" -m "feat(crm-demo): complete dashboard module"
```

---

## 风险与备注

### @ant-design/charts 2.x TypeScript 兼容性
若安装后 `tsc --noEmit` 报 `@ant-design/charts` 内部类型错误，在 `tsconfig.json` 中临时添加：
```json
"skipLibCheck": true
```
这是 antd-charts v2 的已知问题，不影响运行时。

### Pie label prop 版本差异
`@ant-design/charts` 2.x 的 `<Pie>` `label` 属性支持 `{ text: 'fieldName', position: 'outside' }`。若报错改为 `label={false}` 关闭标签，不影响功能。

### 趋势图空数据
若种子数据的 `created_at` 超出 180 天窗口，趋势图会触发空数据分支显示 `<Empty>`。这是正常行为，不是 bug。
