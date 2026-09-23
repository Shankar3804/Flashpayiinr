import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HomeScreen from './components/HomeScreen';
import DepositScreen from './components/DepositScreen';
import UPIScreen from './components/UPIScreen';
import TeamScreen from './components/TeamScreen';
import MeScreen from './components/MeScreen';
import Modals from './components/Modals';
import LoginScreen from './components/LoginScreen';
import AdminPanel from './components/AdminPanel';

const API_BASE = 'http://localhost:5000/api';

export default function App() {
  // Auth state
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home');

  // App Global Stats matching screenshots
  const [stats, setStats] = useState({
    balance: 118.32,
    todayReceived: 0.00,
    topupBonus: 1496.09,
    teamCommission: 211.51
  });

  // UPI Accounts List matching Screenshot 3
  const [upiAccounts, setUpiAccounts] = useState([
    {
      id: 1,
      phone: '7892136208',
      vpa: 'karthik35@ptyes',
      provider: 'paytm',
      enabled: true,
      logoBg: '#e0f2fe'
    },
    {
      id: 2,
      phone: '7907342027',
      vpa: 'paytm.s2zq355@pty',
      provider: 'paytm-business',
      enabled: true,
      logoBg: '#f0fdf4'
    }
  ]);

  // Toast Notification State
  const [toastText, setToastText] = useState(null);
  const showToast = (msg) => {
    setToastText(msg);
    setTimeout(() => {
      setToastText(null);
    }, 2500);
  };

  // Splash Screen on Refresh / Load
  const [splashLoading, setSplashLoading] = useState(true);
  const [refCodeParam, setRefCodeParam] = useState('');

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref') || params.get('code');
      if (ref) {
        setRefCodeParam(ref);
        localStorage.setItem('flashpay_ref_code', ref);
      } else {
        const cached = localStorage.getItem('flashpay_ref_code');
        if (cached) setRefCodeParam(cached);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSplashLoading(false);
    }, 1100);
    return () => clearTimeout(timer);
  }, []);

  // Check saved session in localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('flashpay_user') || localStorage.getItem('elephant_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {}
    }
  }, []);

  // Fetch data from local MongoDB when logged in as user
  useEffect(() => {
    async function loadBackendData() {
      if (!currentUser || currentUser.role === 'admin') return;
      try {
        const targetId = currentUser.userId || '1000656';
        const statsRes = await fetch(`${API_BASE}/stats?userId=${targetId}`);
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats((prev) => ({ ...prev, ...statsData }));
        }

        const upiRes = await fetch(`${API_BASE}/upi`);
        if (upiRes.ok) {
          const upiData = await upiRes.json();
          if (upiData && upiData.length > 0) {
            setUpiAccounts(upiData.map(item => ({ ...item, id: item._id || item.id })));
          }
        }
      } catch (err) {
        console.log('MongoDB server offline, using local state.');
      }
    }
    loadBackendData();
    const interval = setInterval(loadBackendData, 2500);
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData);
    localStorage.setItem('flashpay_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('flashpay_user');
    localStorage.removeItem('elephant_user');
    showToast('Signed out successfully.');
  };

  // Update Stats in MongoDB
  const updateStats = async (newStatsOrFn) => {
    setStats((prev) => {
      const updated = typeof newStatsOrFn === 'function' ? newStatsOrFn(prev) : { ...prev, ...newStatsOrFn };
      const targetId = currentUser?.userId || updated.userId || '1000656';
      fetch(`${API_BASE}/stats`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updated, userId: targetId })
      }).catch(err => console.log('DB sync error:', err));
      return updated;
    });
  };

  // Modal State
  const [modalType, setModalType] = useState(null);
  const [modalData, setModalData] = useState(null);

  const openModal = (type, data = null) => {
    setModalType(type);
    setModalData(data);
  };

  const closeModal = () => {
    setModalType(null);
    setModalData(null);
  };

  const toggleAccountStatus = async (id) => {
    setUpiAccounts((prev) =>
      prev.map((acc) =>
        acc.id === id ? { ...acc, enabled: !acc.enabled } : acc
      )
    );
    showToast('UPI account status updated.');

    try {
      await fetch(`${API_BASE}/upi/${id}/toggle`, { method: 'PUT' });
    } catch (err) {
      console.log('MongoDB toggle sync error:', err);
    }
  };

  const addUpiAccount = async (newAcc) => {
    setUpiAccounts((prev) => [newAcc, ...prev]);

    try {
      const res = await fetch(`${API_BASE}/upi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAcc)
      });
      if (res.ok) {
        const saved = await res.json();
        setUpiAccounts(prev => prev.map(item => item.id === newAcc.id ? { ...saved, id: saved._id } : item));
      }
    } catch (err) {
      console.log('MongoDB add account sync error:', err);
    }
  };

  const handleBuyQuota = (item) => {
    openModal('buyQuota', item);
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="app-container">
      {/* Splash Screen on Refresh / Load */}
      {splashLoading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999999,
          animation: 'fadeIn 0.15s ease-out'
        }}>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <img
              src="/flashpay_logo.png"
              alt="FlashPay"
              style={{
                width: '92px',
                height: '92px',
                borderRadius: '22px',
                boxShadow: '0 10px 30px rgba(37, 99, 235, 0.28)',
                margin: '0 auto 16px auto',
                display: 'block',
                animation: 'scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            />
            <h1 style={{
              fontSize: '26px',
              fontWeight: '900',
              color: '#0f172a',
              letterSpacing: '-0.5px',
              margin: '0 0 4px 0'
            }}>
              Flash<span style={{ color: '#2563eb' }}>Pay</span>
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b', fontWeight: '500', margin: '0 0 24px 0' }}>
              Fast & Secure Payments
            </p>

            {/* Subtle Progress Bar */}
            <div style={{
              width: '120px',
              height: '3px',
              background: '#f1f5f9',
              borderRadius: '99px',
              overflow: 'hidden',
              margin: '0 auto'
            }}>
              <div style={{
                width: '60px',
                height: '100%',
                background: '#2563eb',
                borderRadius: '99px',
                animation: 'progressAnim 1s ease-in-out infinite'
              }} />
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastText && <div className="toast-msg">{toastText}</div>}

      {/* Main Content Container (Natural Sizing) */}
      <div className={`main-content-wrapper ${isAdmin ? 'admin-layout' : ''}`}>
        {/* Screen Content */}
        <div className="screen-content">
          {!currentUser ? (
            <LoginScreen
              onLoginSuccess={handleLoginSuccess}
              showToast={showToast}
              initialRefCode={refCodeParam}
            />
          ) : isAdmin ? (
            <AdminPanel adminUser={currentUser} onLogout={handleLogout} showToast={showToast} />
          ) : (
            <>
              {activeTab === 'home' && (
                <HomeScreen openModal={openModal} stats={stats} setActiveTab={setActiveTab} />
              )}

              {activeTab === 'deposit' && (
                <DepositScreen
                  openModal={openModal}
                  onBuyQuota={handleBuyQuota}
                  showToast={showToast}
                  currentUser={currentUser}
                />
              )}

              {activeTab === 'upi' && (
                <UPIScreen
                  stats={stats}
                  currentUser={currentUser}
                  showToast={showToast}
                  updateStats={updateStats}
                  openModal={openModal}
                />
              )}

              {activeTab === 'team' && (
                <TeamScreen
                  showToast={showToast}
                  currentUser={currentUser}
                  stats={stats}
                />
              )}

              {activeTab === 'me' && (
                <MeScreen
                  openModal={openModal}
                  stats={stats}
                  onLogout={handleLogout}
                  currentUser={currentUser}
                  showToast={showToast}
                />
              )}
            </>
          )}
        </div>

        {/* Bottom Navigation Bar for User role */}
        {currentUser && currentUser.role === 'user' && (
          <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
        )}

        {/* Interactive Modals */}
        {currentUser && currentUser.role === 'user' && (
          <Modals
            modalType={modalType}
            modalData={modalData}
            closeModal={closeModal}
            showToast={showToast}
            addUpiAccount={addUpiAccount}
            updateStats={updateStats}
            currentUser={currentUser}
            stats={stats}
            openModal={openModal}
          />
        )}
      </div>
    </div>
  );
}
