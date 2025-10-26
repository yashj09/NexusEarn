# NexusEarn

> **Adaptive Multi-Chain Yield Optimizer** - Maximize stablecoin yields across chains with intelligent rebalancing powered by Avail Nexus.

## ✨ Features

- **🔍 Opportunity Scanner** - Find best APY across Aave, Compound, Yearn, Curve, Beefy
- **💰 Smart Deposits** - One-click deposits with automatic token approval
- **📊 Portfolio Tracking** - Real-time tracking of all yield positions
- **🔄 Auto Rebalancing** - AI-powered rebalancing suggestions with cost analysis
- **🛡️ Safety Guardrails** - Customizable risk controls (slippage, APY delta, break-even time)
- **🌉 Cross-Chain** - Bridge & deposit in single transaction via Avail Nexus
- **📈 Live Analytics** - Track APY, earnings, and portfolio performance

## 📦 Tech Stack

- **Frontend:** Next.js 14, React, TypeScript, TailwindCSS
- **Smart Contracts:** Solidity, Foundry
- **Blockchain:** Viem, Wagmi, Avail Nexus SDK
- **Protocols:** Aave V3, Compound V3, Yearn, Curve, Beefy
- **Data:** DeFiLlama API, Avail DA

---

## 📖 User Guide

### **Deposit to Earn Yield**

1. Go to **Opportunities** tab
2. Click **Deposit** on any high-APY protocol
3. Enter amount → Approve token → Deposit
4. Track earnings in **My Positions** tab

### **Withdraw Funds**

1. Go to **My Positions** tab
2. Click **Withdraw** on position
3. Enter amount → Confirm withdrawal

### **Rebalance Portfolio**

1. Go to **Rebalance** tab
2. Click **Analyze Rebalancing Opportunities**
3. Review suggestions with cost/benefit analysis
4. Click **Execute Rebalance** on recommended actions

### **Customize Risk Settings**

1. Click ⚙️ **Settings** icon in dashboard
2. Adjust guardrails:
   - Max Slippage
   - Min APY Improvement
   - Break-even Period
   - Risk Tolerance
3. Save configuration

---

## 🗂️ Project Structure

```
NexusEarn/
├── src/
│   ├── app/                 # Next.js app router
│   ├── components/
│   │   ├── yield/          # Main yield components
│   │   │   ├── modals/     # Deposit/Withdraw/Rebalance modals
│   │   │   └── ...
│   │   └── ui/             # shadcn UI components
│   ├── hooks/
│   │   └── yield/          # React hooks for deposits/withdrawals
│   ├── services/
│   │   ├── yield/          # Yield aggregation logic
│   │   ├── nexus/          # Avail Nexus integration
│   │   └── contracts/      # On-chain data readers
│   ├── lib/
│   │   ├── types/          # TypeScript types
│   │   ├── config/         # Protocol configurations
│   │   ├── constants/      # ABIs, addresses
│   │   └── mock/           # Mock data for testing
│   └── providers/          # React context providers
├── contracts/
│   ├── src/                # Solidity contracts
│   ├── script/             # Deployment scripts
│   └── test/               # Contract tests
└── public/
```

---

**Built with ❤️ using Avail Nexus**
