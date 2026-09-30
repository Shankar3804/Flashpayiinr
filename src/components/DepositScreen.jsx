import React, { useState } from 'react';
import { ChevronDown, PlayCircle, Coins, Copy, Check, X, ShieldAlert, ShieldCheck, ArrowRight, AlertTriangle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { API_BASE } from '../config';

export default function DepositScreen({ openModal, onBuyQuota, showToast, currentUser }) {
  const [currency, setCurrency] = useState('INR');
  const [sortOrder, setSortOrder] = useState('low-to-high');
  const [minVal, setMinVal] = useState('');
  const [maxVal, setMaxVal] = useState('');
  const [copied, setCopied] = useState(false);

  // Active Selected Order for UPI Payment
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [utrNumber, setUtrNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedTx, setSubmittedTx] = useState(null);

  // Security & Anti-Scam Notice before Payment
  const [pendingOrder, setPendingOrder] = useState(null);

  const upiId = 'q005726489@ybl';
  const usdtAddress = 'TX5GQ3BXFvFfzfpyZP5AUBCdTqkcc57VmP';
  const [usdtCopied, setUsdtCopied] = useState(false);
  const [usdtAmount, setUsdtAmount] = useState('');
  const [usdtTxId, setUsdtTxId] = useState('');
  const [usdtSubmitting, setUsdtSubmitting] = useState(false);
  const [usdtSubmitted, setUsdtSubmitted] = useState(null);

  const generateRandomDepositItems = () => {
    const tiers = [
      { min: 500, max: 1200, count: 2 },
      { min: 1300, max: 3500, count: 2 },
      { min: 3600, max: 8000, count: 2 },
      { min: 8500, max: 15000, count: 2 },
      { min: 16000, max: 24000, count: 2 },
      { min: 25000, max: 30000, count: 2 }
    ];

    const amounts = [500];
    tiers.forEach(tier => {
      for (let i = 0; i < tier.count; i++) {
        const raw = Math.floor(Math.random() * (tier.max - tier.min + 1)) + tier.min;
        const rounded = Math.round(raw / 50) * 50;
        if (!amounts.includes(rounded) && rounded >= 500 && rounded <= 30000) {
          amounts.push(rounded);
        }
      }
    });

    if (!amounts.includes(30000)) {
      amounts.push(30000);
    }

    amounts.sort((a, b) => a - b);

    return amounts.map((amt, idx) => {
      const income = Math.round(amt * 0.08);
      return {
        id: Date.now() + idx + Math.random(),
        amount: amt,
        income,
        rate: '8%',
        quota: amt + income
      };
    });
  };

  const [items, setItems] = useState([
    { id: 1, amount: 500, income: 40, rate: '8%', quota: 540 },
    { id: 2, amount: 950, income: 76, rate: '8%', quota: 1026 },
    { id: 3, amount: 1600, income: 128, rate: '8%', quota: 1728 },
    { id: 4, amount: 3400, income: 272, rate: '8%', quota: 3672 },
    { id: 5, amount: 6200, income: 496, rate: '8%', quota: 6696 },
    { id: 6, amount: 11500, income: 920, rate: '8%', quota: 12420 },
    { id: 7, amount: 17800, income: 1424, rate: '8%', quota: 19224 },
    { id: 8, amount: 23500, income: 1880, rate: '8%', quota: 25380 },
    { id: 9, amount: 30000, income: 2400, rate: '8%', quota: 32400 },
  ]);

  const handleCopyUpi = () => {
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
    setCopied(true);
    if (showToast) showToast('UPI ID copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyUsdt = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(usdtAddress);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = usdtAddress;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    setUsdtCopied(true);
    if (showToast) showToast('USDT TRC20 Address copied!');
    setTimeout(() => setUsdtCopied(false), 2000);
  };

  const handleRefresh = () => {
    let fresh = generateRandomDepositItems();
    if (minVal) fresh = fresh.filter(i => i.amount >= Number(minVal));
    if (maxVal) fresh = fresh.filter(i => i.amount <= Number(maxVal));
    if (sortOrder === 'high-to-low') fresh.sort((a, b) => b.amount - a.amount);
    else fresh.sort((a, b) => a.amount - b.amount);
    setItems(fresh);
    if (showToast) showToast('Orders refreshed with new random amounts');
  };

  const handleOrderClick = (item) => {
    // Show official company UPI and anti-scammer security popup every time Buy is clicked
    setPendingOrder(item);
  };

  const handleAgreeAndPay = () => {
    if (!pendingOrder) return;
    setSelectedOrder(pendingOrder);
    setPendingOrder(null);
    setUtrNumber('');
    setSubmittedTx(null);
  };

  const handleCancelSecurityNotice = () => {
    setPendingOrder(null);
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!utrNumber || utrNumber.trim().length < 6) {
      if (showToast) showToast('Please enter a valid 12-digit UTR / Reference number');
      return;
    }

    const orderAmt = selectedOrder ? selectedOrder.amount : 500;
    if (orderAmt < 500) {
      if (showToast) showToast('Minimum deposit amount is ₹500');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/topup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.userId || '1000656',
          amount: Number(orderAmt),
          method: 'UPI (PhonePe)',
          utr: utrNumber.trim()
        })
      });

      const data = await res.json();
      setSubmitting(false);

      if (res.ok) {
        if (showToast) showToast('Payment submitted successfully! Pending Admin verification.');
        setSubmittedTx({ amount: orderAmt, utr: utrNumber.trim() });
      } else {
        if (showToast) showToast(data.error || 'Failed to submit payment.');
      }
    } catch (err) {
      setSubmitting(false);
      if (showToast) showToast('Payment submitted. Pending Admin approval.');
      setSubmittedTx({ amount: orderAmt, utr: utrNumber.trim() });
    }
  };

  const handleSubmitUsdt = async (e) => {
    e.preventDefault();
    if (!usdtTxId || usdtTxId.trim().length < 6) {
      if (showToast) showToast('Please enter a valid TRC20 Transaction Hash (TxID)');
      return;
    }
    const enteredUsdt = Number(usdtAmount) || 0;
    if (enteredUsdt <= 0) {
      if (showToast) showToast('Please enter a valid USDT amount');
      return;
    }

    const inrValue = Math.round(enteredUsdt * 115);
    if (inrValue < 500) {
      if (showToast) showToast('Minimum deposit amount is ₹500 (approx $4.5 USDT)');
      return;
    }

    setUsdtSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/topup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.userId || '1000656',
          amount: inrValue,
          method: 'USDT (TRC20)',
          utr: usdtTxId.trim(),
          description: `Top up $${enteredUsdt} USDT (₹${inrValue.toLocaleString('en-IN')}) via USDT TRC20 (TxID: ${usdtTxId.trim()})`
        })
      });

      const data = await res.json();
      setUsdtSubmitting(false);

      if (res.ok) {
        if (showToast) showToast('USDT Deposit submitted! Pending Admin verification.');
        setUsdtSubmitted({ amount: enteredUsdt, inr: inrValue, txId: usdtTxId.trim() });
      } else {
        if (showToast) showToast(data.error || 'Failed to submit USDT deposit.');
      }
    } catch (err) {
      setUsdtSubmitting(false);
      if (showToast) showToast('USDT Deposit submitted. Pending Admin approval.');
      setUsdtSubmitted({ amount: enteredUsdt, inr: inrValue, txId: usdtTxId.trim() });
    }
  };

  return (
    <div className="deposit-screen" style={{ paddingBottom: '30px' }}>
      {/* Top Currency Switcher */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '16px', borderBottom: '1px solid #f0f0f4', paddingBottom: '8px' }}>
        <button
          onClick={() => setCurrency('INR')}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '18px',
            fontWeight: currency === 'INR' ? '800' : '600',
            color: currency === 'INR' ? '#000' : '#9ca3af',
            cursor: 'pointer'
          }}
        >
          INR
        </button>
        <button
          onClick={() => setCurrency('USDT')}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '18px',
            fontWeight: currency === 'USDT' ? '800' : '600',
            color: currency === 'USDT' ? '#000' : '#9ca3af',
            cursor: 'pointer'
          }}
        >
          USDT
        </button>
      </div>

      {currency === 'USDT' ? (
        /* USDT Section: Native SVG QR code and address - clean, normal, no photo */
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '6px 0 24px 0',
          width: '100%'
        }}>
          {/* Main Clean Modern Card matching FlashPay app styling */}
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '24px 20px',
            width: '100%',
            maxWidth: '380px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb'
          }}>
            {/* Network & Coin Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{
                background: '#ecfdf5',
                color: '#059669',
                fontSize: '11px',
                fontWeight: '800',
                padding: '4px 10px',
                borderRadius: '20px',
                border: '1px solid #a7f3d0'
              }}>
                USDT • TRC20
              </span>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748b' }}>
                Tron Network Only
              </span>
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 2px 0', textAlign: 'center' }}>
              Deposit USDT
            </h3>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#059669', marginBottom: '16px', textAlign: 'center' }}>
              Exchange Rate: 1 USDT ≈ ₹115 INR
            </span>

            {/* Generated Vector SVG QR Code - Crisp, native, no photo */}
            <div style={{
              background: '#ffffff',
              padding: '16px',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: '14px'
            }}>
              <QRCodeSVG
                value={usdtAddress}
                size={200}
                level="H"
                bgColor="#ffffff"
                fgColor="#0f172a"
                marginSize={1}
              />
            </div>

            <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 16px 0', textAlign: 'center' }}>
              Scan this QR code with any TRC20 wallet or exchange
            </p>

            {/* Receiving Address + Copy Button */}
            <div style={{
              width: '100%',
              background: '#f8fafc',
              borderRadius: '12px',
              padding: '12px 14px',
              boxSizing: 'border-box',
              border: '1px solid #e2e8f0',
              marginBottom: '16px'
            }}>
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                color: '#64748b',
                display: 'block',
                marginBottom: '4px'
              }}>
                TRC20 Deposit Address
              </span>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#0f172a',
                  fontFamily: 'monospace',
                  wordBreak: 'break-all',
                  lineHeight: '1.4'
                }}>
                  {usdtAddress}
                </span>
                <button
                  type="button"
                  onClick={handleCopyUsdt}
                  style={{
                    background: usdtCopied ? '#059669' : '#0f172a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontSize: '11px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    flexShrink: 0,
                    transition: 'all 0.15s ease'
                  }}
                >
                  {usdtCopied ? <Check size={13} /> : <Copy size={13} />}
                  {usdtCopied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Submission Form / Status */}
            {usdtSubmitted ? (
              <div style={{
                width: '100%',
                background: '#ecfdf5',
                borderRadius: '12px',
                padding: '16px',
                boxSizing: 'border-box',
                border: '1px solid #a7f3d0',
                textAlign: 'center'
              }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: '#059669',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 8px auto'
                }}>
                  <Check size={20} />
                </div>
                <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#065f46', margin: '0 0 4px 0' }}>
                  Deposit Proof Submitted!
                </h4>
                <p style={{ fontSize: '12px', color: '#047857', margin: '0 0 4px 0' }}>
                  Amount: <strong>${usdtSubmitted.amount} USDT</strong> (≈ ₹{usdtSubmitted.inr.toLocaleString('en-IN')} INR)
                </p>
                <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 12px 0', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  TxID: {usdtSubmitted.txId}
                </p>
                <span style={{ fontSize: '11px', color: '#059669', fontWeight: '700', display: 'block', marginBottom: '14px' }}>
                  Pending Admin Verification
                </span>
                <button
                  onClick={() => {
                    setUsdtSubmitted(null);
                    setUsdtTxId('');
                    setUsdtAmount('');
                  }}
                  className="btn-black"
                  style={{
                    padding: '8px 20px',
                    fontSize: '12px',
                    fontWeight: '700',
                    borderRadius: '8px'
                  }}
                >
                  New Deposit
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitUsdt} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>
                      Deposit Amount (USDT)
                    </label>
                    {usdtAmount && Number(usdtAmount) > 0 && (
                      <span style={{ fontSize: '11px', color: '#059669', fontWeight: '700' }}>
                        ≈ ₹{Math.round(Number(usdtAmount) * 115).toLocaleString('en-IN')} INR
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    placeholder="Enter USDT amount e.g. 50"
                    value={usdtAmount}
                    onChange={(e) => setUsdtAmount(e.target.value)}
                    required
                    min="1"
                    step="any"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#0f172a',
                      fontSize: '13px',
                      fontWeight: '600',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                    TRC20 Transaction Hash (TxID)
                  </label>
                  <input
                    type="text"
                    placeholder="Paste TRC20 Transaction Hash / TxID"
                    value={usdtTxId}
                    onChange={(e) => setUsdtTxId(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#0f172a',
                      fontSize: '13px',
                      fontWeight: '600',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={usdtSubmitting}
                  className="btn-black btn-black-lg"
                  style={{
                    borderRadius: '8px',
                    fontWeight: '800',
                    fontSize: '14px',
                    padding: '12px'
                  }}
                >
                  {usdtSubmitting ? 'Submitting...' : 'Submit Deposit Proof'}
                </button>
              </form>
            )}
          </div>
        </div>
      ) : (
        /* INR Task Section */
        <>
          {/* Clean Task Section Title - VIP removed completely per user instruction */}
          <div style={{ display: 'flex', gap: '24px', marginBottom: '16px' }}>
            <span
              style={{
                fontSize: '16px',
                fontWeight: '700',
                color: '#000',
                paddingBottom: '4px',
                borderBottom: '2px solid #000'
              }}
            >
              Task
            </span>
          </div>

          {/* Bonus Banner */}
          <div style={{
            background: '#ede7fe',
            borderRadius: '12px',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '14px'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#fbbf24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Coins size={18} color="#ffffff" />
            </div>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e1b4b', lineHeight: '1.3' }}>
              Complete a task to earn Commission and Bonus
            </span>
          </div>

          {/* How Buy Quota link */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '14px',
              fontWeight: '700',
              color: '#111',
              marginBottom: '16px',
              cursor: 'pointer'
            }}
            onClick={() => openModal && openModal('buyQuotaGuide')}
          >
            <PlayCircle size={18} color="#111" />
            <span>How Buy Quota?</span>
          </div>

          {/* Filter Row Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            {/* Sort Select */}
            <div style={{ position: 'relative', flex: 1 }}>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 24px 8px 10px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  background: '#f9fafb',
                  fontSize: '12px',
                  fontWeight: '600',
                  appearance: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="low-to-high">From low to high</option>
                <option value="high-to-low">From high to low</option>
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>

            {/* Min Input */}
            <input
              type="number"
              placeholder="Min"
              value={minVal}
              onChange={(e) => setMinVal(e.target.value)}
              style={{
                width: '60px',
                padding: '8px 6px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                background: '#f9fafb',
                fontSize: '12px',
                textAlign: 'center'
              }}
            />

            <span style={{ color: '#9ca3af', fontWeight: '700' }}>-</span>

            {/* Max Input */}
            <input
              type="number"
              placeholder="Max"
              value={maxVal}
              onChange={(e) => setMaxVal(e.target.value)}
              style={{
                width: '60px',
                padding: '8px 6px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                background: '#f9fafb',
                fontSize: '12px',
                textAlign: 'center'
              }}
            />

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              style={{
                background: '#000000',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Refresh
            </button>
          </div>

          {/* Number Orders List matching Screenshot 4 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {items.map((item) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#000', marginBottom: '2px' }}>
                    {item.amount} {currency}
                  </h3>
                  <div style={{ display: 'flex', gap: '14px', fontSize: '13px', color: '#6b7280', fontWeight: '600' }}>
                    <span>Income <strong style={{ color: '#111' }}>{item.income} ({item.rate})</strong></span>
                    <span>Quota <strong className="teal-text">+{item.quota}</strong></span>
                  </div>
                </div>

                <button
                  className="btn-black"
                  onClick={() => handleOrderClick(item)}
                  style={{ padding: '8px 24px', fontSize: '14px', fontWeight: '700' }}
                >
                  Buy
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Security & Anti-Scam Official Payment Notice Modal (Appears EVERY TIME Buy is clicked) */}
      {pendingOrder && (
        <div
          className="modal-overlay"
          onClick={handleCancelSecurityNotice}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '16px'
          }}
        >
          <div
            className="modal-sheet"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              width: '100%',
              maxWidth: '390px',
              borderRadius: '24px',
              padding: '22px 20px',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #e2e8f0',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            {/* Header close button */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginBottom: '-6px' }}>
              <button
                type="button"
                onClick={handleCancelSecurityNotice}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Glowing Security Shield Icon */}
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '18px',
              background: 'linear-gradient(135deg, #fef3c7 0%, #fee2e2 100%)',
              border: '2px solid #fed7aa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px',
              boxShadow: '0 8px 20px -4px rgba(245, 158, 11, 0.3)'
            }}>
              <ShieldAlert size={30} color="#dc2626" />
            </div>

            {/* Modal Heading */}
            <h3 style={{
              fontSize: '18px',
              fontWeight: '800',
              color: '#0f172a',
              textAlign: 'center',
              margin: '0 0 4px 0',
              letterSpacing: '-0.3px'
            }}>
              Official Payment Notice
            </h3>
            <p style={{
              fontSize: '12px',
              color: '#64748b',
              textAlign: 'center',
              margin: '0 0 14px 0',
              fontWeight: '600'
            }}>
              Anti-Fraud Security & Verification
            </p>

            {/* Order Highlight Box */}
            <div style={{
              width: '100%',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '10px 14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '14px',
              boxSizing: 'border-box'
            }}>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Selected Package</span>
                <div style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>
                  ₹{Number(pendingOrder.amount).toLocaleString('en-IN')} {currency}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: '#059669', fontWeight: '800' }}>Income +{pendingOrder.income} ({pendingOrder.rate})</span>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#2563eb' }}>
                  Quota +{pendingOrder.quota}
                </div>
              </div>
            </div>

            {/* Security Advisory Points */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              
              {/* Point 1: Company Official UPI & Scanner */}
              <div style={{
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: '12px',
                padding: '10px 12px',
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start',
                boxSizing: 'border-box'
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#059669',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '1px'
                }}>
                  <Check size={14} strokeWidth={3} />
                </div>
                <div style={{ fontSize: '12px', color: '#065f46', lineHeight: '1.4' }}>
                  <span style={{ fontWeight: '800', color: '#047857', display: 'block', marginBottom: '2px' }}>
                    Company Official UPI ID & Scanner
                  </span>
                  This is the company's verified and official UPI ID & QR scanner. All transactions are securely tracked and credited automatically.
                </div>
              </div>

              {/* Point 2: Changes every 15 days */}
              <div style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '12px',
                padding: '10px 12px',
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start',
                boxSizing: 'border-box'
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  background: '#2563eb',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: '900',
                  flexShrink: 0,
                  marginTop: '1px'
                }}>
                  15D
                </div>
                <div style={{ fontSize: '12px', color: '#1e40af', lineHeight: '1.4' }}>
                  <span style={{ fontWeight: '800', color: '#1d4ed8', display: 'block', marginBottom: '2px' }}>
                    Updated Every 15 Days
                  </span>
                  Please note that our official UPI ID and QR scanner change every 15 days for banking safety. Always make payments using the live scanner shown on the screen—never reuse old saved accounts.
                </div>
              </div>

              {/* Point 3: Stay away from scammers */}
              <div style={{
                background: '#fff1f2',
                border: '1px solid #fecdd3',
                borderRadius: '12px',
                padding: '10px 12px',
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start',
                boxSizing: 'border-box'
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#e11d48',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '1px'
                }}>
                  <AlertTriangle size={13} strokeWidth={2.5} />
                </div>
                <div style={{ fontSize: '12px', color: '#9f1239', lineHeight: '1.4' }}>
                  <span style={{ fontWeight: '800', color: '#be123c', display: 'block', marginBottom: '2px' }}>
                    Stay Away from Scammers!
                  </span>
                  Never transfer money to personal UPI IDs, Telegram/WhatsApp agents, or unverified links claiming to represent FlashPay. FlashPay will never ask you to pay into any personal account.
                </div>
              </div>

            </div>

            {/* Acknowledgment line */}
            <div style={{
              fontSize: '11px',
              color: '#64748b',
              textAlign: 'center',
              marginBottom: '14px',
              lineHeight: '1.4',
              padding: '0 4px'
            }}>
              By clicking below, you confirm that you will pay only via the official company QR code & UPI ID displayed next.
            </div>

            {/* Action Buttons: Agree and Pay & Cancel */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                onClick={handleAgreeAndPay}
                className="btn-black"
                style={{
                  width: '100%',
                  padding: '13px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(15, 23, 42, 0.25)',
                  cursor: 'pointer'
                }}
              >
                <span>Agree and Pay (₹{Number(pendingOrder.amount).toLocaleString('en-IN')})</span>
                <ArrowRight size={16} />
              </button>

              <button
                type="button"
                onClick={handleCancelSecurityNotice}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '13px',
                  fontWeight: '600',
                  padding: '8px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Payment Modal: "just keep qr nothing else and upi id and let copy" */}
      {selectedOrder && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedOrder(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px'
          }}
        >
          <div
            className="modal-sheet"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              width: '100%',
              maxWidth: '380px',
              borderRadius: '20px',
              padding: '20px',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            {/* Header with Close */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Order: ₹{selectedOrder.amount} {currency}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
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
                <X size={16} color="#475569" />
              </button>
            </div>

            {/* Official Company Security Reminder Badge */}
            <div style={{
              background: '#fef3c7',
              border: '1px solid #fde68a',
              borderRadius: '8px',
              padding: '6px 10px',
              width: '100%',
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginBottom: '12px',
              fontSize: '11px',
              fontWeight: '700',
              color: '#92400e',
              textAlign: 'center'
            }}>
              <ShieldCheck size={14} color="#b45309" />
              <span>Official Company Scanner • Changes every 15 days</span>
            </div>

            {submittedTx ? (
              <div style={{ textAlign: 'center', padding: '16px 0', width: '100%' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: '#ecfdf5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 10px auto'
                }}>
                  <Check size={22} />
                </div>
                <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
                  Payment Submitted!
                </h4>
                <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
                  Order of <strong>₹{submittedTx.amount}</strong> (UTR: {submittedTx.utr}) is under verification.
                </p>
                <span style={{ fontSize: '11px', color: '#059669', fontWeight: '700', display: 'block', marginBottom: '16px' }}>
                  Pending Admin Approval
                </span>
                <button
                  className="btn-black btn-black-lg"
                  onClick={() => {
                    setSelectedOrder(null);
                    setSubmittedTx(null);
                  }}
                  style={{ borderRadius: '8px' }}
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitPayment} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {/* PhonePe QR Code: FlashPay India Official */}
                <div style={{
                  background: '#ffffff',
                  padding: '10px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: '14px'
                }}>
                  <img
                    src="/phonepe_qr_code.png"
                    alt="PhonePe UPI QR Code"
                    style={{
                      width: '210px',
                      height: '210px',
                      display: 'block',
                      borderRadius: '8px'
                    }}
                  />
                </div>

                {/* UPI ID + Copy button: "and upi id and let copy" */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#f8fafc',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  width: '100%',
                  border: '1px solid #e2e8f0',
                  boxSizing: 'border-box',
                  marginBottom: '14px'
                }}>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', fontFamily: 'monospace' }}>
                    {upiId}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    style={{
                      background: copied ? '#059669' : '#0f172a',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>

                {/* 12-digit UTR input */}
                <div style={{ width: '100%', marginBottom: '14px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                    12-digit UTR / Reference No.
                  </label>
                  <input
                    type="text"
                    placeholder="Enter 12-digit UTR from payment app"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
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

                <button
                  type="submit"
                  className="btn-black btn-black-lg"
                  disabled={submitting}
                  style={{ fontWeight: '800', borderRadius: '8px', width: '100%' }}
                >
                  {submitting ? 'Submitting...' : `Submit Payment Proof (₹${selectedOrder.amount})`}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
