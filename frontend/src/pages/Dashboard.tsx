import React, { useEffect, useState } from 'react'
import { Card, Col, Row, Statistic, Spin } from 'antd'
import {
  TeamOutlined,
  RocketOutlined,
  UserAddOutlined,
  DollarOutlined,
} from '@ant-design/icons'
import { Pie, Funnel, Line, Column } from '@ant-design/charts'
import {
  getOverview,
  getCustomerIndustry,
  getSalesFunnel,
  getAmountTrend,
  getCustomerGrowth,
} from '../services/api'
import type { OverviewData, IndustryData, FunnelData, TrendData } from '../types'

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState<OverviewData>()
  const [industry, setIndustry] = useState<IndustryData[]>([])
  const [funnel, setFunnel] = useState<FunnelData[]>([])
  const [amountTrend, setAmountTrend] = useState<TrendData[]>([])
  const [growth, setGrowth] = useState<TrendData[]>([])

  useEffect(() => {
    Promise.all([
      getOverview(),
      getCustomerIndustry(),
      getSalesFunnel(),
      getAmountTrend(),
      getCustomerGrowth(),
    ]).then(([ov, ind, fun, amt, gro]) => {
      setOverview(ov)
      setIndustry(ind)
      setFunnel(fun)
      setAmountTrend(amt)
      setGrowth(gro)
      setLoading(false)
    })
  }, [])

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card><Statistic title="客户总数" value={overview?.total_customers} prefix={<TeamOutlined />} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="活跃机会数" value={overview?.active_opportunities} prefix={<RocketOutlined />} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="本月新增客户" value={overview?.new_customers_this_month} prefix={<UserAddOutlined />} /></Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="预估总金额"
              value={(overview?.total_amount || 0) / 10000}
              suffix="万元"
              precision={1}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="客户行业分布">
            <Pie
              data={industry}
              angleField="count"
              colorField="industry"
              radius={0.8}
              label={{ text: 'industry', position: 'outside' }}
              height={300}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="销售阶段漏斗">
            <Funnel
              data={funnel}
              xField="stage"
              yField="count"
              height={300}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title="合同金额趋势">
            <Line
              data={amountTrend}
              xField="month"
              yField="amount"
              height={300}
              point={{ size: 4 }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="客户增长趋势">
            <Column
              data={growth}
              xField="month"
              yField="count"
              height={300}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
