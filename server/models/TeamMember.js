import mongoose from 'mongoose';

const teamMemberSchema = new mongoose.Schema({
  referrerId: { type: String, required: true, default: '1000656' },
  memberId: { type: String, default: null },
  phone: { type: String, required: true },
  usersCount: { type: Number, default: 0 },
  recharge: { type: Number, default: 0 },
  comm: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('TeamMember', teamMemberSchema);
