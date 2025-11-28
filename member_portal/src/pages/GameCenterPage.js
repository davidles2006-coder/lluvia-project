// src/pages/GameCenterPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL as API_ROOT } from '../config';
import './GameCenterPage.css'; 

const API_BASE_URL = API_ROOT;

// ⚖️ 等级权重表 (数字越大越高级)
const LEVEL_WEIGHTS = {
    'Bronze': 1,
    'Silver': 2,
    'Gold': 3,
    'Platinum': 4,
    'Diamond': 5
};

function GameCenterPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [userLevel, setUserLevel] = useState('Bronze'); // 默认 Bronze
  const [loading, setLoading] = useState(true);

  // 🎮 游戏配置列表
  const games = [
    {
        id: 'dice',
        title: '🎲 Liar\'s Dice',
        desc: 'Classic Bar Game',
        minLevel: 'Bronze', // 所有人可玩
        route: '/member/game/dice'
    },
    {
        id: 'slots',
        title: '🎰 Lucky Slots',
        desc: 'Win Big Points!',
        minLevel: 'Silver', // 🚩 Silver 以上才能玩 (锁定演示)
        route: '/member/game/slots' 
    },
    {
        id: 'bingo',
        title: '🎱 Daily Bingo',
        desc: 'Try your luck',
        minLevel: 'Gold', // 🚩 Gold 以上才能玩 (锁定演示)
        route: '/member/game/bingo'
    }
  ];

  // 1. 获取用户等级
  useEffect(() => {
    const fetchLevel = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) { navigate('/login'); return; }
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
  }, [navigate]);

  // 2. 点击处理 (检查权限)
  const handleGameClick = (game) => {
      const userWeight = LEVEL_WEIGHTS[userLevel] || 1;
      const reqWeight = LEVEL_WEIGHTS[game.minLevel] || 1;

      // 如果用户等级 < 游戏要求
      if (userWeight < reqWeight) {
          alert(t(`🔒 Locked! Requires ${game.minLevel} level.`));
          return;
      }

      // 权限通过，跳转
      navigate(game.route);
  };

  if (loading) return <div style={{color:'#fff', textAlign:'center', padding:'50px'}}>{t('Loading...')}</div>;

  return (
    <div className="game-center-container">
      <h2 className="center-title">🎮 {t('Game Center')}</h2>
      <p className="center-subtitle">{t('Play to win points & have fun!')}</p>
      
      <div className="games-grid">
        {games.map((game) => {
            // 判断是否锁定
            const isLocked = (LEVEL_WEIGHTS[userLevel] || 1) < (LEVEL_WEIGHTS[game.minLevel] || 1);
            
            return (
                <div 
                    key={game.id} 
                    className={`game-card ${isLocked ? 'locked' : ''}`}
                    onClick={() => handleGameClick(game)}
                >
                    <div className="game-icon">{game.title.split(' ')[0]}</div>
                    <div className="game-info">
                        <h3>{game.title.substring(2)}</h3> {/* 去掉 emoji 显示标题 */}
                        <p>{game.desc}</p>
                    </div>
                    
                    {/* 锁定的遮罩层 */}
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