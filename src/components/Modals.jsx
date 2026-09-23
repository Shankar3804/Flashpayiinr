import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  Play,
  Plus,
  Coins,
  ShieldAlert,
  Copy,
  Check,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  RefreshCw,
  XCircle,
  Wallet,
  Send,
  ExternalLink,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { API_BASE } from '../config';

export default function Modals({ modalType, modalData, closeModal, showToast, addUpiAccount, updateStats, currentUser, stats, openModal }) {
  if (!modalType) return null;

  // Top Up Modal State
  const [topupAmount, setTopupAmount] = useState('500');
  const [payMethod, setPayMethod] = useState('UPI');
  const [topupUtr, setTopupUtr] = useState('');
  const [topupCopied, setTopupCopied] = useState(false);
  const [submittingTopup, setSubmittingTopup] = useState(false);

  // Withdrawal Modal State
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawUpi, setWithdrawUpi] = useState('');
  const [withdrawMpin, setWithdrawMpin] = useState('');
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);
  const [withdrawStep, setWithdrawStep] = useState('input'); // 'input' | 'confirmMpin' | 'setMpin'

  // Set Security MPIN Modal State
  const [newMpin, setNewMpin] = useState('');
  const [confirmMpin, setConfirmMpin] = useState('');
  const [showMpinDigits, setShowMpinDigits] = useState(false);
  const [submittingMpin, setSubmittingMpin] = useState(false);

  useEffect(() => {
    if (modalType !== 'withdraw') {
      setWithdrawStep('input');
    }
  }, [modalType]);

  // Token History State
  const [tokenTxs, setTokenTxs] = useState([]);
  const [txFilter, setTxFilter] = useState(modalData === 'topup' ? 'topup' : 'all');
  const [loadingTokenTxs, setLoadingTokenTxs] = useState(false);

  // Lucky Spin Wheel State
  const [spinning, setSpinning] = useState(false);
  const [wheelDegree, setWheelDegree] = useState(0);
  const [wonPrize, setWonPrize] = useState(null);

  // Add UPI Modal State
  const [newProvider, setNewProvider] = useState('paytm');
  const [newPhone, setNewPhone] = useState('');
  const [newVpa, setNewVpa] = useState('');

  // Contact Modal State
  const [copiedContact, setCopiedContact] = useState(null);

  const handleCopyContact = (text, key) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    setCopiedContact(key);
    if (showToast) showToast(`Copied ${text} to clipboard!`);
    setTimeout(() => setCopiedContact(null), 2000);
  };

  const fetchTokenTxs = async () => {
    try {
      setLoadingTokenTxs(true);
      const uid = currentUser?.userId || '1000656';
      const res = await fetch(`${API_BASE}/user/transactions?userId=${uid}`);
      if (res.ok) {
        const data = await res.json();
        setTokenTxs(data);
      }
    } catch (err) {
      console.log('Error fetching token txs:', err);
    } finally {
      setLoadingTokenTxs(false);
    }
  };

  useEffect(() => {
    if (modalType === 'tokenHistory' || modalType === 'token' || modalType === 'recharge' || modalType === 'rechargeHistory') {
      fetchTokenTxs();
      const interval = setInterval(fetchTokenTxs, 2500);
      return () => clearInterval(interval);
    }
  }, [modalType, currentUser]);

  const upiId = 'paytm.s2zq355@pty';

  const handleCopyTopupUpi = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(upiId);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = upiId;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    setTopupCopied(true);
    showToast('UPI ID copied to clipboard!');
    setTimeout(() => setTopupCopied(false), 2000);
  };

  // Initiate withdrawal from modal: validate inputs and advance to MPIN step
  const handleInitiateWithdrawModal = (e) => {
    e.preventDefault();
    const amt = parseFloat(withdrawAmount);
    if (!amt || amt <= 0) {
      showToast('Please enter a valid withdrawal amount');
      return;
    }
    if (amt < 2000) {
      showToast('Minimum withdrawal amount is ₹2,000');
      return;
    }
    if (amt > Number(stats?.balance || 0)) {
      showToast(`Insufficient balance! Available: ₹${Number(stats?.balance || 0).toFixed(2)}`);
      return;
    }
    if (!withdrawUpi || withdrawUpi.trim().length < 3) {
      showToast('Please enter a valid UPI ID for payout');
      return;
    }

    // Only at request time:
    if (!stats?.hasMpin) {
      setNewMpin('');
      setConfirmMpin('');
      setShowMpinDigits(false);
      setWithdrawStep('setMpin');
    } else {
      setWithdrawMpin('');
      setShowMpinDigits(false);
      setWithdrawStep('confirmMpin');
    }
  };

  // Confirm withdrawal with MPIN from modal
  const handleConfirmWithdrawalModal = async (e) => {
    e.preventDefault();
    const amt = parseFloat(withdrawAmount);
    if (!withdrawMpin || withdrawMpin.trim().length < 4) {
      showToast('Please enter your 4-digit or 6-digit MPIN');
      return;
    }

    setSubmittingWithdraw(true);
    try {
      const res = await fetch(`${API_BASE}/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.userId || stats?.userId || '1000656',
          amount: amt,
          upiId: withdrawUpi.trim(),
          mpin: withdrawMpin.trim()
        })
      });
      const data = await res.json();
      setSubmittingWithdraw(false);

      if (res.ok) {
        updateStats(prev => ({ ...prev, balance: prev.balance - amt }));
        showToast(`Withdrawal of ₹${amt} requested! Pending Admin approval.`);
        setWithdrawAmount('');
        setWithdrawUpi('');
        setWithdrawMpin('');
        setWithdrawStep('input');
        closeModal();
      } else {
        if (data.needsMpinSetup) {
          showToast(data.error || 'Please set your Security MPIN first');
          setWithdrawStep('setMpin');
          return;
        }
        showToast(data.error || 'Incorrect MPIN. Please enter the MPIN you set.');
      }
    } catch (err) {
      setSubmittingWithdraw(false);
      showToast('Withdrawal failed. Please check connection.');
    }
  };

  // Set MPIN and immediately authorize withdrawal
  const handleSetMpinAndWithdrawModal = async (e) => {
    e.preventDefault();
    const pin = newMpin.trim();
    const confirm = confirmMpin.trim();

    if (!pin || pin.length < 4) {
      showToast('MPIN must be 4 to 6 digits');
      return;
    }
    if (pin !== confirm) {
      showToast('MPIN and Confirm MPIN do not match!');
      return;
    }

    setSubmittingMpin(true);
    try {
      const uid = currentUser?.userId || stats?.userId || '1000656';
      const setRes = await fetch(`${API_BASE}/user/set-mpin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: uid, mpin: pin })
      });
      const setData = await setRes.json();

      if (!setRes.ok) {
        setSubmittingMpin(false);
        showToast(setData.error || 'Failed to set MPIN');
        return;
      }

      setSubmittingMpin(false);
      if (updateStats) {
        updateStats(prev => ({ ...prev, hasMpin: true }));
      }

      showToast('Security MPIN set! Please enter your MPIN to confirm withdrawal.');
      setNewMpin('');
      setConfirmMpin('');
      setWithdrawMpin('');
      setShowMpinDigits(false);
      setWithdrawStep('confirmMpin');
    } catch (err) {
      setSubmittingMpin(false);
      showToast('Failed to save MPIN. Please try again.');
    }
  };

  const handleSaveMpin = async (e) => {
    e.preventDefault();
    const pin = newMpin.trim();
    const confirm = confirmMpin.trim();

    if (!pin || pin.length < 4) {
      showToast('MPIN must be 4 to 6 digits');
      return;
    }
    if (pin !== confirm) {
      showToast('MPIN and Confirm MPIN do not match!');
      return;
    }

    setSubmittingMpin(true);
    try {
      const uid = currentUser?.userId || stats?.userId || '1000656';
      const res = await fetch(`${API_BASE}/user/set-mpin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: uid, mpin: pin })
      });
      const data = await res.json();
      setSubmittingMpin(false);

      if (res.ok) {
        if (updateStats) {
          updateStats(prev => ({ ...prev, hasMpin: true }));
        }
        showToast('Security MPIN set successfully!');
        setNewMpin('');
        setConfirmMpin('');
        closeModal();
      } else {
        showToast(data.error || 'Failed to set MPIN');
      }
    } catch (err) {
      setSubmittingMpin(false);
      if (updateStats) {
        updateStats(prev => ({ ...prev, hasMpin: true }));
      }
      showToast('Security MPIN saved!');
      setNewMpin('');
      setConfirmMpin('');
      closeModal();
    }
  };

  const handleTopup = async (e) => {
    e.preventDefault();
    const amt = parseFloat(topupAmount);
    if (!amt || amt <= 0) return;

    if (amt < 500) {
      showToast('Minimum deposit amount is ₹500');
      return;
    }

    if (payMethod === 'UPI') {
      if (!topupUtr || topupUtr.trim().length < 6) {
        showToast('Please enter a valid 12-digit UTR number');
        return;
      }
      setSubmittingTopup(true);
      try {
        await fetch(`${API_BASE}/topup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: '1000656',
            amount: amt,
            method: 'UPI (Paytm)',
            utr: topupUtr.trim()
          })
        });
      } catch (err) {}
      setSubmittingTopup(false);
      showToast(`Payment of ₹${amt} submitted! UTR: ${topupUtr}. Pending Admin approval.`);
    } else {
      const bonus = Math.round(amt * 0.08 * 100) / 100;
      updateStats((prev) => ({
        ...prev,
        balance: prev.balance + amt + bonus,
        topupBonus: prev.topupBonus + bonus,
        todayReceived: (prev.todayReceived || 0) + bonus
      }));
      showToast(`Successfully topped up ₹${amt} (+₹${bonus.toFixed(2)} 8% Bonus)!`);
    }

    try {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    } catch (err) {}
    closeModal();
  };

  const handleAddAccount = (e) => {
    e.preventDefault();
    if (!newPhone || !newVpa) {
      showToast('Please enter both phone number and UPI ID!');
      return;
    }

    addUpiAccount({
      id: Date.now(),
      phone: newPhone,
      vpa: newVpa,
      provider: newProvider,
      enabled: true
    });

    showToast('New UPI account added successfully!');
    closeModal();
  };

  const wheelPrizes = [
    { label: '₹100', value: 100, color: '#ef4444' },
    { label: '₹500', value: 500, color: '#f59e0b' },
    { label: '₹50', value: 50, color: '#10b981' },
    { label: '₹1000', value: 1000, color: '#3b82f6' },
    { label: '₹200', value: 200, color: '#8b5cf6' },
    { label: '₹2000', value: 2000, color: '#ec4899' },
  ];

  const handleSpin = () => {
    if (spinning) return;

    const currentBalance = Number(stats?.balance || 0);
    if (currentBalance < 5000) {
      if (showToast) showToast('Lucky Wheel requires a minimum balance of ₹5,000 INR!');
      return;
    }

    setSpinning(true);
    setWonPrize(null);

    const prizeIdx = Math.floor(Math.random() * wheelPrizes.length);
    const winItem = wheelPrizes[prizeIdx];

    // Pointer is at the top (0 deg).
    // Segment i occupies [i*60, (i+1)*60] deg. Center of segment i is i*60 + 30 deg.
    const targetSliceAngle = (360 - (prizeIdx * 60 + 30) + 360) % 360;
    const currentBase = Math.floor(wheelDegree / 360) * 360;
    const newDegree = currentBase + 1800 + targetSliceAngle;

    setWheelDegree(newDegree);

    setTimeout(async () => {
      setSpinning(false);
      setWonPrize(winItem.value);

      // 1. Immediately update local state
      if (updateStats) {
        updateStats(prev => ({
          ...prev,
          balance: prev.balance + winItem.value,
          todayReceived: prev.todayReceived + winItem.value
        }));
      }

      // 2. Persist in MongoDB database
      try {
        const uid = currentUser?.userId || stats?.userId || '1000656';
        await fetch(`${API_BASE}/wheel/win`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: uid, amount: winItem.value })
        });
      } catch (err) {
        console.log('Error syncing wheel win to DB:', err);
      }

      if (showToast) showToast(`🎉 Congratulations! You won ${winItem.label} INR! Balance updated.`);
      try {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
      } catch (err) {}
    }, 3200);
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Header bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#000' }}>
            {modalType === 'topup' && 'Top up Balance'}
            {modalType === 'withdraw' && (withdrawStep === 'setMpin' ? 'Set Security MPIN' : withdrawStep === 'confirmMpin' ? 'Confirm Withdrawal' : 'Request Withdrawal')}
            {modalType === 'setMpin' && (stats?.hasMpin ? 'Update Security MPIN' : 'Set Security MPIN')}
            {(modalType === 'rechargeHistory' || modalType === 'recharge') && 'Recharge History'}
            {(modalType === 'tokenHistory' || modalType === 'token') && 'Token History'}
            {modalType === 'addUpi' && 'Add New UPI Account'}
            {modalType === 'spin' && 'Lucky Spin Wheel'}
            {modalType === 'tutorial' && `Tutorial: ${modalData}`}
            {modalType === 'buyQuota' && 'Confirm Quota Purchase'}
            {modalType === 'buyQuotaGuide' && 'Guide: How to Buy Quota'}
            {modalType === 'bindUpiGuide' && 'Guide: How to Bind UPI'}
            {modalType === 'inviteRewards' && 'Invite Rewards & Commissions'}
            {(modalType === 'contact' || modalType === 'contactUs') && 'Contact Us'}
            {modalType === 'menuOption' && modalData}
          </h3>
          <button
            onClick={closeModal}
            style={{
              background: '#f3f4f6',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={18} color="#6b7280" />
          </button>
        </div>

        {/* Modal Contents based on type */}
        {modalType === 'topup' && (
          <form onSubmit={handleTopup}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '6px' }}>
                Select Amount (INR)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
                {['500', '1000', '5000', '10000', '20000', '30000'].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTopupAmount(amt)}
                    style={{
                      padding: '10px',
                      borderRadius: '10px',
                      border: topupAmount === amt ? '2px solid #000' : '1px solid #e5e7eb',
                      background: topupAmount === amt ? '#000' : '#fff',
                      color: topupAmount === amt ? '#fff' : '#111',
                      fontWeight: '800',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    ₹{Number(amt).toLocaleString('en-IN')}
                  </button>
                ))}
              </div>

              <input
                type="number"
                placeholder="Or enter custom amount"
                value={topupAmount}
                onChange={(e) => setTopupAmount(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid #d1d5db',
                  fontSize: '16px',
                  fontWeight: '700'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '6px' }}>
                Payment Method
              </label>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                {['UPI', 'USDT'].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPayMethod(method)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '10px',
                      border: payMethod === method ? '2px solid #000' : '1px solid #e5e7eb',
                      background: payMethod === method ? '#f4f4f5' : '#fff',
                      fontWeight: '800',
                      color: '#000',
                      cursor: 'pointer'
                    }}
                  >
                    {method}
                  </button>
                ))}
              </div>

              {payMethod === 'UPI' && (
                <div style={{
                  background: '#f8fafc',
                  borderRadius: '12px',
                  padding: '12px',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  marginBottom: '16px'
                }}>
                  <img
                    src="/paytm_qr_code.png"
                    alt="Paytm QR Code"
                    style={{
                      width: '190px',
                      height: '190px',
                      display: 'block'
                    }}
                  />

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#ffffff',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    marginTop: '10px',
                    width: '100%',
                    maxWidth: '240px',
                    border: '1px solid #e2e8f0',
                    boxSizing: 'border-box'
                  }}>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', fontFamily: 'monospace' }}>
                      {upiId}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyTopupUpi}
                      style={{
                        background: topupCopied ? '#059669' : '#0f172a',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '5px 10px',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {topupCopied ? <Check size={12} /> : <Copy size={12} />}
                      {topupCopied ? 'Copied' : 'Copy'}
                    </button>
                  </div>

                  <div style={{ width: '100%', marginTop: '12px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                      12-digit UTR / Reference No.
                    </label>
                    <input
                      type="text"
                      placeholder="Enter 12-digit UTR from payment app"
                      value={topupUtr}
                      onChange={(e) => setTopupUtr(e.target.value)}
                      maxLength={16}
                      required
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        fontWeight: '600',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn-black btn-black-lg"
              disabled={submittingTopup}
              style={{ fontWeight: '800' }}
            >
              {submittingTopup ? 'Submitting...' : `Confirm Top up ₹${topupAmount}`}
            </button>
          </form>
        )}

        {modalType === 'addUpi' && (
          <form onSubmit={handleAddAccount}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '4px' }}>
                Provider Type
              </label>
              <select
                value={newProvider}
                onChange={(e) => setNewProvider(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                <option value="paytm">Paytm</option>
                <option value="paytm-business">Paytm for Business</option>
                <option value="phonepe">PhonePe</option>
                <option value="gpay">Google Pay</option>
              </select>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '4px' }}>
                Phone Number
              </label>
              <input
                type="text"
                placeholder="e.g. 9876543210"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '4px' }}>
                VPA / UPI ID
              </label>
              <input
                type="text"
                placeholder="e.g. user@paytm"
                value={newVpa}
                onChange={(e) => setNewVpa(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px'
                }}
              />
            </div>

            <button type="submit" className="btn-black btn-black-lg">
              Save Account
            </button>
          </form>
        )}

        {modalType === 'spin' && (
          <div style={{ textAlign: 'center', padding: '4px 0 16px 0' }}>
            {/* Perks Cards Bar */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              marginBottom: '16px'
            }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px 4px', textAlign: 'center' }}>
                <span style={{ fontSize: '14px', display: 'block' }}>🎯</span>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#0f172a' }}>100% Win</span>
                <span style={{ fontSize: '9px', color: '#64748b', display: 'block' }}>Guaranteed</span>
              </div>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px 4px', textAlign: 'center' }}>
                <span style={{ fontSize: '14px', display: 'block' }}>🎁</span>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#0f172a' }}>Up to ₹2,000</span>
                <span style={{ fontSize: '9px', color: '#64748b', display: 'block' }}>Cash reward</span>
              </div>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px 4px', textAlign: 'center' }}>
                <span style={{ fontSize: '14px', display: 'block' }}>⚡</span>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#0f172a' }}>Auto Credit</span>
                <span style={{ fontSize: '9px', color: '#64748b', display: 'block' }}>Instant balance</span>
              </div>
            </div>

            {/* Wheel Container */}
            <div style={{ position: 'relative', width: '230px', height: '230px', margin: '0 auto 18px auto' }}>
              {/* Outer Pointer at Top */}
              <div style={{
                position: 'absolute',
                top: '-14px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '13px solid transparent',
                borderRight: '13px solid transparent',
                borderTop: '20px solid #ef4444',
                filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.4))',
                zIndex: 20
              }} />

              {/* Rotating Wheel Container */}
              <div style={{
                width: '230px',
                height: '230px',
                borderRadius: '50%',
                overflow: 'hidden',
                boxShadow: '0 0 25px rgba(251, 191, 36, 0.45)',
                border: '6px solid #fbbf24',
                boxSizing: 'border-box',
                transform: `rotate(${wheelDegree}deg)`,
                transition: spinning ? 'transform 3.2s cubic-bezier(0.15, 0.9, 0.25, 1)' : 'none'
              }}>
                <svg width="218" height="218" viewBox="0 0 220 220" style={{ display: 'block' }}>
                  {wheelPrizes.map((p, i) => (
                    <g key={i} transform={`rotate(${i * 60}, 110, 110)`}>
                      <path
                        d="M 110 110 L 110 0 A 110 110 0 0 1 205.26 55 Z"
                        fill={p.color}
                        stroke="#ffffff"
                        strokeWidth="2"
                      />
                      <g transform="rotate(30, 110, 110)">
                        <text
                          x="110"
                          y="42"
                          textAnchor="middle"
                          fill="#ffffff"
                          fontWeight="800"
                          fontSize="14px"
                          style={{ textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}
                        >
                          {p.label}
                        </text>
                      </g>
                    </g>
                  ))}

                  {/* Center Hub */}
                  <circle cx="110" cy="110" r="28" fill="#ffffff" stroke="#fbbf24" strokeWidth="4" />
                  <text
                    x="110"
                    y="116"
                    textAnchor="middle"
                    fill="#0f172a"
                    fontWeight="900"
                    fontSize="18px"
                  >
                    ₹
                  </text>
                </svg>
              </div>
            </div>

            {/* Prize Announcement if won */}
            {wonPrize && (
              <div style={{
                marginBottom: '14px',
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                padding: '8px 16px',
                borderRadius: '10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: '#065f46',
                fontWeight: '700',
                fontSize: '13px'
              }}>
                <Sparkles size={16} color="#059669" />
                <span>Won ₹{wonPrize} INR! Credited to balance</span>
              </div>
            )}

            {/* Action Buttons & Qualification State */}
            {Number(stats?.balance || 0) >= 5000 ? (
              <div>
                <div style={{
                  marginBottom: '12px',
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  color: '#065f46',
                  fontWeight: '700'
                }}>
                  <CheckCircle2 size={13} color="#059669" />
                  <span>Qualified to Spin • Balance: ₹{Number(stats?.balance || 0).toFixed(2)}</span>
                </div>

                <button
                  className="btn-black btn-black-lg"
                  onClick={handleSpin}
                  disabled={spinning}
                  style={{
                    background: spinning ? '#94a3b8' : '#ef4444',
                    color: '#ffffff',
                    fontWeight: '800',
                    fontSize: '16px',
                    width: '100%',
                    borderRadius: '10px',
                    boxShadow: spinning ? 'none' : '0 4px 14px rgba(239, 68, 68, 0.4)',
                    cursor: spinning ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {spinning ? 'Spinning Wheel... 🍀' : wonPrize ? 'SPIN AGAIN!' : 'SPIN NOW!'}
                </button>
              </div>
            ) : (
              <div>
                <div style={{
                  marginBottom: '14px',
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  textAlign: 'left'
                }}>
                  <ShieldAlert size={20} color="#d97706" style={{ flexShrink: 0 }} />
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#92400e', display: 'block' }}>
                      Min. Balance ₹5,000 to Spin
                    </span>
                    <span style={{ fontSize: '11px', color: '#b45309' }}>
                      Current balance: <strong>₹{Number(stats?.balance || 0).toFixed(2)}</strong> (Need ₹{(5000 - Number(stats?.balance || 0)).toFixed(0)} more)
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-black btn-black-lg"
                  onClick={() => {
                    closeModal();
                    if (openModal) openModal('topup');
                  }}
                  style={{
                    fontWeight: '800',
                    width: '100%',
                    borderRadius: '10px',
                    fontSize: '14px'
                  }}
                >
                  Top up to Unlock Spin (₹{(5000 - Number(stats?.balance || 0)).toFixed(0)} more)
                </button>
              </div>
            )}
          </div>
        )}

        {modalType === 'tutorial' && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{
              width: '100%',
              height: '180px',
              background: '#1e293b',
              borderRadius: '16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              marginBottom: '16px'
            }}>
              <Play size={48} color="#38bdf8" />
              <p style={{ marginTop: '10px', fontWeight: '700' }}>Video Guide for {modalData}</p>
            </div>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>
              Follow these simple steps to link your {modalData} account to receive automatic transfers.
            </p>
            <button className="btn-black btn-black-lg" onClick={closeModal}>
              Got it!
            </button>
          </div>
        )}

        {modalType === 'buyQuota' && modalData && (
          <div>
            <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
              <h4 style={{ fontSize: '20px', fontWeight: '800', color: '#000', marginBottom: '4px' }}>
                Amount: {modalData.amount} INR
              </h4>
              <p style={{ fontSize: '14px', color: '#6b7280', fontWeight: '600' }}>
                Estimated Income: <strong>{modalData.income} ({modalData.rate})</strong>
              </p>
              <p style={{ fontSize: '14px', color: '#00b894', fontWeight: '800', marginTop: '4px' }}>
                Quota Added: +{modalData.quota}
              </p>
            </div>
            <button
              className="btn-black btn-black-lg"
              onClick={() => {
                updateStats(prev => ({
                  ...prev,
                  balance: prev.balance + modalData.income,
                  todayReceived: prev.todayReceived + modalData.income
                }));
                showToast(`Task purchased! +₹${modalData.income} income added.`);
                try { confetti({ particleCount: 50 }); } catch (err) {}
                closeModal();
              }}
            >
              Confirm Buy
            </button>
          </div>
        )}

        {modalType === 'buyQuotaGuide' && (
          <div style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6' }}>
            <p style={{ marginBottom: '12px' }}>
              1. Select a Task package based on your target income percentage.
            </p>
            <p style={{ marginBottom: '12px' }}>
              2. Click "Buy" to lock in the Quota points (+312, +525, etc.).
            </p>
            <p style={{ marginBottom: '16px' }}>
              3. Income is instantly calculated and credited to your daily balance.
            </p>
            <button className="btn-black btn-black-lg" onClick={closeModal}>Close Guide</button>
          </div>
        )}

        {modalType === 'bindUpiGuide' && (
          <div style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6' }}>
            <p style={{ marginBottom: '12px' }}>
              1. Tap "Add new account" at the bottom of the UPI screen.
            </p>
            <p style={{ marginBottom: '12px' }}>
              2. Enter your Paytm or PhonePe mobile number and registered VPA ID.
            </p>
            <p style={{ marginBottom: '16px' }}>
              3. Toggle the "sale" switch ON to make the account available for automated transactions.
            </p>
            <button className="btn-black btn-black-lg" onClick={closeModal}>Understood</button>
          </div>
        )}

        {modalType === 'withdraw' && (
          <div>
            {/* Step 1: Input Amount & UPI (No MPIN field visible) */}
            {withdrawStep === 'input' && (
              <form onSubmit={handleInitiateWithdrawModal}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '6px' }}>
                    Withdrawal Amount (INR)
                  </label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Enter withdrawal amount"
                    min="1"
                    required
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '10px',
                      border: '1px solid #d1d5db',
                      fontSize: '15px',
                      fontWeight: '700',
                      boxSizing: 'border-box'
                    }}
                  />
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    Available balance: <strong>₹{Number(stats?.balance || 0).toFixed(2)}</strong>
                  </div>
                </div>

                <div style={{ marginBottom: '22px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '6px' }}>
                    Recipient UPI ID / VPA
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. yourname@paytm or 9876543210@upi"
                    value={withdrawUpi}
                    onChange={(e) => setWithdrawUpi(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '10px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px',
                      fontWeight: '600',
                      boxSizing: 'border-box'
                    }}
                  />
                  <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                    Payout will be transferred to this UPI address after Admin verification.
                  </span>
                </div>

                <button
                  type="submit"
                  className="btn-black btn-black-lg"
                  disabled={submittingWithdraw}
                  style={{ fontWeight: '800', borderRadius: '10px', width: '100%' }}
                >
                  {withdrawAmount ? `Withdraw ₹${withdrawAmount}` : 'Withdraw'}
                </button>
              </form>
            )}

            {/* Step 2: Pop up confirmation with Security MPIN */}
            {withdrawStep === 'confirmMpin' && (
              <form onSubmit={handleConfirmWithdrawalModal}>
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  marginBottom: '18px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Amount</span>
                    <span style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>₹{Number(withdrawAmount).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>UPI Destination</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#2563eb' }}>{withdrawUpi}</span>
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151', margin: 0 }}>
                      Enter Security MPIN
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowMpinDigits(!showMpinDigits)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {showMpinDigits ? <EyeOff size={13} /> : <Eye size={13} />}
                      {showMpinDigits ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '14px',
                      color: '#64748b'
                    }}>
                      🔒
                    </span>
                    <input
                      type={showMpinDigits ? "text" : "password"}
                      placeholder="Enter 4-digit or 6-digit MPIN"
                      value={withdrawMpin}
                      onChange={(e) => setWithdrawMpin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      autoFocus
                      required
                      style={{
                        width: '100%',
                        padding: '11px 14px 11px 36px',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        fontSize: '17px',
                        fontWeight: '800',
                        letterSpacing: withdrawMpin ? '5px' : 'normal',
                        textAlign: withdrawMpin ? 'center' : 'left',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setWithdrawStep('input')}
                    disabled={submittingWithdraw}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#475569',
                      fontSize: '14px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="btn-black"
                    disabled={submittingWithdraw || withdrawMpin.length < 4}
                    style={{
                      flex: 2,
                      padding: '12px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '800',
                      cursor: submittingWithdraw || withdrawMpin.length < 4 ? 'not-allowed' : 'pointer',
                      opacity: submittingWithdraw || withdrawMpin.length < 4 ? 0.6 : 1
                    }}
                  >
                    {submittingWithdraw ? 'Verifying...' : 'Confirm Withdrawal'}
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Pop up to Set MPIN for the first time */}
            {withdrawStep === 'setMpin' && (
              <form onSubmit={handleSetMpinAndWithdrawModal}>
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: '#eff6ff',
                    color: '#2563eb',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '10px'
                  }}>
                    <ShieldCheck size={24} />
                  </div>
                  <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
                    Set Security MPIN
                  </h4>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                    Create a secret 4 to 6-digit MPIN. Next, you will enter this MPIN to confirm your withdrawal.
                  </p>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#374151', margin: 0 }}>
                      Create MPIN (4–6 digits)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowMpinDigits(!showMpinDigits)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {showMpinDigits ? <EyeOff size={13} /> : <Eye size={13} />}
                      {showMpinDigits ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '14px',
                      color: '#64748b'
                    }}>
                      🔒
                    </span>
                    <input
                      type={showMpinDigits ? "text" : "password"}
                      placeholder="Enter 4-6 digits"
                      value={newMpin}
                      onChange={(e) => setNewMpin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      autoFocus
                      required
                      style={{
                        width: '100%',
                        padding: '11px 14px 11px 36px',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        fontSize: '16px',
                        fontWeight: '800',
                        letterSpacing: newMpin ? '5px' : 'normal',
                        textAlign: newMpin ? 'center' : 'left',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '6px' }}>
                    Confirm MPIN
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '14px',
                      color: '#64748b'
                    }}>
                      🔒
                    </span>
                    <input
                      type={showMpinDigits ? "text" : "password"}
                      placeholder="Re-enter to confirm"
                      value={confirmMpin}
                      onChange={(e) => setConfirmMpin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      required
                      style={{
                        width: '100%',
                        padding: '11px 14px 11px 36px',
                        borderRadius: '10px',
                        border: confirmMpin && newMpin && confirmMpin !== newMpin ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                        fontSize: '16px',
                        fontWeight: '800',
                        letterSpacing: confirmMpin ? '5px' : 'normal',
                        textAlign: confirmMpin ? 'center' : 'left',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  {confirmMpin && newMpin && confirmMpin !== newMpin && (
                    <span style={{ fontSize: '11px', color: '#ef4444', display: 'block', marginTop: '4px', fontWeight: '600' }}>
                      MPIN entries do not match
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setWithdrawStep('input')}
                    disabled={submittingMpin}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#475569',
                      fontSize: '14px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="btn-black"
                    disabled={submittingMpin || newMpin.length < 4 || newMpin !== confirmMpin}
                    style={{
                      flex: 2,
                      padding: '12px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '800',
                      cursor: submittingMpin || newMpin.length < 4 || newMpin !== confirmMpin ? 'not-allowed' : 'pointer',
                      opacity: submittingMpin || newMpin.length < 4 || newMpin !== confirmMpin ? 0.6 : 1
                    }}
                  >
                    {submittingMpin ? 'Saving MPIN...' : 'Save Security MPIN'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {modalType === 'setMpin' && (
          <form onSubmit={handleSaveMpin}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#eff6ff',
                color: '#2563eb',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px'
              }}>
                <ShieldCheck size={28} />
              </div>
              <h4 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
                {stats?.hasMpin ? 'Update Security MPIN' : 'Set Your Security MPIN'}
              </h4>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                Set a secret 4 to 6-digit MPIN. You will be asked to enter this MPIN whenever requesting a withdrawal.
              </p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151', margin: 0 }}>
                  Enter New MPIN (4–6 digits)
                </label>
                <button
                  type="button"
                  onClick={() => setShowMpinDigits(!showMpinDigits)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {showMpinDigits ? <EyeOff size={13} /> : <Eye size={13} />}
                  {showMpinDigits ? 'Hide' : 'Show'}
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '14px',
                  color: '#64748b'
                }}>
                  🔒
                </span>
                <input
                  type={showMpinDigits ? "text" : "password"}
                  placeholder="e.g. 5821"
                  value={newMpin}
                  onChange={(e) => setNewMpin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  required
                  style={{
                    width: '100%',
                    padding: '11px 14px 11px 36px',
                    borderRadius: '10px',
                    border: '1px solid #d1d5db',
                    fontSize: '16px',
                    fontWeight: '800',
                    letterSpacing: newMpin ? '6px' : 'normal',
                    textAlign: newMpin ? 'center' : 'left',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '6px' }}>
                Confirm New MPIN
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '14px',
                  color: '#64748b'
                }}>
                  🔒
                </span>
                <input
                  type={showMpinDigits ? "text" : "password"}
                  placeholder="Re-enter MPIN to confirm"
                  value={confirmMpin}
                  onChange={(e) => setConfirmMpin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  required
                  style={{
                    width: '100%',
                    padding: '11px 14px 11px 36px',
                    borderRadius: '10px',
                    border: confirmMpin && newMpin && confirmMpin !== newMpin ? '1.5px solid #ef4444' : '1px solid #d1d5db',
                    fontSize: '16px',
                    fontWeight: '800',
                    letterSpacing: confirmMpin ? '6px' : 'normal',
                    textAlign: confirmMpin ? 'center' : 'left',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              {confirmMpin && newMpin && confirmMpin !== newMpin && (
                <span style={{ fontSize: '11px', color: '#ef4444', display: 'block', marginTop: '4px', fontWeight: '600' }}>
                  MPIN entries do not match
                </span>
              )}
            </div>

            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '10px 12px',
              marginBottom: '20px',
              fontSize: '12px',
              color: '#64748b',
              lineHeight: '1.4'
            }}>
              💡 Keep your MPIN confidential. Whenever you request a withdrawal, you will be prompted to enter this exact MPIN.
            </div>

            <button
              type="submit"
              className="btn-black btn-black-lg"
              disabled={submittingMpin || !newMpin || newMpin.length < 4 || newMpin !== confirmMpin}
              style={{
                fontWeight: '800',
                borderRadius: '10px',
                width: '100%',
                opacity: submittingMpin || !newMpin || newMpin.length < 4 || newMpin !== confirmMpin ? 0.6 : 1
              }}
            >
              {submittingMpin ? 'Saving MPIN...' : stats?.hasMpin ? 'Update MPIN' : 'Save Security MPIN'}
            </button>
          </form>
        )}

        {(modalType === 'rechargeHistory' || modalType === 'recharge') && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>
                Completed & Verified Deposits
              </span>
              <button
                onClick={fetchTokenTxs}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}
              >
                <RefreshCw size={12} className={loadingTokenTxs ? 'spin-anim' : ''} />
                Sync
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '360px', overflowY: 'auto' }}>
              {tokenTxs.filter(tx => (tx.type === 'topup' || tx.type === 'buy_quota') && tx.status === 'approved').length === 0 ? (
                <div style={{ padding: '36px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                  No successful deposits recorded yet.
                </div>
              ) : (
                tokenTxs
                  .filter(tx => (tx.type === 'topup' || tx.type === 'buy_quota') && tx.status === 'approved')
                  .map(tx => (
                    <div
                      key={tx._id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 14px',
                        borderRadius: '12px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: '#ecfdf5',
                          color: '#059669',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <ArrowDownLeft size={18} />
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '15px', fontWeight: '800', color: '#059669' }}>
                              +₹{tx.amount}
                            </span>
                            <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>
                              INR
                            </span>
                          </div>

                          <span style={{ fontSize: '11px', color: '#475569', display: 'block', fontWeight: '500' }}>
                            {tx.utr ? `UTR: ${tx.utr}` : tx.description || 'UPI Deposit'}
                          </span>

                          <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                            {new Date(tx.approvedAt || tx.createdAt).toLocaleString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>

                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: '#d1fae5',
                        color: '#047857',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '700'
                      }}>
                        <CheckCircle2 size={12} /> Success
                      </span>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

        {(modalType === 'tokenHistory' || modalType === 'token') && (
          <div>
            {/* Filter buttons */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', alignItems: 'center' }}>
              {[
                { id: 'all', label: 'All' },
                { id: 'topup', label: 'Deposits' },
                { id: 'withdrawal', label: 'Withdrawals' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setTxFilter(f.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    border: txFilter === f.id ? '1px solid #0f172a' : '1px solid #e2e8f0',
                    background: txFilter === f.id ? '#0f172a' : '#f8fafc',
                    color: txFilter === f.id ? '#ffffff' : '#64748b',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  {f.label}
                </button>
              ))}

              <button
                onClick={fetchTokenTxs}
                style={{
                  marginLeft: 'auto',
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}
              >
                <RefreshCw size={12} className={loadingTokenTxs ? 'spin-anim' : ''} />
                Sync
              </button>
            </div>

            {/* List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '340px', overflowY: 'auto' }}>
              {tokenTxs
                .filter(tx => {
                  if (txFilter === 'all') return true;
                  if (txFilter === 'topup') return tx.type === 'topup' || tx.type === 'buy_quota';
                  if (txFilter === 'withdrawal') return tx.type === 'withdrawal';
                  return true;
                })
                .length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                  No {txFilter === 'all' ? 'transaction' : txFilter} requests found.
                </div>
              ) : (
                tokenTxs
                  .filter(tx => {
                    if (txFilter === 'all') return true;
                    if (txFilter === 'topup') return tx.type === 'topup' || tx.type === 'buy_quota';
                    if (txFilter === 'withdrawal') return tx.type === 'withdrawal';
                    return true;
                  })
                  .map(tx => {
                    const isDeposit = tx.type === 'topup' || tx.type === 'buy_quota';
                    const isPending = tx.status === 'pending';
                    const isApproved = tx.status === 'approved';

                    return (
                      <div
                        key={tx._id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px 14px',
                          borderRadius: '12px',
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            background: isDeposit ? '#ecfdf5' : '#f5f3ff',
                            color: isDeposit ? '#059669' : '#7c3aed',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {isDeposit ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                          </div>

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>
                                {isDeposit ? 'Deposit' : 'Withdrawal'}
                              </span>
                              <span style={{ fontSize: '14px', fontWeight: '800', color: isDeposit ? '#059669' : '#0f172a' }}>
                                ₹{tx.amount}
                              </span>
                            </div>

                            <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>
                              {tx.utr ? `UTR: ${tx.utr}` : tx.upiId ? `To: ${tx.upiId}` : tx.description || 'Request'}
                            </span>

                            <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                              {new Date(tx.createdAt).toLocaleString('en-IN', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {isPending && (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: '#fef3c7',
                              color: '#b45309',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '700'
                            }}>
                              <Clock size={11} /> Pending
                            </span>
                          )}
                          {isApproved && (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: '#d1fae5',
                              color: '#047857',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '700'
                            }}>
                              <CheckCircle2 size={11} /> Success
                            </span>
                          )}
                          {(tx.status === 'rejected' || tx.status === 'failed') && (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: '#fee2e2',
                              color: '#b91c1c',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '700'
                            }}>
                              <XCircle size={11} /> Failed
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        )}

        {modalType === 'inviteRewards' && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#000', marginBottom: '8px' }}>
              Invite User Rewards
            </h4>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>
              Earn team commissions from invited users. Check the Team tab to view your invite code and team details.
            </p>
            <button className="btn-black btn-black-lg" onClick={closeModal}>
              Understood
            </button>
          </div>
        )}

        {(modalType === 'contact' || modalType === 'contactUs') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '4px 0 10px 0' }}>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 2px 0', lineHeight: '1.4' }}>
              Connect with our official FlashPay community and customer support channels on Telegram:
            </p>

            {/* Official Channel Card */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: '#229ED9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Send size={18} color="#ffffff" style={{ marginLeft: '-2px' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', marginBottom: '2px' }}>
                    Official Telegram Channel
                  </div>
                  <a
                    href="https://t.me/Flashpayofficiall"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '12px', color: '#0284c7', fontWeight: '600', textDecoration: 'none', wordBreak: 'break-all' }}
                  >
                    https://t.me/Flashpayofficiall
                  </a>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <a
                  href="https://t.me/Flashpayofficiall"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-black"
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    textDecoration: 'none',
                    padding: '9px 12px',
                    fontSize: '12px',
                    fontWeight: '700',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <ExternalLink size={13} />
                  Join Channel
                </a>
                <button
                  type="button"
                  onClick={() => handleCopyContact('https://t.me/Flashpayofficiall', 'channel')}
                  style={{
                    padding: '9px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#0f172a',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {copiedContact === 'channel' ? <Check size={13} color="#059669" /> : <Copy size={13} />}
                  {copiedContact === 'channel' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Official Support Card */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Send size={18} color="#ffffff" style={{ marginLeft: '-2px' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', marginBottom: '2px' }}>
                    Customer Support 24/7
                  </div>
                  <a
                    href="https://t.me/Flashpayindia"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '13px', color: '#0284c7', fontWeight: '700', textDecoration: 'none' }}
                  >
                    @Flashpayindia
                  </a>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <a
                  href="https://t.me/Flashpayindia"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-black"
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    textDecoration: 'none',
                    padding: '9px 12px',
                    fontSize: '12px',
                    fontWeight: '700',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <ExternalLink size={13} />
                  Chat @Flashpayindia
                </a>
                <button
                  type="button"
                  onClick={() => handleCopyContact('@Flashpayindia', 'support')}
                  style={{
                    padding: '9px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#0f172a',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {copiedContact === 'support' ? <Check size={13} color="#059669" /> : <Copy size={13} />}
                  {copiedContact === 'support' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <button
              className="btn-black btn-black-lg"
              onClick={closeModal}
              style={{ marginTop: '6px', borderRadius: '10px' }}
            >
              Close
            </button>
          </div>
        )}

        {modalType === 'menuOption' && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <p style={{ fontSize: '15px', color: '#4b5563', marginBottom: '20px' }}>
              Viewing detail page for <strong>{modalData}</strong>.
            </p>
            <button className="btn-black btn-black-lg" onClick={closeModal}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
