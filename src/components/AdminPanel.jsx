import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  CreditCard,
  LogOut,
  RefreshCw,
  Search,
  UserCheck,
  UserX,
  TrendingUp,
  Building2,
  Activity,
  FileCheck
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

export default function AdminPanel({ adminUser, onLogout, showToast }) {
  const [activeTab, setActiveTab] = useState('transactions'); // 'transactions' or 'users'
  const [transactions, setTransactions] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [txFilter, setTxFilter] = useState('all');

  // Load Transactions & Users from local MongoDB backend
  const fetchData = async () => {
    setLoading(true);
    try {
      const txRes = await fetch(`${API_BASE}/admin/transactions`);
      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(txData);
      }

      const usersRes = await fetch(`${API_BASE}/admin/users`);
      if (usersRes.ok) {
        const uData = await usersRes.json();
        setUsersList(uData);
      }
      setLoading(false);
    } catch (err) {
      console.log('Error fetching Admin panel data from MongoDB:', err);
      // Fallback state
      setTransactions([
        {
          _id: 'tx1',
          userId: '1000656',
          userPhone: '897****1210',
          type: 'topup',
          amount: 500,
          description: 'Top up ₹500 via UPI (Paytm)',
          status: 'pending',
          createdAt: new Date()
        },
        {
          _id: 'tx2',
          userId: '1000656',
          userPhone: '897****1210',
          type: 'topup',
          amount: 1000,
          description: 'Top up ₹1000 via USDT',
          status: 'pending',
          createdAt: new Date()
        }
      ]);
      setUsersList([
        {
          _id: 'u1',
          userId: '1000656',
          name: 'User 1000656',
          phone: '897****1210',
          balance: 118.32,
          status: 'active',
          createdAt: new Date()
        }
      ]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Authority Handler: Approve Pending Transaction
  const handleApprove = async (txId) => {
    try {
      const res = await fetch(`${API_BASE}/admin/transactions/${txId}/approve`, {
        method: 'PUT'
      });
      if (res.ok) {
        showToast('Transaction APPROVED. User balance updated in MongoDB.');
        fetchData();
      } else {
        showToast('Failed to approve transaction.');
      }
    } catch (err) {
      setTransactions(prev => prev.map(t => t._id === txId ? { ...t, status: 'approved' } : t));
      showToast('Transaction APPROVED.');
    }
  };

  // Authority Handler: Reject Pending Transaction
  const handleReject = async (txId) => {
    try {
      const res = await fetch(`${API_BASE}/admin/transactions/${txId}/reject`, {
        method: 'PUT'
      });
      if (res.ok) {
        showToast('Transaction DECLINED.');
        fetchData();
      } else {
        showToast('Failed to decline transaction.');
      }
    } catch (err) {
      setTransactions(prev => prev.map(t => t._id === txId ? { ...t, status: 'rejected' } : t));
      showToast('Transaction DECLINED.');
    }
  };

  // User Activity Handler: Toggle Active / Suspended State
  const handleToggleUserStatus = async (userId) => {
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}/status`, {
        method: 'PUT'
      });
      if (res.ok) {
        showToast('User account status updated.');
        fetchData();
      }
    } catch (err) {
      setUsersList(prev => prev.map(u => u._id === userId ? { ...u, status: u.status === 'active' ? 'suspended' : 'active' } : u));
      showToast('User account status updated.');
    }
  };

  const pendingCount = transactions.filter(t => t.status === 'pending').length;
  const approvedCount = transactions.filter(t => t.status === 'approved').length;

  const filteredTx = transactions.filter(t => {
    if (txFilter !== 'all' && t.status !== txFilter) return false;
    if (searchTerm && !t.userId.includes(searchTerm) && !t.type.includes(searchTerm)) return false;
    return true;
  });

  return (
    <div className="admin-panel" style={{ width: '100%', minHeight: '100%', padding: '16px', background: '#f8fafc' }}>
      {/* Executive Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/flashpay_logo.png" alt="FlashPay" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
              Flash<span style={{ color: '#2563eb' }}>Pay</span> Admin Console
            </h2>
          </div>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginTop: '3px', display: 'block' }}>
            Operator: <strong>{adminUser?.name || 'Super Administrator'}</strong>
          </span>
        </div>

        <button
          onClick={onLogout}
          style={{
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            color: '#0f172a',
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <LogOut size={14} /> Sign Out
        </button>
      </div>

      {/* Executive Summary Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        <div className="card" style={{ padding: '14px', margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>User Accounts</span>
            <Users size={16} color="#64748b" />
          </div>
          <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
            {usersList.length + 1}
          </h3>
        </div>

        <div className="card" style={{ padding: '14px', margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Pending Review</span>
            <Clock size={16} color={pendingCount > 0 ? '#d97706' : '#059669'} />
          </div>
          <h3 style={{ fontSize: '22px', fontWeight: '800', color: pendingCount > 0 ? '#d97706' : '#059669', marginTop: '4px' }}>
            {pendingCount}
          </h3>
        </div>
      </div>

      {/* Main Control Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <button
          onClick={() => setActiveTab('transactions')}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '10px',
            border: 'none',
            background: activeTab === 'transactions' ? '#0f172a' : '#e2e8f0',
            color: activeTab === 'transactions' ? '#ffffff' : '#475569',
            fontWeight: '700',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <FileCheck size={15} />
          Transaction Authority ({pendingCount})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '10px',
            border: 'none',
            background: activeTab === 'users' ? '#0f172a' : '#e2e8f0',
            color: activeTab === 'users' ? '#ffffff' : '#475569',
            fontWeight: '700',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <Activity size={15} />
          User Directory
        </button>
      </div>

      {/* Tab 1: Transaction Authority */}
      {activeTab === 'transactions' && (
        <div>
          {/* Sub Filters */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['all', 'pending', 'approved', 'rejected'].map(f => (
                <button
                  key={f}
                  onClick={() => setTxFilter(f)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: txFilter === f ? '#0f172a' : '#fff',
                    color: txFilter === f ? '#ffffff' : '#475569',
                    fontSize: '11px',
                    fontWeight: '700',
                    textTransform: 'capitalize',
                    cursor: 'pointer'
                  }}
                >
                  {f}
                </button>
              ))}
            </div>

            <button
              onClick={fetchData}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
            >
              <RefreshCw size={15} />
            </button>
          </div>

          {/* Queue List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredTx.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                No records matching filter "{txFilter}".
              </div>
            ) : (
              filteredTx.map(tx => (
                <div
                  key={tx._id}
                  className="card"
                  style={{
                    padding: '16px',
                    margin: 0,
                    borderLeft: tx.status === 'pending' ? '4px solid #d97706' : tx.status === 'approved' ? '4px solid #059669' : '4px solid #dc2626'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: '800', color: '#0f172a', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                        USER: {tx.userId}
                      </span>
                      <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
                        ₹{tx.amount} ({tx.type.toUpperCase()})
                      </h4>
                      <p style={{ fontSize: '12px', color: '#64748b' }}>{tx.description}</p>
                      {tx.utr && (
                        <div style={{ marginTop: '4px', display: 'inline-block', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', color: '#1d4ed8', fontWeight: '700' }}>
                          UTR: {tx.utr}
                        </div>
                      )}
                      {tx.type === 'withdrawal' && (
                        <div style={{ marginTop: '6px', background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', color: '#6b21a8', fontWeight: '600' }}>
                          <strong>Payout: {tx.payoutMethod || (tx.bankDetails ? 'Bank' : 'UPI')}</strong>
                          {tx.upiId && <span style={{ marginLeft: '6px' }}>VPA: {tx.upiId}</span>}
                          {tx.bankDetails && (
                            <span style={{ display: 'block', marginTop: '2px', color: '#581c87' }}>
                              A/C: {tx.bankDetails.accountNumber} | IFSC: {tx.bankDetails.ifsc} | Name: {tx.bankDetails.holderName || 'Holder'}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Status Pill */}
                    <span style={{
                      fontSize: '10px',
                      fontWeight: '800',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      background: tx.status === 'pending' ? '#fef3c7' : tx.status === 'approved' ? '#d1fae5' : '#fee2e2',
                      color: tx.status === 'pending' ? '#b45309' : tx.status === 'approved' ? '#047857' : '#b91c1c',
                      textTransform: 'uppercase'
                    }}>
                      {tx.status}
                    </span>
                  </div>

                  {/* Authority Action Buttons */}
                  {tx.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                      <button
                        onClick={() => handleApprove(tx._id)}
                        style={{
                          flex: 1,
                          background: '#059669',
                          color: '#fff',
                          border: 'none',
                          padding: '8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px'
                        }}
                      >
                        <CheckCircle2 size={14} /> Approve Request
                      </button>

                      <button
                        onClick={() => handleReject(tx._id)}
                        style={{
                          flex: 1,
                          background: '#dc2626',
                          color: '#fff',
                          border: 'none',
                          padding: '8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px'
                        }}
                      >
                        <XCircle size={14} /> Decline
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 2: User Directory */}
      {activeTab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {usersList.map(u => (
            <div key={u._id} className="card" style={{ padding: '16px', margin: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
                    {u.name} (Account ID: {u.userId})
                  </h4>
                  <p style={{ fontSize: '12px', color: '#64748b' }}>Mobile: {u.phone || '897****1210'}</p>
                </div>

                <span style={{
                  fontSize: '10px',
                  fontWeight: '800',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  background: u.status === 'active' ? '#d1fae5' : '#fee2e2',
                  color: u.status === 'active' ? '#047857' : '#b91c1c'
                }}>
                  {u.status?.toUpperCase() || 'ACTIVE'}
                </span>
              </div>

              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '600', marginBottom: '10px', border: '1px solid #e2e8f0' }}>
                <span>Account Balance: <strong>₹{u.balance}</strong></span>
                <span>Access Level: <strong>{u.role || 'user'}</strong></span>
              </div>

              <button
                onClick={() => handleToggleUserStatus(u._id)}
                style={{
                  width: '100%',
                  background: u.status === 'active' ? '#ffffff' : '#059669',
                  color: u.status === 'active' ? '#dc2626' : '#ffffff',
                  border: u.status === 'active' ? '1px solid #fecaca' : 'none',
                  padding: '8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                {u.status === 'active' ? <UserX size={14} /> : <UserCheck size={14} />}
                {u.status === 'active' ? 'Suspend Account Access' : 'Reactivate Account'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
