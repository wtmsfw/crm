import React, { useEffect, useState } from 'react'
import { Drawer, Form, Input, Select, InputNumber, DatePicker, Button } from 'antd'
import dayjs from 'dayjs'
import { getCustomers } from '../services/api'
import type { Opportunity, Customer } from '../types'

const { TextArea } = Input

interface Props {
  open: boolean
  opportunity?: Opportunity | null
  onClose: () => void
  onSubmit: (values: any) => void
}

const stages = ['初步接触', '需求确认', '方案报价', '商务谈判', '赢单', '输单']
const priorities = ['高', '中', '低']

const OpportunityForm: React.FC<Props> = ({ open, opportunity, onClose, onSubmit }) => {
  const [form] = Form.useForm()
  const [customers, setCustomers] = useState<Customer[]>([])

  useEffect(() => {
    if (open) {
      getCustomers({ page_size: 100 }).then(res => setCustomers(res.items))
      if (opportunity) {
        form.setFieldsValue({
          ...opportunity,
          expected_close_date: opportunity.expected_close_date ? dayjs(opportunity.expected_close_date) : null,
        })
      } else {
        form.setFieldsValue({ stage: '初步接触', priority: '中', amount: 0 })
      }
    }
  }, [open, opportunity, form])

  const handleFinish = (values: any) => {
    const payload = {
      ...values,
      expected_close_date: values.expected_close_date?.format('YYYY-MM-DD') || null,
    }
    onSubmit(payload)
    form.resetFields()
  }

  return (
    <Drawer
      title={opportunity ? '编辑销售机会' : '新建销售机会'}
      open={open}
      onClose={onClose}
      width={480}
      extra={<Button type="primary" onClick={() => form.submit()}>保存</Button>}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item name="customer_id" label="关联客户" rules={[{ required: true }]}>
          <Select
            showSearch
            optionFilterProp="label"
            options={customers.map(c => ({ label: c.name, value: c.id }))}
          />
        </Form.Item>
        <Form.Item name="title" label="机会名称" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="stage" label="阶段" rules={[{ required: true }]}>
          <Select options={stages.map(v => ({ label: v, value: v }))} />
        </Form.Item>
        <Form.Item name="amount" label="预估金额（元）">
          <InputNumber style={{ width: '100%' }} min={0} />
        </Form.Item>
        <Form.Item name="expected_close_date" label="预计成交日期">
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="priority" label="优先级" rules={[{ required: true }]}>
          <Select options={priorities.map(v => ({ label: v, value: v }))} />
        </Form.Item>
        <Form.Item name="remark" label="备注">
          <TextArea rows={3} />
        </Form.Item>
      </Form>
    </Drawer>
  )
}

export default OpportunityForm
