// 这是 src/DashboardPage.js 文件的内容 (V13 最终修复版)

import React, { useState, useEffect } from 'react'; 
import axios from 'axios';

// 🚩 V13: "辅助"组件现在需要 Bill Amount
const VoucherCard = ({ voucher, onRedeem }) => {

  const [billAmount, setBillAmount] = useState(''); // V13 新增

  const handleRedeemClick = () => {
    // V13: 验证账单金额
    const bill = parseFloat(billAmount);
    const threshold = parseFloat(voucher.voucherType.threshold);

    if (!bill || bill <= 0) {
      alert("Please enter the total bill amount.");
      return;
    }
    if (bill < threshold) {
      alert(`Bill amount ($${bill}) is less than the required minimum spend ($${threshold}) for this voucher.`);
      return;
    }

    // V13: 发送两个参数
    onRedeem(voucher.voucherId, billAmount);
  };

  return (
    <div className="voucher-card">
      <h4>{voucher.voucherType.name}</h4>
      <p>Value: ${voucher.voucherType.value} (Min Spend ${voucher.voucherType.threshold})</p>
      <p>Expires: {new Date(voucher.expiryDate).toLocaleDateString()}</p>

      {/* 🚩 V13: 核销表单 */}
      <div className="consume-form">
        <input
          type="number"
          step="0.01"
          placeholder="Total Bill ($)"
          value={billAmount}
          onChange={(e) => setBillAmount(e.target.value)}
        />
        <button 
          className="redeem-button"
          onClick={handleRedeemClick} // 🚩 V13: 点击新函数
        >
          Redeem
        </button>
      </div>
    </div>
  );
};


