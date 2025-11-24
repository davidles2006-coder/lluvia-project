// src/components/MemberLayout.js - V80 (背景逻辑修正版)
import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import './MemberLayout.css'; 
import LanguageSwitcher from './LanguageSwitcher'; 

import { API_BASE_URL as API_ROOT } from '../config'; // 🚩 导入根地址

const API_BASE_URL = `${API_ROOT}/api`; // 🚩 加上 /api/ 变成最终 API 地址

function MemberLayout() {
  // 默认等级样式
  const [userLevelClass, setUserLevelClass] = useState('level-bronze');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchProfileForLayout = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) { navigate('/login'); return; }
      
      try {
        const response = await fetch(`${API_BASE_URL}/api/profile/`, {
          headers: { 'Authorization': `Token ${token}` }
        });
        
        if (!response.ok) { throw new Error('Session invalid'); }
        
        const data = await response.json(); 
        
        // 🚩 核心修复：直接读取数据库里的等级名字，而不是通过积分计算
        // 这样即使积分为 0，只要是 Silver，背景就是 Silver
        if (data.level && data.level.levelName) {
            setUserLevelClass(`level-${data.level.levelName.toLowerCase()}`);
        } else {
            setUserLevelClass('level-bronze');
        }

      } catch (error) {
        localStorage.removeItem('authToken'); 
        localStorage.removeItem('memberNickname');
        navigate('/login'); 
      }
      setIsLoading(false);
    };
    
    fetchProfileForLayout();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('memberNickname');
    navigate('/login');
  };

  if (isLoading) {
    return <div style={{color: 'white', textAlign: 'center', paddingTop: '100px'}}>{t('Loading...')}</div>;
  }

  return (
    // 应用动态等级 Class
    <div className={`v11-layout ${userLevelClass}`}> 
      <nav className="v11-navbar">
        <div className="v11-nav-left">
          <span className="v11-logo">LLUVIA</span>
          <Link to="/member/dashboard" className="link-independent">{t('My Account')}</Link>
          <Link to="/member/points-store" className="link-independent">{t('Points Store')}</Link>
          <Link to="/member/balance-store" className="link-independent">{t('Balance Store')}</Link>
          {/* 隐藏入口 */}
          {/* <Link to="/member/gallery" className="link-independent">{t('Social Gallery')}</Link> */}
        </div>
        <div className="v11-nav-right">
          <LanguageSwitcher className="link-independent" /> 
          <span 
            className="link-independent logout" 
            onClick={handleLogout} 
            style={{ cursor: 'pointer' }}
          >
            {t('Logout')}
          </span>
        </div>
      </nav>
      <main className="v11-content">
        <Outlet />
      </main>
    </div>
  );
}

export default MemberLayout;