import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './db.js';
import User from './models/User.js';
import UpiAccount from './models/UpiAccount.js';
import TeamMember from './models/TeamMember.js';
import Transaction from './models/Transaction.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize MongoDB connection
connectDB();

// -------------------------------------------------------------
// AUTHENTICATION ROUTES
function maskPhone(p) {
  if (!p) return '987****0000';
  const clean = String(p).replace(/\D/g, '');
  if (clean.length >= 7) {
    return clean.slice(0, 3) + '****' + clean.slice(-4);
  }
  return clean + '****';
}

// Register New User with Optional Referral Code
app.post('/api/auth/register', async (req, res) => {
  try {
    const { phone, password, confirmPassword, name, referralCode } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ error: 'Phone number and password are required' });
    }
    if (confirmPassword !== undefined && confirmPassword !== password) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    const cleanPhone = phone.trim();
    const existing = await User.findOne({ phone: cleanPhone });
    if (existing) {
      return res.status(400).json({ error: 'An account with this phone number already exists' });
    }

    // Generate unique 7-digit userId
    const newUserId = String(Math.floor(1000000 + Math.random() * 9000000));

    let referrer = null;
    const refCode = (referralCode || '').trim();
    if (refCode) {
      referrer = await User.findOne({
        $or: [{ userId: refCode }, { referralCode: refCode }]
      });
    }

    const newUser = await User.create({
      userId: newUserId,
      password: password.trim(),
      name: name?.trim() || `User_${newUserId.slice(-4)}`,
      phone: cleanPhone,
      role: 'user',
      status: 'active',
      mpin: null,
      balance: 0.00,
      todayReceived: 0.00,
      topupBonus: 0.00,
      teamCommission: 0.00,
      referralCode: newUserId,
      referredBy: referrer ? referrer.userId : null
    });

    // If referred by someone, create initial TeamMember record under referrer
    if (referrer) {
      await TeamMember.create({
        referrerId: referrer.userId,
        memberId: newUser.userId,
        phone: maskPhone(newUser.phone),
        usersCount: 0,
        recharge: 0,
        comm: 0
      });
    }

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: {
        userId: newUser.userId,
        name: newUser.name,
        role: newUser.role,
        phone: newUser.phone,
        status: newUser.status,
        balance: newUser.balance,
        todayReceived: newUser.todayReceived,
        topupBonus: newUser.topupBonus,
        teamCommission: newUser.teamCommission,
        referralCode: newUser.referralCode,
        referredBy: newUser.referredBy
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login User or Admin
app.post('/api/auth/login', async (req, res) => {
  try {
    const { userId, password } = req.body;
    if (!userId || !password) {
      return res.status(400).json({ error: 'User ID and password are required' });
    }

    const user = await User.findOne({
      $or: [{ userId: userId.trim() }, { phone: userId.trim() }]
    });
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid account ID or password' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Account suspended by administrator. Contact support.' });
    }

    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      user: {
        userId: user.userId,
        name: user.name,
        role: user.role,
        phone: user.phone,
        status: user.status,
        balance: user.balance,
        todayReceived: user.todayReceived,
        topupBonus: user.topupBonus,
        teamCommission: user.teamCommission,
        referralCode: user.referralCode || user.userId,
        referredBy: user.referredBy
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// USER API ROUTES
// -------------------------------------------------------------

// Get User Profile & Stats
app.get('/api/stats', async (req, res) => {
  try {
    const userId = req.query.userId || '1000656';
    let user = await User.findOne({ userId });
    if (!user) {
      user = await User.create({ userId });
    }
    res.json({
      balance: user.balance,
      todayReceived: user.todayReceived,
      topupBonus: user.topupBonus,
      teamCommission: user.teamCommission,
      userId: user.userId,
      rewardRatio: user.rewardRatio,
      status: user.status,
      hasMpin: !!user.mpin,
      referralCode: user.referralCode || user.userId,
      referredBy: user.referredBy
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update User Profile & Stats (Balance, Received, etc.)
app.put('/api/stats', async (req, res) => {
  try {
    const { userId, balance, todayReceived, topupBonus, teamCommission } = req.body;
    const targetId = userId || '1000656';
    let user = await User.findOne({ userId: targetId });
    if (!user) {
      user = await User.create({ userId: targetId });
    }

    if (typeof balance === 'number') user.balance = balance;
    if (typeof todayReceived === 'number') user.todayReceived = todayReceived;
    if (typeof topupBonus === 'number') user.topupBonus = topupBonus;
    if (typeof teamCommission === 'number') user.teamCommission = teamCommission;

    await user.save();

    res.json({
      success: true,
      balance: user.balance,
      todayReceived: user.todayReceived,
      topupBonus: user.topupBonus,
      teamCommission: user.teamCommission,
      userId: user.userId
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lucky Wheel Win Handler
app.post('/api/wheel/win', async (req, res) => {
  try {
    const { userId, amount } = req.body;
    const targetId = userId || '1000656';
    const winAmount = Number(amount) || 0;

    let user = await User.findOne({ userId: targetId });
    if (!user) {
      user = await User.create({ userId: targetId });
    }

    if (user.balance < 5000) {
      return res.status(400).json({ error: 'Minimum balance of ₹5000 required to play Lucky Wheel' });
    }

    user.balance += winAmount;
    user.todayReceived += winAmount;
    await user.save();

    // Create a transaction record for wheel win
    await Transaction.create({
      userId: user.userId,
      userPhone: user.phone,
      type: 'buy_quota',
      amount: winAmount,
      description: `Lucky Wheel Prize: +₹${winAmount} INR`,
      status: 'approved'
    });

    res.json({
      success: true,
      winAmount,
      newBalance: user.balance,
      todayReceived: user.todayReceived
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Request Top up (Creates pending transaction for Admin Approval)
app.post('/api/topup', async (req, res) => {
  try {
    const { userId, amount, method, utr, description } = req.body;
    const targetId = userId || '1000656';
    const topupAmt = Number(amount);

    if (!topupAmt || topupAmt < 500) {
      return res.status(400).json({ error: 'Minimum deposit amount is ₹500' });
    }

    const user = await User.findOne({ userId: targetId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const tx = await Transaction.create({
      userId: user.userId,
      userPhone: user.phone,
      type: 'topup',
      amount: topupAmt,
      description: description || `Top up ₹${topupAmt} via ${method || 'UPI'}${utr ? ` (UTR: ${utr})` : ''}`,
      utr: utr || '',
      status: 'pending'
    });

    res.json({
      success: true,
      message: 'Payment order submitted. Pending Admin approval.',
      transaction: tx
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Request Withdrawal (Deducts balance immediately & creates pending transaction for Admin Approval)
app.post('/api/withdraw', async (req, res) => {
  try {
    const { userId, amount, upiId, method, bankDetails, mpin } = req.body;
    const targetId = userId || '1000656';
    const withdrawAmt = Number(amount);

    if (!withdrawAmt || withdrawAmt <= 0) {
      return res.status(400).json({ error: 'Please enter a valid withdrawal amount' });
    }

    if (withdrawAmt < 2000) {
      return res.status(400).json({ error: 'Minimum withdrawal amount is ₹2,000' });
    }

    const user = await User.findOne({ userId: targetId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.mpin) {
      return res.status(400).json({ error: 'Please set your Security MPIN first', needsMpinSetup: true });
    }

    if (!mpin || mpin.toString().trim().length < 4) {
      return res.status(400).json({ error: 'Please enter your 4-digit or 6-digit MPIN' });
    }

    if (mpin.toString().trim() !== user.mpin) {
      return res.status(400).json({ error: 'Incorrect MPIN. Please enter the MPIN you set.' });
    }

    const payoutMethod = method === 'Bank' ? 'Bank' : 'UPI';
    let destinationDesc = '';

    if (payoutMethod === 'Bank') {
      if (!bankDetails?.accountNumber || !bankDetails?.ifsc) {
        return res.status(400).json({ error: 'Please enter bank account number and IFSC code' });
      }
      destinationDesc = `Bank A/C: ${bankDetails.accountNumber} (${bankDetails.ifsc}, ${bankDetails.holderName || 'Holder'})`;
    } else {
      if (!upiId || upiId.trim().length < 3) {
        return res.status(400).json({ error: 'Please enter a valid UPI ID for payout' });
      }
      destinationDesc = `UPI: ${upiId.trim()}`;
    }

    if (user.balance < withdrawAmt) {
      return res.status(400).json({ error: `Insufficient quota balance. Available: ₹${user.balance.toFixed(2)}` });
    }

    // Deduct user balance immediately to reserve it
    user.balance -= withdrawAmt;
    await user.save();

    const tx = await Transaction.create({
      userId: user.userId,
      userPhone: user.phone,
      type: 'withdrawal',
      amount: withdrawAmt,
      payoutMethod,
      upiId: payoutMethod === 'UPI' ? upiId?.trim() : '',
      bankDetails: payoutMethod === 'Bank' ? bankDetails : null,
      description: `Withdrawal of ₹${withdrawAmt} to ${destinationDesc}`,
      status: 'pending'
    });

    res.json({
      success: true,
      message: 'Withdrawal request submitted. Pending Admin approval.',
      transaction: tx,
      newBalance: user.balance
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Set or Update Security MPIN
app.post('/api/user/set-mpin', async (req, res) => {
  try {
    const { userId, mpin } = req.body;
    const targetId = userId || '1000656';
    if (!mpin || mpin.toString().trim().length < 4) {
      return res.status(400).json({ error: 'MPIN must be 4 or 6 digits' });
    }
    const user = await User.findOne({ userId: targetId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.mpin = mpin.toString().trim();
    await user.save();
    res.json({ success: true, message: 'Security MPIN set successfully!', hasMpin: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/user/mpin', async (req, res) => {
  try {
    const { userId, oldMpin, newMpin } = req.body;
    const targetId = userId || '1000656';
    if (!newMpin || newMpin.length < 4) {
      return res.status(400).json({ error: 'New MPIN must be 4 or 6 digits' });
    }
    const user = await User.findOne({ userId: targetId });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.mpin && oldMpin && user.mpin !== oldMpin.trim()) {
      return res.status(400).json({ error: 'Current MPIN is incorrect' });
    }
    user.mpin = newMpin.trim();
    await user.save();
    res.json({ success: true, message: 'Security MPIN updated successfully', hasMpin: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get User Specific Transactions (Deposit & Withdrawal Requests)
app.get('/api/user/transactions', async (req, res) => {
  try {
    const userId = req.query.userId || '1000656';
    const transactions = await Transaction.find({ userId }).sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// ADMIN MANAGEMENT & AUTHORITY PANEL ROUTES
// -------------------------------------------------------------

// Get All Users & Activity (Admin)
app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle User Status (Active / Suspended)
app.put('/api/admin/users/:id/status', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.status = user.status === 'active' ? 'suspended' : 'active';
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get All Transactions for Admin Approval Panel
app.get('/api/admin/transactions', async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const transactions = await Transaction.find(query).sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Approve Transaction Authority
app.put('/api/admin/transactions/:id/approve', async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });

    if (tx.status === 'approved') {
      return res.status(400).json({ error: 'Transaction already approved' });
    }

    tx.status = 'approved';
    tx.approvedAt = new Date();
    tx.approvedBy = 'admin';
    await tx.save();

    // Credit user balance in MongoDB on Top up (+ 8% Bonus)
    if (tx.type === 'topup' || tx.type === 'buy_quota') {
      const user = await User.findOne({ userId: tx.userId });
      if (user) {
        const depositBonus = Math.round(tx.amount * 0.08 * 100) / 100; // 8% deposit bonus
        user.balance += tx.amount + depositBonus;
        user.topupBonus += depositBonus;
        user.todayReceived = (user.todayReceived || 0) + depositBonus;
        user.totalRecharge = (user.totalRecharge || 0) + tx.amount;
        await user.save();

        // 0.8% Referral Commission: Give 0.8% of referred person amount to referrer
        if (user.referredBy) {
          const referrer = await User.findOne({ userId: user.referredBy });
          if (referrer) {
            const comm = Math.round(tx.amount * 0.008 * 100) / 100; // 0.8% commission
            if (comm > 0) {
              referrer.teamCommission = (referrer.teamCommission || 0) + comm;
              referrer.balance = (referrer.balance || 0) + comm;
              referrer.todayReceived = (referrer.todayReceived || 0) + comm;
              await referrer.save();

              // Record commission transaction for referrer
              await Transaction.create({
                userId: referrer.userId,
                userPhone: referrer.phone,
                type: 'commission',
                amount: comm,
                description: `Team Commission: +₹${comm.toFixed(2)} (0.8% of ₹${tx.amount} recharge from referred user ${user.userId})`,
                status: 'approved',
                approvedAt: new Date(),
                approvedBy: 'system'
              });

              // Update or create TeamMember entry
              let memberDoc = await TeamMember.findOne({
                referrerId: referrer.userId,
                $or: [{ memberId: user.userId }, { phone: maskPhone(user.phone) }]
              });
              if (memberDoc) {
                memberDoc.recharge = (Number(memberDoc.recharge) || 0) + tx.amount;
                memberDoc.comm = (Number(memberDoc.comm) || 0) + comm;
                await memberDoc.save();
              } else {
                await TeamMember.create({
                  referrerId: referrer.userId,
                  memberId: user.userId,
                  phone: maskPhone(user.phone),
                  usersCount: 0,
                  recharge: tx.amount,
                  comm: comm
                });
              }
            }
          }
        }
      }
    }

    res.json({ success: true, transaction: tx });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reject Transaction (Refund balance if withdrawal was rejected)
app.put('/api/admin/transactions/:id/reject', async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });

    if (tx.status === 'rejected') {
      return res.status(400).json({ error: 'Transaction already rejected' });
    }

    tx.status = 'rejected';
    tx.approvedAt = new Date();
    tx.approvedBy = 'admin';
    await tx.save();

    // If a withdrawal was rejected, refund the reserved balance back to user
    if (tx.type === 'withdrawal') {
      const user = await User.findOne({ userId: tx.userId });
      if (user) {
        user.balance += tx.amount;
        await user.save();
      }
    }

    res.json({ success: true, transaction: tx });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// GENERAL DATA ROUTES
// -------------------------------------------------------------
app.get('/api/upi', async (req, res) => {
  try {
    const accounts = await UpiAccount.find().sort({ createdAt: -1 });
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/upi', async (req, res) => {
  try {
    const { phone, vpa, provider } = req.body;
    const newAcc = await UpiAccount.create({
      phone,
      vpa,
      provider,
      enabled: true,
      logoBg: provider === 'paytm' ? '#e0f2fe' : '#f0fdf4'
    });
    res.status(201).json(newAcc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/upi/:id/toggle', async (req, res) => {
  try {
    const account = await UpiAccount.findById(req.params.id);
    if (!account) return res.status(404).json({ error: 'Account not found' });
    account.enabled = !account.enabled;
    await account.save();
    res.json(account);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/team', async (req, res) => {
  try {
    const targetId = req.query.userId || '1000656';
    let user = await User.findOne({ userId: targetId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Only real members who registered using this user's referral code
    const members = await TeamMember.find({ referrerId: targetId }).sort({ createdAt: -1 });

    const totalRecharge = members.reduce((sum, m) => sum + (Number(m.recharge) || 0), 0);
    const totalComm = Number(user.teamCommission || 0);

    res.json({
      success: true,
      referralCode: user.referralCode || user.userId,
      commission: Math.round(totalComm * 100) / 100,
      teamRecharge: Math.round(totalRecharge * 100) / 100,
      teamCount: members.length,
      referralRate: '0.8%',
      members: members.map(m => ({
        id: m._id,
        phone: m.phone || '987****0000',
        usersCount: m.usersCount || 0,
        recharge: m.recharge || 0,
        comm: m.comm || 0,
        createdAt: m.createdAt
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 FlashPay Auth & Admin Express Server running on http://localhost:${PORT}`);
});
