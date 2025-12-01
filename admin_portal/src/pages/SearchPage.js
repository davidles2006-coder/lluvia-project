// src/pages/SearchPage.js - (V190 POS 键盘版)
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import NumPad from '../components/NumPad'; // 导入键盘
import './SearchPage.css';
import { API_BASE_URL as API_ROOT } from '../config';

const API_BASE_URL = `${API_ROOT}/api`;

const SearchPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    
    const [phone, setPhone] = useState('');
    const [memberData, setMemberData] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const staffToken = localStorage.getItem('staffToken');
    
    if (!staffToken) {
        return <div className="not-found-message">Please log in to use the search function.</div>;
    }

    // 🚩 1. 键盘输入处理
    const handleNumInput = (val) => {
        if (phone.length < 15) setPhone(prev => prev + val);
        setError('');
        setMemberData(null); // 重新输入时隐藏旧结果
    };

    const handleDelete = () => {
        setPhone(prev => prev.slice(0, -1));
        setError('');
    };

    // 🚩 2. 搜索逻辑
    const handleSearch = async () => {
        if (!phone) return;
        setError('');
        setMemberData(null);
        setLoading(true);

        try {
            const response = await axios.post(`${API_BASE_URL}/admin/search/`, {
                phone: phone,
            }, {
                headers: { 'Authorization': `Token ${staffToken}` },
            });

            // 找到会员了
            const profile = response.data.profile;
            setMemberData(profile);
            
            // 自动跳转 (可选，或者让员工确认后再跳)
            // navigate(`/member/${profile.memberId}`);
            
        } catch (err) {
            if (err.response && err.response.status === 404) {
                setError(t('search.member_not_found'));
            } else if (err.response && err.response.data.error) {
                setError(`API Error: ${err.response.data.error}`);
            } else {
                setError(t('search.search_failed'));
            }
        } finally {
            setLoading(false);
        }
    };
    
    const goToMemberProfile = () => {
        if (memberData && memberData.memberId) {
            navigate(`/member/${memberData.memberId}`);
        }
    };

    return (
        <div className="search-page-container">
            <h2 style={{textAlign:'center', color:'#D4AF37'}}>{t('sidebar.member_search')}</h2>
            
            {/* 🚩 3. 巨大的显示屏 (POS Screen) */}
            <div className="pos-display-screen" style={{marginBottom: '20px'}}>
                {phone || <span className="placeholder" style={{opacity:0.5}}>{t('search.phone_placeholder')}</span>}
            </div>

            {error && <div className="not-found-message" style={{textAlign:'center', color:'#e74c3c'}}>{error}</div>}
            {loading && <div className="message" style={{color:'#888', textAlign:'center'}}>Searching...</div>}

            {/* 🚩 4. 搜索结果卡片 */}
            {memberData && (
                <div className="member-result-card" onClick={goToMemberProfile} style={{cursor:'pointer', border:'2px solid #2ecc71'}}>
                    <h3>{memberData.nickname || 'Unknown'} {t('Found')}!</h3>
                    <p><strong>{t('Phone')}:</strong> {memberData.phone}</p> 
                    <p><strong>{t('Level')}:</strong> {memberData.level?.levelName || 'N/A'}</p>
                    <button className="search-button" style={{marginTop: '10px', width: '100%', background:'#2ecc71'}}>
                        {t('Go to Member Profile')}
                    </button>
                </div>
            )}

            {/* 🚩 5. 数字键盘 (只在没找到人时显示，或者一直显示) */}
            {!memberData && (
                <NumPad 
                    onInput={handleNumInput} 
                    onDelete={handleDelete} 
                    onEnter={handleSearch} 
                    label={t('search.search_button')} 
                />
            )}
        </div>
    );
};

export default SearchPage;