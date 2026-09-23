# FlashPay - Fast & Secure INR/USDT Payment Platform

FlashPay is a high-performance modern fintech & quota management web application built with **React 19**, **Vite**, **Express**, and **MongoDB**. It provides seamless UPI & crypto (USDT TRC-20) recharges, task earning with 8% guaranteed return, 0.8% multi-tier team referral commissions, interactive lucky wheel rewards, and request-time Security MPIN withdrawals.

---

## 🚀 Key Features

- **⚡ 8% Deposit Bonus**: Every deposit and task recharge automatically earns an 8% profit credited upon admin approval.
- **👑 Lifetime Team Referrals**: 0.8% instant commission on every recharge made by referred team members with unique referral invite codes.
- **🔐 Request-Time Security MPIN**:
  - MPIN is never displayed or forced beforehand.
  - Users are prompted to set their 4–6 digit Security MPIN upon their first withdrawal request.
  - Every subsequent withdrawal triggers a confirmation popup requiring their Security MPIN.
- **🛡️ Secure Account Creation**: Mobile number registration with client-side & server-side Confirm Password matching validation.
- **🎡 Interactive Lucky Wheel**: Gamified spin wheel with cash rewards (up to ₹2,000) for active users.
- **💎 Multi-Channel Payments**: UPI QR (Paytm, PhonePe, GPay) and USDT (TRC-20) with automated UTR and transaction hash verification.
- **⚙️ Authority Admin Panel**: Full administrative dashboard at `/` (admin login) to review, approve, or reject deposits and withdrawals, manage accounts, and adjust balances.

---

## 🛠️ Technology Stack

- **Frontend**:
  - React 19
  - Vite 5
  - Lucide React (modern icon suite)
  - Canvas Confetti
  - CSS3 with glassmorphism & responsive mobile-first container
- **Backend**:
  - Node.js & Express 5
  - Mongoose & MongoDB (with built-in `mongodb-memory-server` fallback if no local daemon is running)
  - CORS & Dotenv

---

## 📦 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (Optional: if not installed, the server automatically starts an in-memory MongoDB instance)

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone <your-repo-url>
cd Flashpayiinr
npm install
```

### 3. Running the Application

You can run the backend server and frontend development server concurrently:

**Start the Express & MongoDB backend:**
```bash
npm run server
```
*Backend runs on `http://localhost:5000`*

**Start the Vite frontend development server:**
```bash
npm run dev
```
*Frontend runs on `http://localhost:5173`*

---

## 🔑 Default Credentials

| Role | User ID / Login | Password | Default MPIN |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` | N/A |
| **Demo User** | `1000656` | `user123` | `1234` |
| **New Users** | Auto-generated 7-digit ID | Set at registration | Set upon first withdrawal |

---

## 📁 Project Structure

```
Flashpayiinr/
├── public/                 # Static assets, QR codes, logos, and carousel banners
├── server/
│   ├── index.js            # Express API routes (auth, stats, upi, withdraw, admin)
│   ├── db.js               # Database connection and automatic demo seeder
│   └── models/             # Mongoose schemas (User, Transaction, UpiAccount, TeamMember)
├── src/
│   ├── components/
│   │   ├── AdminPanel.jsx  # Administrative dashboard for transactions & users
│   │   ├── DepositScreen.jsx # Quota task packages & recharge screen (8% returns)
│   │   ├── HomeScreen.jsx  # Interactive AI carousel banners & dashboard
│   │   ├── LoginScreen.jsx # Sign In / Register with Confirm Password
│   │   ├── MeScreen.jsx    # Profile, Quota balance, quick actions & menu
│   │   ├── Modals.jsx      # Topup, withdrawal, contact us, and wheel modals
│   │   ├── Navbar.jsx      # Mobile bottom navigation bar
│   │   ├── TeamScreen.jsx  # Referral team tree, commission stats & invite link
│   │   └── UPIScreen.jsx   # Withdrawal screen with request-time MPIN validation
│   ├── App.jsx             # Main container, routing & global state
│   ├── index.css           # Global design system, animations & utilities
│   └── main.jsx            # React root entry point
├── package.json
└── vite.config.js
```

---

## 🚢 Building for Production

To create an optimized production build:
```bash
npm run build
```
Preview the production build locally:
```bash
npm run preview
```

---

## 📞 Support & Community

- **Official Telegram Channel**: [https://t.me/Flashpayofficiall](https://t.me/Flashpayofficiall)
- **Telegram Support**: [@Flashpayindia](https://t.me/Flashpayindia)
