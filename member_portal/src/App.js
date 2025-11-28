// src/App.js - V67 (纯净会员端版 - 修复 Module not found 错误)
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom'; 
import './App.css';
import './i18n'; // 确保翻译初始化

// 导入布局
import MemberLayout from './components/MemberLayout';

// --- 会员端页面 (Member Pages) ---
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import PasswordResetConfirmPage from './pages/PasswordResetConfirmPage'; 

import DashboardPage from './pages/DashboardPage'; 
import PointsStorePage from './pages/PointsStorePage';
import BalanceStorePage from './pages/BalanceStorePage';
import SocialGalleryPage from './pages/SocialGalleryPage'; 
import AnnouncementDetailPage from './pages/AnnouncementDetailPage'; 
import TermsPage from './pages/TermsPage';


import GameCenterPage from './pages/GameCenterPage';
import LiarDicePage from './pages/LiarDicePage';
import DrunkMonopolyPage from './pages/DrunkMonopolyPage';

function App() {
  return (
    <Routes>
      {/* ==========================
          1. 公共路由 (Public)
      ========================== */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset/:uid/:token" element={<PasswordResetConfirmPage />} />

      {/* ==========================
          2. 会员端路由 (Member Portal)
      ========================== */}
      <Route path="/member" element={<MemberLayout />}>

        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="points-store" element={<PointsStorePage />} />
        <Route path="balance-store" element={<BalanceStorePage />} />

        {/* 🎮 游戏路由 */}
        <Route path="game-center" element={<GameCenterPage />} />
        <Route path="game/dice" element={<LiarDicePage />} />
        <Route path="game/monopoly" element={<DrunkMonopolyPage />} />
        
        {/* 隐形功能: 社交画廊 */}
        <Route path="gallery" element={<SocialGalleryPage />} />
        
        {/* 新功能: 公告详情页 */}
        <Route path="announcement/:id" element={<AnnouncementDetailPage />} />
        
        {/* 默认跳转 */}
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* ==========================
          3. 根路径默认跳转
      ========================== */}
      <Route path="/" element={<Navigate to="/member/dashboard" replace />} />
    </Routes>
  );
}

export default App;