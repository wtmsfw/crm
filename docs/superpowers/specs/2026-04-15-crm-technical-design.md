# CRM 系统技术设计方案

## 1. 整体架构

### 1.1 系统架构

采用前后端分离的 SPA 架构：

```
┌─────────────────────┐     HTTP/JSON      ┌─────────────────────┐     SQLAlchemy     ┌──────────┐
│  Frontend           │ ──────────────────▶ │  Backend            │ ────────────────▶ │ Database │
│  React 19 + TS      │                     │  FastAPI (Python)   │                   │ SQLite   │
│  Ant Design 6       │ ◀────────────────── │  Pydantic v2        │ ◀──────────────── │ crm.db   │
│  Vite :5173         │                     │  Uvicorn :8000      │                   │          │
└─────────────────────┘                     └─────────────────────┘                    └──────────┘
```

- 前后端通过 RESTful JSON API 通信
- 开发阶段 Vite dev server 通过 proxy 将 `/api` 请求代理到后端 `:8000`
- CORS 中间件允许所有来源（MVP 简化配置）
- 应用启动时自动建表并填充种子数据

### 1.2 技术选型

| 层级 | 技术 | 版本 | 选型理由 |
|------|------|------|----------|
| 前端框架 | React + TypeScript | 19.x | 类型安全的 SPA 开发 |
| UI 组件库 | Ant Design | 6.x | 成熟的后台管理 UI 组件 |
| 图表 | @ant-design/charts | 2.x | 与 Ant Design 风格统一 |
| 构建工具 | Vite | 8.x | 快速 HMR 和构建 |
| 前端路由 | React Router | 7.x | 声明式路由 |
| HTTP 客户端 | Axios | 1.x | 请求拦截、统一错误处理 |
| 后端框架 | FastAPI | 0.115 | 异步、自动 OpenAPI 文档、类型校验 |
| ORM | SQLAlchemy | 2.0 | 声明式模型映射 |
| 数据校验 | Pydantic | 2.x | 请求/响应自动校验与序列化 |
| 数据库 | SQLite | — | 零配置，文件级数据库，MVP 足够 |
| ASGI 服务器 | Uvicorn | 0.30 | 高性能异步服务器 |

### 1.3 项目结构

```
crm/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI 应用入口，CORS 配置，路由挂载
│   │   ├── database.py          # SQLAlchemy 引擎、Session 管理
│   │   ├── seed.py              # 种子数据脚本
│   │   ├── models/              # SQLAlchemy ORM 模型
│   │   │   ├── customer.py
│   │   │   ├── contact.py
│   │   │   ├── opportunity.py
│   │   │   └── follow_up.py
│   │   ├── schemas/             # Pydantic 请求/响应模型
│   │   │   ├── customer.py
│   │   │   ├── contact.py
│   │   │   ├── opportunity.py
│   │   │   └── follow_up.py
│   │   └── routers/             # API 路由模块
│   │       ├── customers.py
│   │       ├── contacts.py
│   │       ├── opportunities.py
│   │       ├── follow_ups.py
│   │       └── analytics.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── main.tsx             # 入口文件
│   │   ├── App.tsx              # 根组件，路由配置
│   │   ├── types/index.ts       # TypeScript 类型定义
│   │   ├── services/api.ts      # Axios API 客户端
│   │   ├── components/          # 通用组件
│   │   │   ├── Layout.tsx
│   │   │   ├── CustomerForm.tsx
│   │   │   ├── ContactForm.tsx
│   │   │   ├── OpportunityForm.tsx
│   │   │   └── FollowUpForm.tsx
│   │   └── pages/               # 页面组件
│   │       ├── Dashboard.tsx
│   │       ├── CustomerList.tsx
│   │       ├── CustomerDetail.tsx
│   │       ├── OpportunityList.tsx
│   │       └── OpportunityDetail.tsx
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
└── docs/                        # 项目文档
```

---

## 2. 后端设计

### 2.1 数据库层

**数据库连接：** SQLAlchemy 2.0 声明式基类，SQLite 文件数据库 `crm.db`。通过 `get_db()` 生成器管理 Session 生命周期，配合 FastAPI 的 `Depends` 注入。

**SQLite 配置：** `check_same_thread=False`（允许多线程访问）。

### 2.2 数据结构

#### 实体关系图