function DashboardPage({ token, onLogout, API_URL }) {

  const [phone, setPhone] = useState(''); 
  const [error, setError] = useState('');
  const [memberData, setMemberData] = useState(null);
  const [rechargeTiers, setRechargeTiers] = useState([]);
  const [message, setMessage] = useState(''); 
  const [consumeAmount, setConsumeAmount] = useState('');
  const [trackAmount, setTrackAmount] = useState('');   
  const [memberVouchers, setMemberVouchers] = useState([]);

  const authHeaders = {
    headers: { 'Authorization': `Token ${token}` }
  };

  // V4: 页面加载时获取充值档位
  useEffect(() => {
    const fetchRechargeTiers = async () => {
      try {
        const response = await axios.get(`${API_URL}/admin/tiers/`, authHeaders);
        setRechargeTiers(response.data);
      } catch (err) {
        console.error("Error fetching tiers:", err);
        setMessage("Error: Could not load recharge tiers.");
      }
    };
    fetchRechargeTiers();
  }, [API_URL, authHeaders]);


  // V13: 后勤搜索会员
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setMemberData(null); 
    setMessage('');
    setConsumeAmount('');
    setTrackAmount('');
    setMemberVouchers([]);

    if (!phone) {
      setError('Phone number is required.');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/admin/search/`, 
        { phone: phone },
        authHeaders
      );
      setMemberData(response.data.profile); 
      setMemberVouchers(response.data.vouchers);
    } catch (err) {
      setError(err.response?.data?.error || 'Search Failed.');
    }
  };

  // V4/V11 "代充值" 逻辑
  const handleRecharge = async (tierId) => {
    // ... (这部分代码 100% 保持不变) ...
    if (!memberData) return; 
    setError('');
    setMessage('Recharging...');
    try {
      const response = await axios.post(
        `${API_URL}/admin/recharge/${memberData.memberId}/`, 
        { tier_id: tierId },
        authHeaders
      );
      setMessage(response.data.success);
      handleSearch(); 
    } catch (err) {
      setError(err.response?.data?.error || 'Recharge Failed.');
      setMessage('');
    }
  };

  // V4/V10 "余额消费" 逻辑
  const handleConsumeBalance = async (e) => {
    e.preventDefault();
    // ... (这部分代码 100% 保持不变) ...
    if (!memberData || !consumeAmount) return;
    setError('');
    setMessage('Consuming balance...');
    try {
      const response = await axios.post(
        `${API_URL}/admin/consume/${memberData.memberId}/`,
        { amount: consumeAmount },
        authHeaders
      );
      setMessage(response.data.success);
      setConsumeAmount('');
      handleSearch(); 
    } catch (err) {
      setError(err.response?.data?.error || 'Consume Failed.');
      setMessage('');
    }
  };

  // V10 "现金追踪" 逻辑
  const handleTrackSpend = async (e) => {
    e.preventDefault();
    // ... (这部分代码 100% 保持不变) ...
    if (!memberData || !trackAmount) return;
    setError('');
    setMessage('Tracking spend...');
    try {
      const response = await axios.post(
        `${API_URL}/admin/track/${memberData.memberId}/`,
        { amount: trackAmount },
        authHeaders
      );
      setMessage(response.data.success);
      setTrackAmount('');
      handleSearch(); 
    } catch (err) {
      setError(err.response?.data?.error || 'Track Spend Failed.');
      setMessage('');
    }
  };

  // 🚩 步骤 124: V13 "智能核销" 逻辑
  const handleRedeemVoucher = async (voucherIdToRedeem, billAmountToRedeem) => {
    if (!voucherIdToRedeem || !billAmountToRedeem) return;

    setError('');
    setMessage('Redeeming voucher...');

    try {
      const response = await axios.post(
        `${API_URL}/admin/redeem_voucher/`,
        { 
          voucher_id: voucherIdToRedeem,  // 🚩 V13: 发送 ID
          bill_amount: billAmountToRedeem // 🚩 V13: 发送账单
        }, 
        authHeaders
      );

      setMessage(response.data.success); // "Successfully redeemed... Paid Cash: $130"
      handleSearch(); // 自动刷新会员资料 (Voucher 列表 和 Points 都会更新!)

    } catch (err) {
      setError(err.response?.data?.error || 'Redeem Failed.');
      setMessage('');
    }
  };

  // 
  // --- V15 渲染 (HTML/JSX) ---
  //
  return (
    <div className="App-header">
      <h2>Staff Dashboard (V13 Final)</h2>
      <button onClick={onLogout}>Logout</button>

      <hr style={{width: '80%'}} />

      {/* --- V2 搜索表单 --- */}
      <h3>Search Member (by Phone)</h3>
      <form onSubmit={handleSearch}>
        <input
          type="tel"
          placeholder="Member Phone Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>

      {/* 统一的消息区域 */}
      {error && <p className="error-message">{error}</p>}
      {message && <p className="success-message">{message}</p>}

      {/* --- V2/V4/V10/V13 结果显示 --- */}
      {memberData && (
        <div className="member-card">
          <h3>{memberData.nickname}</h3>
          <p>Email: {memberData.email}</p>
          <p>Phone: {memberData.phone}</p>
          <p>
            Level: {memberData.level.levelName} 
            (Points: {memberData.loyaltyPoints})
          </p>
          <p>
            Balance: ${memberData.balance}
          </p>

          {/* --- V4 充值按钮 --- */}
          <div className="action-section">
            <h4>Recharge (V4)</h4>
            {rechargeTiers.length > 0 ? (
              rechargeTiers.map(tier => (
                <button 
                  key={tier.id} 
                  className="recharge-button"
                  onClick={() => handleRecharge(tier.id)}
                >
                  ${tier.amount} (Get {tier.grantVoucherCount})
                </button>
              ))
            ) : (
              <p>Loading Tiers...</p>
            )}
          </div>

          {/* --- V4/V10 "余额消费" 表单 --- */}
          <div className="action-section">
            <h4>Consume (Balance V4/V10)</h4>
            <form onSubmit={handleConsumeBalance} className="consume-form">
              <input
                type="number"
                step="0.01"
                placeholder="Bill Amount ($)"
                value={consumeAmount}
                onChange={(e) => setConsumeAmount(e.target.value)}
              />
              <button type="submit" className="consume-button">Consume Balance</button>
            </form>
          </div>

          {/* --- V10 "现金追踪" 表单 --- */}
          <div className="action-section">
            <h4>Track (Cash/Card V10)</h4>
            <form onSubmit={handleTrackSpend} className="consume-form">
              <input
                type="number"
                step="0.01"
                placeholder="Spend Amount ($)"
                value={trackAmount}
                onChange={(e) => setTrackAmount(e.target.value)}
              />
              <button type="submit" className="track-button">Track Spend</button>
            </form>
          </div>

          {/* 🚩 步骤 124: V13 "智能核销" (新列表!) */}
          <div className="action-section">
            <h4>Redeem Voucher (V13)</h4>
            {memberVouchers.length > 0 ? (
              memberVouchers.map(voucher => (
                <VoucherCard 
                  key={voucher.voucherId} 
                  voucher={voucher} 
                  onRedeem={handleRedeemVoucher} 
                />
              ))
            ) : (
              <p>(Member has no unused vouchers)</p>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

// (我们还需要为 V13 卡片添加 CSS)
const styles = `
.member-card {
  background-color: #3a3f4a;
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
  width: 80%;
  max-width: 500px;
  text-align: left;
}
.member-card h3 {
  margin-top: 0;
  color: #61dafb;
}
.success-message {
  color: #7aff7a;
  font-size: 16px;
}
.action-section {
  margin-top: 20px;
  border-top: 1px solid #555;
  padding-top: 15px;
}
.recharge-button {
  background-color: #4CAF50; /* Green */
  color: white;
  margin: 5px;
  font-size: 16px;
}
.consume-form {
  display: flex;
  margin-top: 10px;
}
.consume-form input {
  flex-grow: 1;
  margin: 0 10px 0 0;
  font-size: 16px;
}
.consume-button {
  background-color: #f44336; /* Red */
  color: white;
  font-size: 16px;
}
.track-button {
  background-color: #008CBA; /* Blue */
  color: white;
  font-size: 16px;
}
/* 🚩 V13 新 CSS */
.voucher-card {
  background-color: #4f5560;
  border: 1px solid #ff9800;
  border-radius: 5px;
  padding: 10px 15px;
  margin-top: 10px;
}
.voucher-card p {
  margin: 5px 0;
  font-size: 14px;
}
.redeem-button {
  background-color: #ff9800; /* Orange */
  color: white;
  font-size: 16px;
}
small {
  font-size: 12px;
  color: #aaa;
}
`;

const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default DashboardPage;