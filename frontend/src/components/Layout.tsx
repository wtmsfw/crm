import React from 'react'
import { Layout as AntLayout, Menu } from 'antd'
import {
  DashboardOutlined,
  TeamOutlined,
  FunnelPlotOutlined,
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'

const { Sider, Content } = AntLayout

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '数据看板' },
  { key: '/customers', icon: <TeamOutlined />, label: '客户管理' },
  { key: '/opportunities', icon: <FunnelPlotOutlined />, label: '销售管理' },
]

const Layout: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider>
        <div style={{ height: 32, margin: 16, color: '#fff', fontSize: 18, textAlign: 'center', fontWeight: 'bold' }}>
          CRM 系统
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname.startsWith('/customers') ? '/customers'
            : location.pathname.startsWith('/opportunities') ? '/opportunities'
            : '/dashboard']}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <AntLayout>
        <Content style={{ margin: 16 }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  )
}

export default Layout