```
┌──────────────┐       ┌──────────────┐
│   Customer   │1────N│   Contact    │
│──────────────│       │──────────────│
│ id (PK)      │       │ id (PK)      │
│ name         │       │ customer_id  │──FK
│ industry     │       │ name         │
│ scale        │       │ position     │
│ source       │       │ phone        │
│ status       │       │ email        │
│ region       │       │ is_primary   │
│ address      │       └──────────────┘
│ remark       │
│ created_at   │       ┌──────────────┐       ┌──────────────┐
│ updated_at   │1────N│ Opportunity  │1────N│  FollowUp    │
└──────────────┘       │──────────────│       │──────────────│
                       │ id (PK)      │       │ id (PK)      │
                       │ customer_id  │──FK   │ opportunity_id│──FK
                       │ title        │       │ type         │
                       │ stage        │       │ content      │
                       │ amount       │       │ next_plan    │
                       │ expected_    │       │ created_at   │
                       │  close_date  │       └──────────────┘
                       │ priority     │
                       │ remark       │
                       │ created_at   │
                       │ updated_at   │
                       └──────────────┘
```

#### Customer 表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK, 自增 | 主键 |
| name | VARCHAR(100) | NOT NULL | 客户名称 |
| industry | VARCHAR(50) | NOT NULL | 行业（如：互联网、金融、制造业） |
| scale | VARCHAR(20) | NOT NULL | 规模（如：1-50人、50-200人） |
| source | VARCHAR(50) | NOT NULL | 来源渠道（如：官网、转介绍、展会） |
| status | VARCHAR(20) | NOT NULL, 默认"潜在" | 客户状态：潜在/活跃/成交/流失 |
| region | VARCHAR(100) | 可空 | 地区 |
| address | VARCHAR(200) | 可空 | 详细地址 |
| remark | TEXT | 可空 | 备注 |
| created_at | DATETIME | NOT NULL, server_default=now() | 创建时间 |
| updated_at | DATETIME | NOT NULL, server_default=now(), onupdate=now() | 更新时间 |

#### Contact 表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK, 自增 | 主键 |
| customer_id | INTEGER | FK → customers.id, NOT NULL | 所属客户 |
| name | VARCHAR(50) | NOT NULL | 联系人姓名 |
| position | VARCHAR(50) | 可空 | 职位 |
| phone | VARCHAR(20) | 可空 | 电话 |
| email | VARCHAR(100) | 可空 | 邮箱 |
| is_primary | BOOLEAN | 默认 false | 是否主要联系人 |

#### Opportunity 表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK, 自增 | 主键 |
| customer_id | INTEGER | FK → customers.id, NOT NULL | 关联客户 |
| title | VARCHAR(200) | NOT NULL | 机会标题 |
| stage | VARCHAR(20) | NOT NULL, 默认"初步接触" | 销售阶段 |
| amount | FLOAT | 默认 0 | 预估金额 |
| expected_close_date | DATE | 可空 | 预计成交日期 |
| priority | VARCHAR(10) | NOT NULL, 默认"中" | 优先级：高/中/低 |
| remark | TEXT | 可空 | 备注 |
| created_at | DATETIME | NOT NULL, server_default=now() | 创建时间 |
| updated_at | DATETIME | NOT NULL, server_default=now(), onupdate=now() | 更新时间 |

#### FollowUp 表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK, 自增 | 主键 |
| opportunity_id | INTEGER | FK → opportunities.id, NOT NULL | 关联机会 |
| type | VARCHAR(20) | NOT NULL | 跟进方式：电话/邮件/拜访/会议 |
| content | TEXT | NOT NULL | 跟进内容 |
| next_plan | TEXT | 可空 | 下一步计划 |
| created_at | DATETIME | NOT NULL, server_default=now() | 创建时间 |

#### 级联删除规则

| 父实体 | 子实体 | 策略 |
|--------|--------|------|
| Customer | Contact | `cascade="all, delete-orphan"` |
| Customer | Opportunity | `cascade="all, delete-orphan"` |
| Opportunity | FollowUp | `cascade="all, delete-orphan"` |

#### 业务枚举值

| 枚举 | 可选值 |
|------|--------|
| 客户状态 | 潜在、活跃、成交、流失 |
| 机会阶段 | 初步接触 → 需求确认 → 方案报价 → 商务谈判 → 赢单 / 输单 |
| 机会优先级 | 高、中、低 |
| 跟进方式 | 电话、邮件、拜访、会议 |

### 2.3 Pydantic Schema 设计

