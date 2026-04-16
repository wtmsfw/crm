import React, { useEffect, useState } from 'react'
import { Table, Button, Input, Select, Space, Tag, Popconfirm, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { getOpportunities, createOpportunity, updateOpportunity, deleteOpportunity } from '../services/api'
import OpportunityForm from '../components/OpportunityForm'
import type { Opportunity } from '../types'

const stageColors: Record<string, string> = {
  '初步接触': 'blue', '需求确认': 'cyan', '方案报价': 'geekblue',
  '商务谈判': 'purple', '赢单': 'green', '输单': 'red',
}
const priorityColors: Record<string, string> = { '高': 'red', '中': 'orange', '低': 'default' }

const OpportunityList: React.FC = () => {
  const navigate = useNavigate()
  const [data, setData] = useState<Opportunity[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [stage, setStage] = useState('')
  const [priority, setPriority] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Opportunity | null>(null)

  const fetchData = async (p = page) => {
    setLoading(true)
    const res = await getOpportunities({ keyword, stage, priority, page: p, page_size: 20 })
    setData(res.items)
    setTotal(res.total)
    setLoading(false)
  }

  useEffect(() => { fetchData(1) }, [keyword, stage, priority])

  const handleSubmit = async (values: any) => {
    if (editing) {
      await updateOpportunity(editing.id, values)
      message.success('更新成功')
    } else {
      await createOpportunity(values)
      message.success('创建成功')
    }
    setDrawerOpen(false)
    setEditing(null)
    fetchData()
  }

  const handleDelete = async (id: number) => {
    await deleteOpportunity(id)
    message.success('删除成功')
    fetchData()
  }

  const columns = [
    { title: '机会名称', dataIndex: 'title', render: (t: string, r: Opportunity) => <a onClick={() => navigate(`/opportunities/${r.id}`)}>{t}</a> },
    { title: '关联客户', dataIndex: 'customer_name' },
    { title: '阶段', dataIndex: 'stage', render: (s: string) => <Tag color={stageColors[s]}>{s}</Tag> },
    { title: '金额', dataIndex: 'amount', render: (v: number) => `¥${v.toLocaleString()}` },
    { title: '优先级', dataIndex: 'priority', render: (p: string) => <Tag color={priorityColors[p]}>{p}</Tag> },
    { title: '预计成交', dataIndex: 'expected_close_date' },
    {
      title: '操作', render: (_: any, r: Opportunity) => (
        <Space>
          <a onClick={() => { setEditing(r); setDrawerOpen(true) }}>编辑</a>
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(r.id)}>
            <a style={{ color: 'red' }}>删除</a>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Input.Search placeholder="搜索机会名称" onSearch={v => { setKeyword(v); setPage(1) }} allowClear style={{ width: 200 }} />
        <Select placeholder="阶段" allowClear style={{ width: 120 }} onChange={v => { setStage(v || ''); setPage(1) }}
          options={['初步接触','需求确认','方案报价','商务谈判','赢单','输单'].map(v => ({ label: v, value: v }))} />
        <Select placeholder="优先级" allowClear style={{ width: 100 }} onChange={v => { setPriority(v || ''); setPage(1) }}
          options={['高','中','低'].map(v => ({ label: v, value: v }))} />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); setDrawerOpen(true) }}>新建机会</Button>
      </Space>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{ current: page, total, pageSize: 20, onChange: p => { setPage(p); fetchData(p) } }}
      />
      <OpportunityForm open={drawerOpen} opportunity={editing} onClose={() => { setDrawerOpen(false); setEditing(null) }} onSubmit={handleSubmit} />
    </div>
  )
}

export default OpportunityList
