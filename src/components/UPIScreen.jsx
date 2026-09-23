import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, XCircle, RefreshCw, ShieldCheck, Lock, Eye, EyeOff, X } from 'lucide-react';

export default function UPIScreen({ stats = {}, currentUser, showToast, updateStats, openModal }) {
  const [payoutMethod, setPayoutMethod] = useState('UPI'); // 'UPI' | 'Bank'
  const [amount, setAmount] = useState('');

  // UPI Field
  const [upiId, setUpiId] = useState('');

  // Bank Fields
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [holderName, setHolderName] = useState('');

  // Popup States for MPIN at withdrawal request time
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [showSetMpinPopup, setShowSetMpinPopup] = useState(false);
  const [confirmMpinInput, setConfirmMpinInput] = useState('');
  const [newMpinInput, setNewMpinInput] = useState('');
  const [confirmNewMpinInput, setConfirmNewMpinInput] = useState('');
  const [showPinDigits, setShowPinDigits] = useState(false);

  // Submission & Requests State
  const [submitting, setSubmitting] = useState(false);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loadingTxs, setLoadingTxs] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'pending' | 'success' | 'failed'

  const userId = currentUser?.userId || stats?.userId || '1000656';
  const availableBalance = Number(stats?.balance || 0);

  // Fetch all withdrawal requests for this user
  const fetchWithdrawals = async () => {
    try {
      setLoadingTxs(true);
      const res = await fetch(`http://localhost:5000/api/user/transactions?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        const userWithdrawals = data.filter(tx => tx.type === 'withdrawal');
        setWithdrawals(userWithdrawals);
      }
    } catch (err) {
      console.log('Error loading withdrawals:', err);
    } finally {
      setLoadingTxs(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
    const interval = setInterval(fetchWithdrawals, 2500);
    return () => clearInterval(interval);
  }, [userId]);

  // Initiate withdrawal: validates form inputs & triggers the appropriate MPIN popup
  const handleInitiateWithdraw = (e) => {
    e.preventDefault();
    const withdrawAmt = Number(amount);

    if (!withdrawAmt || withdrawAmt <= 0) {
      if (showToast) showToast('Please enter a valid amount');
      return;
    }

    if (withdrawAmt < 2000) {
      if (showToast) showToast('Minimum withdrawal amount is ₹2,000');
      return;
    }

    if (withdrawAmt > availableBalance) {
      if (showToast) showToast(`Insufficient balance! Available: ₹${availableBalance.toFixed(2)}`);
      return;
    }

    if (payoutMethod === 'UPI') {
      if (!upiId || upiId.trim().length < 4 || !upiId.includes('@')) {
        if (showToast) showToast('Please enter a valid UPI ID (e.g. mobile@upi)');
        return;
      }
    } else {
      if (!holderName || holderName.trim().length < 2) {
        if (showToast) showToast('Please enter account holder name');
        return;
      }
      if (!accountNumber || accountNumber.trim().length < 8) {
        if (showToast) showToast('Please enter a valid bank account number');
        return;
      }
      if (!ifsc || ifsc.trim().length < 6) {
        if (showToast) showToast('Please enter a valid IFSC code');
        return;
      }
    }

    // MPIN is prompted only at request time:
    if (!stats?.hasMpin) {
      // Pop up to set MPIN for the first time
      setNewMpinInput('');
      setConfirmNewMpinInput('');
      setShowPinDigits(false);
      setShowSetMpinPopup(true);
    } else {
      // Pop up to confirm with existing MPIN
      setConfirmMpinInput('');
      setShowPinDigits(false);
      setShowConfirmPopup(true);
    }
  };

  // Called from Confirm MPIN popup
  const handleConfirmWithdrawal = async (e) => {
    e.preventDefault();
    const pin = confirmMpinInput.trim();
    if (!pin || pin.length < 4) {
      if (showToast) showToast('Please enter your 4-digit or 6-digit MPIN');
      return;
    }

    const withdrawAmt = Number(amount);
    setSubmitting(true);

    try {
      const payload = {
        userId,
        amount: withdrawAmt,
        method: payoutMethod,
        mpin: pin,
        upiId: payoutMethod === 'UPI' ? upiId.trim() : undefined,
        bankDetails: payoutMethod === 'Bank' ? {
          accountNumber: accountNumber.trim(),
          ifsc: ifsc.trim().toUpperCase(),
          holderName: holderName.trim()
        } : undefined
      };

      const res = await fetch('http://localhost:5000/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      setSubmitting(false);

      if (res.ok) {
        if (showToast) showToast(`Withdrawal of ₹${withdrawAmt} submitted! Pending Admin approval.`);
        if (updateStats) {
          updateStats(prev => ({
            ...prev,
            balance: Math.max(0, prev.balance - withdrawAmt)
          }));
        }
        setShowConfirmPopup(false);
        setConfirmMpinInput('');
        setAmount('');
        fetchWithdrawals();
      } else {
        if (data.needsMpinSetup) {
          if (showToast) showToast(data.error || 'Please set your Security MPIN first');
          setShowConfirmPopup(false);
          setShowSetMpinPopup(true);
          return;
        }
        if (showToast) showToast(data.error || 'Incorrect MPIN. Please try again.');
      }
    } catch (err) {
      setSubmitting(false);
      if (showToast) showToast('Withdrawal submitted. Pending Admin approval.');
      if (updateStats) {
        updateStats(prev => ({ ...prev, balance: Math.max(0, prev.balance - withdrawAmt) }));
      }
      setShowConfirmPopup(false);
      setConfirmMpinInput('');
      setAmount('');
      fetchWithdrawals();
    }
  };

  // Called from Set MPIN popup (only saves MPIN, then opens Confirm popup - NO auto submit)
  const handleSetMpinOnly = async (e) => {
    e.preventDefault();
    const pin = newMpinInput.trim();
    const confirm = confirmNewMpinInput.trim();

    if (!pin || pin.length < 4) {
      if (showToast) showToast('MPIN must be 4 to 6 digits');
      return;
    }
    if (pin !== confirm) {
      if (showToast) showToast('MPIN and Confirm MPIN do not match!');
      return;
    }

    setSubmitting(true);
    try {
      const setRes = await fetch('http://localhost:5000/api/user/set-mpin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, mpin: pin })
      });
      const setData = await setRes.json();
      setSubmitting(false);

      if (!setRes.ok) {
        if (showToast) showToast(setData.error || 'Failed to set MPIN');
        return;
      }

      if (updateStats) {
        updateStats(prev => ({ ...prev, hasMpin: true }));
      }

      if (showToast) showToast('Security MPIN set! Please enter your MPIN to confirm withdrawal.');

      // Close Set MPIN popup and transition to Confirm MPIN popup (do NOT auto-submit!)
      setShowSetMpinPopup(false);
      setNewMpinInput('');
      setConfirmNewMpinInput('');
      setConfirmMpinInput('');
      setShowPinDigits(false);
      setShowConfirmPopup(true);
    } catch (err) {
      setSubmitting(false);
      if (showToast) showToast('Failed to save MPIN. Please try again.');
    }
  };

  // Counts for filter pills
  const pendingCount = withdrawals.filter(tx => tx.status === 'pending').length;
  const successCount = withdrawals.filter(tx => tx.status === 'approved' || tx.status === 'success').length;
  const failedCount = withdrawals.filter(tx => tx.status === 'rejected' || tx.status === 'failed').length;

  const filteredWithdrawals = withdrawals.filter(tx => {
    if (filter === 'pending') return tx.status === 'pending';
    if (filter === 'success') return tx.status === 'approved' || tx.status === 'success';
    if (filter === 'failed') return tx.status === 'rejected' || tx.status === 'failed';
    return true;
  });

  return (
    <div style={{ maxWidth: '440px', margin: '0 auto', paddingTop: '4px', paddingBottom: '20px' }}>
      {/* Title & Available Quota */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
          Withdraw
        </h1>
        <div style={{ fontSize: '13px', color: '#64748b' }}>
          Available: <strong style={{ color: '#0f172a', fontSize: '15px' }}>₹{availableBalance.toFixed(2)}</strong>
        </div>
      </div>

      {/* Minimal Segmented Toggle */}
      <div style={{
        display: 'flex',
        background: '#f1f5f9',
        padding: '3px',
        borderRadius: '10px',
        marginBottom: '18px'
      }}>
        <button
          type="button"
          onClick={() => setPayoutMethod('UPI')}
          style={{
            flex: 1,
            padding: '9px 0',
            borderRadius: '8px',
            border: 'none',
            background: payoutMethod === 'UPI' ? '#ffffff' : 'transparent',
            color: payoutMethod === 'UPI' ? '#0f172a' : '#64748b',
            fontWeight: payoutMethod === 'UPI' ? '700' : '500',
            fontSize: '13px',
            cursor: 'pointer',
            boxShadow: payoutMethod === 'UPI' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          UPI
        </button>
        <button
          type="button"
          onClick={() => setPayoutMethod('Bank')}
          style={{
            flex: 1,
            padding: '9px 0',
            borderRadius: '8px',
            border: 'none',
            background: payoutMethod === 'Bank' ? '#ffffff' : 'transparent',
            color: payoutMethod === 'Bank' ? '#0f172a' : '#64748b',
            fontWeight: payoutMethod === 'Bank' ? '700' : '500',
            fontSize: '13px',
            cursor: 'pointer',
            boxShadow: payoutMethod === 'Bank' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          Bank Transfer
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleInitiateWithdraw}>
        {payoutMethod === 'UPI' ? (
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '5px' }}>
              UPI ID
            </label>
            <input
              type="text"
              placeholder="e.g. mobile@upi or name@paytm"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '11px 12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '14px',
                fontWeight: '500',
                boxSizing: 'border-box',
                outline: 'none',
                background: '#ffffff'
              }}
            />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '5px' }}>
                Account Holder Name
              </label>
              <input
                type="text"
                placeholder="Full name as per bank"
                value={holderName}
                onChange={(e) => setHolderName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '11px 12px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  background: '#ffffff'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '5px' }}>
                Account Number
              </label>
              <input
                type="text"
                placeholder="Bank account number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '11px 12px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  background: '#ffffff'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '5px' }}>
                IFSC Code
              </label>
              <input
                type="text"
                placeholder="e.g. SBIN0001234"
                value={ifsc}
                onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                maxLength={11}
                required
                style={{
                  width: '100%',
                  padding: '11px 12px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '14px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  boxSizing: 'border-box',
                  outline: 'none',
                  background: '#ffffff'
                }}
              />
            </div>
          </div>
        )}

        {/* Amount Field with MAX button */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '5px' }}>
            Amount (₹)
          </label>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '15px',
              fontWeight: '700',
              color: '#64748b'
            }}>
              ₹
            </span>
            <input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              required
              style={{
                width: '100%',
                padding: '11px 58px 11px 28px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '15px',
                fontWeight: '700',
                boxSizing: 'border-box',
                outline: 'none',
                background: '#ffffff'
              }}
            />
            <button
              type="button"
              onClick={() => setAmount(Math.floor(availableBalance).toString())}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '11px',
                fontWeight: '700',
                color: '#0f172a',
                cursor: 'pointer'
              }}
            >
              MAX
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting || !amount || Number(amount) <= 0}
          style={{
            width: '100%',
            padding: '13px',
            borderRadius: '8px',
            border: 'none',
            background: '#000000',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: '700',
            cursor: submitting || !amount || Number(amount) <= 0 ? 'not-allowed' : 'pointer',
            opacity: submitting || !amount || Number(amount) <= 0 ? 0.5 : 1,
            transition: 'opacity 0.15s ease'
          }}
        >
          {submitting ? 'Processing...' : Number(amount) > 0 ? `Withdraw ₹${amount}` : 'Withdraw'}
        </button>
      </form>

      {/* 1. Confirm MPIN Popup Modal (Appears only at withdrawal request time) */}
      {showConfirmPopup && (
        <div className="modal-overlay" onClick={() => !submitting && setShowConfirmPopup(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#eff6ff',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ShieldCheck size={18} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Confirm Withdrawal
                </h3>
              </div>
              <button
                type="button"
                onClick={() => !submitting && setShowConfirmPopup(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={16} color="#64748b" />
              </button>
            </div>

            {/* Transaction Summary Card */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '14px 16px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Amount to Withdraw</span>
                <span style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>₹{Number(amount).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Payout To</span>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#2563eb' }}>
                  {payoutMethod === 'UPI' ? upiId : `${holderName} (A/C: ${accountNumber})`}
                </span>
              </div>
            </div>

            <form onSubmit={handleConfirmWithdrawal}>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#374151', margin: 0 }}>
                    Enter Security MPIN
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPinDigits(!showPinDigits)}
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
                    {showPinDigits ? <EyeOff size={13} /> : <Eye size={13} />}
                    {showPinDigits ? 'Hide' : 'Show'}
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
                    type={showPinDigits ? "text" : "password"}
                    placeholder="Enter your MPIN"
                    value={confirmMpinInput}
                    onChange={(e) => setConfirmMpinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    autoFocus
                    required
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 36px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '18px',
                      fontWeight: '800',
                      letterSpacing: confirmMpinInput ? '6px' : 'normal',
                      textAlign: confirmMpinInput ? 'center' : 'left',
                      boxSizing: 'border-box',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowConfirmPopup(false)}
                  disabled={submitting}
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
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || confirmMpinInput.length < 4}
                  style={{
                    flex: 2,
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#000000',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '800',
                    cursor: submitting || confirmMpinInput.length < 4 ? 'not-allowed' : 'pointer',
                    opacity: submitting || confirmMpinInput.length < 4 ? 0.6 : 1
                  }}
                >
                  {submitting ? 'Verifying...' : 'Confirm Withdrawal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Set MPIN Popup Modal (Appears when user wants to withdraw and has not set an MPIN yet) */}
      {showSetMpinPopup && (
        <div className="modal-overlay" onClick={() => !submitting && setShowSetMpinPopup(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#eff6ff',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ShieldCheck size={18} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Set Security MPIN
                </h3>
              </div>
              <button
                type="button"
                onClick={() => !submitting && setShowSetMpinPopup(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={16} color="#64748b" />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px', lineHeight: '1.4' }}>
              Create a secret 4 to 6-digit MPIN. Next, you will enter this MPIN to confirm your withdrawal.
            </p>

            <form onSubmit={handleSetMpinOnly}>
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#374151', margin: 0 }}>
                    Create MPIN (4–6 digits)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPinDigits(!showPinDigits)}
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
                    {showPinDigits ? <EyeOff size={13} /> : <Eye size={13} />}
                    {showPinDigits ? 'Hide' : 'Show'}
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
                    type={showPinDigits ? "text" : "password"}
                    placeholder="Enter 4-6 digits"
                    value={newMpinInput}
                    onChange={(e) => setNewMpinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
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
                      letterSpacing: newMpinInput ? '6px' : 'normal',
                      textAlign: newMpinInput ? 'center' : 'left',
                      boxSizing: 'border-box',
                      outline: 'none'
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
                    type={showPinDigits ? "text" : "password"}
                    placeholder="Re-enter to confirm"
                    value={confirmNewMpinInput}
                    onChange={(e) => setConfirmNewMpinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    required
                    style={{
                      width: '100%',
                      padding: '11px 14px 11px 36px',
                      borderRadius: '10px',
                      border: confirmNewMpinInput && newMpinInput && confirmNewMpinInput !== newMpinInput ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                      fontSize: '16px',
                      fontWeight: '800',
                      letterSpacing: confirmNewMpinInput ? '6px' : 'normal',
                      textAlign: confirmNewMpinInput ? 'center' : 'left',
                      boxSizing: 'border-box',
                      outline: 'none'
                    }}
                  />
                </div>
                {confirmNewMpinInput && newMpinInput && confirmNewMpinInput !== newMpinInput && (
                  <span style={{ fontSize: '11px', color: '#ef4444', display: 'block', marginTop: '4px', fontWeight: '600' }}>
                    MPIN entries do not match
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting || newMpinInput.length < 4 || newMpinInput !== confirmNewMpinInput}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#000000',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '800',
                  cursor: submitting || newMpinInput.length < 4 || newMpinInput !== confirmNewMpinInput ? 'not-allowed' : 'pointer',
                  opacity: submitting || newMpinInput.length < 4 || newMpinInput !== confirmNewMpinInput ? 0.6 : 1
                }}
              >
                {submitting ? 'Saving MPIN...' : 'Save Security MPIN'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Minimal Withdrawal Requests Section */}
      <div style={{ marginTop: '28px', borderTop: '1px solid #f1f5f9', paddingTop: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: 0, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            Withdrawal Requests
          </h2>
          <button
            type="button"
            onClick={fetchWithdrawals}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <RefreshCw size={12} className={loadingTxs ? 'spin-anim' : ''} />
            Sync
          </button>
        </div>

        {/* Filter Pills: All, Pending, Success, Failed */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
          {[
            { id: 'all', label: 'All', count: withdrawals.length },
            { id: 'pending', label: 'Pending', count: pendingCount },
            { id: 'success', label: 'Success', count: successCount },
            { id: 'failed', label: 'Failed', count: failedCount }
          ].map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              style={{
                padding: '4px 10px',
                borderRadius: '16px',
                border: filter === f.id ? '1px solid #0f172a' : '1px solid #e2e8f0',
                background: filter === f.id ? '#0f172a' : '#f8fafc',
                color: filter === f.id ? '#ffffff' : '#64748b',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{f.label}</span>
              <span style={{
                fontSize: '10px',
                opacity: 0.8,
                background: filter === f.id ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
                padding: '1px 5px',
                borderRadius: '10px'
              }}>
                {f.count}
              </span>
            </button>
          ))}
        </div>

        {/* Requests List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredWithdrawals.length === 0 ? (
            <div style={{ padding: '24px 12px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
              No {filter === 'all' ? '' : filter} withdrawal requests.
            </div>
          ) : (
            filteredWithdrawals.map(tx => {
              const isPending = tx.status === 'pending';
              const isSuccess = tx.status === 'approved' || tx.status === 'success';
              const isFailed = tx.status === 'rejected' || tx.status === 'failed';
              const isBank = tx.payoutMethod === 'Bank' || (!tx.upiId && tx.bankDetails);

              return (
                <div
                  key={tx._id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '11px 13px',
                    borderRadius: '10px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
                        ₹{tx.amount}
                      </span>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: '700',
                        color: '#64748b',
                        background: '#e2e8f0',
                        padding: '1px 5px',
                        borderRadius: '4px'
                      }}>
                        {isBank ? 'BANK' : 'UPI'}
                      </span>
                    </div>

                    <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '2px' }}>
                      {tx.upiId ? tx.upiId : tx.bankDetails ? `A/C: ${tx.bankDetails.accountNumber}` : tx.description}
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

                  {/* Status Badge: Pending, Success, Failed */}
                  <div>
                    {isPending && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: '#fef3c7',
                        color: '#b45309',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '700'
                      }}>
                        <Clock size={11} /> Pending
                      </span>
                    )}
                    {isSuccess && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: '#d1fae5',
                        color: '#047857',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '700'
                      }}>
                        <CheckCircle2 size={11} /> Success
                      </span>
                    )}
                    {isFailed && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: '#fee2e2',
                        color: '#b91c1c',
                        padding: '3px 8px',
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
    </div>
  );
}
