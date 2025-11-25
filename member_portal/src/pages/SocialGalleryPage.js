// src/pages/SocialGalleryPage.js
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './SocialGalleryPage.css'; 

// 引入默认头像
import defaultAvatar from '../assets/default_avatar.png';

import { API_BASE_URL as API_ROOT } from '../config'; // 🚩 导入根地址

const API_BASE_URL = API_ROOT; // 🚩 加上 /api/ 变成最终 API 地址

function SocialGalleryPage() {
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        // 后端默认已经按积分(loyaltyPoints)从高到低排序了
        const response = await fetch(`${API_BASE_URL}/api/social/gallery/`);
        if (response.ok) {
          const data = await response.json();
          setMembers(data);
        }
      } catch (error) {
        console.error("Failed to load gallery:", error);
      }
      setIsLoading(false);
    };

    fetchGallery();
  }, []);

  if (isLoading) {
    return <div className="v11-gallery-loading">{t('Loading...')}</div>;
  }

  return (
    <div className="v11-gallery-container">
      <div className="v11-gallery-header">
        <h1 className="v11-gallery-title">{t('Social Gallery')}</h1>
        <p className="v11-gallery-subtitle">{t('Meet our elite members')}</p>
      </div>

      <div className="v11-gallery-grid">
        {members.length > 0 ? (
          members.map((member, index) => (
            <div key={index} className="v11-card v11-member-card">
              <div className="v11-member-avatar-wrapper">
                <img 
                  src={member.avatarUrl ? member.avatarUrl : defaultAvatar} 
                  onError={(e) => { e.target.onerror = null; e.target.src = defaultAvatar; }}
                  alt={member.nickname} 
                  className="v11-member-avatar"
                />
                {/* 🏆 排名徽章: #1, #2, #3... */}
                <div className="v11-rank-badge">#{index + 1}</div>
              </div>
              
              <h3 className="v11-member-name">{member.nickname || 'Member'}</h3>
              
              <span className="v11-member-level">
                {t(member.levelName || 'Bronze')}
              </span>
              
              {member.flair && <p className="v11-member-flair">"{member.flair}"</p>}
            </div>
          ))
        ) : (
          <p className="v11-no-data">{t('No members found.')}</p>
        )}
      </div>
    </div>
  );
}

export default SocialGalleryPage;