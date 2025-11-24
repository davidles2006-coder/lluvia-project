// src/components/Layout.js - V77 (4级权限控制版)
import React, { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; 
import './Layout.css'; 
import LanguageSwitcher from './LanguageSwitcher'; 

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation(); 

  const staffName = localStorage.getItem('staffName') || 'Staff';
  // 🚩 V77: 获取角色
  const role = localStorage.getItem('staffRole') || 'CASHIER';

  useEffect(() => {
    const token = localStorage.getItem('staffToken');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear(); // 清除所有 Token 和 Role
    navigate('/login'); 
  };

  const getLinkClass = (path) => {
    return location.pathname.startsWith(path) ? 'nav-link active' : 'nav-link';
  };

  // 🚩 V77: 权限判断逻辑
  const showSearch = role === 'SUPERUSER' || role === 'CASHIER';
  const showStore = role === 'SUPERUSER' || role === 'STORE_MANAGER';
  const showFinance = role === 'SUPERUSER' || role === 'ACCOUNT_MANAGER';

  return (
    <div className="admin-layout">
      
      <aside className="admin-sidebar">
        
        <div className="sidebar-header">
          {t('LLUVIA ADMIN')}
        </div>

        <nav className="sidebar-nav">
          <ul>
            {/* 1. 会员搜索 (CASHIER, SUPERUSER) */}
            {showSearch && (
              <li>
                <Link to="/search" className={getLinkClass('/search')}>
                  🔍 {t('sidebar.member_search')}
                </Link>
              </li>
            )}
            
            {/* 2. 商城与公告管理 (STORE_MANAGER, SUPERUSER) */}
            {showStore && (
              <>
                <li>
                  <Link to="/store/points" className={getLinkClass('/store/points')}>
                    🎁 {t('sidebar.store_points')}
                  </Link>
                </li>
                <li>
                  <Link to="/store/balance" className={getLinkClass('/store/balance')}>
                    🛒 {t('sidebar.store_balance')}
                  </Link>
                </li>
                <li>
                  <Link to="/store/vouchertypes" className={getLinkClass('/store/vouchertypes')}>
                    🎫 {t('sidebar.store_vouchertypes')}
                  </Link>
                </li>
                 <li>
                  <Link to="/announcements" className={getLinkClass('/announcements')}>
                    📢 {t('sidebar.content_announcements')}
                  </Link>
                </li>
              </>
            )}

            {/* 3. 财务报表 (ACCOUNT_MANAGER, SUPERUSER) */}
            {showFinance && (
              <li>
                <Link to="/reports" className={getLinkClass('/reports')}>
                  📈 {t('sidebar.nav_finance')}
                </Link>
              </li>
            )}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div style={{ marginBottom: '15px', textAlign: 'center' }}>
            <LanguageSwitcher />
          </div>
          <div className="user-info">
            {role} : {staffName} {/* 显示角色和名字 */}
          </div>
          <button onClick={handleLogout} className="btn-logout">
            {t('Logout')}
          </button>
        </div>

      </aside>

      <main className="admin-content">
        {children}
      </main>

    </div>
  );
};

export default Layout;