import React, { useEffect, useState } from 'react'
import { Table, Button, Input, Select, Space, Tag, Popconfirm, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../services/api'
import CustomerForm from '../components/CustomerForm'
import type { Customer } from '../types'

const statusColors: Record<string, string> = {
  '潜在': 'blue', '活跃': 'green', '成交': 'gold', '流失': 'red',
}

const CustomerList: React.FC = () => {
  const navigate = useNavigate()
  const [data, setData] = useState<Customer[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [industry, setIndustry] = useState('')
  const [status, setStatus] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)

  const fetchData = async (p = page) => {
    setLoading(true)
    const res = await getCustomers({ keyword, industry, status, page: p, page_size: 20 })
    setData(res.items)
    setTotal(res.total)
    setLoading(false)
  }

  useEffect(() => { fetchData(1) }, [keyword, industry, status])

  const handleSubmit = async (values: Partial<Customer>) => {
    if (editing) {
      await updateCustomer(editing.id, values)
      message.success('更新成功')
    } else {
      await createCustomer(values)
      message.success('创建成功')
    }
    setDrawerOpen(false)
    setEditing(null)
    fetchData()
  }

  const handleDelete = async (id: number) => {
    await deleteCustomer(id)
    message.success('删除成功')
    fetchData()
  }

  const columns = [
    { title: '客户名称', dataIndex: 'name', render: (t: string, r: Customer) => <a onClick={() => navigate(`/customers/${r.id}`)}>{t}</a> },
    { title: '行业', dataIndex: 'industry' },
    { title: '规模', dataIndex: 'scale' },
    { title: '来源', dataIndex: 'source' },
    { title: '状态', dataIndex: 'status', render: (s: string) => <Tag color={statusColors[s]}>{s}</Tag> },
    { title: '创建时间', dataIndex: 'created_at', render: (t: string) => t?.slice(0, 10) },
    {
      title: '操作', render: (_: any, r: Customer) => (
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
        <Input.Search placeholder="搜索客户名称" onSearch={v => { setKeyword(v); setPage(1) }} allowClear style={{ width: 200 }} />
        <Select placeholder="行业" allowClear style={{ width: 120 }} onChange={v => { setIndustry(v || ''); setPage(1) }}
          options={['互联网','金融','制造','教育','医疗','其他'].map(v => ({ label: v, value: v }))} />
        <Select placeholder="状态" allowClear style={{ width: 120 }} onChange={v => { setStatus(v || ''); setPage(1) }}
          options={['潜在','活跃','成交','流失'].map(v => ({ label: v, value: v }))} />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); setDrawerOpen(true) }}>新建客户</Button>
      </Space>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{ current: page, total, pageSize: 20, onChange: p => { setPage(p); fetchData(p) } }}
      />
      <CustomerForm open={drawerOpen} customer={editing} onClose={() => { setDrawerOpen(false); setEditing(null) }} onSubmit={handleSubmit} />
    </div>
  )
}

export default CustomerList
