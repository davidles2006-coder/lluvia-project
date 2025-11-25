// src/App.js - Admin Portal (V130 终极路由修复版)
import React from 'react';
import Layout from './components/Layout';
// 🚩 1. 引入 Navigate 组件
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import './App.css'; 
import './i18n'; 

import LoginPage from './pages/LoginPage';
import SearchPage from './pages/SearchPage';
import MemberPage from './pages/MemberPage';
import PointsStoreAdminPage from './pages/admin/PointsStoreAdminPage';
import BalanceStoreAdminPage from './pages/admin/BalanceStoreAdminPage';
import VoucherTypeAdminPage from './pages/admin/VoucherTypeAdminPage';
import AnnouncementAdminPage from './pages/admin/AnnouncementAdminPage';
import FinancialReportPage from './pages/admin/FinancialReportPage';

const LayoutWrapper = () => (
    <Layout>
        <Outlet />
    </Layout>
);

function App() {
  return (
    <BrowserRouter basename="/staff_portal">
      <Routes>
        {/* 登录页 */}
        <Route path="/login" element={<LoginPage />} />

        {/* 受保护的页面 */}
        <Route path="/" element={<LayoutWrapper />}> 
            <Route index element={<SearchPage />} /> 
            <Route path="/search" element={<SearchPage />} /> 
            <Route path="/member/:memberId" element={<MemberPage />} /> 
            <Route path="/store/points" element={<PointsStoreAdminPage />} />
            <Route path="/store/balance" element={<BalanceStoreAdminPage />} />
            <Route path="/store/vouchertypes" element={<VoucherTypeAdminPage />} />
            <Route path="/announcements" element={<AnnouncementAdminPage />} />
            <Route path="/reports" element={<FinancialReportPage />} />
        </Route>

        {/* 🚩 2. 核心修复：万能捕获路由 */}
        {/* 任何未定义的路径，都强制跳转到登录页 */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;