每个实体对应三个 Schema：`Create`（创建请求）、`Update`（更新请求，所有字段可选）、`Response`（响应）。

**CustomerCreate：** `name`(必填), `industry`(必填), `scale`(必填), `source`(必填), `status`(默认"潜在"), `region`, `address`, `remark`

**CustomerUpdate：** 所有字段可选，仅更新传入的字段（`exclude_unset=True`）

**CustomerResponse：** 全部字段 + `created_at` + `updated_at`，启用 `from_attributes=True`

**ContactCreate：** `customer_id`(必填), `name`(必填), `position`, `phone`, `email`, `is_primary`(默认 false)

**ContactUpdate：** 所有字段可选

**OpportunityCreate：** `customer_id`(必填), `title`(必填), `stage`(默认"初步接触"), `amount`(默认 0), `expected_close_date`, `priority`(默认"中"), `remark`

**OpportunityUpdate：** 所有字段可选

**FollowUpCreate：** `opportunity_id`(必填), `type`(必填), `content`(必填), `next_plan`

**分页响应：** `CustomerListResponse` 和 `OpportunityListResponse` 统一结构 `{items: T[], total: int, page: int, page_size: int}`

---

### 2.4 API 接口定义

所有接口统一前缀 `/api`，请求和响应均为 JSON 格式。

#### 2.4.1 客户接口 (`/api/customers`)

**GET /api/customers** — 客户列表（分页 + 筛选）

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| keyword | Query | string | 否 | 按客户名称模糊搜索 |
| industry | Query | string | 否 | 按行业精确筛选 |
| status | Query | string | 否 | 按状态精确筛选 |
| page | Query | int | 否 | 页码，默认 1，≥1 |
| page_size | Query | int | 否 | 每页条数，默认 20，范围 1-100 |

响应：`200 OK`
```json
{
  "items": [CustomerResponse],
  "total": 100,
  "page": 1,
  "page_size": 20
}
```

排序：按 `created_at` 倒序。筛选条件为交集关系。

---

**POST /api/customers** — 创建客户

请求体：`CustomerCreate`
```json
{
  "name": "示例公司",
  "industry": "互联网",
  "scale": "50-200人",
  "source": "官网",
  "status": "潜在",
  "region": "北京",
  "address": "朝阳区xxx",
  "remark": "备注信息"
}
```

响应：`200 OK` → `CustomerResponse`

---

**GET /api/customers/{customer_id}** — 客户详情

响应：`200 OK`
```json
{
  "id": 1,
  "name": "示例公司",
  "industry": "互联网",
  "...": "...",
  "contacts": [ContactResponse],
  "opportunities": [OpportunityResponse]
}
```

错误：`404 Not Found` → `{"detail": "Customer not found"}`

使用 `joinedload` 预加载联系人和机会关联数据，避免 N+1 查询。

---

**PUT /api/customers/{customer_id}** — 更新客户

请求体：`CustomerUpdate`（部分更新，仅传需要修改的字段）

响应：`200 OK` → `CustomerResponse`

错误：`404 Not Found`

---

**DELETE /api/customers/{customer_id}** — 删除客户

响应：`200 OK` → `{"detail": "Deleted"}`

错误：`404 Not Found`

级联删除所有关联的联系人、销售机会及跟进记录。

---

#### 2.4.2 联系人接口

**GET /api/customers/{customer_id}/contacts** — 某客户的联系人列表

响应：`200 OK` → `ContactResponse[]`

---

**POST /api/contacts** — 创建联系人

请求体：`ContactCreate`
```json
{
  "customer_id": 1,
  "name": "张三",
  "position": "技术总监",
  "phone": "13800138000",
  "email": "zhangsan@example.com",
  "is_primary": true
}
```

响应：`200 OK` → `ContactResponse`

---

**PUT /api/contacts/{contact_id}** — 更新联系人

请求体：`ContactUpdate`（部分更新）

响应：`200 OK` → `ContactResponse`

错误：`404 Not Found` → `{"detail": "Contact not found"}`

---

**DELETE /api/contacts/{contact_id}** — 删除联系人

响应：`200 OK` → `{"detail": "Deleted"}`

错误：`404 Not Found`

---

#### 2.4.3 销售机会接口 (`/api/opportunities`)

