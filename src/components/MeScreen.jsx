import React from 'react';
import {
  ChevronRight,
  History,
  Receipt,
  Disc,
  MessageSquareText,
  LogOut,
  UserCheck
} from 'lucide-react';

export default function MeScreen({ openModal, stats, onLogout, currentUser, showToast }) {
  const userId = currentUser?.userId || stats?.userId || '1000656';

  const menuItems = [
    { id: 'recharge', label: 'Recharge History', icon: History, action: () => openModal && openModal('rechargeHistory') },
    { id: 'token', label: 'Token History', icon: Receipt, action: () => openModal && openModal('tokenHistory') },
    {
      id: 'wheel',
      label: 'Lucky Wheel',
      icon: Disc,
      action: () => openModal && openModal('spin')
    },
    { id: 'contact', label: 'Contact Us', icon: MessageSquareText, action: () => openModal && openModal('contact') },
    { id: 'signOut', label: 'Sign Out', icon: LogOut, action: onLogout },
  ];

  return (
    <div className="me-screen" style={{ paddingBottom: '30px' }}>
      {/* Header: Just ID with avatar icon */}
      <div className="screen-header" style={{ marginBottom: '14px', display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="profile-avatar-icon">
            <UserCheck size={18} />
          </div>
          <span style={{ fontSize: '18px', fontWeight: '800', color: '#000' }}>
            ID: {userId}
          </span>
        </div>
      </div>

      {/* Quota Balance Box with Top up & Withdraw buttons */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '18px 20px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>
          <span style={{ fontSize: '14px' }}>🪙</span> Quota
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '36px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.8px', lineHeight: '1.1' }}>
              ₹{Number(stats.balance || 0).toFixed(2)}
            </div>
            <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600', marginTop: '4px', display: 'block' }}>
              Reward ratio 2%
            </span>
          </div>

          {/* Action Buttons: Top up & Withdraw */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn-black"
              onClick={() => openModal && openModal('topup')}
              style={{
                padding: '9px 20px',
                fontSize: '14px',
                fontWeight: '800',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Top up
            </button>
            <button
              onClick={() => openModal && openModal('withdraw')}
              style={{
                background: '#ffffff',
                color: '#0f172a',
                border: '1.5px solid #0f172a',
                padding: '9px 18px',
                fontSize: '14px',
                fontWeight: '800',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Withdraw
            </button>
          </div>
        </div>
      </div>

      {/* Invite User Rewards Banner */}
      <div
        className="invite-banner"
        onClick={() => openModal && openModal('inviteRewards')}
        style={{ cursor: 'pointer', marginBottom: '18px' }}
      >
        <div>
          <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#60a5fa', marginBottom: '2px' }}>
            Invite user rewards
          </h3>
          <p style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: '600' }}>
            Earn team commissions
          </p>
        </div>

        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #38bdf8 0%, #1d4ed8 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          boxShadow: '0 4px 12px rgba(56, 189, 248, 0.4)',
          flexShrink: 0
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: '#fbbf24',
            border: '2px solid #fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '900',
            color: '#78350f',
            fontSize: '14px'
          }}>
            $
          </div>
        </div>
      </div>

      {/* Menu List Options */}
      <div className="menu-list">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <div
              key={item.id}
              className="menu-item"
              onClick={() => {
                if (item.action) {
                  item.action();
                } else {
                  openModal && openModal('menuOption', item.label);
                }
              }}
            >
              <div className="menu-item-left">
                <div className="menu-item-icon">
                  {item.id === 'wheel' ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <circle cx="12" cy="12" r="3"></circle>
                      <line x1="12" y1="2" x2="12" y2="9"></line>
                      <line x1="12" y1="15" x2="12" y2="22"></line>
                    </svg>
                  ) : (
                    <IconComponent size={20} color={item.id === 'signOut' ? '#ef4444' : '#111'} />
                  )}
                </div>
                <span style={{ color: item.id === 'signOut' ? '#ef4444' : '#0f172a' }}>{item.label}</span>
              </div>

              <div className="menu-item-right">
                {item.extraText && (
                  <span style={{ fontSize: '14px', color: '#9ca3af', fontWeight: '500' }}>
                    {item.extraText}
                  </span>
                )}
                <ChevronRight size={18} color="#9ca3af" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
