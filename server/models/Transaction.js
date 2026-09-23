import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  userId: { type: String, required: true, default: '1000656' },
  userPhone: { type: String, default: '9876543210' },
  type: { type: String, required: true }, // 'topup', 'buy_quota', 'spin_reward', 'withdrawal'
  amount: { type: Number, required: true },
  description: { type: String },
  utr: { type: String },
  upiId: { type: String },
  payoutMethod: { type: String, default: 'UPI' },
  bankDetails: { type: Object },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  approvedAt: { type: Date },
  approvedBy: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Transaction', transactionSchema);
