// src/pages/AnnouncementDetailPage.js - V71 (消除警告 + 国际化修复)
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './DashboardPage.css'; // 复用样式
import defaultBanner from '../assets/default_avatar.png';

import { API_BASE_URL as API_ROOT } from '../config'; // 🚩 导入根地址

const API_BASE_URL = API_ROOT; // 🚩 加上 /api/ 变成最终 API 地址

function AnnouncementDetailPage() {
  const { id } = useParams();
  const [announcement, setAnnouncement] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  // 🚩 V71 修复: 既然引入了 t，我们就必须用它！
  const { t } = useTranslation();

  const getBannerUrl = (url) => {
    if (!url) return defaultBanner;
    if (url.startsWith('http')) return url;
    return `${API_BASE_URL}${url}`;
  };

  useEffect(() => {
    const fetchDetail = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) { navigate('/login'); return; }
      
      try {
        const response = await fetch(`${API_BASE_URL}/api/announcements/${id}/`, {
          headers: { 'Authorization': `Token ${token}` }
        });
        if (response.ok) {
          setAnnouncement(await response.json());
        }
      } catch (error) {
        console.error(error);
      }
      setIsLoading(false);
    };
    fetchDetail();
  }, [id, navigate]);

  // 🚩 V71 修复: 使用 t() 翻译
  if (isLoading) return <div className="v11-dashboard-loading">{t('Loading...')}</div>;
  if (!announcement) return <div className="v11-dashboard-loading">{t('Not Found')}</div>;

  return (
    <div className="v11-dashboard-container" style={{padding: '20px'}}>
      {/* 返回按钮 */}
      <button 
        onClick={() => navigate(-1)} 
        className="link-independent"
        style={{background:'none', border:'none', fontSize:'16px', marginBottom:'20px', padding:0, cursor:'pointer'}}
      >
        &lt; {t('Back')} {/* 🚩 V71: 使用翻译 */}
      </button>

      {/* 图片容器 */}
      <div className="v11-card" style={{
          padding: 0, 
          overflow: 'hidden', 
          marginBottom: '20px',
          backgroundColor: '#000', 
          height: '300px',         
          display: 'flex',         
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #444'
      }}>
        <img 
          src={getBannerUrl(announcement.imageUrl || announcement.image)} 
          alt={announcement.title} 
          style={{
              width: '100%', 
              height: '100%', 
              objectFit: 'contain' 
          }}
        />
      </div>

      {/* 标题和内容 */}
      <div className="v11-card">
        <h1 style={{color: '#D4AF37', marginTop: 0, fontSize: '24px'}}>{announcement.title}</h1>
        <div style={{color: '#ddd', lineHeight: '1.8', whiteSpace: 'pre-wrap', fontSize: '15px'}}>
          {/* 🚩 V71: 使用翻译 */}
          {announcement.content || t('No details available.')}
        </div>
      </div>
    </div>
  );
}

export default AnnouncementDetailPage;