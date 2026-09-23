import React, { useState, useEffect } from 'react';
import { User, Users, Copy, Check, Share2, Link2 } from 'lucide-react';
import { API_BASE } from '../config';

export default function TeamScreen({ showToast, currentUser, stats }) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const userId = currentUser?.userId || stats?.userId || '1000656';
  const referralCode = currentUser?.referralCode || userId;

  const inviteUrl = typeof window !== 'undefined' && window.location.origin
    ? `${window.location.origin}/?ref=${referralCode}`
    : `https://flashpayiinr.vercel.app/?ref=${referralCode}`;

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

    setCopiedCode(true);
    if (showToast) showToast('Invite code copied!');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyInviteLink = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(inviteUrl);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = inviteUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }

    setCopiedLink(true);
    if (showToast) showToast('Invite link copied!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join FlashPay',
          text: `Join FlashPay using my invite code ${referralCode} and get 8% return on every deposit!`,
          url: inviteUrl
        });
      } catch (err) {}
    } else {
      copyInviteLink();
    }
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

      {/* Invite Link & Code Card */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '18px 16px',
        marginBottom: '24px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
      }}>
        {/* Header with 0.8% badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 2px 0' }}>
              Invite Friends & Earn
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
              Get 0.8% instant commission on every team recharge
            </p>
          </div>
          <span style={{
            fontSize: '11px',
            fontWeight: '800',
            color: '#059669',
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            padding: '3px 8px',
            borderRadius: '6px'
          }}>
            0.8% Lifetime
          </span>
        </div>

        {/* 1. Invite Link Field */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
            <Link2 size={13} color="#2563eb" />
            Invite Link
          </label>
          <div style={{
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '10px',
            padding: '6px 8px 6px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px'
          }}>
            <span style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#0f172a',
              fontFamily: 'monospace',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              flex: 1
            }}>
              {inviteUrl}
            </span>
            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
              <button
                type="button"
                onClick={copyInviteLink}
                style={{
                  background: copiedLink ? '#ecfdf5' : '#0f172a',
                  color: copiedLink ? '#059669' : '#ffffff',
                  border: copiedLink ? '1px solid #a7f3d0' : 'none',
                  padding: '7px 12px',
                  borderRadius: '7px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease'
                }}
              >
                {copiedLink ? <Check size={13} /> : <Copy size={13} />}
                {copiedLink ? 'Copied' : 'Copy'}
              </button>
              <button
                type="button"
                onClick={handleShare}
                style={{
                  background: '#f1f5f9',
                  color: '#0f172a',
                  border: '1px solid #cbd5e1',
                  padding: '7px 10px',
                  borderRadius: '7px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Share Link"
              >
                <Share2 size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* 2. Invite Code Field */}
        <div>
          <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>
            Invite Code
          </label>
          <div style={{
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '10px',
            padding: '6px 8px 6px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px'
          }}>
            <span style={{
              fontSize: '15px',
              fontWeight: '900',
              color: '#2563eb',
              fontFamily: 'monospace',
              letterSpacing: '1px'
            }}>
              {referralCode}
            </span>
            <button
              type="button"
              onClick={copyInviteCode}
              style={{
                background: copiedCode ? '#ecfdf5' : '#ffffff',
                color: copiedCode ? '#059669' : '#0f172a',
                border: '1px solid ' + (copiedCode ? '#a7f3d0' : '#cbd5e1'),
                padding: '7px 12px',
                borderRadius: '7px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s ease'
              }}
            >
              {copiedCode ? <Check size={13} /> : <Copy size={13} />}
              {copiedCode ? 'Copied' : 'Copy Code'}
            </button>
          </div>
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
              background: '#eff6ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px auto'
            }}>
              <Users size={26} color="#2563eb" />
            </div>
            <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0' }}>
              No team members yet
            </h4>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0', lineHeight: '1.4' }}>
              Share your invite link with friends. When they register through your link and make recharges, they will appear here and you will earn 0.8% instant lifetime commissions!
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                className="btn-black"
                onClick={copyInviteLink}
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
                {copiedLink ? <Check size={14} color="#059669" /> : <Link2 size={14} />}
                {copiedLink ? 'Link Copied!' : 'Copy Invite Link'}
              </button>
              <button
                type="button"
                onClick={handleShare}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 16px',
                  fontSize: '13px',
                  borderRadius: '8px',
                  fontWeight: '700',
                  background: '#f1f5f9',
                  color: '#0f172a',
                  border: '1px solid #cbd5e1',
                  cursor: 'pointer'
                }}
              >
                <Share2 size={14} />
                Share
              </button>
            </div>
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
