# CRM 客户关系管理系统 (MVP)

面向企业销售与客户运营场景的 CRM 系统，覆盖客户管理、销售流程管理、数据分析三个核心模块。

## 技术栈

- 前端：React 18 + TypeScript + Ant Design 5 + @ant-design/charts 2.x
- 后端：FastAPI + SQLAlchemy 2.0 + Pydantic v2
- 数据库：SQLite
- 构建工具：Vite

## 快速启动

### 1. 启动后端

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

首次启动会自动创建数据库并填充演示数据（20 个客户、30 个销售机会）。

### 2. 启动前端

```bash
cd frontend
npm install
npm run dev
```

访问 http://localhost:5173

## 功能模块

- **数据看板**：统计卡片 + 行业分布饼图 + 销售漏斗图 + 金额趋势图 + 客户增长图
- **客户管理**：客户列表（搜索/筛选/分页）→ 客户详情（联系人管理 + 关联机会）
- **销售管理**：机会列表（搜索/筛选/分页）→ 机会详情（阶段推进 + 跟进记录时间线）

## 业务流程

```
录入客户 → 添加联系人 → 创建销售机会 → 记录跟进 → 推进阶段 → 赢单/输单
```

## 项目结构

```
crm/
├── backend/                # FastAPI 后端
│   ├── app/
│   │   ├── main.py         # 应用入口
│   │   ├── database.py     # 数据库配置
│   │   ├── models/         # ORM 模型
│   │   ├── schemas/        # Pydantic 模型
│   │   ├── routers/        # API 路由
│   │   └── seed.py         # 种子数据
│   └── requirements.txt
├── frontend/               # React 前端
│   ├── src/
│   │   ├── pages/          # 页面组件
│   │   ├── components/     # 通用组件
│   │   ├── services/       # API 调用
│   │   └── types/          # TS 类型
│   └── package.json
└── docs/                   # 设计文档
```
