import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  password: { type: String, required: true, default: 'user123' },
  name: { type: String, default: 'User' },
  phone: { type: String, default: '9876543210' },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  mpin: { type: String, default: null },
  balance: { type: Number, default: 118.32 },
  todayReceived: { type: Number, default: 0.00 },
  topupBonus: { type: Number, default: 1496.09 },
  teamCommission: { type: Number, default: 211.51 },
  rewardRatio: { type: Number, default: 2.0 },
  referralCode: { type: String, default: function() { return this.userId; } },
  referredBy: { type: String, default: null },
  totalRecharge: { type: Number, default: 0 },
  lastLogin: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('User', userSchema);
