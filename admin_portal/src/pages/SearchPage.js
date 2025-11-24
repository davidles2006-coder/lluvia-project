// src/pages/SearchPage.js - (修复按钮翻译)
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './SearchPage.css';

import { API_BASE_URL as API_ROOT } from '../config'; // 🚩 导入根地址

const API_BASE_URL = `${API_ROOT}/api`; // 🚩 加上 /api/ 变成最终 API 地址

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

    const handleSearch = async (e) => {
        e.preventDefault();
        setError('');
        setMemberData(null);
        setLoading(true);

        try {
            const response = await axios.post(`${API_BASE_URL}/admin/search/`, {
                phone: phone,
            }, {
                headers: { 'Authorization': `Token ${staffToken}` },
            });

            setMemberData(response.data.profile);
            
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
        } else {
             setError("Error: Member ID is missing.");
        }
    };

    return (
        <div className="search-container">
            <h2>{t('sidebar.member_search')}</h2>
            
            <form onSubmit={handleSearch} className="search-form">
                <input
                    type="text"
                    placeholder={t('search.phone_placeholder')}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    disabled={loading}
                />
                <button type="submit" className="search-button" disabled={loading}>
                    {loading ? t('search.search_failed') : t('search.search_button')}
                </button>
            </form>

            {error && <div className="not-found-message">{error}</div>}

            {memberData && (
                <div className="member-result-card">
                    
                    <h3>{memberData.nickname || 'Unknown'} {t('Found')}!</h3>
                    
                    <p><strong>{t('Phone')}:</strong> {memberData.phone || 'N/A'}</p> 
                    <p><strong>{t('Level')}:</strong> {memberData.level?.levelName || 'N/A'}</p>
                    <p><strong>{t('Balance')}:</strong> ${memberData.balance || '0.00'}</p>
                    <p><strong>{t('Loyalty Points')}:</strong> {memberData.loyaltyPoints || '0'}</p>
                    
                    {/* 🚩 修复：加上 t() */}
                    <button onClick={goToMemberProfile} className="search-button" style={{marginTop: '15px', width: '100%'}}>
                        {t('Go to Member Profile')}
                    </button>
                    
                </div>
            )}
        </div>
    );
};

export default SearchPage;