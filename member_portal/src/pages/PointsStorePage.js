// src/pages/PointsStorePage.js - V68 (全自定义弹窗版)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; 
import './PointsStorePage.css'; 
import defaultProduct from '../assets/default_product.png'; 

import ConfirmModal from '../components/ConfirmModal';
// 🚩 1. 引入新组件
import AlertModal from '../components/AlertModal';

import { API_BASE_URL as API_ROOT } from '../config'; // 🚩 导入根地址

const API_BASE_URL = API_ROOT; // 🚩 加上 /api/ 变成最终 API 地址

function PointsStorePage() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // 🚩 2. 新增 Alert 状态
  const [alertInfo, setAlertInfo] = useState({ show: false, title: '', message: '', type: 'success' });

  const navigate = useNavigate();
  const { t } = useTranslation(); 

  useEffect(() => {
    const fetchItems = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) { navigate('/login'); return; }
      try {
        const response = await fetch(`${API_BASE_URL}/api/store/points/`, {
          headers: { 'Authorization': `Token ${token}` }
        });
        if (!response.ok) { throw new Error('无法获取商城物品。'); }
        setItems(await response.json());
        setIsLoading(false);
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
      }
    };
    fetchItems();
  }, [navigate]);

  const handleRedeemClick = (item) => {
    setSelectedItem(item);
    setShowConfirm(true);
  };

  const executeRedeem = async () => {
    if (!selectedItem) return;
    setIsRedeeming(true);
    setShowConfirm(false); 
    
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch(`${API_BASE_URL}/api/store/redeem/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ reward_id: selectedItem.id }) 
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unknown error');
      
      // 🚩 3. 替换 alert 为 setAlertInfo
      setAlertInfo({
          show: true,
          title: t('Success'),
          message: t('Redeem Success'),
          type: 'success'
      });

    } catch (error) {
      // 🚩 3. 替换 alert 为 setAlertInfo
      setAlertInfo({
          show: true,
          title: t('Failed'),
          message: t('Redeem Failed') + error.message,
          type: 'error'
      });
    }
    setIsRedeeming(false);
  };

  // 关闭 Alert 的辅助函数
  const closeAlert = () => {
      setAlertInfo({ ...alertInfo, show: false });
      // 如果是成功，可以在这里刷新页面或跳转
      if (alertInfo.type === 'success') {
          // navigate('/member/dashboard'); // 可选：跳转回主页
      }
  };

  if (isLoading) return <div className="v11-store-loading">{t('Loading Products...')}</div>;
  if (error) return <div className="v11-store-loading" style={{ color: 'red' }}>{error}</div>;

  return (
    <div className="v11-store-container">
      <div className="v11-store-header">
        <h1 className="v11-store-title">{t('Points Store')}</h1>
        <p className="v11-store-subtitle">{t('Redeem Exclusive Rewards')}</p>
      </div>
      
      <div className="v11-store-grid">
        {items.length > 0 ? (
          items.map(item => (
            <div className="v11-card v11-store-item" key={item.id}>
              <div className="v11-item-image-wrapper">
                 <img 
                    src={item.imageUrl ? item.imageUrl : defaultProduct} 
                    onError={(e) => { e.target.onerror = null; e.target.src = defaultProduct; }}
                    alt={item.name} 
                    className="v11-item-image"
                    style={{objectFit: 'contain', padding: '10px'}}
                 />
              </div>
              <div className="v11-item-content">
                <h3 className="v11-item-name">{item.name}</h3>
                <p className="v11-item-desc">{item.description}</p>
                <div className="v11-item-footer">
                  <span className="v11-item-cost">{item.pointsCost} {t('Points')}</span>
                  <button 
                    className="btn-pill"
                    onClick={() => handleRedeemClick(item)}
                    disabled={isRedeeming} 
                    style={{opacity: isRedeeming ? 0.6 : 1}}
                  >
                    {isRedeeming ? t('Processing...') : t('Redeem')}
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p style={{ color: 'white', textAlign: 'center' }}>{t('No products available.')}</p>
        )}
      </div>

      <ConfirmModal 
        isOpen={showConfirm}
        title={t('Redeem')}
        message={selectedItem ? t('Confirm Redeem', { item: selectedItem.name, points: selectedItem.pointsCost }) : ''}
        onConfirm={executeRedeem}
        onCancel={() => setShowConfirm(false)}
      />

      {/* 🚩 4. 渲染 Alert 弹窗 */}
      <AlertModal 
        isOpen={alertInfo.show}
        title={alertInfo.title}
        message={alertInfo.message}
        type={alertInfo.type}
        onClose={closeAlert}
      />
      
    </div>
  );
}

export default PointsStorePage;