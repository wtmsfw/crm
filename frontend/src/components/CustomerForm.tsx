import React, { useEffect } from 'react'
import { Drawer, Form, Input, Select, Button } from 'antd'
import type { Customer } from '../types'

const { TextArea } = Input

interface Props {
  open: boolean
  customer?: Customer | null
  onClose: () => void
  onSubmit: (values: Partial<Customer>) => void
}

const industries = ['互联网', '金融', '制造', '教育', '医疗', '其他']
const scales = ['小型', '中型', '大型', '集团']
const sources = ['官网', '转介绍', '广告', '展会', '电话', '其他']
const statuses = ['潜在', '活跃', '成交', '流失']

const CustomerForm: React.FC<Props> = ({ open, customer, onClose, onSubmit }) => {
  const [form] = Form.useForm()

  useEffect(() => {
    if (open) {
      form.setFieldsValue(customer || { status: '潜在' })
    }
  }, [open, customer, form])

  const handleFinish = (values: any) => {
    onSubmit(values)
    form.resetFields()
  }

  return (
    <Drawer
      title={customer ? '编辑客户' : '新建客户'}
      open={open}
      onClose={onClose}
      width={480}
      extra={
        <Button type="primary" onClick={() => form.submit()}>
          保存
        </Button>
      }
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item name="name" label="客户名称" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="industry" label="行业" rules={[{ required: true }]}>
          <Select options={industries.map(v => ({ label: v, value: v }))} />
        </Form.Item>
        <Form.Item name="scale" label="规模" rules={[{ required: true }]}>
          <Select options={scales.map(v => ({ label: v, value: v }))} />
        </Form.Item>
        <Form.Item name="source" label="来源" rules={[{ required: true }]}>
          <Select options={sources.map(v => ({ label: v, value: v }))} />
        </Form.Item>
        <Form.Item name="status" label="状态" rules={[{ required: true }]}>
          <Select options={statuses.map(v => ({ label: v, value: v }))} />
        </Form.Item>
        <Form.Item name="region" label="地区">
          <Input />
        </Form.Item>
        <Form.Item name="address" label="详细地址">
          <Input />
        </Form.Item>
        <Form.Item name="remark" label="备注">
          <TextArea rows={3} />
        </Form.Item>
      </Form>
    </Drawer>
  )
}

export default CustomerForm
