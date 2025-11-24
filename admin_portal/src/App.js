// src/App.js - Admin Portal (V48 修复: 移除未使用的变量)
import React from 'react';
import Layout from './components/Layout';
// 🚩 移除: import { useTranslation } from 'react-i18next'; (这里用不到)
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import './App.css'; 
import './i18n'; 

// 导入页面
import LoginPage from './pages/LoginPage';
import SearchPage from './pages/SearchPage';
import MemberPage from './pages/MemberPage';
import PointsStoreAdminPage from './pages/admin/PointsStoreAdminPage';
import BalanceStoreAdminPage from './pages/admin/BalanceStoreAdminPage';
import VoucherTypeAdminPage from './pages/admin/VoucherTypeAdminPage';
import AnnouncementAdminPage from './pages/admin/AnnouncementAdminPage';
import FinancialReportPage from './pages/admin/FinancialReportPage';

// Layout Wrapper
const LayoutWrapper = () => (
    <Layout>
        <Outlet />
    </Layout>
);

function App() {
  // 🚩 移除: const { t } = useTranslation(); (这里没用到 t)

  return (
    <BrowserRouter>
      <Routes>
        {/* 登录页 */}
        <Route path="/login" element={<LoginPage />} />

        {/* 受保护的页面 */}
        <Route path="/" element={<LayoutWrapper />}> 
            <Route index element={<SearchPage />} /> 
            <Route path="/search" element={<SearchPage />} /> 
            
            {/* 会员详情 */}
            <Route path="/member/:memberId" element={<MemberPage />} /> 
            
            {/* 商城管理 */}
            <Route path="/store/points" element={<PointsStoreAdminPage />} />
            <Route path="/store/balance" element={<BalanceStoreAdminPage />} />
            <Route path="/store/vouchertypes" element={<VoucherTypeAdminPage />} />
            <Route path="/announcements" element={<AnnouncementAdminPage />} />
            <Route path="/reports" element={<FinancialReportPage />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;