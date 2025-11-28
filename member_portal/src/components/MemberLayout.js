// src/components/MemberLayout.js - V132 (汉堡菜单版)
import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import './MemberLayout.css'; 
import LanguageSwitcher from './LanguageSwitcher'; 

const API_BASE_URL = 'https://lluvia.app'; // 确保这里是生产环境地址

function MemberLayout() {
  const [userLevelClass, setUserLevelClass] = useState('level-bronze');
  const [isLoading, setIsLoading] = useState(true);
  // 🚩 新增: 控制手机菜单开关
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation(); // 用来监听路由变化
  const { t } = useTranslation();

  // 1. 获取会员等级 (保持不变)
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
        if (data.level && data.level.levelName) {
            setUserLevelClass(`level-${data.level.levelName.toLowerCase()}`);
        }
      } catch (error) {
        localStorage.removeItem('authToken'); 
        navigate('/login'); 
      }
      setIsLoading(false);
    };
    fetchProfileForLayout();
  }, [navigate]);

  // 2. 路由跳转时自动关闭菜单
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  // 切换菜单函数
  const toggleMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  if (isLoading) return null;

  return (
    <div className={`v11-layout ${userLevelClass}`}> 
      
      <nav className="v11-navbar">
        
        {/* 左侧: Logo */}
        <div className="v11-nav-left">
          <span className="v11-logo">LLUVIA</span>
          
          {/* 桌面端导航链接 (手机端隐藏) */}
          <div className="desktop-links">
            <Link to="/member/dashboard" className="link-independent">{t('My Account')}</Link>
            <Link to="/member/game-center" className="link-independent">🎮 {t('Game Center')}</Link>
            <Link to="/member/points-store" className="link-independent">{t('Points Store')}</Link>
            <Link to="/member/balance-store" className="link-independent">{t('Balance Store')}</Link>
          </div>
        </div>

        {/* 右侧: 语言切换 & 汉堡按钮 */}
        <div className="v11-nav-right">
          <div className="compact-lang-switch">
             <LanguageSwitcher />
          </div>
          
          {/* 桌面端退出按钮 */}
          <span className="link-independent logout desktop-only" onClick={handleLogout}>
            {t('Logout')}
          </span>

          {/* 🚩 手机端汉堡按钮 (三道杠) */}
          <div className="mobile-hamburger" onClick={toggleMenu}>
            <div className={`bar ${isMobileMenuOpen ? 'open' : ''}`}></div>
            <div className={`bar ${isMobileMenuOpen ? 'open' : ''}`}></div>
            <div className={`bar ${isMobileMenuOpen ? 'open' : ''}`}></div>
          </div>
        </div>
      </nav>

      {/* 🚩 手机端下拉菜单 (点击汉堡后显示) */}
      <div className={`mobile-menu-dropdown ${isMobileMenuOpen ? 'show' : ''}`}>
          <Link to="/member/dashboard" className="mobile-link">{t('My Account')}</Link>
          <Link to="/member/game-center" className="mobile-link">🎮 {t('Game Center')}</Link>
          <Link to="/member/points-store" className="mobile-link">{t('Points Store')}</Link>
          <Link to="/member/balance-store" className="mobile-link">{t('Balance Store')}</Link>
          <hr className="mobile-divider"/>
          <span className="mobile-link logout" onClick={handleLogout}>{t('Logout')}</span>
      </div>

      <main className="v11-content">
        <Outlet />
      </main>
    </div>
  );
}

export default MemberLayout;