import mongoose from 'mongoose';
import User from './models/User.js';
import UpiAccount from './models/UpiAccount.js';
import TeamMember from './models/TeamMember.js';
import Transaction from './models/Transaction.js';

export async function connectDB() {
  const localUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/elephant_pay';

  try {
    console.log(`Connecting to local MongoDB at: ${localUri}...`);
    await mongoose.connect(localUri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log('✅ Connected successfully to local MongoDB daemon!');
  } catch (err) {
    console.log('⚠️ Local MongoDB daemon not running on port 27017. Starting fallback MongoDB instance...');
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      await mongoose.connect(mongoUri);
      console.log(`✅ Connected to local MongoDB instance at: ${mongoUri}`);
    } catch (memErr) {
      console.error('❌ Failed to start fallback MongoDB server:', memErr);
    }
  }

  // Seed default data if collections are empty
  await seedDatabase();
}

async function seedDatabase() {
  try {
    // 1. Seed Demo User
    const demoUser = await User.findOne({ userId: '1000656' });
    if (!demoUser) {
      await User.create({
        userId: '1000656',
        password: 'user123',
        name: 'User 1000656',
        phone: '897****1210',
        role: 'user',
        status: 'active',
        mpin: '1234',
        balance: 118.32,
        todayReceived: 0.00,
        topupBonus: 1496.09,
        teamCommission: 211.51,
        rewardRatio: 2.0
      });
      console.log('🌱 Seeded default User (1000656) into local MongoDB.');
    } else if (demoUser.name === 'Edit profile' || !demoUser.mpin) {
      demoUser.name = 'User 1000656';
      if (!demoUser.mpin) demoUser.mpin = '1234';
      await demoUser.save();
    }
    await User.updateMany({ name: 'Edit profile' }, { $set: { name: 'User 1000656' } });

    // 2. Seed Admin User
    const adminUser = await User.findOne({ userId: 'admin' });
    if (!adminUser) {
      await User.create({
        userId: 'admin',
        password: 'admin123',
        name: 'Super Administrator',
        phone: '9999999999',
        role: 'admin',
        status: 'active',
        balance: 99999.00,
        todayReceived: 0.00,
        topupBonus: 0.00,
        teamCommission: 0.00
      });
      console.log('🌱 Seeded default Admin (admin/admin123) into local MongoDB.');
    }

    // 3. Seed UPI Accounts
    const upiCount = await UpiAccount.countDocuments();
    if (upiCount === 0) {
      await UpiAccount.create([
        {
          phone: '7892136208',
          vpa: 'karthik35@ptyes',
          provider: 'paytm',
          enabled: true,
          logoBg: '#e0f2fe'
        },
        {
          phone: '7907342027',
          vpa: 'paytm.s2zq355@pty',
          provider: 'paytm-business',
          enabled: true,
          logoBg: '#f0fdf4'
        }
      ]);
      console.log('🌱 Seeded default UPI Accounts into local MongoDB.');
    }

    // 4. Seed Team Members
    const teamCount = await TeamMember.countDocuments();
    if (teamCount === 0) {
      await TeamMember.create([
        { referrerId: '1000656', phone: '897****1210', usersCount: 0, recharge: 36162.88, comm: 211.51 },
        { referrerId: '1000656', phone: '709****4921', usersCount: 0, recharge: 0, comm: 0 },
        { referrerId: '1000656', phone: '702****9820', usersCount: 0, recharge: 0, comm: 0 }
      ]);
      console.log('🌱 Seeded default Team Members into local MongoDB.');
    } else {
      // Ensure existing members have referrerId
      await TeamMember.updateMany({ referrerId: { $exists: false } }, { $set: { referrerId: '1000656' } });
    }

    // 5. Seed Transactions for Authority Panel
    const txCount = await Transaction.countDocuments();
    if (txCount === 0) {
      await Transaction.create([
        {
          userId: '1000656',
          userPhone: '897****1210',
          type: 'topup',
          amount: 500,
          description: 'Top up via UPI (Paytm)',
          status: 'pending',
          createdAt: new Date(Date.now() - 3600000)
        },
        {
          userId: '1000656',
          userPhone: '897****1210',
          type: 'topup',
          amount: 1000,
          description: 'Top up via USDT',
          status: 'pending',
          createdAt: new Date(Date.now() - 7200000)
        },
        {
          userId: '1000656',
          userPhone: '897****1210',
          type: 'buy_quota',
          amount: 300,
          description: 'Task Purchase 300 INR (+312 Quota)',
          status: 'approved',
          approvedAt: new Date(Date.now() - 86400000),
          approvedBy: 'admin'
        }
      ]);
      console.log('🌱 Seeded default Transactions into local MongoDB.');
    }
  } catch (err) {
    console.error('Error seeding database:', err);
  }
}
