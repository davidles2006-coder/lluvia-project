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
 // ... 前面的代码不变 ...

  // 🚩 V141 修复: 获取图片路径 (无论是 image 还是 imageUrl)
  const imagePath = announcement.image || announcement.imageUrl;

  return (
    <div className="announcement-detail-container">
      <div className="announcement-card">
        
        {/* 🚩 修复: 只要检测到有图片路径，就显示图片区域 */}
        {imagePath && (
          <div className="detail-image-wrapper">
             <img 
               src={getImageUrl(imagePath)} 
               alt={announcement.title} 
               className="detail-image"
               // 添加错误处理，如果加载失败显示默认图
               onError={(e) => {e.target.style.display = 'none'}} 
             />
          </div>
        )}

        <h1 className="detail-title">{announcement.title}</h1>

        <div className="detail-meta">
           {t('Announcement')}
           {/* 如果有日期也可以显示 */}
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