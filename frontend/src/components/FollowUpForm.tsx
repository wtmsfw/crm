import React from 'react'
import { Modal, Form, Input, Select } from 'antd'

const { TextArea } = Input

interface Props {
  open: boolean
  opportunityId: number
  onClose: () => void
  onSubmit: (values: any) => void
}

const followTypes = ['电话', '邮件', '拜访', '会议', '其他']

const FollowUpForm: React.FC<Props> = ({ open, opportunityId, onClose, onSubmit }) => {
  const [form] = Form.useForm()

  return (
    <Modal
      title="添加跟进记录"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
    >
      <Form form={form} layout="vertical" onFinish={values => {
        onSubmit({ ...values, opportunity_id: opportunityId })
        form.resetFields()
      }}>
        <Form.Item name="type" label="跟进方式" rules={[{ required: true }]}>
          <Select options={followTypes.map(v => ({ label: v, value: v }))} />
        </Form.Item>
        <Form.Item name="content" label="跟进内容" rules={[{ required: true }]}>
          <TextArea rows={4} />
        </Form.Item>
        <Form.Item name="next_plan" label="下一步计划">
          <TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default FollowUpForm
