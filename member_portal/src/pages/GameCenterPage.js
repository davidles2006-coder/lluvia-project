// src/pages/GameCenterPage.js - V175 (翻译修复版)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL as API_ROOT } from '../config';
import './GameCenterPage.css'; 

const API_BASE_URL = API_ROOT;

// 等级权重
const LEVEL_WEIGHTS = { 'Bronze': 1, 'Silver': 2, 'Gold': 3, 'Platinum': 4, 'Diamond': 5 };

function GameCenterPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [userLevel, setUserLevel] = useState('Bronze');
  const [loading, setLoading] = useState(true);

  // 1. 定义游戏列表 (使用翻译键值)
  // 我们把 emoji 单独拿出来，标题和描述都用 t() 包裹
  const games = [
    {
        id: 'dice',
        icon: '🎲',
        title: t('game.dice_title'), // "大话骰"
        desc: t('game.dice_desc'),   // "经典酒吧游戏"
        minLevel: 'Bronze',
        route: '/member/game/dice'
    },
    {
        id: 'slots',
        icon: '🎰',
        title: t('game.slots_title'), // "幸运老虎机"
        desc: t('game.slots_desc'),   // "赢取海量积分"
        minLevel: 'Silver',
        route: '/member/game/slots'
    },
    {
        id: 'bingo',
        icon: '🎱',
        title: t('game.bingo_title'), // "每日宾果"
        desc: t('game.bingo_desc'),   // "试试手气"
        minLevel: 'Gold',
        route: '/member/game/bingo'
    }
  ];

  // 2. 获取等级
  useEffect(() => {
    const fetchLevel = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      try {
        const response = await fetch(`${API_BASE_URL}/api/profile/`, {
            headers: { 'Authorization': `Token ${token}` }
        });
        const data = await response.json();
        if (data.level && data.level.levelName) {
            setUserLevel(data.level.levelName);
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    fetchLevel();
  }, []);

  // 3. 点击处理
  const handleGameClick = (game) => {
      const userWeight = LEVEL_WEIGHTS[userLevel] || 1;
      const reqWeight = LEVEL_WEIGHTS[game.minLevel] || 1;

      if (userWeight < reqWeight) {
          // 弹窗提示使用翻译
          alert(t('game.locked_msg', { level: game.minLevel }));
          return;
      }
      navigate(game.route);
  };

  if (loading) return <div className="game-center-loading">{t('Loading...')}</div>;

  return (
    <div className="game-center-container">
      <h2 className="center-title">🎮 {t('game_center_title')}</h2>
      <p className="center-subtitle">{t('game_center_subtitle')}</p>
      
      <div className="games-grid">
        {games.map((game) => {
            const isLocked = (LEVEL_WEIGHTS[userLevel] || 1) < (LEVEL_WEIGHTS[game.minLevel] || 1);
            
            return (
                <div 
                    key={game.id} 
                    className={`game-card ${isLocked ? 'locked' : ''}`}
                    onClick={() => handleGameClick(game)}
                >
                    {/* 直接显示图标，不需要再去 substring 标题了 */}
                    <div className="game-icon">{game.icon}</div>
                    <div className="game-info">
                        <h3>{game.title}</h3>
                        <p>{game.desc}</p>
                    </div>
                    
                    {isLocked && (
                        <div className="lock-overlay">
                            <span className="lock-icon">🔒</span>
                            <span className="lock-text">{game.minLevel}+</span>
                        </div>
                    )}
                </div>
            );
        })}
      </div>
    </div>
  );
}

export default GameCenterPage;