import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import CustomerList from './pages/CustomerList'
import CustomerDetail from './pages/CustomerDetail'
import OpportunityList from './pages/OpportunityList'
import OpportunityDetail from './pages/OpportunityDetail'

const App: React.FC = () => (
  <ConfigProvider locale={zhCN}>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/customers" element={<CustomerList />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />
          <Route path="/opportunities" element={<OpportunityList />} />
          <Route path="/opportunities/:id" element={<OpportunityDetail />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </ConfigProvider>
)

export default App
