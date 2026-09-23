import mongoose from 'mongoose';

const upiAccountSchema = new mongoose.Schema({
  phone: { type: String, required: true },
  vpa: { type: String, required: true },
  provider: { type: String, required: true, default: 'paytm' },
  enabled: { type: Boolean, default: true },
  logoBg: { type: String, default: '#e0f2fe' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('UpiAccount', upiAccountSchema);
