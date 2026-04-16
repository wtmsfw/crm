import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Card, Descriptions, Steps, Timeline, Button, Tag, Spin, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { getOpportunity, createFollowUp, updateOpportunity } from '../services/api'
import FollowUpForm from '../components/FollowUpForm'
import type { Opportunity, FollowUp } from '../types'

const ALL_STAGES = ['初步接触', '需求确认', '方案报价', '商务谈判', '赢单', '输单']
const priorityColors: Record<string, string> = { '高': 'red', '中': 'orange', '低': 'default' }

const OpportunityDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [opp, setOpp] = useState<Opportunity>()
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    const data = await getOpportunity(Number(id))
    setOpp(data)
    setFollowUps((data as any).follow_ups || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [id])

  const handleFollowUpSubmit = async (values: any) => {
    await createFollowUp(values)
    message.success('跟进记录已添加')
    setModalOpen(false)
    fetchData()
  }

  const handleStageChange = async (newStage: string) => {
    await updateOpportunity(Number(id), { stage: newStage })
    message.success(`阶段已更新为：${newStage}`)
    fetchData()
  }

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />

  const currentStageIndex = ALL_STAGES.indexOf(opp?.stage || '')

  return (
    <div>
      <Card title="机会信息" style={{ marginBottom: 16 }}>
        <Descriptions column={2}>
          <Descriptions.Item label="机会名称">{opp?.title}</Descriptions.Item>
          <Descriptions.Item label="关联客户">{opp?.customer_name}</Descriptions.Item>
          <Descriptions.Item label="阶段"><Tag>{opp?.stage}</Tag></Descriptions.Item>
          <Descriptions.Item label="金额">¥{opp?.amount?.toLocaleString()}</Descriptions.Item>
          <Descriptions.Item label="优先级"><Tag color={priorityColors[opp?.priority || '']}>{opp?.priority}</Tag></Descriptions.Item>
          <Descriptions.Item label="预计成交">{opp?.expected_close_date}</Descriptions.Item>
          <Descriptions.Item label="备注">{opp?.remark}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="阶段进度" style={{ marginBottom: 16 }}>
        <Steps
          current={currentStageIndex >= 0 ? currentStageIndex : 0}
          items={ALL_STAGES.map((s, i) => ({
            title: s,
            status: i === currentStageIndex ? 'process' : i < currentStageIndex ? 'finish' : 'wait',
          }))}
          onChange={(current) => handleStageChange(ALL_STAGES[current])}
        />
      </Card>

      <Card title="跟进记录" extra={
        <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>添加跟进</Button>
      }>
        <Timeline
          items={followUps.map(f => ({
            children: (
              <div>
                <div><Tag>{f.type}</Tag> <span style={{ color: '#999', fontSize: 12 }}>{f.created_at?.slice(0, 16)}</span></div>
                <div style={{ margin: '4px 0' }}>{f.content}</div>
                {f.next_plan && <div style={{ color: '#666', fontSize: 12 }}>下一步：{f.next_plan}</div>}
              </div>
            ),
          }))}
        />
        {followUps.length === 0 && <div style={{ color: '#999' }}>暂无跟进记录</div>}
      </Card>

      <FollowUpForm
        open={modalOpen}
        opportunityId={Number(id)}
        onClose={() => setModalOpen(false)}
        onSubmit={handleFollowUpSubmit}
      />
    </div>
  )
}

export default OpportunityDetail
