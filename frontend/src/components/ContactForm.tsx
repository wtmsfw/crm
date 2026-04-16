import React, { useEffect } from 'react'
import { Modal, Form, Input, Switch } from 'antd'
import type { Contact } from '../types'

interface Props {
  open: boolean
  contact?: Contact | null
  customerId: number
  onClose: () => void
  onSubmit: (values: any) => void
}

const ContactForm: React.FC<Props> = ({ open, contact, customerId, onClose, onSubmit }) => {
  const [form] = Form.useForm()

  useEffect(() => {
    if (open) {
      form.setFieldsValue(contact || { is_primary: false })
    }
  }, [open, contact, form])

  return (
    <Modal
      title={contact ? '编辑联系人' : '新增联系人'}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
    >
      <Form form={form} layout="vertical" onFinish={values => {
        onSubmit({ ...values, customer_id: customerId })
        form.resetFields()
      }}>
        <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="position" label="职位">
          <Input />
        </Form.Item>
        <Form.Item name="phone" label="电话">
          <Input />
        </Form.Item>
        <Form.Item name="email" label="邮箱">
          <Input />
        </Form.Item>
        <Form.Item name="is_primary" label="主要联系人" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default ContactForm
