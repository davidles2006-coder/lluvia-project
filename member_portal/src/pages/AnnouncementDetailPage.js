// src/pages/AnnouncementDetailPage.js - V142 (修复 getImageUrl 未定义错误)
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './AnnouncementDetailPage.css'; 
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

  // 🚩 核心修复：补回 helper 函数
  const getImageUrl = (url) => {
      if (!url) return null;
      if (url.startsWith('http')) return url;
      return `${API_BASE_URL}${url}`;
  };

  if (loading) return <div style={{textAlign:'center', padding:'50px', color:'#fff'}}>{t('Loading...')}</div>;
  if (!announcement) return <div style={{textAlign:'center', padding:'50px', color:'#fff'}}>{t('Announcement not found')}</div>;

  // 获取图片路径
  const imagePath = announcement.image || announcement.imageUrl;

  return (
    <div className="announcement-detail-container">
      <div className="announcement-card">
        
        {/* 图片区域 */}
        {imagePath && (
          <div className="detail-image-wrapper">
             <img 
               src={getImageUrl(imagePath)} 
               alt={announcement.title} 
               className="detail-image"
               onError={(e) => {e.target.style.display = 'none'}} 
             />
          </div>
        )}

        <h1 className="detail-title">{announcement.title}</h1>

        <div className="detail-meta">
           {t('Announcement')}
           {announcement.expiryDate && ` | Valid until: ${new Date(announcement.expiryDate).toLocaleDateString()}`}
        </div>

        <div className="detail-content">
            {announcement.content || announcement.description || t('No details available.')}
        </div>

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