**GET /api/opportunities** — 机会列表（分页 + 筛选）

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| keyword | Query | string | 否 | 按机会标题模糊搜索 |
| stage | Query | string | 否 | 按阶段精确筛选 |
| priority | Query | string | 否 | 按优先级精确筛选 |
| page | Query | int | 否 | 页码，默认 1 |
| page_size | Query | int | 否 | 每页条数，默认 20 |

响应：`200 OK`
```json
{
  "items": [
    {
      "id": 1,
      "customer_id": 1,
      "title": "XX项目采购",
      "stage": "需求确认",
      "amount": 500000,
      "customer_name": "示例公司",
      "...": "..."
    }
  ],
  "total": 30,
  "page": 1,
  "page_size": 20
}
```

列表查询通过 `JOIN Customer` 获取 `customer_name`，按 `created_at` 倒序排列。

---

**POST /api/opportunities** — 创建机会

请求体：`OpportunityCreate`
```json
{
  "customer_id": 1,
  "title": "XX项目采购",
  "stage": "初步接触",
  "amount": 500000,
  "expected_close_date": "2026-06-30",
  "priority": "高",
  "remark": "客户有明确预算"
}
```

响应：`200 OK` → `OpportunityResponse`

---

**GET /api/opportunities/{opp_id}** — 机会详情

响应：`200 OK`
```json
{
  "id": 1,
  "customer_id": 1,
  "title": "XX项目采购",
  "customer_name": "示例公司",
  "...": "...",
  "follow_ups": [FollowUpResponse]
}
```

错误：`404 Not Found` → `{"detail": "Opportunity not found"}`

使用 `joinedload` 预加载跟进记录和客户关联数据。

---

**PUT /api/opportunities/{opp_id}** — 更新机会

请求体：`OpportunityUpdate`（部分更新）

响应：`200 OK` → `OpportunityResponse`

错误：`404 Not Found`

---

**DELETE /api/opportunities/{opp_id}** — 删除机会

响应：`200 OK` → `{"detail": "Deleted"}`

错误：`404 Not Found`

级联删除所有关联的跟进记录。

---

#### 2.4.4 跟进记录接口

**GET /api/opportunities/{opp_id}/followups** — 某机会的跟进列表

响应：`200 OK` → `FollowUpResponse[]`

按 `created_at` 倒序排列。

---

**POST /api/followups** — 创建跟进记录

请求体：`FollowUpCreate`
```json
{
  "opportunity_id": 1,
  "type": "电话",
  "content": "与客户沟通了需求细节，客户对方案表示认可",
  "next_plan": "下周安排现场演示"
}
```

响应：`200 OK` → `FollowUpResponse`

---

#### 2.4.5 数据分析接口 (`/api/analytics`)

**GET /api/analytics/overview** — 业务概览

响应：
```json
{
  "total_customers": 20,
  "active_opportunities": 18,
  "new_customers_this_month": 5,
  "total_amount": 15000000
}
```

- `active_opportunities`：阶段不为"赢单"或"输单"的机会数
- `new_customers_this_month`：当月 1 日 00:00 之后创建的客户数
- `total_amount`：所有机会金额之和（含已赢单/输单）

---

**GET /api/analytics/customer-industry** — 客户行业分布

响应：
```json
[
  {"industry": "互联网", "count": 8},
  {"industry": "金融", "count": 5}
]
```

按行业分组统计客户数量。

---

**GET /api/analytics/sales-funnel** — 销售漏斗

响应：
```json
[
  {"stage": "初步接触", "count": 10, "amount": 5000000},
  {"stage": "需求确认", "count": 8, "amount": 4000000},
  {"stage": "方案报价", "count": 5, "amount": 3000000},
  {"stage": "商务谈判", "count": 3, "amount": 2000000},
  {"stage": "赢单", "count": 2, "amount": 1500000},
  {"stage": "输单", "count": 2, "amount": 500000}
]
```

固定 6 个阶段顺序输出，无数据的阶段 count=0, amount=0。

---

**GET /api/analytics/amount-trend** — 近 6 月金额趋势

响应：
```json
[
  {"month": "2025-11", "amount": 2000000},
  {"month": "2025-12", "amount": 2500000}
]
```

统计近 180 天内按月汇总的机会金额，使用 `strftime("%Y-%m", created_at)` 分组。

---

**GET /api/analytics/customer-growth** — 近 6 月客户增长

响应：
```json
[
  {"month": "2025-11", "count": 3},
  {"month": "2025-12", "count": 5}
]
```

统计近 180 天内按月汇总的新增客户数。

