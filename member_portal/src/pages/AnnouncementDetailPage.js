// src/pages/AnnouncementDetailPage.js - V140 视觉升级版
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './AnnouncementDetailPage.css'; // 引入新样式
import { API_BASE_URL as API_ROOT } from '../config';

const API_BASE_URL = API_ROOT; 

function AnnouncementDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);

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
      setLoading(false);
    };
    fetchDetail();
  }, [id, navigate]);

  if (loading) return <div style={{textAlign:'center', padding:'50px', color:'#fff'}}>{t('Loading...')}</div>;
  if (!announcement) return <div style={{textAlign:'center', padding:'50px', color:'#fff'}}>{t('Announcement not found')}</div>;

  // 图片路径处理
  const getImageUrl = (url) => {
      if (!url) return null;
      if (url.startsWith('http')) return url;
      return `${API_BASE_URL}${url}`;
  };

  return (
    <div className="announcement-detail-container">
      <div className="announcement-card">
        
        {/* 1. 图片 */}
        {announcement.image && (
          <div className="detail-image-wrapper">
             <img 
               src={getImageUrl(announcement.imageUrl || announcement.image)} 
               alt={announcement.title} 
               className="detail-image"
             />
          </div>
        )}

        {/* 2. 标题 */}
        <h1 className="detail-title">{announcement.title}</h1>

        {/* 3. 日期 (如果有的话，没有就不显示) */}
        <div className="detail-meta">
           {t('Announcement')}
        </div>

        {/* 4. 正文内容 */}
        <div className="detail-content">
            {/* 如果没有 content 字段，显示默认文字 */}
            {announcement.content || t('No details available.')}
        </div>

        {/* 5. 返回按钮 */}
        <div className="detail-actions">
            <button className="btn-pill" onClick={() => navigate(-1)}>
                {t('Back')}
            </button>
        </div>

      </div>
    </div>
  );
}

export default AnnouncementDetailPage;