import React from 'react';
import { Home, ArrowLeftRight, Briefcase, LayoutGrid, MessageSquare } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'deposit', label: 'Deposit', icon: ArrowLeftRight },
    { id: 'upi', label: 'Withdraw', icon: Briefcase },
    { id: 'team', label: 'Team', icon: LayoutGrid },
    { id: 'me', label: 'Me', icon: MessageSquare },
  ];

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => {
        const IconComponent = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <div className="nav-icon-container">
              {tab.id === 'me' ? (
                // Custom Speech Bubble Icon matching the "Me" icon in screenshots
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill={isActive ? '#000000' : 'none'} stroke={isActive ? '#000000' : '#8e8e93'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    {isActive && <circle cx="12" cy="10" r="2.5" fill="#ffffff" />}
                  </svg>
                </div>
              ) : tab.id === 'team' ? (
                // Layout grid icon matching "Team" tab
                <svg width="22" height="22" viewBox="0 0 24 24" fill={isActive ? '#000000' : 'none'} stroke={isActive ? '#000000' : '#8e8e93'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="8" height="8" rx="2" fill={isActive ? '#000000' : 'none'}></rect>
                  <rect x="13" y="3" width="8" height="8" rx="2" fill={isActive ? '#000000' : 'none'}></rect>
                  <rect x="3" y="13" width="8" height="8" rx="2" fill={isActive ? '#000000' : 'none'}></rect>
                  <rect x="13" y="13" width="8" height="8" rx="2" fill={isActive ? '#000000' : 'none'}></rect>
                </svg>
              ) : tab.id === 'upi' ? (
                // Briefcase icon matching "UPI" tab
                <svg width="22" height="22" viewBox="0 0 24 24" fill={isActive ? '#000000' : 'none'} stroke={isActive ? '#000000' : '#8e8e93'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="3" fill={isActive ? '#000000' : 'none'}></rect>
                  <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"></path>
                </svg>
              ) : tab.id === 'deposit' ? (
                // Circle double arrows matching "Deposit" tab
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: isActive ? '#000000' : '#8e8e93',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="17 1 21 5 17 9"></polyline>
                    <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                    <polyline points="7 23 3 19 7 15"></polyline>
                    <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
                  </svg>
                </div>
              ) : (
                // Home icon matching "Home" tab
                <svg width="22" height="22" viewBox="0 0 24 24" fill={isActive ? '#000000' : 'none'} stroke={isActive ? '#000000' : '#8e8e93'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22" fill={isActive ? '#ffffff' : 'none'}></polyline>
                </svg>
              )}
            </div>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