---

#### 2.4.6 健康检查

**GET /api/health**

响应：`200 OK` → `{"status": "ok"}`

---

#### 2.4.7 错误响应约定

| HTTP 状态码 | 触发场景 | 响应体格式 |
|-------------|----------|------------|
| 200 | 请求成功 | 业务数据 |
| 404 | 资源不存在（ID 无效） | `{"detail": "<Entity> not found"}` |
| 422 | 请求体校验失败 | Pydantic 自动生成的校验错误详情 |

---

## 3. 前端设计

### 3.1 路由设计

| 路径 | 页面组件 | 说明 |
|------|----------|------|
| `/dashboard` | Dashboard | 数据看板，系统默认首页 |
| `/customers` | CustomerList | 客户列表，支持搜索筛选和分页 |
| `/customers/:id` | CustomerDetail | 客户详情，含联系人和机会列表 |
| `/opportunities` | OpportunityList | 销售机会列表，支持筛选和分页 |
| `/opportunities/:id` | OpportunityDetail | 机会详情，含跟进记录列表 |
| `*` | — | 所有未匹配路径重定向到 `/dashboard` |

所有页面嵌套在 `Layout` 组件内，Layout 提供 Ant Design 侧边栏导航（数据看板、客户管理、销售机会）。使用 `ConfigProvider` 配置 Ant Design 中文语言包。

### 3.2 组件职责

**页面组件（pages/）：**

| 组件 | 职责 |
|------|------|
| Dashboard | 调用 5 个 analytics API，渲染 4 个 Statistic 卡片 + 4 个图表（饼图、漏斗图、折线图、柱状图） |
| CustomerList | 调用 `getCustomers` API，渲染搜索框 + 行业/状态筛选 + 分页 Table，弹出 CustomerForm 创建客户 |
| CustomerDetail | 调用 `getCustomer` API，渲染客户信息卡片 + 联系人 Table（含 ContactForm）+ 机会 Table |
| OpportunityList | 调用 `getOpportunities` API，渲染筛选 + 分页 Table，弹出 OpportunityForm 创建机会 |
| OpportunityDetail | 调用 `getOpportunity` API，渲染机会信息卡片 + 跟进记录 Timeline/Table（含 FollowUpForm） |

**表单组件（components/）：**

| 组件 | 职责 |
|------|------|
| Layout | Ant Design Layout + Sider + Menu，提供侧边栏导航，内容区渲染 `<Outlet />` |
| CustomerForm | Modal 表单，支持新建和编辑模式，表单校验必填字段 |
| ContactForm | Modal 表单，新建/编辑联系人，关联到当前客户 |
| OpportunityForm | Modal 表单，新建/编辑机会，下拉选择关联客户 |
| FollowUpForm | Modal 表单，新建跟进记录，下拉选择跟进方式 |

### 3.3 API 层设计

统一使用 Axios 实例，配置 `baseURL: '/api'`：

- 开发环境：Vite proxy 将 `/api` 代理到 `http://localhost:8000`
- 每个 API 函数返回 `Promise<T>`，在 `.then(r => r.data)` 中解包响应
- 按业务模块分组：Customers、Contacts、Opportunities、FollowUps、Analytics

### 3.4 TypeScript 类型定义

前端类型与后端 Pydantic Schema 一一对应：

| 类型 | 对应后端 Schema | 说明 |
|------|-----------------|------|
| `Customer` | `CustomerResponse` | 客户实体 |
| `Contact` | `ContactResponse` | 联系人实体 |
| `Opportunity` | `OpportunityResponse` | 销售机会实体（含可选 `customer_name`） |
| `FollowUp` | `FollowUpResponse` | 跟进记录实体 |
| `PaginatedResponse<T>` | `*ListResponse` | 分页响应通用类型 |
| `OverviewData` | analytics/overview 响应 | 概览指标 |
| `IndustryData` | analytics/customer-industry 响应 | 行业分布数据 |
| `FunnelData` | analytics/sales-funnel 响应 | 漏斗数据 |
| `TrendData` | analytics/amount-trend / customer-growth 响应 | 趋势数据 |

### 3.5 状态管理

- 无全局状态管理库，各页面组件内部使用 `useState` + `useEffect` 管理数据获取和 UI 状态
- 列表页筛选和分页状态通过组件 state 管理
- 表单组件通过 props 回调（`onSuccess`）通知父组件刷新数据
