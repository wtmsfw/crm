import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Descriptions, Table, Button, Tag, Space, Spin, message, Popconfirm } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { getCustomer, createContact, updateContact, deleteContact } from '../services/api'
import ContactForm from '../components/ContactForm'
import type { Customer, Contact, Opportunity } from '../types'

const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState<Customer>()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)

  const fetchData = async () => {
    setLoading(true)
    const data = await getCustomer(Number(id))
    setCustomer(data)
    setContacts(data.contacts)
    setOpportunities(data.opportunities)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [id])

  const handleContactSubmit = async (values: any) => {
    if (editingContact) {
      await updateContact(editingContact.id, values)
      message.success('更新成功')
    } else {
      await createContact(values)
      message.success('创建成功')
    }
    setContactModalOpen(false)
    setEditingContact(null)
    fetchData()
  }

  const handleDeleteContact = async (contactId: number) => {
    await deleteContact(contactId)
    message.success('删除成功')
    fetchData()
  }

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />

  return (
    <div>
      <Card title="客户信息" style={{ marginBottom: 16 }}>
        <Descriptions column={2}>
          <Descriptions.Item label="客户名称">{customer?.name}</Descriptions.Item>
          <Descriptions.Item label="行业">{customer?.industry}</Descriptions.Item>
          <Descriptions.Item label="规模">{customer?.scale}</Descriptions.Item>
          <Descriptions.Item label="来源">{customer?.source}</Descriptions.Item>
          <Descriptions.Item label="状态"><Tag>{customer?.status}</Tag></Descriptions.Item>
          <Descriptions.Item label="地区">{customer?.region}</Descriptions.Item>
          <Descriptions.Item label="地址">{customer?.address}</Descriptions.Item>
          <Descriptions.Item label="备注">{customer?.remark}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="联系人" style={{ marginBottom: 16 }} extra={
        <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => { setEditingContact(null); setContactModalOpen(true) }}>新增</Button>
      }>
        <Table rowKey="id" dataSource={contacts} pagination={false} columns={[
          { title: '姓名', dataIndex: 'name' },
          { title: '职位', dataIndex: 'position' },
          { title: '电话', dataIndex: 'phone' },
          { title: '邮箱', dataIndex: 'email' },
          { title: '主要联系人', dataIndex: 'is_primary', render: (v: boolean) => v ? <Tag color="green">是</Tag> : '否' },
          { title: '操作', render: (_: any, r: Contact) => (
            <Space>
              <a onClick={() => { setEditingContact(r); setContactModalOpen(true) }}>编辑</a>
              <Popconfirm title="确认删除？" onConfirm={() => handleDeleteContact(r.id)}>
                <a style={{ color: 'red' }}>删除</a>
              </Popconfirm>
            </Space>
          )},
        ]} />
      </Card>

      <Card title="关联销售机会">
        <Table rowKey="id" dataSource={opportunities} pagination={false} columns={[
          { title: '机会名称', dataIndex: 'title', render: (t: string, r: Opportunity) => <a onClick={() => navigate(`/opportunities/${r.id}`)}>{t}</a> },
          { title: '阶段', dataIndex: 'stage', render: (s: string) => <Tag>{s}</Tag> },
          { title: '金额', dataIndex: 'amount', render: (v: number) => `¥${v.toLocaleString()}` },
          { title: '优先级', dataIndex: 'priority' },
        ]} />
      </Card>

      <ContactForm
        open={contactModalOpen}
        contact={editingContact}
        customerId={Number(id)}
        onClose={() => { setContactModalOpen(false); setEditingContact(null) }}
        onSubmit={handleContactSubmit}
      />
    </div>
  )
}

export default CustomerDetail
