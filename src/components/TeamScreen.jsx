import React, { useState, useEffect } from 'react';
import { User, Users, Copy, Check, Share2 } from 'lucide-react';
import { API_BASE } from '../config';

export default function TeamScreen({ showToast, currentUser, stats }) {
  const [copied, setCopied] = useState(false);

  const userId = currentUser?.userId || stats?.userId || '1000656';
  const referralCode = currentUser?.referralCode || userId;

  const [teamData, setTeamData] = useState({
    commission: Number(currentUser?.teamCommission || stats?.teamCommission || 0),
    teamRecharge: 0,
    teamCount: 0,
    referralCode: referralCode,
    members: []
  });

  const fetchTeamData = async () => {
    try {
      const res = await fetch(`${API_BASE}/team?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setTeamData({
          commission: Number(data.commission) || 0,
          teamRecharge: Number(data.teamRecharge) || 0,
          teamCount: Number(data.teamCount) || 0,
          referralCode: data.referralCode || referralCode,
          members: Array.isArray(data.members) ? data.members : []
        });
      }
    } catch (err) {
      // Keep existing state if offline
    }
  };

  useEffect(() => {
    fetchTeamData();
    const interval = setInterval(fetchTeamData, 3000);
    return () => clearInterval(interval);
  }, [userId, referralCode]);

  const copyInviteCode = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(referralCode);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = referralCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }

    setCopied(true);
    if (showToast) showToast('Invite code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="team-screen" style={{ padding: '0 4px 85px 4px' }}>
      {/* Simple Clean Header */}
      <div className="screen-header">
        <h1 className="screen-title">Team</h1>
      </div>

      {/* Dark Charcoal Summary Card */}
      <div className="dark-summary-card">
        <div className="dark-card-numbers">
          <div className="dark-card-num-item">
            <h2>{Number(teamData.commission).toFixed(2)}</h2>
            <span>Commission (0.8%)</span>
          </div>
          <div className="dark-card-num-item">
            <h2>{Number(teamData.teamRecharge).toFixed(2)}</h2>
            <span>Team Recharge</span>
          </div>
        </div>

        <div className="dark-card-user-count">
          <User size={20} color="#ffffff" />
          <span>{teamData.teamCount}</span>
        </div>
      </div>

      {/* Invite Code Section (Simple Referral Code only, no URL link) */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#000', margin: 0 }}>
            Invite Code
          </h3>
          <span style={{
            fontSize: '12px',
            fontWeight: '800',
            color: '#059669',
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            padding: '2px 8px',
            borderRadius: '6px'
          }}>
            Earn 0.8%
          </span>
        </div>

        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
          border: '1px solid #f0f1f5'
        }}>
          <span style={{
            fontSize: '17px',
            fontWeight: '800',
            color: '#111827',
            fontFamily: 'monospace',
            letterSpacing: '0.8px'
          }}>
            {referralCode}
          </span>

          <button
            onClick={copyInviteCode}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: copied ? '#00b894' : '#333333',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              borderRadius: '6px',
              transition: 'color 0.15s ease'
            }}
            title="Copy Invite Code"
          >
            {copied ? <Check size={20} color="#00b894" /> : <Copy size={20} />}
          </button>
        </div>
      </div>

      {/* Team Detail Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#000', margin: 0 }}>
            Team Detail ({teamData.teamCount})
          </h3>
          <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>
            Commission Rate: <strong style={{ color: '#059669' }}>0.8%</strong>
          </span>
        </div>

        {teamData.members.length === 0 ? (
          /* Clean Empty State when user has not referred anyone */
          <div style={{
            background: '#ffffff',
            borderRadius: '14px',
            padding: '36px 20px',
            textAlign: 'center',
            border: '1px dashed #cbd5e1',
            boxShadow: '0 1px 4px rgba(0,0,0,0.02)'
          }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px auto'
            }}>
              <Users size={26} color="#64748b" />
            </div>
            <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0' }}>
              No team members yet
            </h4>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0', lineHeight: '1.4' }}>
              Share your invite code <strong>{referralCode}</strong> with friends. When they register and recharge, they will appear here and you will earn 0.8% lifetime commissions!
            </p>
            <button
              className="btn-black"
              onClick={copyInviteCode}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 18px',
                fontSize: '13px',
                borderRadius: '8px',
                fontWeight: '700'
              }}
            >
              {copied ? <Check size={14} color="#00b894" /> : <Copy size={14} />}
              {copied ? 'Code Copied' : 'Copy Invite Code'}
            </button>
          </div>
        ) : (
          /* Real Members List when user has actually referred members */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {teamData.members.map((member, index) => {
              const rechargeVal = Number(member.recharge || 0);
              const commVal = Number(member.comm || 0);

              return (
                <div
                  key={member._id || member.id || index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    background: '#ffffff',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1px solid #f1f5f9'
                  }}
                >
                  {/* Turquoise Glowing Orb Avatar */}
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle at 30% 30%, #00f2fe 0%, #4facfe 40%, #0f172a 100%)',
                    boxShadow: '0 4px 12px rgba(79, 172, 254, 0.3)',
                    position: 'relative',
                    overflow: 'hidden',
                    flexShrink: 0
                  }}>
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.1) 4px, rgba(255,255,255,0.1) 8px)'
                    }} />
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '4px'
                    }}>
                      <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                        {member.phone}
                      </h4>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        fontSize: '12px',
                        color: '#64748b',
                        fontWeight: '600'
                      }}>
                        <User size={13} />
                        <span>{member.usersCount || 0}</span>
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                      color: '#64748b',
                      fontWeight: '500'
                    }}>
                      <span>
                        Recharge: <strong style={{ color: '#0f172a' }}>
                          ₹{rechargeVal.toFixed(2)}
                        </strong>
                      </span>
                      <span>
                        Comm (0.8%): <strong style={{ color: '#059669' }}>
                          ₹{commVal.toFixed(2)}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
